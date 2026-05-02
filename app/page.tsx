import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

function initials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function HomePage() {
  const session = await auth();

  let featured: any[] = [];
  let categories: any[] = [];

  try {
    [featured, categories] = await Promise.all([
      prisma.serviceProvider.findMany({
        where: { isFeatured: true, isVerified: true },
        include: { user: { select: { fullName: true } } },
        orderBy: { rating: "desc" },
        take: 6,
      }),
      prisma.homepageCategory.findMany({
        where: { isVisible: true },
        orderBy: { displayOrder: "asc" },
      }),
    ]);
  } catch {
    // DB not yet connected — show static shell
  }

  return (
    <main>
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid var(--border, #e8ddd5)" }}>
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold" style={{ color: "var(--bark, #2a1e15)" }}>
            Quick<span style={{ color: "var(--ember, #c45c1a)" }}>Hire</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/categories" className="hover:opacity-70 transition-opacity"
              style={{ color: "var(--warm-mid, #5a4a3d)" }}>Services</Link>
            {session ? (
              <>
                {(session.user as any).userType === "admin" && (
                  <Link href="/admin" className="hover:opacity-70 transition-opacity"
                    style={{ color: "var(--warm-mid, #5a4a3d)" }}>Admin</Link>
                )}
                <Link href="/dashboard" className="hover:opacity-70 transition-opacity"
                  style={{ color: "var(--warm-mid, #5a4a3d)" }}>Dashboard</Link>
                <LogoutButton className="hover:opacity-70 transition-opacity" style={{ color: "var(--warm-mid, #5a4a3d)" }}>Logout</LogoutButton>
              </>
            ) : (
              <>
                <Link href="/auth" className="hover:opacity-70 transition-opacity"
                  style={{ color: "var(--warm-mid, #5a4a3d)" }}>Login</Link>
                <Link href="/auth?tab=register"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--ember, #c45c1a)" }}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative" style={{ background: "var(--bark, #2a1e15)", minHeight: 520 }}>
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(196,92,26,0.12) 0%, transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
              style={{ background: "rgba(196,92,26,0.15)", color: "var(--ember, #c45c1a)", border: "1px solid rgba(196,92,26,0.25)" }}>
              The Service Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
              Find &amp; Hire{" "}
              <em className="not-italic" style={{ color: "var(--ember, #c45c1a)" }}>Professionals</em>{" "}
              in Minutes
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Search for plumbers, tutors, technicians and more — trusted, vetted, ready to help.
            </p>
          </div>
          <div className="rounded-2xl p-8 shadow-2xl" style={{ background: "var(--card-bg, #fff)" }}>
            <p className="font-semibold mb-5" style={{ color: "var(--bark, #2a1e15)" }}>What do you need done?</p>
            <form action="/categories" className="space-y-3">
              <input
                name="q"
                placeholder="e.g. Plumber, Math Tutor, Electrician…"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                style={{ border: "1.5px solid var(--border, #e8ddd5)" }}
              />
              <button type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ background: "var(--ember, #c45c1a)" }}>
                Find Professionals →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="py-3" style={{ background: "var(--ember, #c45c1a)" }}>
        <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto text-white text-sm font-medium">
          <span className="whitespace-nowrap opacity-70">Popular →</span>
          {["Plumbing","Electrical","Tutoring","Cleaning","Carpentry","Landscaping","Painting","Security","Catering"].map((s) => (
            <Link key={s} href={`/categories?category=${encodeURIComponent(s)}`}
              className="whitespace-nowrap hover:opacity-80 transition-opacity">{s}</Link>
          ))}
        </div>
      </div>

      {/* ── Popular Services ── */}
      {categories.length > 0 && (
        <section className="py-16" style={{ background: "var(--cream, #fdf9f3)" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-bold" style={{ color: "var(--bark, #2a1e15)" }}>Popular Services</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(196,92,26,0.1)", color: "var(--ember, #c45c1a)" }}>
                {categories.length} categories
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-xl p-6 flex flex-col"
                  style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border, #e8ddd5)" }}>
                  <span className="text-4xl mb-4">{cat.icon}</span>
                  <h3 className="font-semibold mb-1" style={{ color: "var(--bark, #2a1e15)" }}>{cat.name}</h3>
                  <p className="text-sm flex-1 mb-5" style={{ color: "var(--sand, #8c7b6e)" }}>{cat.description}</p>
                  <Link href={`/categories?category=${encodeURIComponent(cat.filterKey)}`}
                    className="block text-center text-sm font-semibold py-2.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ background: "var(--bark, #2a1e15)" }}>
                    View Providers
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Providers ── */}
      {featured.length > 0 && (
        <section className="py-16" style={{ background: "var(--card-bg, #fff)" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--bark, #2a1e15)" }}>Featured Providers</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>Hand-picked</p>
              </div>
              <Link href="/categories" className="text-sm font-medium hover:underline"
                style={{ color: "var(--ember, #c45c1a)" }}>View all →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => {
                const ini = initials(p.user.fullName);
                return (
                  <div key={p.id} className="rounded-xl p-6 flex flex-col"
                    style={{ border: "1px solid var(--border, #e8ddd5)" }}>
                    {/* Featured badge row */}
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide pb-3 mb-4"
                      style={{ borderBottom: "1px solid var(--border, #e8ddd5)", color: "var(--ember, #c45c1a)" }}>
                      ★ Featured
                    </div>
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                        style={{ background: "var(--ember, #c45c1a)" }}>
                        {ini}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: "var(--bark, #2a1e15)" }}>{p.user.fullName}</p>
                        <p className="text-sm font-medium" style={{ color: "var(--ember, #c45c1a)" }}>{p.serviceCategory}</p>
                      </div>
                    </div>
                    {p.bio && (
                      <p className="text-sm flex-1 mb-4 line-clamp-2" style={{ color: "var(--sand, #8c7b6e)" }}>{p.bio}</p>
                    )}
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 mb-5"
                      style={{ borderTop: "1px solid var(--border, #e8ddd5)", borderBottom: "1px solid var(--border, #e8ddd5)" }}>
                      {[
                        { value: Number(p.rating).toFixed(1), label: "Rating" },
                        { value: p.totalJobs ?? 0,            label: "Jobs" },
                        { value: `${p.experienceYears}yr`,    label: "Experience" },
                      ].map(({ value, label }) => (
                        <div key={label} className="text-center">
                          <p className="font-bold text-lg leading-none" style={{ color: "var(--bark, #2a1e15)" }}>{value}</p>
                          <p className="text-xs uppercase tracking-wide mt-1" style={{ color: "var(--sand, #8c7b6e)" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <Link href={`/providers/${p.id}`}
                      className="block text-center py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                      style={{ background: "var(--ember, #c45c1a)" }}>
                      Hire {p.user.fullName.split(" ")[0]}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it Works ── */}
      <section className="py-20" style={{ background: "var(--bark, #2a1e15)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How QuickHire Works</h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Three simple steps to get the help you need.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Search & Browse",  desc: "Find verified professionals by category. Compare services and pricing at a glance." },
              { step: "2", title: "Book Instantly",    desc: "Pick your date, time, and service. Your provider is notified immediately and confirms your booking." },
              { step: "3", title: "Pay & Review",      desc: "Pay securely via Mobile Money, card, or cash after the job is done. Leave a review to help the community." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl p-8"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-5"
                  style={{ background: "var(--ember, #c45c1a)" }}>
                  {item.step}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12" style={{ background: "var(--bark, #2a1e15)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-extrabold text-lg text-white mb-2">
            Quick<span style={{ color: "var(--ember, #c45c1a)" }}>Hire</span>
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Ghana&apos;s trusted service marketplace. Find &amp; hire professionals fast.
          </p>
          <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} QuickHire. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
