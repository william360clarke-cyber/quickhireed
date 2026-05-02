import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const featured = req.nextUrl.searchParams.get("featured") === "1";

  const providers = await prisma.serviceProvider.findMany({
    where: {
      isVerified: true,
      ...(featured && { isFeatured: true }),
      ...(category && { serviceCategory: { contains: category } }),
    },
    include: {
      user: { select: { id: true, fullName: true } },
      services: { where: { isActive: true }, take: 3 },
      reviews: { select: { rating: true } },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(providers);
}
