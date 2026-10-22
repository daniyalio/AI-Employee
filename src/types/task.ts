export type TaskStatus = "queued" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string | number;
  title: string;
  description?: string;
  project?: string;
  priority: TaskPriority;
  status: TaskStatus;
};
