import { useCallback, useEffect, useState } from "react";
import { createTask, getTasks, updateTask } from "../api/taskApi";
import type { Task } from "../types/task";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data.tasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addTask(title: string) {
    const data = await createTask({ title, priority: "medium" });
    setTasks((current) => [data.task, ...current]);
  }

  async function changeStatus(task: Task) {
    const next = task.status === "queued" ? "in-progress" : task.status === "in-progress" ? "done" : "queued";
    const data = await updateTask(task.id, { status: next });
    setTasks((current) => current.map((item) => item.id === task.id ? data.task : item));
  }

  return { tasks, loading, addTask, changeStatus, refresh };
}
