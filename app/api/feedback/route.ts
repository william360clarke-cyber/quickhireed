import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const { category, message, rating } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const feedback = await prisma.platformFeedback.create({
    data: {
      userId,
      category: category ?? "general",
      message: message.trim(),
      rating: rating != null ? parseInt(rating) : 5,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
