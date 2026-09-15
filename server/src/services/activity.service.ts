import { prisma } from "../lib/prisma.js";

export type ActivityType = "task" | "agent" | "approval";

export const activityService = {
  create: (userId: string, message: string, type: ActivityType) =>
    prisma.activity.create({ data: { userId, message, type } }),

  list: (userId: string) => prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  }),
};
