import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import ActivityFeed from "../components/ActivityFeed";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="container">Loading dashboard...</div>;

  if (user?.role === "ADMIN") {
    return (
      <div className="container">
        <h2>Admin Dashboard</h2>
        <div className="stats-grid">
          <StatBox label="Total Users" value={stats.totalUsers} />
          <StatBox label="Total Clients" value={stats.totalClients} />
          <StatBox label="Total Projects" value={stats.totalProjects} />
          <StatBox label="Total Tasks" value={stats.totalTasks} />
          <StatBox label="Completed Tasks" value={stats.completedTasks} />
          <StatBox label="Overdue Tasks" value={stats.overdueTasks} />
        </div>
        <div className="card">
          <h3>Recent Activity</h3>
          <ActivityFeed activities={stats.recentActivity} />
        </div>
      </div>
    );
  }

  if (user?.role === "PROJECT_MANAGER") {
    return (
      <div className="container">
        <h2>Project Manager Dashboard</h2>
        <div className="stats-grid">
          <StatBox label="My Projects" value={stats.myProjects} />
          <StatBox label="Team Tasks" value={stats.teamTasks} />
          <StatBox label="Completed Tasks" value={stats.completedTasks} />
          <StatBox label="Pending Tasks" value={stats.pendingTasks} />
          <StatBox label="Overdue Tasks" value={stats.overdueTasks} />
        </div>
        <div className="card">
          <h3>Team Activity</h3>
          <ActivityFeed activities={stats.teamActivity} />
        </div>
      </div>
    );
  }

  // DEVELOPER
  return (
    <div className="container">
      <h2>Developer Dashboard</h2>
      <div className="stats-grid">
        <StatBox label="My Tasks" value={stats.myTasks} />
        <StatBox label="Pending" value={stats.pending} />
        <StatBox label="In Progress" value={stats.inProgress} />
        <StatBox label="Completed" value={stats.completed} />
        <StatBox label="Overdue" value={stats.overdue} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-box">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
