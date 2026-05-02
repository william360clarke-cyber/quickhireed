import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fullName, email, phone, password, userType } = body;

  if (!fullName || !email || !password || !userType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const validTypes = ["customer", "provider", "both"];
  if (!validTypes.includes(userType)) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const hashed = await hash(password, 12);

  const user = await prisma.user.create({
    data: { fullName, email, phone, password: hashed, userType },
  });

  if (userType === "provider" || userType === "both") {
    await prisma.serviceProvider.create({
      data: { userId: user.id, serviceCategory: "General" },
    });
  }

  await createNotification(
    user.id,
    "system",
    "Welcome to QuickHire!",
    "Your account is set up. Browse services or complete your profile to get started.",
    "/dashboard"
  );

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
