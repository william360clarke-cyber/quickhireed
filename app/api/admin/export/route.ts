import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") return null;
  return session;
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "bookings";

  let csv = "";
  let filename = "";

  if (type === "bookings") {
    const rows = await prisma.booking.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(
      rows.map((b) => ({
        booking_id: b.id,
        customer: b.user.fullName,
        email: b.user.email,
        provider: b.provider.user.fullName,
        service: b.service.serviceName,
        price: Number(b.service.price).toFixed(2),
        status: b.status,
        payment_status: b.payment?.paymentStatus ?? "none",
        booking_date: b.bookingDate.toISOString(),
        created_at: b.createdAt.toISOString(),
      }))
    );
    filename = "bookings.csv";
  } else if (type === "payments") {
    const rows = await prisma.payment.findMany({
      include: { booking: { include: { user: { select: { fullName: true } } } } },
      orderBy: { paymentDate: "desc" },
    });
    csv = toCSV(
      rows.map((p) => ({
        payment_id: p.id,
        booking_id: p.bookingId,
        customer: p.booking.user.fullName,
        amount: Number(p.amount).toFixed(2),
        method: p.paymentMethod,
        status: p.paymentStatus,
        date: p.paymentDate.toISOString(),
      }))
    );
    filename = "payments.csv";
  } else if (type === "users") {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    csv = toCSV(
      rows.map((u) => ({
        user_id: u.id,
        full_name: u.fullName,
        email: u.email,
        phone: u.phone ?? "",
        user_type: u.userType,
        created_at: u.createdAt.toISOString(),
      }))
    );
    filename = "users.csv";
  } else if (type === "providers") {
    const rows = await prisma.serviceProvider.findMany({
      include: { user: { select: { fullName: true, email: true } } },
    });
    csv = toCSV(
      rows.map((p) => ({
        provider_id: p.id,
        full_name: p.user.fullName,
        email: p.user.email,
        category: p.serviceCategory,
        is_verified: p.isVerified,
        is_featured: p.isFeatured,
        rating: Number(p.rating).toFixed(2),
        joined_at: p.joinedAt.toISOString(),
      }))
    );
    filename = "providers.csv";
  } else if (type === "revenue") {
    const [providers, payouts, cashCommissions, featuredRevenue] = await Promise.all([
      prisma.serviceProvider.findMany({
        include: {
          user: { select: { fullName: true } },
          bookings: { include: { payment: { select: { amount: true, paymentStatus: true } } } },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.providerPayout.aggregate({ where: { status: "released" }, _sum: { commissionAmount: true, payoutAmount: true, taxAmount: true } }),
      prisma.providerCommission.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
      prisma.featuredRequest.aggregate({ where: { paymentStatus: "completed" }, _sum: { fee: true } }),
    ]);
    const totalCommission = Number(payouts._sum.commissionAmount ?? 0) + Number(cashCommissions._sum.amount ?? 0);
    const totalPayouts    = Number(payouts._sum.payoutAmount ?? 0);
    const totalTax        = Number(payouts._sum.taxAmount ?? 0);
    const totalFeatured   = Number(featuredRevenue._sum.fee ?? 0);
    const date = new Date().toLocaleDateString("en-GH", { timeZone: "Africa/Accra" });
    const rows: string[] = [
      `QuickHire — Revenue & Earnings Report,Generated: ${date}`,
      "",
      "PLATFORM SUMMARY",
      `Commission Earned (GHS),${totalCommission.toFixed(2)}`,
      `Payouts Released (GHS),${totalPayouts.toFixed(2)}`,
      `Tax Held for GRA (GHS),${totalTax.toFixed(2)}`,
      `Featured Listing Revenue (GHS),${totalFeatured.toFixed(2)}`,
      "",
      "PROVIDER EARNINGS BREAKDOWN",
      "Provider,Category,Total Jobs,Gross Earned (GHS),Commission (10%) (GHS),Net Payout (GHS),Verified,Featured",
    ];
    for (const p of providers) {
      const paidPayments = p.bookings.flatMap((b) => (b.payment?.paymentStatus === "completed" ? [Number(b.payment.amount)] : []));
      const gross = paidPayments.reduce((s, a) => s + a, 0);
      const commission = gross * 0.1;
      const net = gross * 0.9;
      rows.push([p.user.fullName, p.serviceCategory, p.bookings.length, gross.toFixed(2), commission.toFixed(2), net.toFixed(2), p.isVerified ? "Yes" : "No", p.isFeatured ? "Yes" : "No"].join(","));
    }
    csv = rows.join("\n");
    filename = "quickhire_revenue.csv";

  } else if (type === "providers") {
    const providers = await prisma.serviceProvider.findMany({
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        bookings: { include: { payment: { select: { amount: true, paymentStatus: true } } } },
      },
      orderBy: { rating: "desc" },
    });
    csv = toCSV(providers.map((p) => {
      const totalEarned = p.bookings
        .filter((b) => b.payment?.paymentStatus === "completed")
        .reduce((s, b) => s + Number(b.payment!.amount), 0);
      return {
        provider_id: p.id,
        full_name: p.user.fullName,
        email: p.user.email,
        phone: p.user.phone ?? "",
        category: p.serviceCategory,
        rating: Number(p.rating).toFixed(2),
        experience_years: p.experienceYears,
        total_jobs: p.bookings.length,
        total_earned_ghs: totalEarned.toFixed(2),
        verified: p.isVerified ? "Yes" : "No",
        featured: p.isFeatured ? "Yes" : "No",
      };
    }));
    filename = "quickhire_providers.csv";

  } else if (type === "analytics") {
    const [allBookings, allPayments, allReviews, allUsers] = await Promise.all([
      prisma.booking.findMany({ include: { service: { select: { serviceName: true } }, provider: { select: { serviceCategory: true } } } }),
      prisma.payment.findMany({ select: { amount: true, paymentStatus: true, paymentDate: true } }),
      prisma.review.findMany({ select: { rating: true } }),
      prisma.user.findMany({ select: { userType: true, createdAt: true } }),
    ]);
    const completedBookings = allBookings.filter((b) => b.status === "completed").length;
    const completedPayments = allPayments.filter((p) => p.paymentStatus === "completed");
    const avgValue = completedPayments.length ? completedPayments.reduce((s, p) => s + Number(p.amount), 0) / completedPayments.length : 0;
    const avgRating = allReviews.length ? allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length : 0;
    const statusCounts: Record<string, number> = {};
    for (const b of allBookings) statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
    const categoryCounts: Record<string, { bookings: number; revenue: number }> = {};
    for (const b of allBookings) {
      const cat = b.provider.serviceCategory;
      if (!categoryCounts[cat]) categoryCounts[cat] = { bookings: 0, revenue: 0 };
      categoryCounts[cat].bookings++;
    }
    const hourCounts: Record<number, number> = {};
    for (const b of allBookings) {
      const h = new Date(b.bookingDate).getHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const monthlyRevenue: Record<string, { revenue: number; bookings: number }> = {};
    for (const b of allBookings) {
      const m = b.bookingDate.toISOString().slice(0, 7);
      if (!monthlyRevenue[m]) monthlyRevenue[m] = { revenue: 0, bookings: 0 };
      monthlyRevenue[m].bookings++;
    }
    for (const p of completedPayments) {
      const m = (p.paymentDate ?? new Date()).toISOString().slice(0, 7);
      if (!monthlyRevenue[m]) monthlyRevenue[m] = { revenue: 0, bookings: 0 };
      monthlyRevenue[m].revenue += Number(p.amount);
    }
    const userGrowth: Record<string, { customers: number; providers: number }> = {};
    for (const u of allUsers) {
      const m = u.createdAt.toISOString().slice(0, 7);
      if (!userGrowth[m]) userGrowth[m] = { customers: 0, providers: 0 };
      if (u.userType === "customer") userGrowth[m].customers++;
      else if (u.userType === "provider" || u.userType === "both") userGrowth[m].providers++;
    }
    const last6 = (obj: Record<string, any>) => Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    const fmt = (m: string) => { const d = new Date(m + "-01"); return d.toLocaleDateString("en-GH", { month: "short", year: "numeric", timeZone: "UTC" }); };
    const rows: string[] = [
      "QuickHire — Business Analytics Report,",
      "",
      "KPI SUMMARY",
      "Metric,Value",
      `Total Bookings,${allBookings.length}`,
      `Completed Bookings,${completedBookings}`,
      `Completion Rate (%),${allBookings.length > 0 ? ((completedBookings / allBookings.length) * 100).toFixed(1) : 0}`,
      `Avg Booking Value (GHS),${avgValue.toFixed(2)}`,
      `Avg Platform Rating,${avgRating.toFixed(1)}`,
      `Total Reviews,${allReviews.length}`,
      "",
      "BOOKINGS BY STATUS",
      "Status,Count",
      ...Object.entries(statusCounts).sort(([, a], [, b]) => b - a).map(([s, c]) => `${s.charAt(0).toUpperCase() + s.slice(1)},${c}`),
      "",
      "TOP CATEGORIES",
      "Category,Total Bookings",
      ...Object.entries(categoryCounts).sort(([, a], [, b]) => b.bookings - a.bookings).slice(0, 10).map(([c, v]) => `${c},${v.bookings}`),
      "",
      "MONTHLY REVENUE (LAST 6 MONTHS)",
      "Month,Revenue (GHS),Bookings",
      ...last6(monthlyRevenue).map(([m, v]) => `${fmt(m)},${v.revenue.toFixed(2)},${v.bookings}`),
      "",
      "USER GROWTH (LAST 6 MONTHS)",
      "Month,Customers,Providers",
      ...last6(userGrowth).map(([m, v]) => `${fmt(m)},${v.customers},${v.providers}`),
      "",
      "PEAK BOOKING HOURS",
      "Hour,Bookings",
      ...Object.entries(hourCounts).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([h, c]) => `${h}:00 - ${parseInt(h) + 1}:00,${c}`),
    ];
    csv = rows.join("\n");
    filename = "quickhire_analytics.csv";

  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
