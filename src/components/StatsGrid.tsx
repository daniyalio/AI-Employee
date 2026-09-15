import type { Task } from "../types/task";

type Props = { tasks: Task[] };

export function StatsGrid({ tasks }: Props) {
  const completed = tasks.filter((task) => task.status === "done").length;
  const active = tasks.filter((task) => task.status !== "done").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return <section className="stats-grid">
    <div className="stat-card"><span className="stat-icon">✓</span><div><small>Completed today</small><strong>{completed}</strong></div></div>
    <div className="stat-card"><span className="stat-icon">◷</span><div><small>Active tasks</small><strong>{active}</strong></div></div>
    <div className="stat-card"><span className="stat-icon">◎</span><div><small>Daily progress</small><strong>{progress}%</strong></div></div>
  </section>;
}
