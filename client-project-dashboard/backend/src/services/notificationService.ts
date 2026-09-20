import { prisma } from "../lib/prisma";
import { sendToUser } from "../websocket/wsServer";

interface CreateNotificationInput {
  userId: string;
  taskId?: string;
  message: string;
}

// Creates a notification in the DB, then sends it directly to that user
// over WebSocket (if they're currently connected) along with their new
// unread count so the frontend can update the bell icon immediately.
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      taskId: input.taskId,
      message: input.message
    }
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: input.userId, isRead: false }
  });

  sendToUser(input.userId, {
    type: "NOTIFICATION",
    data: notification,
    unreadCount
  });

  return notification;
}
