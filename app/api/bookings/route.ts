import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { TOTAL_TAX_RATE } from "@/lib/taxes";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;

  let bookings;

  if (userType === "provider" || userType === "both") {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) return NextResponse.json([]);

    bookings = await prisma.booking.findMany({
      where: { providerId: provider.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        service: true,
        payment: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(bookings)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { providerId, serviceId, bookingDate, address, notes } = body;
  try {

  if (!providerId || !serviceId || !bookingDate || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const pid = parseInt(providerId);
  const sid = parseInt(serviceId);
  const date = new Date(bookingDate);

  if (isNaN(date.getTime()) || date < new Date()) {
    return NextResponse.json({ error: "Booking date must be in the future" }, { status: 400 });
  }

  const [provider, service] = await Promise.all([
    prisma.serviceProvider.findUnique({ where: { id: pid } }),
    prisma.service.findUnique({ where: { id: sid } }),
  ]);

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  if (provider.userId === userId) {
    return NextResponse.json({ error: "You cannot book your own services" }, { status: 400 });
  }

  if (!provider.isAvailable) {
    return NextResponse.json({ error: "This provider is not currently accepting bookings" }, { status: 400 });
  }

  // Daily cap check
  const cap = provider.dailyBookingCap ?? 0;
  if (cap > 0) {
    const dateStr = date.toISOString().slice(0, 10);
    const todayCount = await prisma.booking.count({
      where: {
        providerId: pid,
        status: { not: "cancelled" },
        bookingDate: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lt: new Date(`${dateStr}T23:59:59.999Z`),
        },
      },
    });
    if (todayCount >= cap) {
      return NextResponse.json({ error: "This provider is fully booked for that day." }, { status: 409 });
    }
  }

  // Hourly time-slot conflict check
  const bookingHourStart = new Date(date);
  bookingHourStart.setMinutes(0, 0, 0);
  const bookingHourEnd = new Date(date);
  bookingHourEnd.setMinutes(59, 59, 999);

  const slotConflict = await prisma.booking.count({
    where: {
      providerId: pid,
      status: { not: "cancelled" },
      bookingDate: { gte: bookingHourStart, lte: bookingHourEnd },
    },
  });
  if (slotConflict > 0) {
    return NextResponse.json({ error: "This time slot is already taken. Please choose a different hour." }, { status: 409 });
  }

  // Create booking + pending payment atomically
  const basePrice = Number(service.price);
  const taxedAmount = parseFloat((basePrice * (1 + TOTAL_TAX_RATE)).toFixed(2));

  const booking = await prisma.booking.create({
    data: {
      userId,
      providerId: pid,
      serviceId: sid,
      bookingDate: date,
      address,
      notes,
      payment: {
        create: {
          amount: taxedAmount,
          paymentMethod: "mobile_money",
          paymentStatus: "pending",
        },
      },
    },
    include: {
      provider: { include: { user: { select: { fullName: true, id: true } } } },
      user: { select: { fullName: true } },
      service: true,
      payment: true,
    },
  });

  await createNotification(
    booking.provider.user.id,
    "booking",
    "New Booking Request",
    `${booking.user.fullName} has booked your service for ${date.toLocaleDateString("en-GH", { timeZone: "Africa/Accra" })}. Check your Manage Bookings tab.`,
    "/dashboard"
  );

  return NextResponse.json(JSON.parse(JSON.stringify(booking)), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
