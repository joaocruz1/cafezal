"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchWithAuth, getStoredToken, setStoredToken, clearStoredToken } from "@/lib/auth-client";

export type User = {
  id: string;
  email: string;
  name: string;
  profile: "ADMIN" | "GERENTE" | "FINANCEIRO" | "VENDEDOR" | "ESTOQUE";
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/api/auth/me");
      if (!res.ok) {
        clearStoredToken();
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((token: string, u: User) => {
    setStoredToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
