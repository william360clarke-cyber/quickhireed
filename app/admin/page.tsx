import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") redirect("/");

  let data: any = {
    users: [], bookings: [], payments: [], providers: [],
    verifications: [], featuredRequests: [], feedback: [],
    totalRevenue: 0, categories: [], partners: [], smileidStats: null,
  };

  try {
    const [users, bookings, payments, providers, verifications, featuredRequests, feedback, categories, partners] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, fullName: true, email: true, phone: true, userType: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        include: {
          user: { select: { fullName: true } },
          provider: { include: { user: { select: { fullName: true } } } },
          service: { select: { serviceName: true, price: true } },
          payment: { select: { id: true, paymentStatus: true, paymentMethod: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        select: { id: true, amount: true, paymentStatus: true, paymentMethod: true, paymentDate: true, bookingId: true },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.serviceProvider.findMany({
        include: { user: { select: { fullName: true, email: true, phone: true } } },
        orderBy: { rating: "desc" },
      }),
      prisma.verificationRequest.findMany({
        include: { provider: { include: { user: { select: { fullName: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.featuredRequest.findMany({
        include: { provider: { include: { user: { select: { fullName: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.platformFeedback.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.homepageCategory.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.partner.findMany({
        include: {
          configs: { select: { configKey: true, configValue: true, isSecret: true } },
          wallet: true,
          activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
          transactions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalRevenue = payments
      .filter((p) => p.paymentStatus === "completed")
      .reduce((s, p) => s + Number(p.amount) * 0.1, 0);

    // Smile ID usage stats
    const smileIdPartner = partners.find((p: any) => p.slug === "smile_id");
    let smileidStats = null;
    if (smileIdPartner) {
      const now = new Date();
      const todayStart = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const countByStatus = async (since?: Date) => {
        const where: any = { partnerId: smileIdPartner.id, action: "verify_id" };
        if (since) where.createdAt = { gte: since };
        const [verified, failed, error] = await Promise.all([
          prisma.partnerActivityLog.count({ where: { ...where, status: "verified" } }),
          prisma.partnerActivityLog.count({ where: { ...where, status: "failed" } }),
          prisma.partnerActivityLog.count({ where: { ...where, status: "error" } }),
        ]);
        return { verified, failed, error, total: verified + failed + error };
      };
      const [today, week, month, all] = await Promise.all([
        countByStatus(todayStart),
        countByStatus(weekStart),
        countByStatus(monthStart),
        countByStatus(),
      ]);
      smileidStats = { today, week, month, all };
    }

    data = JSON.parse(JSON.stringify({
      users, bookings, payments, providers, verifications,
      featuredRequests, feedback, totalRevenue, categories,
      partners, smileidStats,
    }));
  } catch {
    // DB not connected — show empty admin panel
  }

  return <AdminClient {...data} />;
}
