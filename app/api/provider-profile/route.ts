import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;

  if (userType !== "provider" && userType !== "both") {
    return NextResponse.json({ error: "Not a provider account" }, { status: 403 });
  }

  let pb: any;
  try { pb = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const {
    bio, serviceCategory, experienceYears, availability,
    languages, avgResponse, isAvailable, dailyBookingCap,
  } = pb;
  try {

  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

  const updated = await prisma.serviceProvider.update({
    where: { userId },
    data: {
      bio: bio ?? provider.bio,
      serviceCategory: serviceCategory ?? provider.serviceCategory,
      experienceYears: experienceYears != null ? parseInt(experienceYears) : provider.experienceYears,
      availability: availability ?? provider.availability,
      languages: languages ?? provider.languages,
      avgResponse: avgResponse ?? provider.avgResponse,
      isAvailable: isAvailable != null ? Boolean(isAvailable) : provider.isAvailable,
      dailyBookingCap: dailyBookingCap != null ? parseInt(dailyBookingCap) : provider.dailyBookingCap,
    },
  });

  return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
