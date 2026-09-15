import { Router } from "express";
import { listAgentRuns, runAgent } from "../controllers/agent.controller.js";

export const agentRouter = Router();

agentRouter.post("/", runAgent);
agentRouter.get("/runs", listAgentRuns);
