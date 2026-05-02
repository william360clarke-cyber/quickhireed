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

  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const { commissionId, paymentReference } = await req.json();

  const commission = await prisma.providerCommission.findUnique({
    where: { id: parseInt(commissionId) },
  });

  if (!commission) return NextResponse.json({ error: "Commission not found" }, { status: 404 });
  if (commission.providerId !== provider.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (commission.status !== "owed") return NextResponse.json({ error: "Commission already paid" }, { status: 409 });

  const updated = await prisma.providerCommission.update({
    where: { id: commission.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      paymentReference: paymentReference ?? null,
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { userType: "admin" } });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        "commission",
        "Commission Paid",
        `Provider #${provider.id} paid commission of GH₵ ${Number(commission.amount).toFixed(2)} for booking #${commission.bookingId}.`,
        "/admin"
      )
    )
  );

  return NextResponse.json(JSON.parse(JSON.stringify(updated)));
}
