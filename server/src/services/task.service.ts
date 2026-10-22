import { prisma } from "../lib/prisma.js";
import type { TaskPriority, TaskStatus } from "../types/task.js";

export const taskService = {
  list: (userId: string) => prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),

  create: (userId: string, input: { title: string; description?: string; priority?: TaskPriority }) =>
    prisma.task.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        priority: input.priority ?? "medium",
      },
    }),

  update: (userId: string, id: string, input: Partial<{ title: string; description: string; status: TaskStatus; priority: TaskPriority }>) =>
    prisma.task.updateMany({ where: { id, userId }, data: input }),

  remove: (userId: string, id: string) => prisma.task.deleteMany({ where: { id, userId } }),

  stats: async (userId: string) => {
    const [total, queued, inProgress, done] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "queued" } }),
      prisma.task.count({ where: { userId, status: "in-progress" } }),
      prisma.task.count({ where: { userId, status: "done" } }),
    ]);
    return { total, queued, inProgress, done };
  },
};
