import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { id: true, fullName: true, email: true, phone: true, userType: true, createdAt: true },
  });

  return NextResponse.json(JSON.parse(JSON.stringify(user)));
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let pb: any;
  try { pb = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { fullName, email, phone } = pb;

  if (!fullName?.trim()) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  try {

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: parseInt(session.user.id) } },
  });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const user = await prisma.user.update({
    where: { id: parseInt(session.user.id) },
    data: { fullName: fullName.trim(), email, phone },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
