import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function getUnreadMessages(userId: number) {
  return prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });
}

export async function markAllRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
