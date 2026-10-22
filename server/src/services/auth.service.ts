import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireEnvironment } from "../config/env.js";

const tokenSecret = () => requireEnvironment("JWT_SECRET", process.env.JWT_SECRET);

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("An account with this email already exists");

    const password = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { name: input.name.trim(), email, password } });
    return createSession(user);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) throw new Error("Invalid email or password");
    return createSession(user);
  },
};

function createSession(user: { id: string; name: string; email: string }) {
  const token = jwt.sign({ userId: user.id }, tokenSecret(), { expiresIn: "7d" });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}
