import { useEffect, useState, FormEvent } from "react";
import { api } from "../services/api";
import { Client } from "../types";

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  function load() {
    api.get("/clients").then((res) => setClients(res.data));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/clients", { name, email: email || undefined, company: company || undefined });
      setName("");
      setEmail("");
      setCompany("");
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create client");
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/clients/${id}`);
    load();
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h2>Clients</h2>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New Client"}</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Create Client</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.company}</td>
              <td>
                <button className="secondary" onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
