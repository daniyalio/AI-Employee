import { Router } from "express";
import { createTask, deleteTask, getStats, listTasks, updateTask } from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.get("/stats", getStats);
taskRouter.post("/", createTask);
taskRouter.patch("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
