import { apiRequest } from "./apiClient";

export type User = { id: string; name: string; email: string };
export type AuthResponse = { token: string; user: User };

export const loginUser = (credentials: { email: string; password: string }) =>
  apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const registerUser = (credentials: { name: string; email: string; password: string }) =>
  apiRequest<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(credentials) });
