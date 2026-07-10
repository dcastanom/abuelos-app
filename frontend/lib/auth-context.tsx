"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setAccessToken, setRefreshFailCallback } from "./api";

export type UserRole = "admin" | "doctor" | "nurse" | "receptionist";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id: string;
  company_slug: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // ignore errors on logout
    }
    setAccessToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const login = useCallback((token: string, userData: AuthUser) => {
    setAccessToken(token);
    setUser(userData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setRefreshFailCallback(logout);

    (async () => {
      try {
        const { data } = await api.post<{ access_token: string }>("/api/v1/auth/refresh");
        setAccessToken(data.access_token);

        // Decode JWT payload to get user info (read-only, not for verification)
        const payloadB64 = data.access_token.split(".")[1];
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        setUser({
          id: payload.sub,
          email: payload.email,
          full_name: payload.full_name,
          role: payload.role,
          company_id: payload.company_id,
          company_slug: payload.company_slug,
        });
      } catch {
        // No valid refresh token — stay on public pages
      } finally {
        setIsLoading(false);
      }
    })();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
