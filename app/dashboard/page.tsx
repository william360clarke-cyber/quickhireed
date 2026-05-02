import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  let provider = null;
  let customerBookings: any[] = [];
  let providerBookings: any[] = [];
  let notifications: any[] = [];
  let unreadCount = 0;
  let commissions: any[] = [];

  try {
    notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    unreadCount = notifications.filter((n) => !n.isRead).length;

    if (userType === "customer" || userType === "both") {
      customerBookings = await prisma.booking.findMany({
        where: { userId },
        include: {
          provider: { include: { user: { select: { fullName: true } } } },
          service: true,
          payment: true,
          reviews: { where: { userId } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (userType === "provider" || userType === "both") {
      provider = await prisma.serviceProvider.findUnique({
        where: { userId },
        include: { services: true },
      });

      if (provider) {
        providerBookings = await prisma.booking.findMany({
          where: { providerId: provider.id },
          include: {
            user: { select: { fullName: true, phone: true } },
            service: true,
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        });

        commissions = await prisma.providerCommission.findMany({
          where: { providerId: provider.id, status: "owed" },
          include: { booking: { include: { service: true } } },
        });
      }
    }
  } catch {
    // DB not connected
  }

  // Serialize all Decimal/Date objects before passing to Client Component
  const serialize = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <DashboardClient
      user={serialize(user)}
      userType={userType}
      provider={serialize(provider)}
      customerBookings={serialize(customerBookings)}
      providerBookings={serialize(providerBookings)}
      notifications={serialize(notifications)}
      unreadCount={unreadCount}
      commissions={serialize(commissions)}
    />
  );
}
