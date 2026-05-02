import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id) },
    include: { provider: true },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (service.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let pb: any;
  try { pb = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { serviceName, description, price, duration, isActive } = pb;
  try {
  const newName    = serviceName?.trim()                          ?? service.serviceName;
  const newDesc    = description !== undefined ? description       : service.description;
  const newPrice   = price    != null ? parseFloat(price)          : Number(service.price);
  const newDur     = duration != null ? parseInt(duration)         : (service as any).duration;
  const newActive  = isActive != null ? Boolean(isActive)          : service.isActive;
  const sid        = parseInt(id);

  // Use raw SQL to bypass stale compiled-client validation on the duration column
  await prisma.$executeRaw`
    UPDATE services
    SET service_name = ${newName},
        description  = ${newDesc},
        price        = ${newPrice},
        duration     = ${newDur},
        is_active    = ${newActive}
    WHERE service_id = ${sid}
  `;

  const rows = await prisma.$queryRaw<any[]>`
    SELECT service_id AS id, provider_id AS providerId, service_name AS serviceName,
           description, price, duration, is_active AS isActive, created_at AS createdAt
    FROM services WHERE service_id = ${sid} LIMIT 1
  `;
  return NextResponse.json(JSON.parse(JSON.stringify(rows[0])));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id) },
    include: { provider: true },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (service.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.service.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
