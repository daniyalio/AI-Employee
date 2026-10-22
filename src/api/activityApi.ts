import { apiRequest } from "./apiClient";

export type Activity = {
  id: string;
  message: string;
  type: "task" | "agent" | "approval";
  createdAt: string;
};

export const getActivities = () =>
  apiRequest<{ activities: Activity[] }>("/api/activity");