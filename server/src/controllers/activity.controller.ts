import type { Request, Response } from "express";
import { activityService } from "../services/activity.service.js";

export const listActivities = async (req: Request, res: Response) => {
  const activities = await activityService.list(req.userId!);
  res.json({ activities });
};