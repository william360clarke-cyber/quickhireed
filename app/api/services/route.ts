import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: { services: { orderBy: { createdAt: "desc" } } },
  });

  if (!provider) return NextResponse.json([]);
  return NextResponse.json(JSON.parse(JSON.stringify(provider.services)));
}

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
  const { serviceName, description, price, duration } = parsedBody;
  if (!serviceName?.trim() || !price) {
    return NextResponse.json({ error: "Service name and price are required" }, { status: 400 });
  }
  try {

  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

  // Use raw SQL to avoid stale-compiled-client issues with the duration column
  const dur = duration ? parseInt(duration) : null;
  const priceVal = parseFloat(price);
  const desc = description ?? null;

  await prisma.$executeRaw`
    INSERT INTO services (provider_id, service_name, description, price, duration, is_active)
    VALUES (${provider.id}, ${serviceName.trim()}, ${desc}, ${priceVal}, ${dur}, true)
  `;

  const service = await prisma.$queryRaw<any[]>`
    SELECT service_id AS id, provider_id AS providerId, service_name AS serviceName,
           description, price, duration, is_active AS isActive, created_at AS createdAt
    FROM services
    WHERE provider_id = ${provider.id}
    ORDER BY service_id DESC
    LIMIT 1
  `;

  return NextResponse.json(JSON.parse(JSON.stringify(service[0])), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
