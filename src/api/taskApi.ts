import { apiRequest } from "./apiClient";
import type { Task } from "../types/task";

export const getTasks = () => apiRequest<{ tasks: Task[] }>("/api/tasks");

export const createTask = (task: Pick<Task, "title" | "priority"> & { description?: string }) =>
  apiRequest<{ task: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });

export const updateTask = (id: string | number, changes: Partial<Task>) =>
  apiRequest<{ task: Task }>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });

export const runAgent = (task: string) =>
  apiRequest<{ success: boolean; output: string }>("/api/agent", {
    method: "POST",
    body: JSON.stringify({ task }),
  });
