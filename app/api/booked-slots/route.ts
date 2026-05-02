import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/booked-slots?providerId=X&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const providerId = searchParams.get("providerId");
  const date = searchParams.get("date");

  if (!providerId || !date) {
    return NextResponse.json({ error: "providerId and date required" }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const bookings = await prisma.booking.findMany({
    where: {
      providerId: parseInt(providerId),
      status: { not: "cancelled" },
      bookingDate: { gte: dayStart, lte: dayEnd },
    },
    select: { bookingDate: true },
  });

  const bookedHours = bookings.map((b) => new Date(b.bookingDate).getUTCHours());
  return NextResponse.json({ bookedHours });
}
