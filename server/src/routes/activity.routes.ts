import { Router } from "express";
import { listActivities } from "../controllers/activity.controller.js";

export const activityRouter = Router();
activityRouter.get("/", listActivities);