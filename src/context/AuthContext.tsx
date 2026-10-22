import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setAuthToken } from "../api/apiClient";
import type { User } from "../api/authApi";

type Session = { token: string; user: User };
type AuthContextValue = { session: Session | null; login: (session: Session) => void; logout: () => void };

const SESSION_KEY = "ai-employee-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as Session : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);

  useEffect(() => setAuthToken(session?.token ?? null), [session]);

  function login(nextSession: Session) {
    setSession(nextSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  function logout() {
    setSession(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
