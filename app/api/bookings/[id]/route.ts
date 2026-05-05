import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { geocodeAndCache } from "@/lib/geocode";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id);
  const body = await req.json();
  const { status } = body;

  const validStatuses = ["accepted", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status. Must be accepted, completed, or cancelled." }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, fullName: true } },
      provider: { include: { user: { select: { id: true, fullName: true } } } },
      service: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Only the provider who owns this booking can update its status
  if (booking.provider.user.id !== userId) {
    return NextResponse.json({ error: "Only the service provider can update this booking's status" }, { status: 403 });
  }

  // Enforce valid status transitions
  if (status === "accepted" && booking.status !== "pending") {
    return NextResponse.json({ error: "Only pending bookings can be accepted" }, { status: 400 });
  }
  if (status === "completed" && booking.status !== "accepted") {
    return NextResponse.json({ error: "Only accepted bookings can be marked as completed" }, { status: 400 });
  }
  if (status === "cancelled" && booking.status === "completed") {
    return NextResponse.json({ error: "Completed bookings cannot be cancelled" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as any },
  });

  const providerName = booking.provider.user.fullName;

  if (status === "accepted") {
    await createNotification(
      booking.user.id,
      "booking_accepted",
      "Booking Accepted",
      `${providerName} has accepted your booking. Your service is confirmed for ${new Date(booking.bookingDate).toLocaleDateString("en-GH", { timeZone: "Africa/Accra" })}.`,
      "/dashboard"
    );
    await geocodeAndCache(bookingId);
  } else if (status === "completed") {
    await createNotification(
      booking.user.id,
      "booking_completed",
      "Service Completed",
      `${providerName} has marked your service as complete. You can now make payment and leave a review.`,
      "/dashboard"
    );
  } else if (status === "cancelled") {
    await createNotification(
      booking.user.id,
      "booking_declined",
      "Booking Declined",
      `${providerName} has declined your booking #${bookingId}.`,
      "/dashboard"
    );
  }

  return NextResponse.json(updated);
}
