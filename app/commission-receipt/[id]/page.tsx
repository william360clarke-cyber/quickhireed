import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CommissionReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const provider = await prisma.serviceProvider.findUnique({ where: { userId }, select: { id: true } });
  if (!provider) redirect("/dashboard");

  const commission = await prisma.providerCommission.findUnique({
    where: { id: parseInt(id) },
    include: {
      booking: {
        include: {
          user: { select: { fullName: true } },
          service: { select: { serviceName: true, price: true } },
        },
      },
    },
  });

  if (!commission || commission.providerId !== provider.id || commission.status !== "paid") {
    redirect("/dashboard");
  }

  const methodLabels: Record<string, string> = {
    mobile_money: "Mobile Money",
    card: "Bank / Debit Card",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
  };
  const methodLabel = methodLabels[commission.paymentMethod ?? ""] ?? (commission.paymentMethod ?? "—");
  const bookingRef = String(commission.bookingId).padStart(4, "0");

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream, #faf7f2)", fontFamily: "inherit" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border, #e8ddd5)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: "1.15rem", fontWeight: 800, textDecoration: "none", color: "var(--bark, #2a1e15)", fontFamily: "'Sora', sans-serif" }}>
          Quick<span style={{ color: "var(--ember, #c45c1a)" }}>Hire</span>
        </Link>
        <div style={{ display: "flex", gap: 20, fontSize: "0.88rem" }}>
          <Link href="/dashboard" style={{ color: "var(--warm-mid, #7a6955)", textDecoration: "none" }}>Dashboard</Link>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }} className="receipt-wrap">

        <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "14px 20px", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>✓ Commission Paid!</p>
          <p style={{ fontSize: "0.84rem", marginTop: 4, marginBottom: 0 }}>Your account is in good standing. Receipt below.</p>
        </div>

        <div style={{
          background: "var(--card-bg, #fff)",
          border: "1.5px solid var(--border, #e8ddd5)",
          borderRadius: 14,
          padding: "36px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* PAID ribbon */}
          <div style={{
            position: "absolute", top: 28, right: -28,
            background: "#059669", color: "#fff",
            fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.15em",
            padding: "5px 38px", transform: "rotate(45deg)",
          }}>PAID</div>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>
              Commission Receipt
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--sand, #9c8a78)", margin: 0 }}>Booking #QH-{bookingRef}</p>
          </div>

          {[
            ["Service",        commission.booking.service?.serviceName ?? "Service"],
            ["Customer",       commission.booking.user.fullName],
            ["Booking Date",   new Date(commission.booking.bookingDate).toLocaleDateString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "long", year: "numeric" })],
            ["Payment Method", methodLabel],
            ["Paid On",        commission.paidAt ? new Date(commission.paidAt).toLocaleString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border, #e8ddd5)", fontSize: "0.86rem" }}>
              <span style={{ color: "var(--sand, #9c8a78)" }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}

          <hr style={{ border: "none", borderTop: "1.5px dashed var(--border, #e8ddd5)", margin: "18px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border, #e8ddd5)", fontSize: "0.86rem" }}>
            <span style={{ color: "var(--sand, #9c8a78)" }}>Service Price</span>
            <span style={{ fontWeight: 600 }}>GH₵ {Number(commission.booking.service?.price ?? 0).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: "0.86rem" }}>
            <span style={{ color: "var(--sand, #9c8a78)" }}>Commission Rate</span>
            <span style={{ fontWeight: 600 }}>10%</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 14, borderTop: "2px solid var(--bark, #2a1e15)", marginTop: 4 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sand, #9c8a78)" }}>Commission Paid</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#059669", letterSpacing: "-0.04em" }}>
              GH₵ {Number(commission.amount).toFixed(2)}
            </span>
          </div>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.75rem", color: "var(--sand, #9c8a78)" }}>
            <p style={{ margin: 0 }}>QuickHire — Connecting Ghana, one job at a time.</p>
            <p style={{ marginTop: 4, marginBottom: 0 }}>
              Receipt generated {new Date().toLocaleString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={() => window.print()}
            style={{ background: "var(--bark, #2a1e15)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
            className="print-btn"
          >
            🖨 Print Receipt
          </button>
          <Link href="/dashboard" style={{ padding: "10px 22px", border: "1.5px solid var(--border, #e8ddd5)", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: "var(--bark, #2a1e15)", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <style>{`@media print { header, .print-btn { display: none !important; } .receipt-wrap { padding: 0 !important; } }`}</style>
    </div>
  );
}
