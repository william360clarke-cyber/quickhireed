import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const withUserId = req.nextUrl.searchParams.get("with");

  if (withUserId) {
    const otherId = parseInt(withUserId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
      where: { senderId: otherId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  }

  // Return conversation list
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    distinct: ["receiverId"],
    include: { receiver: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const received = await prisma.message.findMany({
    where: { receiverId: userId },
    distinct: ["senderId"],
    include: { sender: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sent, received });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = parseInt(session.user.id);
  const body = await req.json();
  const { receiverId, message, bookingId } = body;

  if (!receiverId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (parseInt(receiverId) === senderId) {
    return NextResponse.json({ error: "You cannot send a message to yourself" }, { status: 400 });
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { fullName: true },
  });

  const msg = await prisma.message.create({
    data: {
      senderId,
      receiverId: parseInt(receiverId),
      message,
      ...(bookingId && { bookingId: parseInt(bookingId) }),
    },
  });

  await createNotification(
    parseInt(receiverId),
    "message",
    `New message from ${sender?.fullName}`,
    message.slice(0, 100),
    `/messages?with=${senderId}`
  );

  return NextResponse.json(msg, { status: 201 });
}
