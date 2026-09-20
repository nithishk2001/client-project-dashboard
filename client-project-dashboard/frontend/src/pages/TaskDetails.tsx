import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Task } from "../types";
import Badge from "../components/Badge";
import ActivityFeed from "../components/ActivityFeed";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) loadTask(id);
  }, [id]);

  function loadTask(taskId: string) {
    api.get(`/tasks/${taskId}`).then((res) => setTask(res.data));
  }

  async function handleStatusChange(newStatus: string) {
    if (!id) return;
    setError("");

    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      loadTask(id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  }

  if (!task) return <div className="container">Loading...</div>;

  // Developers can only change status on tasks assigned to them.
  // Admin and Project Manager can always change status.
  const canUpdateStatus =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    (user?.role === "DEVELOPER" && task.assigneeId === user.id);

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between">
          <h2>{task.title}</h2>
          <div>
            <Badge value={task.priority} /> <Badge value={task.status} />
          </div>
        </div>
        {task.description && <p>{task.description}</p>}
        <p className="text-muted">
          Project: {task.project?.name} · Assigned to: {task.assignee?.name || "Unassigned"}
          {task.dueDate && <> · Due: {new Date(task.dueDate).toLocaleDateString()}</>}
        </p>

        {canUpdateStatus && (
          <div className="form-group" style={{ maxWidth: 240 }}>
            <label>Update Status</label>
            <select value={task.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>

      <h3>Activity Log</h3>
      <div className="card">
        <ActivityFeed activities={task.activities || []} />
      </div>
    </div>
  );
}
