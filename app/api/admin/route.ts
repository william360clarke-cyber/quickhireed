import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { smileIdVerifyId, getSmileIdConfig, setSmileIdConfig, smileIdWalletTopup, smileIdLog } from "@/lib/smileid";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, bookings, payments, providers, verifications, feedback, categories] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.booking.findMany({
      include: {
        user: { select: { fullName: true } },
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({ orderBy: { paymentDate: "desc" } }),
    prisma.serviceProvider.findMany({
      include: { user: { select: { fullName: true, email: true } } },
    }),
    prisma.verificationRequest.findMany({
      include: { provider: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.platformFeedback.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.homepageCategory.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  const completedPayments = payments.filter((p) => p.paymentStatus === "completed");
  const totalRevenue = completedPayments.reduce((s, p) => s + Number(p.amount) * 0.1, 0);

  return NextResponse.json(
    JSON.parse(JSON.stringify({ users, bookings, payments, providers, verifications, feedback, totalRevenue, categories }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { action, targetId, data } = body;

  try {
  switch (action) {
    // ── Verification ──────────────────────────────────────────────────────────
    case "approve_verification": {
      await prisma.verificationRequest.update({
        where: { id: parseInt(targetId) },
        data: { status: "approved", reviewedAt: new Date() },
      });
      const vr = await prisma.verificationRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: true },
      });
      if (vr) {
        await prisma.serviceProvider.update({ where: { id: vr.providerId }, data: { isVerified: true } });
        await createNotification(vr.provider.userId, "verification", "Verification Approved",
          "Your ID has been verified. You can now accept bookings.", "/dashboard");
      }
      return NextResponse.json({ success: true });
    }

    case "reject_verification": {
      await prisma.verificationRequest.update({
        where: { id: parseInt(targetId) },
        data: { status: "rejected", adminNotes: data?.notes ?? null, reviewedAt: new Date() },
      });
      const vr = await prisma.verificationRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: true },
      });
      if (vr) {
        await createNotification(vr.provider.userId, "verification", "Verification Rejected",
          data?.notes ? `Reason: ${data.notes}` : "Your verification request was not approved. Please resubmit.", "/dashboard");
      }
      return NextResponse.json({ success: true });
    }

    // ── Featured ──────────────────────────────────────────────────────────────
    case "approve_featured": {
      const fr = await prisma.featuredRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: true },
      });
      if (!fr) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (fr.paymentStatus !== "completed") {
        return NextResponse.json({ error: "Cannot approve — payment not completed." }, { status: 400 });
      }
      const expires = new Date();
      expires.setDate(expires.getDate() + (fr.durationDays ?? 30));
      await prisma.featuredRequest.update({
        where: { id: parseInt(targetId) },
        data: { requestStatus: "approved", approvedAt: new Date(), expiresAt: expires },
      });
      await prisma.serviceProvider.update({ where: { id: fr.providerId }, data: { isFeatured: true } });
      await createNotification(fr.provider.userId, "featured", "Featured Listing Approved",
        `Your featured listing is now active for ${fr.durationDays} days.`, "/dashboard");
      return NextResponse.json({ success: true });
    }

    case "reject_featured": {
      const fr2 = await prisma.featuredRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: true },
      });
      await prisma.featuredRequest.update({
        where: { id: parseInt(targetId) },
        data: { requestStatus: "rejected" },
      });
      if (fr2) {
        await createNotification(fr2.provider.userId, "featured", "Featured Request Rejected",
          "Your featured listing request was not approved. Please contact support.", "/dashboard");
      }
      return NextResponse.json({ success: true });
    }

    // ── Feedback ──────────────────────────────────────────────────────────────
    case "mark_feedback_read": {
      await prisma.platformFeedback.update({
        where: { id: parseInt(targetId) },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    case "reply_feedback": {
      await prisma.platformFeedback.update({
        where: { id: parseInt(targetId) },
        data: { adminReply: data?.reply, isRead: true },
      });
      const fb = await prisma.platformFeedback.findUnique({ where: { id: parseInt(targetId) } });
      if (fb) {
        await createNotification(fb.userId, "support", "QuickHire Support Response",
          `We've responded to your feedback: "${(data?.reply ?? "").slice(0, 80)}…"`, "/dashboard");
      }
      return NextResponse.json({ success: true });
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    case "update_user": {
      const updated = await prisma.user.update({
        where: { id: parseInt(targetId) },
        data: {
          fullName: data?.fullName ?? undefined,
          email: data?.email ?? undefined,
          phone: data?.phone ?? undefined,
          userType: data?.userType ?? undefined,
        },
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    }

    case "delete_user": {
      // Cascade: delete all associated data first
      const userId = parseInt(targetId);
      const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
      if (provider) {
        await prisma.verificationRequest.deleteMany({ where: { providerId: provider.id } });
        await prisma.featuredRequest.deleteMany({ where: { providerId: provider.id } });
        await prisma.providerCommission.deleteMany({ where: { providerId: provider.id } });
        await prisma.providerPayout.deleteMany({ where: { providerId: provider.id } });
        const bookingIds = (await prisma.booking.findMany({ where: { providerId: provider.id }, select: { id: true } })).map(b => b.id);
        await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.message.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.booking.deleteMany({ where: { providerId: provider.id } });
        await prisma.service.deleteMany({ where: { providerId: provider.id } });
        await prisma.serviceProvider.delete({ where: { id: provider.id } });
      }
      // Delete customer bookings
      const custBookingIds = (await prisma.booking.findMany({ where: { userId }, select: { id: true } })).map(b => b.id);
      await prisma.review.deleteMany({ where: { bookingId: { in: custBookingIds } } });
      await prisma.payment.deleteMany({ where: { bookingId: { in: custBookingIds } } });
      await prisma.message.deleteMany({ where: { bookingId: { in: custBookingIds } } });
      await prisma.booking.deleteMany({ where: { userId } });
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.platformFeedback.deleteMany({ where: { userId } });
      await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
      await prisma.review.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true });
    }

    case "reset_password": {
      const hash = await bcrypt.hash(data?.newPassword ?? "QuickHire2024!", 12);
      await prisma.user.update({ where: { id: parseInt(targetId) }, data: { password: hash } });
      return NextResponse.json({ success: true });
    }

    // ── Providers ─────────────────────────────────────────────────────────────
    case "update_provider": {
      const updated = await prisma.serviceProvider.update({
        where: { id: parseInt(targetId) },
        data: {
          isVerified: data?.isVerified ?? undefined,
          isFeatured: data?.isFeatured ?? undefined,
          serviceCategory: data?.serviceCategory ?? undefined,
          bio: data?.bio ?? undefined,
          isAvailable: data?.isAvailable ?? undefined,
          dailyBookingCap: data?.dailyBookingCap != null ? parseInt(data.dailyBookingCap) : undefined,
          experienceYears: data?.experienceYears != null ? parseInt(data.experienceYears) : undefined,
          availability: data?.availability ?? undefined,
          languages: data?.languages ?? undefined,
          avgResponse: data?.avgResponse ?? undefined,
        },
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    }

    // ── Bookings ──────────────────────────────────────────────────────────────
    case "update_booking_status": {
      await prisma.booking.update({
        where: { id: parseInt(targetId) },
        data: { status: data?.status },
      });
      return NextResponse.json({ success: true });
    }

    case "delete_booking": {
      const bid = parseInt(targetId);
      await prisma.review.deleteMany({ where: { bookingId: bid } });
      await prisma.providerCommission.deleteMany({ where: { bookingId: bid } });
      await prisma.providerPayout.deleteMany({ where: { bookingId: bid } });
      await prisma.payment.deleteMany({ where: { bookingId: bid } });
      await prisma.message.deleteMany({ where: { bookingId: bid } });
      await prisma.booking.delete({ where: { id: bid } });
      return NextResponse.json({ success: true });
    }

    // ── Payments ──────────────────────────────────────────────────────────────
    case "update_payment": {
      const updated = await prisma.payment.update({
        where: { id: parseInt(targetId) },
        data: { paymentStatus: data?.paymentStatus ?? undefined },
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    }

    // ── Categories ────────────────────────────────────────────────────────────
    case "create_category": {
      const cat = await prisma.homepageCategory.create({
        data: {
          name: data.name,
          icon: data.icon ?? "🔧",
          description: data.description ?? "",
          filterKey: data.filterKey ?? data.name.toLowerCase().replace(/\s+/g, "_"),
          displayOrder: data.displayOrder ?? 0,
          isVisible: true,
        },
      });
      return NextResponse.json(cat);
    }

    case "update_category": {
      const cat = await prisma.homepageCategory.update({
        where: { id: parseInt(targetId) },
        data: {
          name: data?.name ?? undefined,
          icon: data?.icon ?? undefined,
          description: data?.description ?? undefined,
          filterKey: data?.filterKey ?? undefined,
          displayOrder: data?.displayOrder != null ? parseInt(data.displayOrder) : undefined,
          isVisible: data?.isVisible ?? undefined,
        },
      });
      return NextResponse.json(cat);
    }

    case "delete_category": {
      await prisma.homepageCategory.delete({ where: { id: parseInt(targetId) } });
      return NextResponse.json({ success: true });
    }

    case "toggle_category": {
      const cat = await prisma.homepageCategory.findUnique({ where: { id: parseInt(targetId) } });
      if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.homepageCategory.update({ where: { id: parseInt(targetId) }, data: { isVisible: !cat.isVisible } });
      return NextResponse.json({ success: true });
    }

    // ── Smile ID / Partners ───────────────────────────────────────────────────
    case "reverify_smileid": {
      const vr = await prisma.verificationRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: { include: { user: { select: { fullName: true } } } } },
      });
      if (!vr) return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
      const result = await smileIdVerifyId(vr.idType, vr.idNumber, vr.provider.user.fullName);
      await prisma.verificationRequest.update({
        where: { id: parseInt(targetId) },
        data: {
          smileidStatus: result.status,
          smileidSummary: result.summary,
          smileidReference: result.reference ?? null,
          smileidResponse: result.response ?? null,
          smileidCheckedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, result });
    }

    case "smileid_toggle_enabled": {
      const cfg = await getSmileIdConfig();
      await setSmileIdConfig("enabled", cfg.enabled === "1" ? "0" : "1");
      return NextResponse.json({ success: true });
    }

    case "smileid_set_mode": {
      const mode = data?.mode === "live" ? "live" : "sandbox";
      await setSmileIdConfig("mode", mode);
      return NextResponse.json({ success: true });
    }

    case "smileid_save_credentials": {
      await Promise.all([
        setSmileIdConfig("partner_id", data?.partner_id ?? "", false),
        setSmileIdConfig("api_key", data?.api_key ?? "", true),
      ]);
      return NextResponse.json({ success: true });
    }

    case "topup_wallet": {
      const amount = parseFloat(data?.amount ?? "0");
      const method = data?.paymentMethod ?? "mobile_money";
      if (amount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      const ref = `TOPUP-${Date.now().toString(16).toUpperCase()}`;
      const newBalance = await smileIdWalletTopup(amount, method, ref, `Admin top-up via ${method}`);
      if (newBalance === false) return NextResponse.json({ error: "Top-up failed — wallet not found" }, { status: 500 });
      await smileIdLog("wallet_topup", "success", `Wallet topped up GHS ${amount.toFixed(2)} via ${method}`, ref, { method, new_balance: newBalance });
      return NextResponse.json({ success: true, newBalance });
    }

    case "update_partner_notes": {
      await prisma.partner.update({
        where: { id: parseInt(targetId) },
        data: { notes: data?.notes ?? null },
      });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  } catch (err: any) {
    console.error("[admin POST]", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
