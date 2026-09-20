import { Link } from "react-router-dom";
import { Task } from "../types";
import Badge from "./Badge";

interface Props {
  task: Task;
}

export default function TaskCard({ task }: Props) {
  return (
    <div className="card">
      <div className="flex-between">
        <Link to={`/tasks/${task.id}`} style={{ fontWeight: "bold", textDecoration: "none" }}>
          {task.title}
        </Link>
        <div>
          <Badge value={task.priority} /> <Badge value={task.status} />
        </div>
      </div>
      {task.description && <p className="text-muted">{task.description}</p>}
      <div className="text-muted">
        {task.project?.name && <span>Project: {task.project.name} · </span>}
        {task.assignee?.name && <span>Assigned to: {task.assignee.name} · </span>}
        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
