"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

// ── Emoji picker for category icons ──────────────────────────────────────────
const SERVICE_EMOJIS = [
  "🔧","⚡","📚","🧹","🔨","🌿","🎨","🔒","🍽️","🚗",
  "💄","🏥","📱","🐕","👶","🎵","📸","🏋️","🌺","🏠",
  "❄️","🛋️","🔐","🧰","🚿","📦","🎓","💊","👔","📊",
  "⚖️","🖥️","🐾","🌱","🛡️","🎭","🏊","🌍","🔑","🪚",
  "🧑‍🍳","🍕","🧴","🪴","🚜","🛻","🏗️","🪟","🧱","🛁",
  "🎪","🎬","🐄","🧺","🪣","🧼","🪒","🧲","🔩","🔌",
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Pick an icon"
        style={{
          width: 52, height: 40, border: "1.5px solid var(--border)", borderRadius: 7,
          fontSize: "1.4rem", textAlign: "center", background: "#fff",
          cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {value || "🔧"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff", border: "1px solid var(--border)", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(42,30,21,0.15)",
          padding: 10, width: 260,
          display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4,
        }}>
          {SERVICE_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              title={e}
              style={{
                fontSize: "1.3rem", lineHeight: 1, padding: "5px 2px", border: "none",
                borderRadius: 6, cursor: "pointer", textAlign: "center",
                background: e === value ? "var(--parchment, #f5ede4)" : "transparent",
                outline: e === value ? "2px solid var(--ember, #c45c1a)" : "none",
              }}
            >
              {e}
            </button>
          ))}
          {/* Also allow manual input for unlisted emoji */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="✏️"
            maxLength={4}
            style={{
              gridColumn: "span 10", marginTop: 6,
              padding: "6px 10px", border: "1.5px solid var(--border)", borderRadius: 7,
              fontSize: "0.82rem", color: "var(--bark)", background: "#fff", outline: "none",
              textAlign: "center",
            }}
          />
        </div>
      )}
    </div>
  );
}

interface Props {
  users: any[];
  bookings: any[];
  payments: any[];
  providers: any[];
  verifications: any[];
  featuredRequests: any[];
  feedback: any[];
  totalRevenue: number;
  categories: any[];
  partners: any[];
  smileidStats: any;
}

// ── shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "var(--card-bg, #fff)",
  border: "1.5px solid var(--border, #e8ddd5)",
  borderRadius: 14,
  padding: 32,
  marginBottom: 24,
};
const statCard: React.CSSProperties = {
  background: "var(--card-bg, #fff)",
  border: "1.5px solid var(--border, #e8ddd5)",
  borderRadius: 10,
  padding: "22px 20px",
};
const statCardDark: React.CSSProperties = {
  background: "var(--bark, #2a1e15)",
  border: "1.5px solid var(--bark, #2a1e15)",
  borderRadius: 10,
  padding: "22px 20px",
};
const pageTitle: React.CSSProperties = {
  fontFamily: "'Sora', sans-serif",
  fontSize: "1.9rem",
  fontWeight: 900,
  letterSpacing: "-0.05em",
  marginBottom: 6,
  color: "var(--bark, #2a1e15)",
};
const pageSub: React.CSSProperties = {
  color: "var(--sand, #8c7b6e)",
  marginBottom: 36,
  fontSize: "0.9rem",
};
const sectionHeading: React.CSSProperties = {
  fontFamily: "'Sora', sans-serif",
  fontSize: "1.1rem",
  fontWeight: 900,
  color: "var(--bark, #2a1e15)",
  marginBottom: 20,
};
const tblTh: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "var(--sand, #8c7b6e)",
  padding: "0 14px 12px",
  textAlign: "left" as const,
  borderBottom: "1.5px solid var(--border, #e8ddd5)",
  whiteSpace: "nowrap" as const,
};
const tblTd: React.CSSProperties = {
  padding: "13px 14px",
  borderBottom: "1px solid var(--border, #e8ddd5)",
  color: "var(--warm-mid, #5a4a3d)",
  verticalAlign: "middle" as const,
  fontSize: "0.87rem",
};
function Btn({ children, onClick, disabled, variant = "primary", small }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "danger" | "ghost" | "success" | "warn"; small?: boolean;
}) {
  const bg: Record<string, string> = {
    primary: "var(--ember, #c45c1a)", danger: "#991b1b", ghost: "var(--parchment, #f5ede4)",
    success: "#166534", warn: "#92400e",
  };
  const fg: Record<string, string> = {
    primary: "#fff", danger: "#fff", ghost: "var(--warm-mid, #5a4a3d)", success: "#fff", warn: "#fff",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "4px 10px" : "8px 16px",
        background: disabled ? "#e5e7eb" : bg[variant],
        color: disabled ? "#9ca3af" : fg[variant],
        border: variant === "ghost" ? "1.5px solid var(--border, #e8ddd5)" : "none",
        borderRadius: 6,
        fontSize: small ? "0.7rem" : "0.78rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.2s",
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </button>
  );
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  accepted: { bg: "#d1fae5", fg: "#065f46" },
  completed: { bg: "#dcfce7", fg: "#166534" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
  approved: { bg: "#d1fae5", fg: "#065f46" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
  customer: { bg: "#dbeafe", fg: "#1e40af" },
  provider: { bg: "#fef3c7", fg: "#92400e" },
  both: { bg: "#f3e8ff", fg: "#6b21a8" },
  admin: { bg: "#fee2e2", fg: "#991b1b" },
};
function Badge({ text }: { text: string }) {
  const c = STATUS_COLORS[text?.toLowerCase()] ?? { bg: "#f3f4f6", fg: "#374151" };
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.04em", textTransform: "capitalize" as const,
      background: c.bg, color: c.fg,
    }}>{text}</span>
  );
}

// ── nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "bookings", label: "Bookings", icon: "📅" },
  { key: "providers", label: "Providers", icon: "🤝" },
  { key: "revenue", label: "Revenue", icon: "💰" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { key: "featured", label: "Featured Requests", icon: "⭐" },
  { key: "verifications", label: "Verifications", icon: "✅" },
  { key: "feedback", label: "Feedback & Issues", icon: "💬" },
  { key: "categories", label: "Categories", icon: "📦" },
  { key: "api_partners", label: "API Partners", icon: "🔌" },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminClient({
  users, bookings, payments, providers, verifications,
  featuredRequests: initFR, feedback, totalRevenue, categories: initCats,
  partners = [], smileidStats = null,
}: Props) {
  const router = useRouter();
  const [section, setSection] = useState("overview");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [categories, setCategories] = useState(initCats);
  const [featuredRequests, setFeaturedRequests] = useState(initFR);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});

  const completedPayments = payments.filter((p) => p.paymentStatus === "completed");
  const pendingPayments   = payments.filter((p) => p.paymentStatus === "pending");
  const grossRevenue      = completedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const platformCommission = grossRevenue * 0.10;
  const featuredRevenue   = featuredRequests.reduce((s: number, fr: any) =>
    s + (fr.paymentStatus === "completed" ? Number(fr.fee) : 0), 0);
  const pendingCollection = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingBookings   = bookings.filter((b) => b.status === "pending").length;
  const pendingVerifications = verifications.filter((v) => v.status === "pending");
  const pendingFeatured   = featuredRequests.filter((fr: any) =>
    fr.requestStatus === "pending" && fr.paymentStatus === "completed");
  const unreadFeedback    = feedback.filter((f) => !f.isRead).length;
  const totalCustomers    = users.filter((u) => u.userType === "customer").length;
  const totalProviderUsers = users.filter((u) => u.userType === "provider" || u.userType === "both").length;

  const navBadges: Record<string, number> = {
    featured: pendingFeatured.length,
    verifications: pendingVerifications.length,
    feedback: unreadFeedback,
  };

  async function adminAction(action: string, targetId: number | string, extraData?: object) {
    setLoadingId(`${action}-${targetId}`);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, data: extraData }),
    });
    setLoadingId(null);
    if (res.ok) router.refresh();
    return res;
  }

  function exportCSV(type: string) {
    window.open(`/api/admin/export?type=${type}`, "_blank");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 260, background: "var(--bark, #2a1e15)", position: "sticky", top: 0,
        height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        <div style={{ margin: "28px 20px 24px", padding: "14px 16px", background: "rgba(196,92,26,0.15)", border: "1px solid rgba(196,92,26,0.3)", borderRadius: 8, textAlign: "center" }}>
          <Link href="/" style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.15rem", fontWeight: 900, color: "var(--cream, #fdf9f3)", textDecoration: "none", display: "block" }}>
            Quick<span style={{ color: "var(--ember, #c45c1a)" }}>Hire</span>
          </Link>
          <p style={{ fontSize: "0.68rem", color: "var(--ember, #c45c1a)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>Admin Panel</p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {NAV.map((item) => {
            const badge = navBadges[item.key];
            const isActive = section === item.key;
            return (
              <button key={item.key} type="button"
                onClick={() => setSection(item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 24px",
                  fontSize: "0.83rem", fontWeight: 600, background: isActive ? "rgba(196,92,26,0.12)" : "transparent",
                  borderTop: "none", borderRight: "none", borderBottom: "none",
                  borderLeft: isActive ? "3px solid var(--ember, #c45c1a)" : "3px solid transparent",
                  color: isActive ? "var(--cream, #fdf9f3)" : "rgba(245,240,232,0.5)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.18s",
                }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge != null && badge > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--ember, #c45c1a)", color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px 28px" }}>
          <button onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/")} style={{ display: "block", width: "100%", textAlign: "center", padding: "9px 16px", fontSize: "0.78rem", color: "rgba(245,240,232,0.35)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, background: "var(--cream, #fdf9f3)", padding: "48px", overflowY: "auto", minHeight: "100vh" }}>

        {section === "overview" && (
          <OverviewSection
            users={users} bookings={bookings} payments={completedPayments}
            providers={providers} grossRevenue={grossRevenue}
            platformCommission={platformCommission} featuredRevenue={featuredRevenue}
            pendingCollection={pendingCollection} pendingBookings={pendingBookings}
            totalCustomers={totalCustomers} totalProviderUsers={totalProviderUsers}
            pendingVerifications={pendingVerifications.length}
            pendingFeatured={pendingFeatured.length}
            setSection={setSection} exportCSV={exportCSV}
          />
        )}

        {section === "users" && (
          <UsersSection users={users} adminAction={adminAction} loadingId={loadingId} />
        )}

        {section === "bookings" && (
          <BookingsSection bookings={bookings} adminAction={adminAction} loadingId={loadingId} />
        )}

        {section === "providers" && (
          <ProvidersSection providers={providers} bookings={bookings} payments={payments}
            adminAction={adminAction} loadingId={loadingId} />
        )}

        {section === "revenue" && (
          <RevenueSection grossRevenue={grossRevenue} platformCommission={platformCommission}
            featuredRevenue={featuredRevenue} pendingCollection={pendingCollection}
            providers={providers} bookings={bookings} payments={payments} />
        )}

        {section === "analytics" && (
          <AnalyticsSection bookings={bookings} payments={completedPayments}
            users={users} providers={providers} exportCSV={exportCSV} />
        )}

        {section === "featured" && (
          <FeaturedSection featuredRequests={featuredRequests}
            setFeaturedRequests={setFeaturedRequests}
            adminAction={adminAction} loadingId={loadingId} />
        )}

        {section === "verifications" && (
          <VerificationsSection verifications={verifications} adminAction={adminAction}
            loadingId={loadingId} rejectNotes={rejectNotes} setRejectNotes={setRejectNotes} />
        )}

        {section === "feedback" && (
          <FeedbackSection feedback={feedback} adminAction={adminAction}
            loadingId={loadingId} replyText={replyText} setReplyText={setReplyText} />
        )}

        {section === "categories" && (
          <CategoriesSection categories={categories} setCategories={setCategories}
            adminAction={adminAction} loadingId={loadingId} />
        )}

        {section === "api_partners" && (
          <APIPartnersSection partners={partners} smileidStats={smileidStats}
            adminAction={adminAction} loadingId={loadingId} />
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function OverviewSection({ users, bookings, payments, providers, grossRevenue, platformCommission,
  featuredRevenue, pendingCollection, pendingBookings, totalCustomers, totalProviderUsers,
  pendingVerifications, pendingFeatured, setSection, exportCSV }: any) {

  const completed = bookings.filter((b: any) => b.status === "completed").length;
  const featuredCount = providers.filter((p: any) => p.isFeatured).length;

  // Monthly revenue (last 6 months) computed from payments
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-GH", { month: "short" }),
      month: d.getMonth(), year: d.getFullYear(),
    };
  });
  const revenueByMonth = months.map((m) => {
    const rev = payments
      .filter((p: any) => {
        const d = new Date(p.paymentDate ?? p.createdAt);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      })
      .reduce((s: number, p: any) => s + Number(p.amount) * 0.1, 0);
    return { ...m, rev };
  });
  const maxRev = Math.max(...revenueByMonth.map((m) => m.rev), 1);
  const todayStr = new Date().toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <h2 style={pageTitle}>Admin Dashboard</h2>
      <p style={pageSub}>{todayStr}</p>

      {/* Primary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
        <div style={statCard}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "2rem", fontWeight: 900, color: "var(--bark)", letterSpacing: "-0.05em", display: "block" }}>{users.length}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--sand)" }}>Total Users</span>
          <span style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 6, display: "block" }}>{totalCustomers} customers · {totalProviderUsers} providers</span>
        </div>
        <div style={statCard}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "2rem", fontWeight: 900, color: "var(--bark)", letterSpacing: "-0.05em", display: "block" }}>{bookings.length}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--sand)" }}>Total Bookings</span>
          <span style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 6, display: "block" }}>{completed} completed · {pendingBookings} pending</span>
        </div>
        <div style={statCardDark}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "var(--ember)", letterSpacing: "-0.04em", display: "block" }}>GH₵ {grossRevenue.toLocaleString("en-GH", { minimumFractionDigits: 0 })}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(245,240,232,0.5)" }}>Gross Revenue</span>
        </div>
        <div style={statCardDark}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "var(--ember)", letterSpacing: "-0.04em", display: "block" }}>GH₵ {(platformCommission + featuredRevenue).toLocaleString("en-GH", { minimumFractionDigits: 0 })}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(245,240,232,0.5)" }}>Platform Income</span>
          <span style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.35)", marginTop: 6, display: "block" }}>Commission + featured listings</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Providers", value: providers.filter((p: any) => p.isAvailable).length },
          { label: "Verified Providers", value: providers.filter((p: any) => p.isVerified).length },
          { label: "Featured Providers", value: featuredCount },
          { label: "Pending Collection", value: `GH₵ ${pendingCollection.toFixed(0)}` },
        ].map((s) => (
          <div key={s.label} style={statCard}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: s.label === "Pending Collection" ? "1.3rem" : "2rem", fontWeight: 900, color: "var(--bark)", letterSpacing: "-0.05em", display: "block" }}>{s.value}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--sand)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Attention strip */}
      {(pendingBookings > 0 || pendingVerifications > 0 || pendingFeatured > 0) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {pendingBookings > 0 && (
            <div onClick={() => setSection("bookings")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: 10, cursor: "pointer" }}>
              <span>📅</span>
              <div><p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>{pendingBookings} pending booking{pendingBookings > 1 ? "s" : ""}</p><p style={{ fontSize: "0.7rem", color: "#b45309" }}>Review in Bookings →</p></div>
            </div>
          )}
          {pendingVerifications > 0 && (
            <div onClick={() => setSection("verifications")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#dbeafe", border: "1.5px solid #93c5fd", borderRadius: 10, cursor: "pointer" }}>
              <span>✅</span>
              <div><p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e40af" }}>{pendingVerifications} verification{pendingVerifications > 1 ? "s" : ""} pending</p><p style={{ fontSize: "0.7rem", color: "#2563eb" }}>Review in Verifications →</p></div>
            </div>
          )}
          {pendingFeatured > 0 && (
            <div onClick={() => setSection("featured")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: 10, cursor: "pointer" }}>
              <span>⭐</span>
              <div><p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>{pendingFeatured} featured request{pendingFeatured > 1 ? "s" : ""}</p><p style={{ fontSize: "0.7rem", color: "#b45309" }}>Review in Featured →</p></div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Revenue Bar Chart */}
      <div style={card}>
        <h3 style={sectionHeading}>Monthly Revenue</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200, marginBottom: 30, paddingBottom: 4, borderBottom: "2px solid var(--border, #e8ddd5)", borderLeft: "2px solid var(--border, #e8ddd5)" }}>
          {revenueByMonth.map((m) => {
            const h = (m.rev / maxRev) * 170 + 10;
            return (
              <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <span style={{ position: "absolute", top: -22, fontSize: "0.7rem", fontWeight: 700, color: "var(--bark)", whiteSpace: "nowrap" as const }}>GH₵ {m.rev.toFixed(0)}</span>
                <div style={{ width: "80%", height: h, background: "linear-gradient(180deg, var(--ember, #c45c1a), rgba(13,148,136,0.4))", borderRadius: "6px 6px 0 0" }} />
                <span style={{ position: "absolute", bottom: -22, fontSize: "0.72rem", fontWeight: 700, color: "var(--sand)" }}>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(["bookings", "payments", "users", "providers"] as const).map((t) => (
          <Btn key={t} onClick={() => exportCSV(t)} variant="ghost">↓ Export {t.charAt(0).toUpperCase() + t.slice(1)} CSV</Btn>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
function UsersSection({ users, adminAction, loadingId }: any) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<number, any>>({});

  const filtered = users.filter((u: any) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(u: any) {
    setEditData((d) => ({ ...d, [u.id]: { fullName: u.fullName, email: u.email, phone: u.phone ?? "", userType: u.userType } }));
    setExpandedId(u.id);
  }

  return (
    <div>
      <h2 style={pageTitle}>User Management</h2>
      <p style={pageSub}>{users.length} registered users · click Edit to modify.</p>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ padding: "9px 14px", border: "1.5px solid var(--border, #e8ddd5)", borderRadius: 8, fontSize: "0.87rem", width: 280, background: "var(--card-bg, #fff)", color: "var(--bark)", outline: "none" }} />
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <thead>
            <tr style={{ background: "var(--parchment, #f5ede4)" }}>
              {["#", "Name", "Email", "Phone", "Type", "Joined", "Actions"].map((h) => (
                <th key={h} style={tblTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <>
                <tr key={u.id} style={{ cursor: "default" }}>
                  <td style={tblTd}><span style={{ color: "var(--sand)", fontSize: "0.78rem" }}>#{u.id}</span></td>
                  <td style={{ ...tblTd, fontWeight: 600, color: "var(--bark)" }}>{u.fullName}</td>
                  <td style={tblTd}>{u.email}</td>
                  <td style={tblTd}>{u.phone ?? "—"}</td>
                  <td style={tblTd}><Badge text={u.userType} /></td>
                  <td style={tblTd}>{new Date(u.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td style={{ ...tblTd, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn small variant="ghost" onClick={() => expandedId === u.id ? setExpandedId(null) : startEdit(u)}>
                        {expandedId === u.id ? "Cancel" : "Edit"}
                      </Btn>
                      <Btn small variant="ghost" disabled={loadingId === `reset_password-${u.id}`}
                        onClick={() => { if (confirm(`Reset password for ${u.fullName}? New password: QuickHire2024!`)) adminAction("reset_password", u.id, { newPassword: "QuickHire2024!" }); }}>
                        Reset PW
                      </Btn>
                      <Btn small variant="danger" disabled={loadingId === `delete_user-${u.id}`}
                        onClick={() => { if (confirm(`Delete ${u.fullName}? This removes ALL their data permanently.`)) adminAction("delete_user", u.id); }}>
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && editData[u.id] && (
                  <tr key={`edit-${u.id}`}>
                    <td colSpan={7} style={{ background: "var(--parchment, #f5ede4)", padding: "16px 14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                        {[
                          { key: "fullName", placeholder: "Full name" },
                          { key: "email", placeholder: "Email" },
                          { key: "phone", placeholder: "Phone" },
                        ].map(({ key, placeholder }) => (
                          <input key={key} value={editData[u.id][key]} placeholder={placeholder}
                            onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], [key]: e.target.value } }))}
                            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
                        ))}
                        <select aria-label="User type" value={editData[u.id].userType}
                          onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], userType: e.target.value } }))}
                          style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none" }}>
                          <option value="customer">Customer</option>
                          <option value="provider">Provider</option>
                          <option value="both">Both</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={() => { adminAction("update_user", u.id, editData[u.id]); setExpandedId(null); }}
                          disabled={loadingId === `update_user-${u.id}`}>Save Changes</Btn>
                        <Btn variant="ghost" onClick={() => setExpandedId(null)}>Cancel</Btn>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ ...tblTd, textAlign: "center", padding: 40, color: "var(--sand)" }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════════════════════
function BookingsSection({ bookings, adminAction, loadingId }: any) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b: any) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch = !search ||
      b.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      b.provider.user.fullName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <h2 style={pageTitle}>Bookings</h2>
      <p style={pageSub}>{bookings.length} total bookings · update status or payment directly in the table.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer or provider…"
          style={{ padding: "9px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.87rem", width: 260, background: "var(--card-bg, #fff)", color: "var(--bark)", outline: "none" }} />
        {["all", "pending", "accepted", "completed", "cancelled"].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            style={{
              padding: "8px 14px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em",
              textTransform: "capitalize" as const, cursor: "pointer", transition: "all 0.15s",
              background: filter === s ? "var(--ember, #c45c1a)" : "transparent",
              color: filter === s ? "#fff" : "var(--sand)",
              border: filter === s ? "1.5px solid var(--ember)" : "1.5px solid var(--border)",
            }}>{s}</button>
        ))}
      </div>

      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--parchment, #f5ede4)" }}>
              {["#", "Customer", "Provider", "Service", "Date", "Amount", "Booking Status", "Payment", "Actions"].map((h) => (
                <th key={h} style={tblTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => (
              <tr key={b.id}>
                <td style={tblTd}><span style={{ color: "var(--sand)", fontSize: "0.78rem" }}>#{b.id}</span></td>
                <td style={{ ...tblTd, fontWeight: 500 }}>{b.user.fullName}</td>
                <td style={{ ...tblTd, fontWeight: 500 }}>{b.provider.user.fullName}</td>
                <td style={tblTd}>{b.service?.serviceName ?? "—"}</td>
                <td style={{ ...tblTd, fontSize: "0.78rem", color: "var(--sand)", whiteSpace: "nowrap" }}>
                  {new Date(b.bookingDate).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td style={{ ...tblTd, fontWeight: 600, whiteSpace: "nowrap" }}>GH₵ {Number(b.service?.price ?? 0).toFixed(0)}</td>
                <td style={tblTd}>
                  <select aria-label="Status" defaultValue={b.status}
                    onChange={(e) => adminAction("update_booking_status", b.id, { status: e.target.value })}
                    style={{ padding: "4px 8px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, background: "var(--cream)", color: "var(--bark)", outline: "none", cursor: "pointer" }}>
                    {["pending", "accepted", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={tblTd}>
                  {b.payment ? (
                    <select aria-label="Payment status" defaultValue={b.payment.paymentStatus}
                      onChange={(e) => adminAction("update_payment", b.payment.id, { paymentStatus: e.target.value })}
                      style={{ padding: "4px 8px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, background: "var(--cream)", color: "var(--bark)", outline: "none", cursor: "pointer" }}>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : <span style={{ color: "var(--sand)", fontSize: "0.78rem" }}>—</span>}
                </td>
                <td style={{ ...tblTd, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={`/receipt/${b.id}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.72rem", color: "var(--ember)", fontWeight: 700, textDecoration: "none" }}>Receipt</a>
                    <Btn small variant="danger" disabled={loadingId === `delete_booking-${b.id}`}
                      onClick={() => { if (confirm(`Delete booking #${b.id}?`)) adminAction("delete_booking", b.id); }}>
                      Delete
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...tblTd, textAlign: "center", padding: 40, color: "var(--sand)" }}>No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROVIDERS
// ══════════════════════════════════════════════════════════════════════════════
function ProvidersSection({ providers, bookings, payments, adminAction, loadingId }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = providers.filter((p: any) =>
    p.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.serviceCategory ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Per-provider job counts + earnings from bookings/payments
  const providerStats = useMemo(() => {
    const stats: Record<number, { jobs: number; earned: number }> = {};
    bookings.forEach((b: any) => {
      if (!stats[b.providerId]) stats[b.providerId] = { jobs: 0, earned: 0 };
      stats[b.providerId].jobs++;
      if (b.payment?.paymentStatus === "completed") {
        stats[b.providerId].earned += Number(b.payment.amount) * 0.9;
      }
    });
    return stats;
  }, [bookings]);

  return (
    <div>
      <h2 style={pageTitle}>Providers</h2>
      <p style={pageSub}>{providers.length} service providers · toggle verified/featured or click Edit for details.</p>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search provider name or category…"
          style={{ padding: "9px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.87rem", width: 280, background: "var(--card-bg, #fff)", color: "var(--bark)", outline: "none" }} />
      </div>

      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--parchment, #f5ede4)" }}>
              {["#", "Name", "Email", "Category", "Rating", "Jobs", "Net Earned", "Verified", "Featured", "Avail", "Cap", "Actions"].map((h) => (
                <th key={h} style={tblTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const st = providerStats[p.id] ?? { jobs: 0, earned: 0 };
              return (
                <>
                  <tr key={p.id}>
                    <td style={tblTd}><span style={{ color: "var(--sand)", fontSize: "0.78rem" }}>#{p.id}</span></td>
                    <td style={{ ...tblTd, fontWeight: 600, color: "var(--bark)" }}>{p.user.fullName}</td>
                    <td style={tblTd}>{p.user.email}</td>
                    <td style={tblTd}>{p.serviceCategory ?? "—"}</td>
                    <td style={tblTd}>★ {Number(p.rating ?? 0).toFixed(1)}</td>
                    <td style={tblTd}>{st.jobs}</td>
                    <td style={{ ...tblTd, fontWeight: 600 }}>GH₵ {st.earned.toFixed(0)}</td>
                    <td style={tblTd}>
                      <Btn small variant={p.isVerified ? "success" : "ghost"}
                        disabled={loadingId === `update_provider-${p.id}`}
                        onClick={() => adminAction("update_provider", p.id, { isVerified: !p.isVerified })}>
                        {p.isVerified ? "✓ Yes" : "No"}
                      </Btn>
                    </td>
                    <td style={tblTd}>
                      <Btn small variant={p.isFeatured ? "warn" : "ghost"}
                        disabled={loadingId === `update_provider-${p.id}`}
                        onClick={() => adminAction("update_provider", p.id, { isFeatured: !p.isFeatured })}>
                        {p.isFeatured ? "★ Yes" : "No"}
                      </Btn>
                    </td>
                    <td style={tblTd}><Badge text={p.isAvailable ? "Yes" : "No"} /></td>
                    <td style={tblTd}>{p.dailyBookingCap === 0 ? "∞" : p.dailyBookingCap}</td>
                    <td style={tblTd}>
                      <Btn small variant="ghost" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                        {expandedId === p.id ? "Close" : "Edit"}
                      </Btn>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <ProviderEditRow key={`edit-${p.id}`} provider={p} adminAction={adminAction}
                      onClose={() => setExpandedId(null)} loadingId={loadingId} />
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={12} style={{ ...tblTd, textAlign: "center", padding: 40, color: "var(--sand)" }}>No providers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProviderEditRow({ provider: p, adminAction, onClose, loadingId }: any) {
  const [bio, setBio] = useState(p.bio ?? "");
  const [category, setCategory] = useState(p.serviceCategory ?? "");
  const [cap, setCap] = useState(String(p.dailyBookingCap ?? 0));
  const [exp, setExp] = useState(String(p.experienceYears ?? 0));
  const [avail, setAvail] = useState(p.availability ?? "");
  const [langs, setLangs] = useState(p.languages ?? "");

  return (
    <tr>
      <td colSpan={12} style={{ background: "var(--parchment, #f5ede4)", padding: "16px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
          {[
            { val: category, set: setCategory, placeholder: "Service Category" },
            { val: avail, set: setAvail, placeholder: "Availability (e.g. Mon–Fri)" },
            { val: langs, set: setLangs, placeholder: "Languages (e.g. English, Twi)" },
          ].map(({ val, set, placeholder }) => (
            <input key={placeholder} value={val} onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
          ))}
          <input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="Experience (years)" type="number" min="0"
            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
          <input value={cap} onChange={(e) => setCap(e.target.value)} placeholder="Daily cap (0=unlimited)" type="number" min="0"
            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio / description" rows={2}
            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.85rem", background: "#fff", color: "var(--bark)", outline: "none", resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { adminAction("update_provider", p.id, { bio, serviceCategory: category, dailyBookingCap: cap, experienceYears: exp, availability: avail, languages: langs }); onClose(); }}
            disabled={loadingId === `update_provider-${p.id}`}>Save Changes</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE
// ══════════════════════════════════════════════════════════════════════════════
function RevenueSection({ grossRevenue, platformCommission, featuredRevenue, pendingCollection, providers, bookings, payments }: any) {
  // Per-provider earnings breakdown
  const providerEarnings = useMemo(() => {
    const map: Record<number, { name: string; category: string; jobs: number; gross: number; commission: number; net: number }> = {};
    bookings.forEach((b: any) => {
      const name = b.provider?.user?.fullName ?? "—";
      const cat = b.provider?.serviceCategory ?? "—";
      if (!map[b.providerId]) map[b.providerId] = { name, category: cat, jobs: 0, gross: 0, commission: 0, net: 0 };
      map[b.providerId].jobs++;
      if (b.payment?.paymentStatus === "completed") {
        const amt = Number(b.payment.amount);
        map[b.providerId].gross += amt;
        map[b.providerId].commission += amt * 0.1;
        map[b.providerId].net += amt * 0.9;
      }
    });
    return Object.values(map).sort((a, b) => b.gross - a.gross);
  }, [bookings]);

  return (
    <div>
      <h2 style={pageTitle}>Revenue & Earnings</h2>
      <p style={pageSub}>Commission rate: 10% per transaction. Ghana VAT/NHIL/GETFund: 20% on customer side.</p>

      {/* Revenue cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Gross Revenue (GMV)", value: `GH₵ ${grossRevenue.toFixed(2)}`, dark: true },
          { label: "QuickHire Commission (10%)", value: `GH₵ ${platformCommission.toFixed(2)}`, dark: true },
          { label: "Featured Listings Revenue", value: `GH₵ ${featuredRevenue.toFixed(2)}`, dark: true },
          { label: "Total QuickHire Income", value: `GH₵ ${(platformCommission + featuredRevenue).toFixed(2)}`, dark: true },
          { label: "Provider Payouts (90%)", value: `GH₵ ${(grossRevenue - platformCommission).toFixed(2)}`, dark: false },
          { label: "Pending Collection", value: `GH₵ ${pendingCollection.toFixed(2)}`, dark: false },
        ].map((s) => (
          <div key={s.label} style={s.dark ? statCardDark : statCard}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.35rem", fontWeight: 900, color: s.dark ? "var(--ember)" : "var(--bark)", letterSpacing: "-0.04em", display: "block" }}>{s.value}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: s.dark ? "rgba(245,240,232,0.5)" : "var(--sand)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Revenue model */}
      <div style={card}>
        <h3 style={sectionHeading}>Revenue Model</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "var(--cream, #fdf9f3)", borderRadius: 10, padding: 20 }}>
            <p style={{ fontWeight: 700, color: "var(--bark)", marginBottom: 8, fontSize: "0.9rem" }}>Transaction Commission</p>
            <p style={{ fontSize: "0.85rem", color: "var(--warm-mid)", lineHeight: 1.6 }}>QuickHire takes 10% of every completed payment. Customer pays base × 1.20 (20% Ghana tax). Provider nets base × 0.90.</p>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "var(--ember)", marginTop: 8 }}>GH₵ {platformCommission.toFixed(2)}</p>
          </div>
          <div style={{ background: "var(--cream, #fdf9f3)", borderRadius: 10, padding: 20 }}>
            <p style={{ fontWeight: 700, color: "var(--bark)", marginBottom: 8, fontSize: "0.9rem" }}>Featured Listings</p>
            <p style={{ fontSize: "0.85rem", color: "var(--warm-mid)", lineHeight: 1.6 }}>GH₵ 50/week for featured placement. Revenue from listing fees adds directly to QuickHire income.</p>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "var(--ember)", marginTop: 8 }}>GH₵ {featuredRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Provider earnings breakdown */}
      <div style={card}>
        <h3 style={sectionHeading}>Provider Earnings Breakdown</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr>
                {["Provider", "Category", "Jobs", "Gross Earned", "Commission Paid", "Net Earned"].map((h) => (
                  <th key={h} style={tblTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providerEarnings.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tblTd, textAlign: "center", padding: 32, color: "var(--sand)" }}>No payment data yet.</td></tr>
              ) : providerEarnings.map((pe) => (
                <tr key={pe.name}>
                  <td style={{ ...tblTd, fontWeight: 600, color: "var(--bark)" }}>{pe.name}</td>
                  <td style={tblTd}>{pe.category}</td>
                  <td style={tblTd}>{pe.jobs}</td>
                  <td style={{ ...tblTd, fontWeight: 600 }}>GH₵ {pe.gross.toFixed(2)}</td>
                  <td style={{ ...tblTd, color: "#991b1b" }}>GH₵ {pe.commission.toFixed(2)}</td>
                  <td style={{ ...tblTd, fontWeight: 700, color: "var(--ember)" }}>GH₵ {pe.net.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════
function AnalyticsSection({ bookings, payments, users, providers, exportCSV }: any) {
  const completedB = bookings.filter((b: any) => b.status === "completed").length;
  const cancelledB = bookings.filter((b: any) => b.status === "cancelled").length;
  const totalRev   = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const platformRev = totalRev * 0.1;
  const avgVal     = payments.length ? totalRev / payments.length : 0;
  const convRate   = bookings.length ? Math.round(completedB / bookings.length * 100) : 0;

  // Bookings by status
  const statusCounts = ["pending", "accepted", "completed", "cancelled"].map((s) => ({
    s, count: bookings.filter((b: any) => b.status === s).length,
  }));

  // Monthly revenue (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en-GH", { month: "short", year: "2-digit" }), month: d.getMonth(), year: d.getFullYear() };
  });
  const monthlyData = months.map((m) => {
    const rev = payments.filter((p: any) => {
      const d = new Date(p.paymentDate ?? p.createdAt);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).reduce((s: number, p: any) => s + Number(p.amount) * 0.1, 0);
    const bks = bookings.filter((b: any) => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).length;
    return { ...m, rev, bks };
  });
  const maxMonthRev = Math.max(...monthlyData.map((m) => m.rev), 1);

  // Top categories by bookings
  const catMap: Record<string, { bookings: number; revenue: number }> = {};
  bookings.forEach((b: any) => {
    const cat = b.provider?.serviceCategory ?? "Other";
    if (!catMap[cat]) catMap[cat] = { bookings: 0, revenue: 0 };
    catMap[cat].bookings++;
    if (b.payment?.paymentStatus === "completed") catMap[cat].revenue += Number(b.payment.amount);
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1].bookings - a[1].bookings).slice(0, 8);
  const maxCatB = Math.max(...topCats.map(([, v]) => v.bookings), 1);

  // User growth by month
  const userGrowth = months.map((m) => {
    const newUsers = users.filter((u: any) => {
      const d = new Date(u.createdAt);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    return { ...m, total: newUsers.length, customers: newUsers.filter((u: any) => u.userType === "customer").length };
  });
  const maxUserGrowth = Math.max(...userGrowth.map((m) => m.total), 1);

  // Peak booking hours
  const hourMap: Record<number, number> = {};
  bookings.forEach((b: any) => {
    const h = new Date(b.bookingDate).getHours();
    hourMap[h] = (hourMap[h] ?? 0) + 1;
  });
  const maxHour = Math.max(...Object.values(hourMap), 1);

  // Top providers by revenue
  const topProviders: { name: string; category: string; rating: number; jobs: number; revenue: number }[] = [];
  const provMap: Record<number, typeof topProviders[0]> = {};
  bookings.forEach((b: any) => {
    if (!provMap[b.providerId]) {
      provMap[b.providerId] = {
        name: b.provider?.user?.fullName ?? "—",
        category: b.provider?.serviceCategory ?? "—",
        rating: Number(b.provider?.rating ?? 0),
        jobs: 0, revenue: 0,
      };
    }
    provMap[b.providerId].jobs++;
    if (b.payment?.paymentStatus === "completed") provMap[b.providerId].revenue += Number(b.payment.amount);
  });
  const top5Providers = Object.values(provMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
        <div>
          <h2 style={pageTitle}>Business Analytics</h2>
          <p style={pageSub}>Data-driven insights to help you make better decisions.</p>
        </div>
        <Btn onClick={() => exportCSV("bookings")}>↓ Export CSV</Btn>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Completion Rate", value: `${convRate}%`, dark: true },
          { label: "Avg Booking Value", value: `GH₵ ${avgVal.toFixed(0)}`, dark: true },
          { label: "Total GMV", value: `GH₵ ${totalRev.toFixed(0)}`, dark: false },
          { label: "Platform Revenue", value: `GH₵ ${platformRev.toFixed(0)}`, dark: false },
        ].map((s) => (
          <div key={s.label} style={s.dark ? statCardDark : statCard}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.7rem", fontWeight: 900, color: s.dark ? "var(--ember)" : "var(--bark)", letterSpacing: "-0.04em", display: "block" }}>{s.value}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: s.dark ? "rgba(245,240,232,0.5)" : "var(--sand)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Bookings by status */}
        <div style={card}>
          <h3 style={sectionHeading}>Bookings by Status</h3>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {statusCounts.map(({ s, count }) => (
              <div key={s}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "0.85rem" }}>
                  <span style={{ textTransform: "capitalize" as const, color: "var(--warm-mid)" }}>{s}</span>
                  <span style={{ fontWeight: 700, color: "var(--bark)" }}>{count}</span>
                </div>
                <div style={{ background: "var(--cream)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: bookings.length ? `${count / bookings.length * 100}%` : "0%", background: "var(--ember)", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top categories */}
        <div style={card}>
          <h3 style={sectionHeading}>Top Categories by Bookings</h3>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {topCats.length === 0 ? <p style={{ color: "var(--sand)", fontSize: "0.85rem" }}>No data yet.</p> : topCats.map(([name, v]) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.82rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--bark)" }}>{name}</span>
                  <span style={{ color: "var(--sand)" }}>{v.bookings} · GH₵ {v.revenue.toFixed(0)}</span>
                </div>
                <div style={{ height: 8, background: "var(--cream)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${v.bookings / maxCatB * 100}%`, background: "linear-gradient(90deg, var(--ember), #06b6d4)", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* User growth */}
        <div style={card}>
          <h3 style={sectionHeading}>User Growth (6 Months)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140, marginBottom: 28, borderBottom: "2px solid var(--border)" }}>
            {userGrowth.map((m) => {
              const totalH = (m.total / maxUserGrowth) * 120 + 4;
              const custH = m.total > 0 ? (m.customers / m.total) * totalH : 0;
              const provH = totalH - custH;
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  <span style={{ position: "absolute", top: -18, fontSize: "0.68rem", fontWeight: 700, color: "var(--bark)" }}>{m.total}</span>
                  <div style={{ width: "80%", display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ height: provH, background: "var(--ember)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                    <div style={{ height: custH, background: "#06b6d4", borderRadius: "0 0 3px 3px", minHeight: 2 }} />
                  </div>
                  <span style={{ position: "absolute", bottom: -20, fontSize: "0.65rem", fontWeight: 700, color: "var(--sand)" }}>{m.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#06b6d4", display: "block" }} /><span style={{ fontSize: "0.72rem", color: "var(--sand)", fontWeight: 600 }}>Customers</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--ember)", display: "block" }} /><span style={{ fontSize: "0.72rem", color: "var(--sand)", fontWeight: 600 }}>Providers</span></div>
          </div>
        </div>

        {/* Revenue trend */}
        <div style={card}>
          <h3 style={sectionHeading}>Revenue Trend</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140, marginBottom: 28, borderBottom: "2px solid var(--border)", borderLeft: "2px solid var(--border)" }}>
            {monthlyData.map((m) => {
              const h = (m.rev / maxMonthRev) * 120 + 4;
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  <span style={{ position: "absolute", top: -18, fontSize: "0.65rem", fontWeight: 700, color: "var(--bark)", whiteSpace: "nowrap" as const }}>GH₵ {m.rev.toFixed(0)}</span>
                  <div style={{ width: "75%", height: h, background: "linear-gradient(180deg, var(--ember), rgba(13,148,136,0.4))", borderRadius: "4px 4px 0 0" }}>
                    <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700, display: "block", paddingTop: 4, textAlign: "center" as const }}>{m.bks}</span>
                  </div>
                  <span style={{ position: "absolute", bottom: -20, fontSize: "0.65rem", fontWeight: 700, color: "var(--sand)" }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Peak hours + Top providers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={card}>
          <h3 style={sectionHeading}>Peak Booking Hours</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
            {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
              const count = hourMap[h] ?? 0;
              const barH = (count / maxHour) * 90 + 4;
              return (
                <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {count > 0 && <span style={{ position: "absolute", top: -16, fontSize: "0.58rem", fontWeight: 700, color: "var(--bark)" }}>{count}</span>}
                  <div style={{ width: "90%", height: barH, background: count === maxHour && count > 0 ? "var(--ember)" : "rgba(13,148,136,0.3)", borderRadius: "2px 2px 0 0" }} />
                  {h % 3 === 0 && <span style={{ position: "absolute", bottom: -18, fontSize: "0.56rem", color: "var(--sand)", fontWeight: 600 }}>{h}:00</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionHeading}>Top Providers by Revenue</h3>
          {top5Providers.length === 0 ? <p style={{ color: "var(--sand)", fontSize: "0.85rem" }}>No data yet.</p> : (
            <div>
              {top5Providers.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < top5Providers.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: i === 0 ? "var(--ember)" : "var(--cream)", color: i === 0 ? "#fff" : "var(--bark)", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--bark)" }}>{p.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--sand)" }}>{p.category} · ★ {p.rating.toFixed(1)} · {p.jobs} jobs</p>
                  </div>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--ember)", whiteSpace: "nowrap" as const }}>GH₵ {p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURED REQUESTS
// ══════════════════════════════════════════════════════════════════════════════
function FeaturedSection({ featuredRequests, setFeaturedRequests, adminAction, loadingId }: any) {
  const pending = featuredRequests.filter((fr: any) => fr.requestStatus === "pending");
  const others  = featuredRequests.filter((fr: any) => fr.requestStatus !== "pending");

  async function handle(action: "approve_featured" | "reject_featured", id: number) {
    const res = await adminAction(action, id);
    if (res?.ok) {
      setFeaturedRequests((prev: any[]) =>
        prev.map((fr: any) => fr.id === id ? { ...fr, requestStatus: action === "approve_featured" ? "approved" : "rejected" } : fr)
      );
    }
  }

  const FRCard = ({ fr }: { fr: any }) => (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--bark)" }}>{fr.provider?.user?.fullName ?? "—"}</p>
          <p style={{ fontSize: "0.82rem", color: "var(--sand)", marginTop: 2 }}>{fr.provider?.serviceCategory ?? "—"}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--sand)", marginTop: 4 }}>{fr.durationDays} days · GH₵ {Number(fr.fee).toFixed(2)} · {fr.paymentMethod?.replace("_", " ")}</p>
          {fr.approvedAt && <p style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 4 }}>Approved: {new Date(fr.approvedAt).toLocaleDateString("en-GH")}</p>}
          {fr.expiresAt && <p style={{ fontSize: "0.72rem", color: "#166534", marginTop: 2 }}>Expires: {new Date(fr.expiresAt).toLocaleDateString("en-GH")}</p>}
          <p style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 4 }}>{new Date(fr.createdAt).toLocaleDateString("en-GH")}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 8 }}>
          <Badge text={fr.requestStatus} />
          <Badge text={fr.paymentStatus === "completed" ? "paid" : "unpaid"} />
        </div>
      </div>
      {fr.requestStatus === "pending" && (
        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          {fr.paymentStatus === "completed" ? (
            <Btn onClick={() => handle("approve_featured", fr.id)} disabled={loadingId === `approve_featured-${fr.id}`} variant="success">
              Approve & Feature
            </Btn>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "#92400e", background: "#fef3c7", padding: "6px 12px", borderRadius: 6, fontWeight: 600 }}>
              Awaiting payment before approval
            </span>
          )}
          <Btn onClick={() => handle("reject_featured", fr.id)} disabled={loadingId === `reject_featured-${fr.id}`} variant="danger">
            Reject
          </Btn>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={pageTitle}>Featured Listing Requests</h2>
      <p style={pageSub}>{featuredRequests.length} requests · {pending.length} awaiting action.</p>

      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ ...sectionHeading, color: "#92400e" }}>⭐ Pending Requests ({pending.length})</h3>
          {pending.map((fr: any) => <FRCard key={fr.id} fr={fr} />)}
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 style={sectionHeading}>History</h3>
          {others.map((fr: any) => <FRCard key={fr.id} fr={fr} />)}
        </div>
      )}

      {featuredRequests.length === 0 && (
        <div style={{ textAlign: "center", padding: 64, color: "var(--sand)" }}>No featured listing requests yet.</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VERIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
function VerificationsSection({ verifications, adminAction, loadingId, rejectNotes, setRejectNotes }: any) {
  const pending = verifications.filter((v: any) => v.status === "pending");
  const others  = verifications.filter((v: any) => v.status !== "pending");

  const VCard = ({ v }: { v: any }) => (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--bark)" }}>{v.provider?.user?.fullName ?? "—"}</p>
          <p style={{ fontSize: "0.82rem", color: "var(--sand)", marginTop: 2 }}>{v.provider?.user?.email ?? "—"}</p>
          <p style={{ fontSize: "0.82rem", color: "var(--warm-mid)", marginTop: 4 }}>
            {v.idType?.replace("_", " ")} · #{v.idNumber}
          </p>
          {v.notes && <p style={{ fontSize: "0.78rem", color: "var(--sand)", marginTop: 4, fontStyle: "italic" as const }}>{v.notes}</p>}
          {v.smileidSummary && <p style={{ fontSize: "0.78rem", color: "#166534", marginTop: 4 }}>✓ Smile ID: {v.smileidSummary}</p>}
          {v.adminNotes && <p style={{ fontSize: "0.78rem", color: "#991b1b", marginTop: 4 }}>Admin note: {v.adminNotes}</p>}
          {v.documentPath && (
            <a href={v.documentPath} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.78rem", color: "var(--ember)", marginTop: 6, display: "block", fontWeight: 600 }}>
              View Document →
            </a>
          )}
          <p style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 6 }}>{new Date(v.createdAt).toLocaleDateString("en-GH")}</p>
        </div>
        <Badge text={v.status} />
      </div>

      {v.status === "pending" && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <input
            value={rejectNotes[v.id] ?? ""}
            onChange={(e) => setRejectNotes((r: any) => ({ ...r, [v.id]: e.target.value }))}
            placeholder="Rejection notes (optional)"
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.85rem", background: "var(--cream)", color: "var(--bark)", outline: "none", marginBottom: 10, boxSizing: "border-box" as const }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => adminAction("approve_verification", v.id)}
              disabled={loadingId === `approve_verification-${v.id}`} variant="success">
              Approve & Verify
            </Btn>
            <Btn onClick={() => adminAction("reject_verification", v.id, { notes: rejectNotes[v.id] })}
              disabled={loadingId === `reject_verification-${v.id}`} variant="danger">
              Reject
            </Btn>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={pageTitle}>Verification Requests</h2>
      <p style={pageSub}>{verifications.length} total · {pending.length} pending review.</p>

      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ ...sectionHeading, color: "#1e40af" }}>✅ Pending Review ({pending.length})</h3>
          {pending.map((v: any) => <VCard key={v.id} v={v} />)}
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 style={sectionHeading}>History</h3>
          {others.map((v: any) => <VCard key={v.id} v={v} />)}
        </div>
      )}

      {verifications.length === 0 && (
        <div style={{ textAlign: "center", padding: 64, color: "var(--sand)" }}>No verification requests yet.</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEEDBACK
// ══════════════════════════════════════════════════════════════════════════════
const ISSUE_CATS = ["service_issue", "provider_complaint", "payment_issue"];

function FeedbackSection({ feedback, adminAction, loadingId, replyText, setReplyText }: any) {
  const issues  = feedback.filter((f: any) => ISSUE_CATS.includes(f.category));
  const general = feedback.filter((f: any) => !ISSUE_CATS.includes(f.category));
  const avgRating = general.length
    ? (general.reduce((s: number, f: any) => s + (f.rating ?? 0), 0) / general.length).toFixed(1) : "—";
  const [openReplies, setOpenReplies] = useState<Record<number, boolean>>({});

  function toggleReply(id: number) {
    setOpenReplies((r) => ({ ...r, [id]: !r[id] }));
  }

  const FBCard = ({ f, isIssue }: { f: any; isIssue: boolean }) => (
    <div style={{ background: "var(--card-bg, #fff)", border: `1.5px solid ${isIssue ? "rgba(249,115,22,0.3)" : "var(--border)"}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--bark)" }}>{f.user?.fullName ?? "—"}</span>
          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10, marginLeft: 8, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: isIssue ? "rgba(249,115,22,0.1)" : "rgba(13,148,136,0.08)", color: isIssue ? "#c2410c" : "var(--ember)" }}>
            {f.category?.replace(/_/g, " ")}
          </span>
          {!f.isRead && <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 10, marginLeft: 6, fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>NEW</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 3 }}>
          {!isIssue && f.rating && <span style={{ color: "var(--ember)", fontSize: "0.88rem" }}>{"★".repeat(Math.min(f.rating, 5))}</span>}
          <span style={{ fontSize: "0.72rem", color: "var(--sand)" }}>{new Date(f.createdAt).toLocaleDateString("en-GH")}</span>
        </div>
      </div>

      <p style={{ fontSize: "0.88rem", color: "var(--warm-mid)", lineHeight: 1.6, marginBottom: 12 }}>{f.message}</p>

      {f.adminReply && (
        <div style={{ background: "rgba(13,148,136,0.04)", border: "1px solid rgba(13,148,136,0.12)", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ember)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>QuickHire Response</p>
          <p style={{ fontSize: "0.85rem", color: "var(--bark)", lineHeight: 1.6 }}>{f.adminReply}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!f.isRead && (
          <Btn small variant="ghost" onClick={() => adminAction("mark_feedback_read", f.id)}
            disabled={loadingId === `mark_feedback_read-${f.id}`}>
            Mark Read
          </Btn>
        )}
        <Btn small variant="ghost" onClick={() => toggleReply(f.id)}>
          {f.adminReply ? "✏️ Edit Reply" : "💬 Reply"}
        </Btn>
      </div>

      {openReplies[f.id] && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={replyText[f.id] ?? f.adminReply ?? ""}
            onChange={(e) => setReplyText((r: any) => ({ ...r, [f.id]: e.target.value }))}
            placeholder="Write your response…"
            rows={3}
            style={{ flex: 1, padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.88rem", background: "var(--cream)", color: "var(--bark)", outline: "none", resize: "vertical" as const, fontFamily: "inherit" }}
          />
          <Btn onClick={() => { adminAction("reply_feedback", f.id, { reply: replyText[f.id] }); setOpenReplies((r) => ({ ...r, [f.id]: false })); }}
            disabled={!replyText[f.id] || loadingId === `reply_feedback-${f.id}`}>
            Send Reply
          </Btn>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={pageTitle}>Feedback & Issues</h2>
      <p style={pageSub}>{feedback.length} total · {feedback.filter((f: any) => !f.isRead).length} unread.</p>

      {issues.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ ...sectionHeading, color: "#c2410c" }}>🚨 Issues Reported ({issues.length})</h3>
          {issues.map((f: any) => <FBCard key={f.id} f={f} isIssue />)}
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={sectionHeading}>General Feedback</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--sand)" }}>Average rating: <strong style={{ color: "var(--ember)" }}>★ {avgRating}</strong></span>
        </div>
        {general.length === 0
          ? <p style={{ color: "var(--sand)", fontSize: "0.88rem" }}>No general feedback yet.</p>
          : general.map((f: any) => <FBCard key={f.id} f={f} isIssue={false} />)
        }
      </div>

      {feedback.length === 0 && (
        <div style={{ textAlign: "center", padding: 64, color: "var(--sand)" }}>No feedback submitted yet.</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════
function CategoriesSection({ categories, setCategories, adminAction, loadingId }: any) {
  const [adding, setAdding]     = useState(false);
  const [newName, setNewName]   = useState("");
  const [newIcon, setNewIcon]   = useState("🔧");
  const [newDesc, setNewDesc]   = useState("");
  const [newKey, setNewKey]     = useState("");
  const [newOrder, setNewOrder] = useState("0");
  const [savingNew, setSavingNew] = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<number, any>>({});

  async function addCategory() {
    if (!newName.trim()) return;
    setSavingNew(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_category", targetId: 0,
        data: { name: newName, icon: newIcon, description: newDesc, filterKey: newKey || newName.toLowerCase().replace(/\s+/g, "_"), displayOrder: newOrder },
      }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((c: any[]) => [...c, cat]);
      setAdding(false); setNewName(""); setNewIcon("🔧"); setNewDesc(""); setNewKey(""); setNewOrder("0");
    }
    setSavingNew(false);
  }

  function startEdit(c: any) {
    setEditData((d) => ({ ...d, [c.id]: { name: c.name, icon: c.icon, description: c.description ?? "", filterKey: c.filterKey, displayOrder: String(c.displayOrder) } }));
    setEditId(c.id);
  }

  async function saveEdit(id: number) {
    await adminAction("update_category", id, editData[id]);
    setCategories((cats: any[]) => cats.map((c) => c.id === id ? { ...c, ...editData[id] } : c));
    setEditId(null);
  }

  async function toggleCat(id: number) {
    await adminAction("toggle_category", id);
    setCategories((cats: any[]) => cats.map((c) => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  }

  async function deleteCat(id: number) {
    await adminAction("delete_category", id);
    setCategories((cats: any[]) => cats.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h2 style={pageTitle}>Homepage Categories</h2>
      <p style={pageSub}>Manage the Popular Services cards shown on the homepage.</p>

      {/* Add form */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: adding ? 20 : 0 }}>
          <h3 style={{ ...sectionHeading, marginBottom: 0 }}>Add New Category</h3>
          <Btn onClick={() => setAdding(!adding)} variant={adding ? "ghost" : "primary"}>{adding ? "Cancel" : "+ Add Category"}</Btn>
        </div>
        {adding && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 70px", gap: 10, marginBottom: 14 }}>
              <EmojiPicker value={newIcon} onChange={setNewIcon} />
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name *"
                style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description"
                style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
              <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Filter key (auto)"
                style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
              <input value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="Order" type="number"
                style={{ padding: "9px 8px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={addCategory} disabled={savingNew || !newName.trim()} variant="success">
                {savingNew ? "Adding…" : "Add Category"}
              </Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <thead>
            <tr style={{ background: "var(--parchment, #f5ede4)" }}>
              {["Order", "Icon", "Name", "Description", "Filter Key", "Visible", "Actions"].map((h) => (
                <th key={h} style={tblTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <>
                <tr key={c.id} style={{ opacity: c.isVisible ? 1 : 0.5 }}>
                  <td style={{ ...tblTd, fontWeight: 700 }}>#{c.displayOrder}</td>
                  <td style={{ ...tblTd, fontSize: "1.5rem" }}>{c.icon}</td>
                  <td style={{ ...tblTd, fontWeight: 600, color: "var(--bark)" }}>{c.name}</td>
                  <td style={{ ...tblTd, fontSize: "0.82rem", color: "var(--warm-mid)", maxWidth: 200 }}>{c.description}</td>
                  <td style={tblTd}><code style={{ background: "var(--cream)", padding: "2px 8px", borderRadius: 4, fontSize: "0.78rem" }}>{c.filterKey}</code></td>
                  <td style={tblTd}>
                    <Badge text={c.isVisible ? "visible" : "hidden"} />
                  </td>
                  <td style={{ ...tblTd, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn small variant="ghost" onClick={() => editId === c.id ? setEditId(null) : startEdit(c)}>
                        {editId === c.id ? "Cancel" : "Edit"}
                      </Btn>
                      <Btn small variant="warn" onClick={() => toggleCat(c.id)}>
                        {c.isVisible ? "Hide" : "Show"}
                      </Btn>
                      <Btn small variant="danger" disabled={loadingId === `delete_category-${c.id}`}
                        onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteCat(c.id); }}>
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
                {editId === c.id && editData[c.id] && (
                  <tr key={`edit-${c.id}`}>
                    <td colSpan={7} style={{ background: "var(--parchment, #f5ede4)", padding: "14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 80px", gap: 10, marginBottom: 10 }}>
                        <EmojiPicker
                          value={editData[c.id].icon}
                          onChange={(v) => setEditData((d) => ({ ...d, [c.id]: { ...d[c.id], icon: v } }))}
                        />
                        {[
                          { key: "name", placeholder: "Name" },
                          { key: "description", placeholder: "Description" },
                          { key: "filterKey", placeholder: "Filter key" },
                          { key: "displayOrder", placeholder: "Order", type: "number" },
                        ].map(({ key, ...rest }) => (
                          <input key={key} value={editData[c.id][key]} placeholder={(rest as any).placeholder}
                            type={(rest as any).type ?? "text"}
                            onChange={(e) => setEditData((d) => ({ ...d, [c.id]: { ...d[c.id], [key]: e.target.value } }))}
                            style={{ padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: "0.87rem", background: "#fff", color: "var(--bark)", outline: "none" }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={() => saveEdit(c.id)}>Save</Btn>
                        <Btn variant="ghost" onClick={() => setEditId(null)}>Cancel</Btn>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={7} style={{ ...tblTd, textAlign: "center", padding: 40, color: "var(--sand)" }}>No categories yet. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Homepage preview */}
      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={sectionHeading}>Homepage Preview</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--sand)", marginBottom: 20 }}>How the Popular Services section looks to visitors.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {categories.filter((c: any) => c.isVisible).map((c: any) => (
            <div key={c.id} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 18px" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: 10 }}>{c.icon}</span>
              <p style={{ fontWeight: 700, color: "var(--bark)", marginBottom: 4, fontSize: "0.9rem" }}>{c.name}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--warm-mid)" }}>{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// API PARTNERS
// ══════════════════════════════════════════════════════════════════════════════
function APIPartnersSection({ partners, smileidStats, adminAction, loadingId }: any) {
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState("mobile_money");
  const [topupMsg, setTopupMsg] = useState<string | null>(null);
  const [credPartnerId, setCredPartnerId] = useState("");
  const [credApiKey, setCredApiKey] = useState("");
  const [credMsg, setCredMsg] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<Record<number, string>>({});

  const smilePartner = partners.find((p: any) => p.slug === "smile_id");
  const wallet = smilePartner?.wallet;
  const configs: Record<string, string> = {};
  if (smilePartner?.configs) {
    for (const c of smilePartner.configs) configs[c.configKey] = c.configValue ?? "";
  }
  const isEnabled = configs.enabled !== "0";
  const isLive = configs.mode === "live";
  const balance = wallet ? Number(wallet.balance) : 0;
  const costPerCheck = wallet ? Number(wallet.costPerCheck) : 3.5;
  const lowBalance = balance < costPerCheck * 10;

  async function handleTopup() {
    setTopupMsg(null);
    const res = await adminAction("topup_wallet", smilePartner?.id ?? 0, {
      amount: parseFloat(topupAmount),
      paymentMethod: topupMethod,
    });
    if (res?.ok) {
      setTopupMsg("Wallet topped up successfully.");
      setTopupAmount("");
    } else {
      const d = await res?.json?.();
      setTopupMsg(d?.error ?? "Top-up failed.");
    }
  }

  async function handleSaveCreds() {
    setCredMsg(null);
    const res = await adminAction("smileid_save_credentials", smilePartner?.id ?? 0, {
      partner_id: credPartnerId,
      api_key: credApiKey,
    });
    if (res?.ok) { setCredMsg("Credentials saved."); setCredPartnerId(""); setCredApiKey(""); }
    else setCredMsg("Failed to save credentials.");
  }

  const statTile = (label: string, val: any, sub?: string, accent?: string) => (
    <div style={{ ...statCard, textAlign: "center" }}>
      <div style={{ fontSize: "1.7rem", fontWeight: 900, color: accent ?? "var(--ember, #c45c1a)", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.04em" }}>{val}</div>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bark)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--sand)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h1 style={pageTitle}>API Partners</h1>
      <p style={pageSub}>Manage third-party integrations, credentials, and wallet balances.</p>

      {partners.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 60, color: "var(--sand)" }}>No API partners configured.</div>
      )}

      {smilePartner && (
        <>
          {/* Header card */}
          <div style={{ ...card, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "1.5rem" }}>🪪</span>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "var(--bark)" }}>Smile Identity</h2>
                <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: isEnabled ? "#dcfce7" : "#fee2e2", color: isEnabled ? "#166534" : "#991b1b" }}>{isEnabled ? "Enabled" : "Disabled"}</span>
                <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: isLive ? "#dbeafe" : "#fef3c7", color: isLive ? "#1e40af" : "#92400e" }}>{isLive ? "Live" : "Sandbox"}</span>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--sand)" }}>Ghana ID verification — Ghana Card, Passport, Voter's ID, Driver's Licence, NHIS</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant={isEnabled ? "danger" : "success"} small
                onClick={() => adminAction("smileid_toggle_enabled", smilePartner.id)}
                disabled={loadingId?.startsWith("smileid_toggle")}>
                {isEnabled ? "Disable" : "Enable"}
              </Btn>
              <Btn variant={isLive ? "warn" : "primary"} small
                onClick={() => adminAction("smileid_set_mode", smilePartner.id, { mode: isLive ? "sandbox" : "live" })}
                disabled={loadingId?.startsWith("smileid_set")}>
                Switch to {isLive ? "Sandbox" : "Live"}
              </Btn>
            </div>
          </div>

          {/* Wallet + usage stats */}
          {lowBalance && (
            <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <span style={{ fontSize: "0.87rem", color: "#92400e", fontWeight: 600 }}>
                Low wallet balance — GH₵ {balance.toFixed(2)} remaining ({Math.floor(balance / costPerCheck)} check{Math.floor(balance / costPerCheck) !== 1 ? "s" : ""} left). Top up soon.
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
            {statTile("Wallet Balance", `GH₵ ${balance.toFixed(2)}`, `GH₵ ${costPerCheck.toFixed(2)} / check`, balance < costPerCheck * 5 ? "#dc2626" : "#059669")}
            {smileidStats && (<>
              {statTile("Today", smileidStats.today.total, `${smileidStats.today.verified}✓ ${smileidStats.today.failed}✗ ${smileidStats.today.error}⚠`)}
              {statTile("This Week", smileidStats.week.total, `${smileidStats.week.verified}✓ ${smileidStats.week.failed}✗ ${smileidStats.week.error}⚠`)}
              {statTile("This Month", smileidStats.month.total, `${smileidStats.month.verified}✓ ${smileidStats.month.failed}✗ ${smileidStats.month.error}⚠`)}
              {statTile("All-Time", smileidStats.all.total, `${smileidStats.all.verified}✓ ${smileidStats.all.failed}✗ ${smileidStats.all.error}⚠`)}
            </>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Top-up wallet */}
            <div style={card}>
              <h3 style={sectionHeading}>Top Up Wallet</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="number" placeholder="Amount (GHS)" value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)} min="1" step="0.01"
                  style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", width: "100%", boxSizing: "border-box" as const }}
                />
                <select value={topupMethod} onChange={(e) => setTopupMethod(e.target.value)}
                  style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", background: "#fff" }}>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
                <Btn onClick={handleTopup} disabled={!topupAmount || parseFloat(topupAmount) <= 0}>Top Up</Btn>
                {topupMsg && <p style={{ fontSize: "0.82rem", color: topupMsg.includes("success") ? "#166534" : "#991b1b", margin: 0 }}>{topupMsg}</p>}
              </div>
            </div>

            {/* Credentials */}
            <div style={card}>
              <h3 style={sectionHeading}>Live Credentials</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--sand)", marginBottom: 14 }}>Only needed when switching to Live mode.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="text" placeholder="Partner ID" value={credPartnerId}
                  onChange={(e) => setCredPartnerId(e.target.value)}
                  style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", width: "100%", boxSizing: "border-box" as const }}
                />
                <input
                  type="password" placeholder="API Key (secret)" value={credApiKey}
                  onChange={(e) => setCredApiKey(e.target.value)}
                  style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: "0.87rem", width: "100%", boxSizing: "border-box" as const }}
                />
                <Btn onClick={handleSaveCreds} disabled={!credPartnerId && !credApiKey}>Save Credentials</Btn>
                {credMsg && <p style={{ fontSize: "0.82rem", color: credMsg.includes("saved") ? "#166534" : "#991b1b", margin: 0 }}>{credMsg}</p>}
              </div>
            </div>
          </div>

          {/* Activity log */}
          <div style={card}>
            <h3 style={sectionHeading}>Recent Verification Activity</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Time", "Action", "Status", "Summary", "Reference"].map((h) => (
                      <th key={h} style={tblTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(smilePartner.activityLogs ?? []).map((log: any) => (
                    <tr key={log.id}>
                      <td style={tblTd}>{new Date(log.createdAt).toLocaleString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                      <td style={tblTd}><span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{log.action}</span></td>
                      <td style={tblTd}>
                        <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                          background: log.status === "verified" ? "#dcfce7" : log.status === "failed" ? "#fee2e2" : log.status === "error" ? "#e0e7ff" : "#f3f4f6",
                          color: log.status === "verified" ? "#166534" : log.status === "failed" ? "#991b1b" : log.status === "error" ? "#3730a3" : "#374151" }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ ...tblTd, maxWidth: 280 }}>{log.summary ?? "—"}</td>
                      <td style={{ ...tblTd, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--sand)" }}>{log.reference ?? "—"}</td>
                    </tr>
                  ))}
                  {(smilePartner.activityLogs ?? []).length === 0 && (
                    <tr><td colSpan={5} style={{ ...tblTd, textAlign: "center", padding: 36, color: "var(--sand)" }}>No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent transactions */}
          <div style={card}>
            <h3 style={sectionHeading}>Wallet Transactions</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Type", "Amount (GHS)", "Balance After", "Reference"].map((h) => (
                      <th key={h} style={tblTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(smilePartner.transactions ?? []).map((t: any) => (
                    <tr key={t.id}>
                      <td style={tblTd}>{new Date(t.createdAt).toLocaleString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                      <td style={tblTd}>
                        <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                          background: t.type === "topup" ? "#dcfce7" : "#fee2e2",
                          color: t.type === "topup" ? "#166534" : "#991b1b" }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ ...tblTd, fontWeight: 700, color: t.type === "topup" ? "#059669" : "#dc2626" }}>
                        {t.type === "topup" ? "+" : "-"}GH₵ {Number(t.amount).toFixed(2)}
                      </td>
                      <td style={tblTd}>GH₵ {Number(t.balanceAfter).toFixed(2)}</td>
                      <td style={{ ...tblTd, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--sand)" }}>{t.reference ?? "—"}</td>
                    </tr>
                  ))}
                  {(smilePartner.transactions ?? []).length === 0 && (
                    <tr><td colSpan={5} style={{ ...tblTd, textAlign: "center", padding: 36, color: "var(--sand)" }}>No transactions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin notes */}
          <div style={card}>
            <h3 style={sectionHeading}>Admin Notes</h3>
            <textarea
              rows={4} placeholder="Internal notes about this integration…"
              defaultValue={smilePartner.notes ?? ""}
              onChange={(e) => setNotesText((p) => ({ ...p, [smilePartner.id]: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.87rem", resize: "vertical", boxSizing: "border-box" as const }}
            />
            <div style={{ marginTop: 10 }}>
              <Btn onClick={() => adminAction("update_partner_notes", smilePartner.id, { notes: notesText[smilePartner.id] ?? smilePartner.notes ?? "" })}>
                Save Notes
              </Btn>
            </div>
          </div>
        </>
      )}

      {/* Other partners (non-smile) */}
      {partners.filter((p: any) => p.slug !== "smile_id").map((p: any) => (
        <div key={p.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1rem", fontWeight: 800, color: "var(--bark)" }}>{p.name}</h2>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--sand)" }}>{p.slug}</span>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--sand)" }}>{p.description ?? "No description."}</p>
        </div>
      ))}
    </div>
  );
}
