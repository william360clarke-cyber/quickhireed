import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import BookingForm from "./BookingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  let provider: any = null;
  try {
    provider = await prisma.serviceProvider.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { fullName: true, email: true } },
        services: { where: { isActive: true } },
        reviews: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bookings: {
          where: { status: { not: "cancelled" } },
          select: { id: true, bookingDate: true, status: true },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!provider) notFound();

  const serializedProvider = JSON.parse(JSON.stringify(provider));

  const initials = provider.user.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const avgRating = provider.reviews.length
    ? provider.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / provider.reviews.length
    : 0;

  // Satisfaction rate: 60% positive reviews + 40% normalised avg rating
  const positiveReviews = provider.reviews.filter((r: any) => (r.rating ?? 0) >= 4).length;
  const positiveRate = provider.reviews.length ? positiveReviews / provider.reviews.length : 0;
  const satisfactionRate = provider.reviews.length
    ? Math.round(positiveRate * 60 + (avgRating / 5) * 40)
    : null;

  // Job count (all non-cancelled)
  const jobCount = provider.bookings.length;

  // Today's bookings vs daily cap
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = provider.bookings.filter((b: any) => {
    const bDate = new Date(b.bookingDate).toISOString().slice(0, 10);
    return bDate === today;
  }).length;
  const cap = provider.dailyBookingCap ?? 0;
  const isFullToday = cap > 0 && todayBookings >= cap;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <div className="flex gap-4 text-sm">
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">← Back to Services</Link>
            {session && <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>}
          </div>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{provider.user.fullName}</h1>
                  {provider.isVerified && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">✓ Verified</span>
                  )}
                  {provider.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">★ Featured</span>
                  )}
                  {!provider.isAvailable && (
                    <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full">Unavailable</span>
                  )}
                  {isFullToday && (
                    <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">Fully Booked Today</span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">{provider.serviceCategory}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium text-gray-900">{avgRating.toFixed(1)}</span>
                    <span>({provider.reviews.length} reviews)</span>
                  </span>
                  <span>· {jobCount} jobs</span>
                  {satisfactionRate !== null && (
                    <span>· {satisfactionRate}% satisfaction</span>
                  )}
                  <span>· {provider.experienceYears} yrs exp</span>
                  <span>· Speaks {provider.languages}</span>
                </div>
              </div>
            </div>
            {provider.bio && (
              <p className="text-gray-600 mt-6 leading-relaxed">{provider.bio}</p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Availability</p>
                <p className="font-medium text-gray-900 mt-1">{provider.availability ?? "Contact for details"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Response time</p>
                <p className="font-medium text-gray-900 mt-1">{provider.avgResponse}</p>
              </div>
              {cap > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Today's bookings</p>
                  <p className={`font-medium mt-1 ${isFullToday ? "text-red-600" : "text-green-600"}`}>
                    {todayBookings} / {cap} {isFullToday ? "(full)" : "slots available"}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Jobs completed</p>
                <p className="font-medium text-gray-900 mt-1">{jobCount}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {provider.services.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Services Offered</h2>
              <div className="space-y-3">
                {provider.services.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{s.serviceName}</p>
                      {s.description && <p className="text-gray-500 text-sm mt-1">{s.description}</p>}
                      {s.duration && <p className="text-gray-400 text-xs mt-1">{s.duration} min</p>}
                    </div>
                    <span className="text-blue-600 font-semibold ml-4">GH₵ {Number(s.price).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {provider.reviews.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                {satisfactionRate !== null && (
                  <span className="text-sm text-gray-500">{satisfactionRate}% satisfaction rate</span>
                )}
              </div>
              <div className="space-y-4">
                {provider.reviews.map((r: any) => (
                  <div key={r.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 text-sm">{r.user.fullName}</span>
                      <span className="text-yellow-500 text-sm">{"★".repeat(r.rating ?? 0)}</span>
                    </div>
                    {r.comment && <p className="text-gray-500 text-sm">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking form */}
        <div>
          <BookingForm
            provider={serializedProvider}
            session={session ? { userId: session.user.id, userType: (session.user as any).userType } : null}
            isFullToday={isFullToday}
          />
          {session && (
            <div className="mt-4">
              <Link
                href={`/messages?with=${provider.userId}`}
                className="w-full block text-center border border-gray-300 text-gray-700 text-sm px-4 py-3 rounded-xl hover:bg-gray-50"
              >
                Send Message
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
