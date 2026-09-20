import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Task, Project, User as UserType } from "../types";
import TaskCard from "../components/TaskCard";

export default function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<UserType[]>([]);
  const [error, setError] = useState("");

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const canCreate = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const status = searchParams.get("status") || "";
  const priorityFilter = searchParams.get("priority") || "";

  useEffect(() => {
    loadTasks();
  }, [searchParams]);

  useEffect(() => {
    if (canCreate) {
      api.get("/projects").then((res) => setProjects(res.data));
      api.get("/users/developers").then((res) => setDevelopers(res.data));
    }
  }, []);

  function loadTasks() {
    // Query params are passed straight through to the backend, which
    // supports filtering by status, priority, and projectId.
    api.get("/tasks", { params: Object.fromEntries(searchParams) }).then((res) => setTasks(res.data));
  }

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/tasks", {
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
        projectId,
        assigneeId: assigneeId || undefined
      });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setProjectId("");
      setAssigneeId("");
      setShowForm(false);
      loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h2>Tasks</h2>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New Task"}
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => updateFilter("status", e.target.value)}>
              <option value="">All</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Priority</label>
            <select value={priorityFilter} onChange={(e) => updateFilter("priority", e.target.value)}>
              <option value="">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Create Task</button>
        </form>
      )}

      {tasks.length === 0 && <p className="text-muted">No tasks found.</p>}

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
