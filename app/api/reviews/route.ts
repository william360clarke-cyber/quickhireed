import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { bookingId, rating, comment } = body;
  try {

  if (!bookingId || rating == null) {
    return NextResponse.json({ error: "Booking ID and rating are required" }, { status: 400 });
  }

  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { provider: { include: { user: { select: { id: true, fullName: true } } } } },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.userId !== userId) {
    return NextResponse.json({ error: "You can only review your own bookings" }, { status: 403 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "You can only leave a review after the service is completed" }, { status: 400 });
  }

  const existing = await prisma.review.findFirst({
    where: { bookingId: parseInt(bookingId), userId },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: parseInt(bookingId),
      userId,
      providerId: booking.providerId,
      rating: ratingNum,
      comment: comment?.trim() ?? null,
    },
  });

  // Recalculate provider avg rating
  const allReviews = await prisma.review.findMany({
    where: { providerId: booking.providerId, rating: { not: null } },
    select: { rating: true },
  });
  const avg = allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length;
  await prisma.serviceProvider.update({
    where: { id: booking.providerId },
    data: { rating: Math.round(avg * 100) / 100 },
  });

  // Notify provider about the new review
  await createNotification(
    booking.provider.user.id,
    "review",
    "New Review Received",
    `You received a ${ratingNum}-star review for booking #${booking.id}.${comment ? ` "${comment.trim().slice(0, 60)}"` : ""}`,
    "/dashboard"
  );

  return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
