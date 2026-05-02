import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? "";

  const providers = await prisma.serviceProvider.findMany({
    where: {
      isVerified: true,
      ...(category && { serviceCategory: { contains: category } }),
      user: q
        ? {
            fullName: { contains: q },
          }
        : undefined,
    },
    include: {
      user: { select: { fullName: true, email: true } },
      services: { where: { isActive: true } },
    },
    orderBy: { rating: "desc" },
    take: 20,
  });

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(q && {
        OR: [
          { serviceName: { contains: q } },
          { description: { contains: q } },
        ],
      }),
    },
    include: {
      provider: {
        include: { user: { select: { fullName: true } } },
      },
    },
    take: 20,
  });

  return NextResponse.json({ providers, services });
}
