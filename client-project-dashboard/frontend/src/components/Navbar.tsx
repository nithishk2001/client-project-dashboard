import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { onSocketMessage } from "../services/socket";
import { api } from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load the initial unread count, then keep it updated live via WebSocket
  useEffect(() => {
    if (!user) return;

    api.get("/notifications").then((res) => {
      setUnreadCount(res.data.unreadCount);
    });

    const unsubscribe = onSocketMessage((message) => {
      if (message.type === "UNREAD_COUNT") {
        setUnreadCount(message.unreadCount);
      }
      if (message.type === "NOTIFICATION") {
        setUnreadCount(message.unreadCount);
      }
    });

    return unsubscribe;
  }, [user]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <div className="navbar">
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
        Client Project Dashboard
      </Link>
      <div className="navbar-links">
        <Link to="/projects">Projects</Link>
        <Link to="/tasks">Tasks</Link>
        {user.role === "ADMIN" && <Link to="/clients">Clients</Link>}
        <Link to="/notifications">Notifications ({unreadCount})</Link>
        <span className="text-muted" style={{ color: "#e5e7eb" }}>
          {user.name} ({user.role})
        </span>
        <button className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
