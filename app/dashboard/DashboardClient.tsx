"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const BookingMap = dynamic(
  () => import("@/app/components/BookingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 bg-slate-100 rounded animate-pulse" />
    ),
  }
);

interface Props {
  user: any;
  userType: string;
  provider: any;
  customerBookings: any[];
  providerBookings: any[];
  notifications: any[];
  unreadCount: number;
  commissions: any[];
}

// ── helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return (name ?? "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}
function greeting(name: string) {
  const h = new Date().getHours();
  const first = name?.split(" ")[0] ?? "there";
  if (h < 12) return `Good morning, ${first} 👋`;
  if (h < 17) return `Good afternoon, ${first} 👋`;
  return `Good evening, ${first} 👋`;
}
function fmtDate(d: any) {
  return new Date(d).toLocaleDateString("en-GH", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Accra",
  });
}

// ── status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: "var(--bark, #2a1e15)", color: "#fff" },
    pending:   { bg: "#fef3c7", color: "#92400e" },
    accepted:  { bg: "rgba(196,92,26,0.12)", color: "var(--ember, #c45c1a)" },
    cancelled: { bg: "#fff1f2", color: "#be123c" },
  };
  const s = map[status] ?? { bg: "var(--parchment, #f5ede4)", color: "var(--sand, #8c7b6e)" };
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── svg icons ─────────────────────────────────────────────────────────────────
const Icon = {
  home: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  pin: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  star: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  card: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  book: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chat: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  bell: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  box: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  settings: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardClient({
  user, userType, provider, customerBookings, providerBookings,
  notifications, unreadCount, commissions,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const isProvider = userType === "provider" || userType === "both";
  const isCustomer = userType === "customer" || userType === "both";

  // ── sidebar nav ─────────────────────────────────────────────────────────────
  const navItems = [
    { key: "overview",        label: "Overview",           icon: Icon.home },
    ...(isCustomer ? [{ key: "my_bookings",     label: "Track Service",      icon: Icon.pin  }] : []),
    ...(isProvider ? [{ key: "manage_bookings", label: "Manage Bookings",    icon: Icon.book }] : []),
    ...(isProvider ? [{ key: "services",        label: "My Services",        icon: Icon.box  }] : []),
    ...(isProvider ? [{ key: "commissions",     label: "Payments & Earnings",icon: Icon.card }] : []),
    ...(isProvider ? [{ key: "featured",        label: "Get Featured",       icon: Icon.star }] : []),
    ...(isProvider ? [{ key: "verify",          label: "Get Verified",       icon: Icon.check}] : []),
    ...(isProvider ? [{ key: "provider_profile",label: "Provider Settings",  icon: Icon.settings }] : []),
    { key: "support",         label: "Support",            icon: Icon.chat },
    { key: "profile",         label: "My Profile",         icon: Icon.user },
  ];

  // ── stats ───────────────────────────────────────────────────────────────────
  const allBookings = [...customerBookings, ...providerBookings];
  const activeCount   = allBookings.filter(b => b.status === "pending" || b.status === "accepted").length;
  const completedCount = allBookings.filter(b => b.status === "completed").length;
  const reviewsGiven  = customerBookings.filter(b => b.reviews?.length > 0).length;

  // ── recent activity ─────────────────────────────────────────────────────────
  const recentActivity = [
    ...customerBookings.map(b => ({
      id: b.id, role: "Customer", service: b.service?.serviceName ?? "—",
      with: b.provider?.user?.fullName ?? "—", date: b.bookingDate, status: b.status,
    })),
    ...providerBookings.map(b => ({
      id: b.id, role: "Provider", service: b.service?.serviceName ?? "—",
      with: b.user?.fullName ?? "—", date: b.bookingDate, status: b.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // ── booking action ──────────────────────────────────────────────────────────
  async function updateBooking(bookingId: number, status: string) {
    setLoadingId(bookingId);
    setBookingError(null);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBookingError(data.error ?? "Failed to update booking.");
    }
    setLoadingId(null);
    if (res.ok) router.refresh();
  }

  async function markNotificationsRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  const userInitials = initials(user?.fullName ?? "U");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--cream, #fdf9f3)" }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: 220, background: "var(--bark, #2a1e15)", minHeight: "100vh" }}>

        {/* User block */}
        <div className="px-5 pt-7 pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center rounded-full text-white font-bold text-sm flex-shrink-0"
              style={{ width: 40, height: 40, background: "var(--ember, #c45c1a)", fontSize: "0.85rem" }}>
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate" style={{ lineHeight: 1.3 }}>{user?.fullName ?? "User"}</p>
              <p className="text-xs truncate" style={{ color: "var(--sand, #8c7b6e)" }}>{user?.email ?? ""}</p>
            </div>
          </div>
          {(provider?.isVerified) && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
              ✓ Verified
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const active = tab === item.key;
            return (
              <button key={item.key} type="button" onClick={() => setTab(item.key)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium w-full text-left transition-colors"
                style={{
                  color: active ? "#fff" : "var(--sand, #8c7b6e)",
                  background: active ? "rgba(196,92,26,0.12)" : "transparent",
                  borderLeft: active ? "3px solid var(--ember, #c45c1a)" : "3px solid transparent",
                }}>
                <span style={{ color: active ? "var(--ember, #c45c1a)" : "var(--warm-mid, #5a4a3d)" }}>{item.icon}</span>
                {item.label}
                {item.key === "support" && unreadCount > 0 && (
                  <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--ember, #c45c1a)", color: "#fff" }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-5 pb-6">
          <button onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/")}
            className="block w-full text-xs text-center py-2 rounded-lg cursor-pointer"
            style={{ color: "var(--warm-mid, #5a4a3d)", border: "1px solid rgba(255,255,255,0.07)", background: "transparent" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "var(--border, #e8ddd5)" }}>
          <div className="flex items-center justify-between px-8 h-14">
            <Link href="/" className="text-lg font-extrabold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--bark, #2a1e15)" }}>
              Quick<span style={{ color: "var(--ember, #c45c1a)" }}>Hire</span>
            </Link>
            <div className="flex items-center gap-5 text-sm" style={{ color: "var(--warm-mid, #5a4a3d)" }}>
              <Link href="/categories" className="hover:text-slate-900 transition-colors">Services</Link>
              <Link href="/messages" className="hover:text-slate-900 transition-colors">Messages</Link>
              <button onClick={() => setTab("notifications")} className="relative flex items-center hover:text-slate-900 transition-colors">
                {Icon.bell}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full"
                    style={{ background: "var(--ember, #c45c1a)", fontSize: "0.6rem" }}>{unreadCount}</span>
                )}
              </button>
              <button onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/")} className="hover:text-slate-900 transition-colors" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>Logout</button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--bark, #2a1e15)" }}>{greeting(user?.fullName ?? "")}</h1>
              <p className="text-sm mb-8" style={{ color: "var(--sand, #8c7b6e)" }}>Here's a summary of your QuickHire activity.</p>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Bookings",  value: allBookings.length },
                  { label: "Active Service",  value: activeCount },
                  { label: "Completed",       value: completedCount },
                  { label: "Reviews Given",   value: reviewsGiven },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-6" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
                    <p className="text-3xl font-bold mb-2" style={{ color: "var(--bark, #2a1e15)" }}>{s.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sand, #8c7b6e)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border, #e8ddd5)" }}>
                  <h2 className="font-semibold" style={{ color: "var(--bark, #2a1e15)" }}>Recent Activity</h2>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="py-16 text-center text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>
                    No activity yet. <Link href="/categories" className="hover:underline" style={{ color: "var(--ember, #c45c1a)" }}>Browse services →</Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--parchment, #f5ede4)" }}>
                          {["Role", "Service", "With", "Date", "Status"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sand, #8c7b6e)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivity.map((r, i) => (
                          <tr key={`${r.role}-${r.id}-${i}`} style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid #f8fafc" : "none" }}>
                            <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--ember, #c45c1a)" }}>{r.role}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: "var(--warm-mid, #5a4a3d)" }}>{r.service}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: "var(--warm-mid, #5a4a3d)" }}>{r.with}</td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: "var(--sand, #8c7b6e)" }}>{fmtDate(r.date)}</td>
                            <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Provider earnings summary strip */}
              {isProvider && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
                    <div className="rounded-lg p-2.5" style={{ background: "var(--parchment, #f5ede4)" }}>{Icon.card}</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>Total Earned</p>
                      <p className="text-lg font-bold" style={{ color: "var(--bark, #2a1e15)" }}>
                        GH₵ {providerBookings.filter(b => b.payment?.paymentStatus === "completed").reduce((s: number, b: any) => s + Number(b.service.price), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {commissions.length > 0 && (
                    <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: "1px solid #fee2e2" }}>
                      <div className="rounded-lg p-2.5" style={{ background: "#fff1f2" }}>
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>Commission Owed</p>
                        <p className="text-lg font-bold text-red-600">
                          GH₵ {commissions.reduce((s: number, c: any) => s + Number(c.amount), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
                    <div className="rounded-lg p-2.5" style={{ background: provider?.isVerified ? "#f0fdf4" : "#fff7ed" }}>
                      {provider?.isVerified
                        ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        : <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      }
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>Account Status</p>
                      <p className={`text-sm font-semibold ${provider?.isVerified ? "text-green-600" : "text-amber-600"}`}>
                        {provider?.isVerified ? "Verified" : "Pending Verification"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TRACK SERVICE (customer) ── */}
          {tab === "my_bookings" && (
            <div>
              <PageHeader title="Track Service" sub="Your service bookings and their current status." />
              <div className="space-y-4">
                {customerBookings.length === 0 ? (
                  <EmptyState message="No bookings yet." action={{ label: "Browse services →", href: "/categories" }} />
                ) : (
                  customerBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} role="customer" loadingId={loadingId} onAction={updateBooking} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── MANAGE BOOKINGS (provider) ── */}
          {tab === "manage_bookings" && (
            <div>
              <PageHeader title="Manage Bookings" sub="Accept, complete, or decline incoming service requests." />
              {bookingError && <ErrorBanner message={bookingError} />}
              <div className="space-y-4">
                {providerBookings.length === 0 ? (
                  <EmptyState message="No bookings received yet." />
                ) : (
                  providerBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} role="provider" loadingId={loadingId} onAction={updateBooking} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── MY SERVICES ── */}
          {tab === "services" && provider && (
            <div>
              <PageHeader title="My Services" sub="Services you offer to customers on QuickHire." />
              <ServicesTab providerId={provider.id} services={provider.services} />
            </div>
          )}

          {/* ── PAYMENTS & EARNINGS ── */}
          {tab === "commissions" && (
            <div>
              <PageHeader title="Payments & Earnings" sub="Track your earnings and platform commission obligations." />
              <CommissionsTab commissions={commissions} />
            </div>
          )}

          {/* ── GET FEATURED ── */}
          {tab === "featured" && provider && (
            <div>
              <PageHeader title="Get Featured" sub="Boost your visibility and get more bookings." />
              <FeaturedTab provider={provider} />
            </div>
          )}

          {/* ── GET VERIFIED ── */}
          {tab === "verify" && provider && (
            <div>
              <PageHeader title="Get Verified" sub="Verify your identity to build customer trust." />
              <VerificationTab provider={provider} />
            </div>
          )}

          {/* ── PROVIDER SETTINGS ── */}
          {tab === "provider_profile" && provider && (
            <div>
              <PageHeader title="Provider Settings" sub="Update your availability, bio, and service information." />
              <ProviderProfileTab provider={provider} />
            </div>
          )}

          {/* ── SUPPORT ── */}
          {tab === "support" && (
            <div>
              <PageHeader title="Support" sub="Get help or send us feedback." />
              <SupportTab />
            </div>
          )}

          {/* ── MY PROFILE ── */}
          {tab === "profile" && (
            <div>
              <PageHeader title="My Profile" sub="Manage your personal information and account security." />
              <ProfileTab user={user} />
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <div>
              <PageHeader title="Notifications" sub="Your recent alerts and activity updates." />
              {unreadCount > 0 && (
                <button onClick={markNotificationsRead} className="mb-4 text-sm font-medium" style={{ color: "var(--ember, #c45c1a)" }}>
                  Mark all as read
                </button>
              )}
              {notifications.length === 0 ? (
                <EmptyState message="No notifications." />
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-xl p-4"
                      style={{
                        border: !n.isRead ? "1px solid var(--ember, #c45c1a)" : "1px solid var(--border, #e8ddd5)",
                        background: !n.isRead ? "var(--parchment, #f5ede4)" : "var(--card-bg, #fff)",
                      }}>
                      <p className="font-semibold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>{n.title}</p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{n.message}</p>
                      <p className="text-xs mt-2" style={{ color: "var(--sand, #8c7b6e)" }}>{fmtDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── shared layout helpers ─────────────────────────────────────────────────────
function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--bark, #2a1e15)" }}>{title}</h1>
      <p className="text-sm mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{sub}</p>
    </div>
  );
}
function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="bg-white rounded-xl p-16 text-center" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
      <p className="text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>{message}</p>
      {action && <Link href={action.href} className="mt-3 inline-block text-sm hover:underline" style={{ color: "var(--ember, #c45c1a)" }}>{action.label}</Link>}
    </div>
  );
}
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}>
      {message}
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking: b, role, loadingId, onAction }: {
  booking: any; role: "customer" | "provider";
  loadingId: number | null; onAction: (id: number, status: string) => void;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const counterparty = role === "customer" ? b.provider?.user?.fullName : b.user?.fullName;
  const counterLabel = role === "customer" ? "Provider" : "Customer";

  const hasCoords = b.latitude != null && b.longitude != null;
  const showMap =
    hasCoords &&
    (b.status === "accepted" || b.status === "completed");
  const showDirections = role === "provider" && b.status === "accepted" && hasCoords;

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>{b.service?.serviceName}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{counterLabel}: {counterparty}</p>
          {role === "provider" && b.user?.phone && (
            <p className="text-xs mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{b.user.phone}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--sand, #8c7b6e)" }}>{fmtDate(b.bookingDate)} · {b.address}</p>
          {b.notes && <p className="text-xs mt-1 italic" style={{ color: "var(--sand, #8c7b6e)" }}>"{b.notes}"</p>}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={b.status} />
          <span className="font-bold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>GH₵ {Number(b.service?.price ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {showMap && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMapOpen((o) => !o)}
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--ember, #c45c1a)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {mapOpen ? "Hide map" : "View on map"}
            </button>
            {showDirections && (
              <a
                href={`https://www.openstreetmap.org/directions?to=${b.latitude},${b.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--ember, #c45c1a)" }}
              >
                Get Directions ↗
              </a>
            )}
          </div>
          {mapOpen && (
            <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
              <BookingMap
                lat={Number(b.latitude)}
                lng={Number(b.longitude)}
                address={b.address ?? ""}
              />
            </div>
          )}
        </div>
      )}

      {b.payment?.paymentStatus === "completed" && (
        <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <Link href={`/receipt/${b.id}`} className="text-sm hover:underline font-medium" style={{ color: "var(--ember, #c45c1a)" }}>Receipt</Link>
          <Link href={`/invoice/${b.id}`} className="text-sm hover:underline font-medium" style={{ color: "var(--ember, #c45c1a)" }}>Invoice</Link>
        </div>
      )}

      {role === "provider" && b.status === "pending" && (
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <button onClick={() => onAction(b.id, "accepted")} disabled={loadingId === b.id}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ background: "var(--bark, #2a1e15)", color: "#fff" }}>
            {loadingId === b.id ? "…" : "Accept"}
          </button>
          <button onClick={() => onAction(b.id, "cancelled")} disabled={loadingId === b.id}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}>
            Decline
          </button>
        </div>
      )}

      {role === "provider" && b.status === "accepted" && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <button onClick={() => onAction(b.id, "completed")} disabled={loadingId === b.id}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ background: "var(--ember, #c45c1a)", color: "#fff" }}>
            {loadingId === b.id ? "Updating…" : "Mark as Completed"}
          </button>
        </div>
      )}

      {role === "customer" && b.status === "completed" && b.payment?.paymentStatus !== "completed" && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <PaymentWidget bookingId={b.id} />
        </div>
      )}

      {role === "customer" && b.status === "completed" && b.payment?.paymentStatus === "completed" && b.reviews?.length === 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
          <ReviewWidget bookingId={b.id} providerId={b.providerId} />
        </div>
      )}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  async function saveProfile() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Profile updated." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  async function changePassword() {
    setPwLoading(true); setPwMsg("");
    const res = await fetch("/api/profile/password", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setPwLoading(false);
    setPwMsg(res.ok ? "Password changed." : data.error ?? "Failed.");
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <FormCard title="Personal Information" msg={msg} msgSuccess="updated">
        <Field label="Full Name"><Input value={fullName} onChange={setFullName} /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={setEmail} /></Field>
        <Field label="Phone"><Input value={phone} onChange={setPhone} /></Field>
        <PrimaryBtn onClick={saveProfile} loading={loading} label="Save Changes" />
      </FormCard>
      <FormCard title="Change Password" msg={pwMsg} msgSuccess="changed">
        <Field label="Current Password"><Input type="password" value={currentPassword} onChange={setCurrentPassword} /></Field>
        <Field label="New Password"><Input type="password" value={newPassword} onChange={setNewPassword} /></Field>
        <PrimaryBtn onClick={changePassword} loading={pwLoading} label="Change Password" />
      </FormCard>
    </div>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────
function ServicesTab({ providerId, services: initialServices }: { providerId: number; services: any[] }) {
  const [services, setServices] = useState(initialServices);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function addService() {
    setLoading(true); setAddError(null);
    const res = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName: name, description: desc, price, duration }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) { setServices((p) => [s, ...p]); setName(""); setDesc(""); setPrice(""); setDuration(""); setAdding(false); }
    else setAddError(s.error ?? "Failed to add service.");
    setLoading(false);
  }

  async function deleteService(id: number) {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setServices((p) => p.filter((s) => s.id !== id));
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName: editName, description: editDesc, price: editPrice }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) { setServices((p) => p.map((x) => (x.id === id ? s : x))); setEditId(null); }
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) setServices((p) => p.map((x) => (x.id === id ? s : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>{services.length} service{services.length !== 1 ? "s" : ""} listed</p>
        <button onClick={() => setAdding(!adding)}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--bark, #2a1e15)", color: "#fff" }}>
          + Add Service
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <Input value={name} onChange={setName} placeholder="Service name *" />
          <Input value={desc} onChange={setDesc} placeholder="Description (optional)" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={price} onChange={setPrice} type="number" placeholder="Price (GH₵) *" />
            <Input value={duration} onChange={setDuration} type="number" placeholder="Duration (mins)" />
          </div>
          <div className="flex gap-2">
            <PrimaryBtn onClick={addService} loading={loading} label="Add" disabled={!name.trim() || !price} />
            <button onClick={() => setAdding(false)} className="text-sm px-4 py-2" style={{ color: "var(--sand, #8c7b6e)" }}>Cancel</button>
          </div>
        </div>
      )}

      {services.length === 0 && !adding && <EmptyState message="No services yet. Add your first service above." />}

      {services.map((s: any) => (
        <div key={s.id} className="bg-white rounded-xl p-5" style={{ border: "1px solid var(--border, #e8ddd5)", opacity: s.isActive ? 1 : 0.55 }}>
          {editId === s.id ? (
            <div className="space-y-3">
              <Input value={editName} onChange={setEditName} placeholder="Service name" />
              <Input value={editDesc} onChange={setEditDesc} placeholder="Description" />
              <Input value={editPrice} onChange={setEditPrice} type="number" placeholder="Price" />
              <div className="flex gap-2">
                <PrimaryBtn onClick={() => saveEdit(s.id)} loading={false} label="Save" />
                <button onClick={() => setEditId(null)} className="text-sm px-4 py-2" style={{ color: "var(--sand, #8c7b6e)" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>{s.serviceName}</p>
                {s.description && <p className="text-xs mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{s.description}</p>}
                {s.duration && <p className="text-xs mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{s.duration} min</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-sm" style={{ color: "var(--ember, #c45c1a)" }}>GH₵ {Number(s.price).toFixed(2)}</span>
                <button onClick={() => { setEditId(s.id); setEditName(s.serviceName); setEditDesc(s.description ?? ""); setEditPrice(String(Number(s.price))); }}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: "var(--parchment, #f5ede4)", color: "var(--warm-mid, #5a4a3d)" }}>Edit</button>
                <button onClick={() => toggleActive(s.id, s.isActive)}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: s.isActive ? "#fff7ed" : "#f0fdf4", color: s.isActive ? "#c2410c" : "#15803d" }}>
                  {s.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteService(s.id)}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: "#fff1f2", color: "#be123c" }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Provider Profile Tab ──────────────────────────────────────────────────────
function ProviderProfileTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [bio, setBio] = useState(provider?.bio ?? "");
  const [category, setCategory] = useState(provider?.serviceCategory ?? "");
  const [experience, setExperience] = useState(String(provider?.experienceYears ?? 0));
  const [availability, setAvailability] = useState(provider?.availability ?? "");
  const [languages, setLanguages] = useState(provider?.languages ?? "English");
  const [avgResponse, setAvgResponse] = useState(provider?.avgResponse ?? "");
  const [isAvailable, setIsAvailable] = useState(provider?.isAvailable ?? true);
  const [dailyCap, setDailyCap] = useState(String(provider?.dailyBookingCap ?? 0));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/provider-profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, serviceCategory: category, experienceYears: experience, availability, languages, avgResponse, isAvailable, dailyBookingCap: dailyCap }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Profile updated." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="max-w-lg">
      <FormCard title="Service Profile" msg={msg} msgSuccess="updated">
        <Field label="Service Category"><Input value={category} onChange={setCategory} /></Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", resize: "vertical" }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years Experience"><Input type="number" value={experience} onChange={setExperience} /></Field>
          <Field label="Daily Cap (0 = unlimited)"><Input type="number" value={dailyCap} onChange={setDailyCap} /></Field>
        </div>
        <Field label="Availability"><Input value={availability} onChange={setAvailability} placeholder="e.g. Mon–Fri, 8am–6pm" /></Field>
        <Field label="Languages"><Input value={languages} onChange={setLanguages} /></Field>
        <Field label="Avg Response Time"><Input value={avgResponse} onChange={setAvgResponse} placeholder="e.g. Within 1 hour" /></Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="rounded accent-blue-600 w-4 h-4" />
          <span className="text-sm" style={{ color: "var(--warm-mid, #5a4a3d)" }}>Currently available for bookings</span>
        </label>
        <PrimaryBtn onClick={save} loading={loading} label="Save Settings" />
      </FormCard>
    </div>
  );
}

// ── Commissions Tab ───────────────────────────────────────────────────────────
function CommissionsTab({ commissions }: { commissions: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [refs, setRefs] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);

  async function pay(id: number) {
    setLoading(id); setErrors((e) => ({ ...e, [id]: "" }));
    const res = await fetch("/api/commissions/pay", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionId: id, paymentReference: refs[id] ?? "" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((e) => ({ ...e, [id]: data.error ?? "Payment failed." }));
    }
    setLoading(null);
    if (res.ok) router.refresh();
  }

  if (commissions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
        <p className="text-sm font-semibold" style={{ color: "#15803d" }}>✓ No commission owed</p>
        <p className="text-sm mt-1" style={{ color: "var(--sand, #8c7b6e)" }}>Your account is in good standing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
        <p className="font-bold text-sm" style={{ color: "#be123c" }}>Total Due: GH₵ {total.toFixed(2)}</p>
        <p className="text-xs mt-1" style={{ color: "#e11d48" }}>10% platform commission for cash bookings. Pay to keep your account in good standing.</p>
      </div>
      {commissions.map((c) => (
        <div key={c.id} className="bg-white rounded-xl p-5" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>{c.booking?.service?.serviceName ?? `Booking #${c.bookingId}`}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--sand, #8c7b6e)" }}>{fmtDate(c.createdAt)}</p>
            </div>
            <span className="font-bold text-sm" style={{ color: "#be123c" }}>GH₵ {Number(c.amount).toFixed(2)}</span>
          </div>
          {errors[c.id] && <p className="text-xs text-red-600 mb-2">{errors[c.id]}</p>}
          <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--parchment, #f5ede4)" }}>
            <input value={refs[c.id] ?? ""} onChange={(e) => setRefs((r) => ({ ...r, [c.id]: e.target.value }))}
              placeholder="Payment reference (optional)"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: "1.5px solid var(--border, #e8ddd5)" }} />
            <button type="button" onClick={() => pay(c.id)} disabled={loading === c.id}
              className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              style={{ background: "var(--bark, #2a1e15)", color: "#fff" }}>
              {loading === c.id ? "Processing…" : "Pay"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Verification Tab ──────────────────────────────────────────────────────────
function VerificationTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [idType, setIdType] = useState("Ghana Card");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (provider?.isVerified) {
    return (
      <div className="max-w-lg rounded-xl p-6" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <p className="font-bold" style={{ color: "#15803d" }}>✓ Your account is verified</p>
        <p className="text-sm mt-1" style={{ color: "#16a34a" }}>Your identity has been confirmed. This badge builds trust with customers.</p>
      </div>
    );
  }

  async function submit() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/verification", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idType, idNumber, notes }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Verification request submitted. We'll review within 1–2 business days." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="max-w-lg">
      <FormCard title="ID Verification" msg={msg} msgSuccess="submitted">
        <p className="text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>Submit your government-issued ID to get a verified badge on your profile.</p>
        <Field label="ID Type">
          <select value={idType} onChange={(e) => setIdType(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", background: "#fff" }}>
            <option>Ghana Card</option>
            <option>Passport</option>
            <option>Voter ID</option>
            <option>Driver's License</option>
            <option>SSNIT Card</option>
          </select>
        </Field>
        <Field label="ID Number"><Input value={idNumber} onChange={setIdNumber} placeholder="Enter your ID number" /></Field>
        <Field label="Additional Notes (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", resize: "vertical" }} />
        </Field>
        <PrimaryBtn onClick={submit} loading={loading} label="Submit for Verification" disabled={!idNumber.trim()} />
      </FormCard>
    </div>
  );
}

// ── Featured Tab ──────────────────────────────────────────────────────────────
function FeaturedTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [days, setDays] = useState("7");
  const [method, setMethod] = useState("mobile_money");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fee = Math.ceil(parseInt(days) / 7) * 50;

  if (provider?.isFeatured) {
    return (
      <div className="max-w-lg rounded-xl p-6" style={{ background: "#fefce8", border: "1px solid #fef08a" }}>
        <p className="font-bold" style={{ color: "#854d0e" }}>★ You are a featured provider</p>
        <p className="text-sm mt-1" style={{ color: "#92400e" }}>Your profile appears at the top of search results and on the homepage.</p>
      </div>
    );
  }

  async function request() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/featured", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays: days, paymentMethod: method, paymentReference: ref }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Request submitted! We'll activate your listing after payment confirmation." : data.error ?? "Failed.");
  }

  return (
    <div className="max-w-lg">
      <FormCard title="Get Featured" msg={msg} msgSuccess="submitted">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fefce8", border: "1px solid #fef08a", color: "#854d0e" }}>
          GH₵ 50 per week · Minimum 1 week
        </div>
        <Field label="Duration">
          <select value={days} onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", background: "#fff" }}>
            <option value="7">1 week — GH₵ 50</option>
            <option value="14">2 weeks — GH₵ 100</option>
            <option value="30">30 days — GH₵ 250</option>
            <option value="90">90 days — GH₵ 650</option>
          </select>
        </Field>
        <Field label="Payment Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", background: "#fff" }}>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash (at office)</option>
          </select>
        </Field>
        <Field label="Payment Reference / Transaction ID"><Input value={ref} onChange={setRef} placeholder="Enter your payment reference" /></Field>
        <p className="font-semibold text-sm" style={{ color: "var(--bark, #2a1e15)" }}>Total: GH₵ {fee}</p>
        <PrimaryBtn onClick={request} loading={loading} label="Request Featured Listing" />
      </FormCard>
    </div>
  );
}

// ── Support Tab ───────────────────────────────────────────────────────────────
function SupportTab() {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!message.trim()) return;
    setLoading(true); setMsg("");
    const res = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message, rating }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Feedback submitted. Thank you!" : data.error ?? "Failed to send.");
    if (res.ok) { setMessage(""); setRating(5); }
  }

  return (
    <div className="max-w-lg">
      <FormCard title="Send Feedback" msg={msg} msgSuccess="submitted">
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", background: "#fff" }}>
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="billing">Billing Issue</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Message">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
            placeholder="Describe your issue or feedback…"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", resize: "vertical" }} />
        </Field>
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--sand, #8c7b6e)" }}>Rating</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)}
                className="text-xl transition-transform hover:scale-110"
                style={{ color: s <= rating ? "#f59e0b" : "var(--border, #e8ddd5)" }}>★</button>
            ))}
          </div>
        </div>
        <PrimaryBtn onClick={submit} loading={loading} label="Send Feedback" disabled={!message.trim()} />
      </FormCard>
    </div>
  );
}

// ── Payment Widget ────────────────────────────────────────────────────────────
function PaymentWidget({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [method, setMethod] = useState("mobile_money");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true); setError(null);
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, paymentMethod: method, mobileNetwork: network, mobilePhone: phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment failed. Please try again.");
    }
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold" style={{ color: "var(--bark, #2a1e15)" }}>Make Payment</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: "1.5px solid var(--border, #e8ddd5)" }}>
          <option value="mobile_money">Mobile Money</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
        {method === "mobile_money" && (<>
          <select value={network} onChange={(e) => setNetwork(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1.5px solid var(--border, #e8ddd5)" }}>
            <option value="">Network</option>
            <option value="MTN">MTN</option>
            <option value="Vodafone">Vodafone</option>
            <option value="AirtelTigo">AirtelTigo</option>
          </select>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="MoMo number"
            className="rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-36"
            style={{ border: "1.5px solid var(--border, #e8ddd5)" }} />
        </>)}
        <button onClick={pay} disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          style={{ background: "#15803d", color: "#fff" }}>
          {loading ? "Processing…" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

// ── Review Widget ─────────────────────────────────────────────────────────────
function ReviewWidget({ bookingId, providerId }: { bookingId: number; providerId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, providerId, rating, comment }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit review.");
    }
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold" style={{ color: "var(--bark, #2a1e15)" }}>Leave a review</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} onClick={() => setRating(s)}
            className="text-xl transition-transform hover:scale-110"
            style={{ color: s <= rating ? "#f59e0b" : "var(--border, #e8ddd5)" }}>★</button>
        ))}
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        style={{ border: "1.5px solid var(--border, #e8ddd5)" }} />
      <button onClick={submit} disabled={loading}
        className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        style={{ background: "var(--ember, #c45c1a)", color: "#fff" }}>
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

// ── micro UI helpers ──────────────────────────────────────────────────────────
function FormCard({ title, children, msg, msgSuccess }: {
  title: string; children: React.ReactNode; msg: string; msgSuccess?: string;
}) {
  const ok = msg && msgSuccess && msg.includes(msgSuccess);
  return (
    <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
      <h2 className="font-semibold" style={{ color: "var(--bark, #2a1e15)" }}>{title}</h2>
      {msg && (
        <p className="text-sm font-medium px-3 py-2 rounded-lg"
          style={{ background: ok ? "#f0fdf4" : "#fff1f2", color: ok ? "#15803d" : "#be123c" }}>
          {msg}
        </p>
      )}
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--sand, #8c7b6e)" }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, type = "text", placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      style={{ border: "1.5px solid var(--border, #e8ddd5)" }} />
  );
}
function PrimaryBtn({ onClick, loading, label, disabled }: {
  onClick: () => void; loading: boolean; label: string; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
      style={{ background: "var(--bark, #2a1e15)", color: "#fff" }}>
      {loading ? "Please wait…" : label}
    </button>
  );
}
