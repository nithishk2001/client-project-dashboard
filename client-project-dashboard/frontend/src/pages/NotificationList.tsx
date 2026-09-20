import { useEffect, useState } from "react";
import { api } from "../services/api";
import { onSocketMessage } from "../services/socket";
import { Notification } from "../types";

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    load();

    // New notifications arrive live over WebSocket while the page is open
    const unsubscribe = onSocketMessage((message) => {
      if (message.type === "NOTIFICATION") {
        setNotifications((prev) => [message.data, ...prev]);
      }
    });

    return unsubscribe;
  }, []);

  function load() {
    api.get("/notifications").then((res) => setNotifications(res.data.notifications));
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h2>Notifications</h2>
        <button className="secondary" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="card">
        {notifications.length === 0 && <p className="text-muted">No notifications yet.</p>}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification-item ${!n.isRead ? "unread" : ""}`}
            onClick={() => !n.isRead && markRead(n.id)}
            style={{ cursor: !n.isRead ? "pointer" : "default" }}
          >
            <div>{n.message}</div>
            <div className="meta text-muted">{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
