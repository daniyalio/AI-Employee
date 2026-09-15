import type { Task } from "../types/task";

type Props = { tasks: Task[]; loading: boolean; onStatusChange: (task: Task) => void };

export function TaskList({ tasks, loading, onStatusChange }: Props) {
  if (loading) return <p className="empty-state">Loading tasks…</p>;
  if (!tasks.length) return <p className="empty-state">No tasks yet. Give your AI employee something to do.</p>;

  return <div className="task-list">
    {tasks.map((task) => (
      <div className="task-row" key={task.id}>
        <button className={`check ${task.status === "done" ? "checked" : ""}`} onClick={() => onStatusChange(task)}>
          {task.status === "done" ? "✓" : ""}
        </button>
        <div className="task-info">
          <strong className={task.status === "done" ? "strike" : ""}>{task.title}</strong>
          <small>{task.project ?? task.description ?? "AI Employee"}</small>
        </div>
        <span className={`priority ${task.priority}`}>{task.priority}</span>
        <span className={`task-status ${task.status}`}>{task.status}</span>
      </div>
    ))}
  </div>;
}
