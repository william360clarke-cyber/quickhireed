import { prisma } from "@/lib/prisma";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "QuickHire/1.0 (https://quickhireed.vercel.app)";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let lastGeocodeMs = 0;

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const elapsed = Date.now() - lastGeocodeMs;
    if (elapsed < 1000) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    lastGeocodeMs = Date.now();

    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

export async function geocodeAndCache(bookingId: number): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { address: true, latitude: true, geocodedAt: true },
    });

    if (!booking?.address) return;

    const isFresh =
      booking.latitude !== null &&
      booking.geocodedAt !== null &&
      booking.geocodedAt.getTime() > Date.now() - THIRTY_DAYS_MS;

    if (isFresh) return;

    const coords = await geocodeAddress(booking.address);
    if (!coords) return;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        latitude: coords.lat,
        longitude: coords.lng,
        geocodedAt: new Date(),
      },
    });
  } catch {
    // never crash the caller
  }
}
