import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { COMMISSION_RATE, TOTAL_TAX_RATE } from "@/lib/taxes";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { bookingId, paymentMethod, mobileNetwork, mobilePhone } = body;

  if (!bookingId || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      service: true,
      provider: { include: { user: { select: { id: true, fullName: true } } } },
      user: { select: { id: true, fullName: true } },
      payment: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const userId = parseInt(session.user.id);
  // Only the customer who made the booking can pay for it
  if (booking.userId !== userId) {
    return NextResponse.json({ error: "You are not authorized to make payment for this booking" }, { status: 403 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Payment can only be made after the service is marked complete by the provider" }, { status: 400 });
  }

  if (booking.payment?.paymentStatus === "completed") {
    return NextResponse.json({ error: "This booking has already been paid" }, { status: 409 });
  }

  // Ghana tax math:
  // basePrice = service price before tax
  // taxedAmount (what customer pays) = basePrice * 1.20
  // commissionAmount = basePrice * 0.10
  // payoutAmount = basePrice - commissionAmount = basePrice * 0.90
  const basePrice = Number(booking.service.price);
  const taxedAmount = parseFloat((basePrice * (1 + TOTAL_TAX_RATE)).toFixed(2));
  const commissionAmount = parseFloat((basePrice * COMMISSION_RATE).toFixed(2));
  const taxAmount = parseFloat((basePrice * TOTAL_TAX_RATE).toFixed(2));
  const payoutAmount = parseFloat((basePrice - commissionAmount).toFixed(2));

  let payment;
  if (booking.payment) {
    payment = await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        amount: taxedAmount,
        paymentMethod: paymentMethod as any,
        paymentStatus: "completed",
        paymentDate: new Date(),
        mobileNetwork: mobileNetwork ?? null,
        mobilePhone: mobilePhone ?? null,
      },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: taxedAmount,
        paymentMethod: paymentMethod as any,
        paymentStatus: "completed",
        paymentDate: new Date(),
        mobileNetwork: mobileNetwork ?? null,
        mobilePhone: mobilePhone ?? null,
      },
    });
  }

  if (paymentMethod === "cash") {
    await prisma.providerCommission.upsert({
      where: { bookingId: booking.id },
      update: {},
      create: {
        bookingId: booking.id,
        providerId: booking.providerId,
        amount: commissionAmount,
        status: "owed",
      },
    });
    await createNotification(
      booking.provider.user.id,
      "commission",
      "Commission Due",
      `A 10% platform commission of GH₵ ${commissionAmount.toFixed(2)} is due for cash booking #${booking.id}. Pay from your dashboard.`,
      "/dashboard"
    );
  } else {
    const ref = `PAYOUT-${Date.now().toString(16).toUpperCase()}`;
    await prisma.providerPayout.upsert({
      where: { bookingId: booking.id },
      update: {},
      create: {
        bookingId: booking.id,
        providerId: booking.providerId,
        grossAmount: taxedAmount,
        commissionAmount,
        taxAmount,
        payoutAmount,
        paymentMethod,
        payoutReference: ref,
        status: "released",
        releasedAt: new Date(),
      },
    });
    await createNotification(
      booking.provider.user.id,
      "payment",
      "Payout Released",
      `Payout of GH₵ ${payoutAmount.toFixed(2)} released for booking #${booking.id}. Commission GH₵ ${commissionAmount.toFixed(2)} deducted.`,
      "/dashboard"
    );
  }

  await createNotification(
    booking.user.id,
    "payment",
    "Payment Confirmed",
    `Your payment of GH₵ ${taxedAmount.toFixed(2)} for booking #${booking.id} was received.`,
    `/receipt/${booking.id}`
  );

  return NextResponse.json(JSON.parse(JSON.stringify({ payment, basePrice, taxedAmount, commissionAmount, taxAmount, payoutAmount })));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
