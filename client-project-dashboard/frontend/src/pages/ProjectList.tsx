import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Project, Client } from "../types";

export default function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");

  const canCreate = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  useEffect(() => {
    loadProjects();
    if (canCreate) {
      api.get("/clients").then((res) => setClients(res.data)).catch(() => {});
    }
  }, []);

  function loadProjects() {
    api.get("/projects").then((res) => setProjects(res.data));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/projects", { name, description, clientId });
      setName("");
      setDescription("");
      setClientId("");
      setShowForm(false);
      loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h2>Projects</h2>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New Project"}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Create Project</button>
        </form>
      )}

      {projects.length === 0 && <p className="text-muted">No projects found.</p>}

      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/projects/${project.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="card">
            <div style={{ fontWeight: "bold" }}>{project.name}</div>
            <div className="text-muted">
              Client: {project.client?.name} · Manager: {project.manager?.name}
            </div>
            {project.description && <p>{project.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
