import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { joinProjectRoom, leaveProjectRoom, onSocketMessage } from "../services/socket";
import { Project, Activity } from "../types";
import TaskCard from "../components/TaskCard";
import ActivityFeed from "../components/ActivityFeed";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!id) return;

    api.get(`/projects/${id}`).then((res) => setProject(res.data));

    // Tell the server we're now watching this project's room
    joinProjectRoom(id);

    const unsubscribe = onSocketMessage((message) => {
      if (message.type === "RECENT_ACTIVITIES") {
        setActivities(message.data);
      }
      if (message.type === "ACTIVITY" && message.data.projectId === id) {
        setActivities((prev) => [...prev, message.data]);
      }
    });

    return () => {
      leaveProjectRoom();
      unsubscribe();
    };
  }, [id]);

  if (!project) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>{project.name}</h2>
      <p className="text-muted">
        Client: {project.client?.name} · Manager: {project.manager?.name}
      </p>
      {project.description && <p>{project.description}</p>}

      <h3>Tasks</h3>
      {project.tasks && project.tasks.length > 0 ? (
        project.tasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <p className="text-muted">No tasks in this project yet.</p>
      )}

      <h3>Live Activity Feed</h3>
      <div className="card">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
