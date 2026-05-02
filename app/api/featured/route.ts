import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;

  if (userType !== "provider" && userType !== "both") {
    return NextResponse.json({ error: "Not a provider account" }, { status: 403 });
  }

  let parsedBody: any;
  try { parsedBody = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { durationDays, paymentMethod } = parsedBody;

  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

    // Check no pending request
    const existing = await prisma.featuredRequest.findFirst({
      where: { providerId: provider.id, requestStatus: "pending" },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have a pending featured request." }, { status: 409 });
    }

    // GH₵ 50/week — calculate fee by duration
    const weeks = Math.ceil((parseInt(durationDays) || 7) / 7);
    const feeAmount = weeks * 50;

    const request = await prisma.featuredRequest.create({
      data: {
        providerId: provider.id,
        durationDays: parseInt(durationDays) || 7,
        fee: feeAmount,
        paymentMethod: paymentMethod ?? "mobile_money",
        requestStatus: "pending",
        paymentStatus: "pending",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { userType: "admin" } });
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          "featured",
          "New Featured Request",
          `Provider #${provider.id} requested a featured listing for ${durationDays ?? 7} days.`,
          "/admin"
        )
      )
    );

    return NextResponse.json(JSON.parse(JSON.stringify(request)), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
