import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function CategoriesPage({ searchParams }: Props) {
  const { q, category } = await searchParams;

  let providers: any[] = [];
  try {
    providers = await prisma.serviceProvider.findMany({
      where: {
        isVerified: true,
        ...(category && { serviceCategory: { contains: category } }),
        ...(q && {
          OR: [
            { user: { fullName: { contains: q } } },
            { serviceCategory: { contains: q } },
            { bio: { contains: q } },
          ],
        }),
      },
      include: {
        user: { select: { fullName: true } },
        services: { where: { isActive: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    });
  } catch {
    // DB not connected
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category ? `${category} Professionals` : q ? `Results for "${q}"` : "Browse All Services"}
        </h1>
        <p className="text-gray-500 mb-8">{providers.length} provider{providers.length !== 1 ? "s" : ""} found</p>

        {/* Search bar */}
        <form className="flex gap-2 mb-8 max-w-xl">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search services or professionals…"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-700">
            Search
          </button>
        </form>

        {providers.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium">No providers found.</p>
            <p className="text-sm mt-2">Try a different search term or browse all categories.</p>
            <Link href="/categories" className="mt-4 inline-block text-blue-600 hover:underline">Clear filter</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => {
              const initials = p.user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
              const minPrice = p.services.length
                ? Math.min(...p.services.map((s: any) => Number(s.price)))
                : null;
              return (
                <Link
                  key={p.id}
                  href={`/providers/${p.id}`}
                  className="bg-white border rounded-xl p-6 hover:shadow-lg transition relative"
                >
                  {p.isFeatured && (
                    <span className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.user.fullName}</p>
                      <p className="text-gray-500 text-sm">{p.serviceCategory}</p>
                    </div>
                  </div>
                  {p.bio && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{p.bio}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium text-gray-900">{Number(p.rating).toFixed(1)}</span>
                      <span>· {p.experienceYears} yrs</span>
                    </div>
                    {minPrice !== null && (
                      <span className="text-blue-600 font-medium">From GH₵ {minPrice.toFixed(0)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
