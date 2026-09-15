import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { agentRouter } from "./routes/agent.routes.js";
import { activityRouter } from "./routes/activity.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.clientUrl }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/tasks", requireAuth, taskRouter);
  app.use("/api/agent", requireAuth, agentRouter);
  app.use("/api/activity", requireAuth, activityRouter);

  return app;
};