import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getNotifications(req: Request, res: Response) {
  try {
    const { userId } = req.user!;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const { userId } = req.user!;

    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const { userId } = req.user!;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
}
