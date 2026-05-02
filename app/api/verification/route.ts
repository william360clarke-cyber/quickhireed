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
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

  // Check no pending/approved request already exists
  const existing = await prisma.verificationRequest.findFirst({
    where: { providerId: provider.id, status: { in: ["pending", "approved"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "A verification request already exists for this account." }, { status: 409 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { idType, idNumber, documentPath, certPath, notes } = body;
  try {

  if (!idType || !idNumber) {
    return NextResponse.json({ error: "ID type and number are required" }, { status: 400 });
  }

  const verificationRequest = await prisma.verificationRequest.create({
    data: {
      providerId: provider.id,
      idType,
      idNumber,
      documentPath: documentPath ?? null,
      certPath: certPath ?? null,
      notes: notes ?? null,
      status: "pending",
    },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({ where: { userType: "admin" } });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        "verification",
        "New Verification Request",
        `Provider #${provider.id} submitted a verification request. Review in the admin panel.`,
        "/admin"
      )
    )
  );

  return NextResponse.json(JSON.parse(JSON.stringify(verificationRequest)), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
