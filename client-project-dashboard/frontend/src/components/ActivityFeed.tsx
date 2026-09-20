import { Activity } from "../types";

interface Props {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-muted">No activity yet.</p>;
  }

  return (
    <div>
      {activities.map((activity) => (
        <div className="activity-item" key={activity.id}>
          <div>{activity.message}</div>
          <div className="meta">
            {activity.user?.name || "Someone"} · {new Date(activity.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
