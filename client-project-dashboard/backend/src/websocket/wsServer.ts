import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

// Every connected client gets tracked here so we know who they are
// and which project room (if any) they're currently watching.
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  projectId: string | null;
}

const clients: ConnectedClient[] = [];

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    // Client must connect with ?token=<accessToken> in the URL
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "No token provided");
      return;
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.userId;
    } catch (error) {
      ws.close(1008, "Invalid token");
      return;
    }

    const client: ConnectedClient = { ws, userId, projectId: null };
    clients.push(client);

    // Send unread notification count as soon as they connect
    sendUnreadCount(userId);

    ws.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());

        if (message.type === "JOIN_PROJECT") {
          client.projectId = message.projectId;

          // Send the last 20 activities for this project so the user
          // catches up on anything they missed while offline/away.
          const activities = await prisma.activity.findMany({
            where: { projectId: message.projectId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { id: true, name: true, role: true } } }
          });

          ws.send(
            JSON.stringify({
              type: "RECENT_ACTIVITIES",
              data: activities.reverse()
            })
          );
        }

        if (message.type === "LEAVE_PROJECT") {
          client.projectId = null;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      const index = clients.indexOf(client);
      if (index !== -1) clients.splice(index, 1);
    });
  });

  return wss;
}

// Send an event to everyone currently viewing a specific project
export function broadcastToProject(projectId: string, payload: any) {
  const message = JSON.stringify(payload);
  clients
    .filter((c) => c.projectId === projectId && c.ws.readyState === WebSocket.OPEN)
    .forEach((c) => c.ws.send(message));
}

// Send an event to one specific user, wherever they are in the app
export function sendToUser(userId: string, payload: any) {
  const message = JSON.stringify(payload);
  clients
    .filter((c) => c.userId === userId && c.ws.readyState === WebSocket.OPEN)
    .forEach((c) => c.ws.send(message));
}

async function sendUnreadCount(userId: string) {
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false }
  });
  sendToUser(userId, { type: "UNREAD_COUNT", unreadCount });
}
