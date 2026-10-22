import { prisma } from "../lib/prisma.js";
import { env, requireOpenAiKey } from "../config/env.js";
import { activityService } from "./activity.service.js";

export const agentService = {
  async run(userId: string, task: string) {
    const run = await prisma.agentRun.create({ data: { userId, task, status: "running" } });
    await activityService.create(userId, `Started work: ${task}`, "agent");

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${requireOpenAiKey()}` },
        body: JSON.stringify({
          model: env.openAiModel,
          instructions: "You are an AI employee. Turn requests into concrete, useful work. Never claim an external action happened unless a connected tool actually performed it.",
          input: task,
          tools: [{ type: "web_search" }],
        }),
      });

      const data = await response.json() as { output_text?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "AI request failed");

      const output = data.output_text ?? "No output returned.";
      await prisma.agentRun.update({ where: { id: run.id }, data: { output, status: "completed" } });
      await activityService.create(userId, "Finished the requested work", "agent");
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed";
      await prisma.agentRun.update({ where: { id: run.id }, data: { output: message, status: "failed" } });
      await activityService.create(userId, "Agent work failed", "agent");
      throw error;
    }
  },

  listRuns: (userId: string) => prisma.agentRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  }),
};