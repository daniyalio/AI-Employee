import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Name is required" });
  if (typeof email !== "string" || !email.includes("@")) return res.status(400).json({ message: "Valid email is required" });
  if (typeof password !== "string" || password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

  try {
    return res.status(201).json(await authService.register({ name, email, password }));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : "Unable to create account" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ message: "Email and password are required" });

  try {
    return res.json(await authService.login(email, password));
  } catch {
    return res.status(401).json({ message: "Invalid email or password" });
  }
}
