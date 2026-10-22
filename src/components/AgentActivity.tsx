type Activity = { id: string; message: string; type: "task" | "agent" | "approval"; createdAt: string };

type Props = { activities: Activity[] };

export function AgentActivity({ activities }: Props) {
  if (!activities.length) return <p className="empty-state">No activity yet.</p>;

  return <div className="activity-list">
    {activities.map((item) => (
      <div className="activity-row" key={item.id}>
        <span className={`activity-icon ${item.type}`}>✦</span>
        <div><strong>{item.message}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></div>
      </div>
    ))}
  </div>;
}
