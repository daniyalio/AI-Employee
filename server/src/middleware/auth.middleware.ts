import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireEnvironment } from "../config/env.js";

declare global {
  namespace Express {
    interface Request { userId?: string; }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(token, requireEnvironment("JWT_SECRET", process.env.JWT_SECRET));
    if (typeof payload !== "object" || typeof payload.userId !== "string") throw new Error("Invalid token");
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
