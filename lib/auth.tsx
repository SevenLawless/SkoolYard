"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { StaffPermissions } from "@/lib/data";

type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "staff" | "parent";
  name: string;
  email: string;
  phone?: string;
  staffId?: string;
  permissions?: StaffPermissions;
  studentIds?: string[];
} | null;

type AuthContextValue = {
  user: AuthUser;
  login: (username: string, password: string, csrfToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  loading: boolean;
  hasPermission: (permission: keyof StaffPermissions) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isParent: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    verify();
  }, []);

  const verify = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Verify error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string, csrfToken: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: keyof StaffPermissions) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (user.role === "staff" && user.permissions) {
        return user.permissions[permission] === true;
      }
      return false;
    },
    [user]
  );

  const isAdmin = useCallback(() => user?.role === "admin", [user]);
  const isStaff = useCallback(() => user?.role === "staff", [user]);
  const isParent = useCallback(() => user?.role === "parent", [user]);

  const value = useMemo(
    () => ({ user, login, logout, verify, loading, hasPermission, isAdmin, isStaff, isParent }),
    [user, login, logout, verify, loading, hasPermission, isAdmin, isStaff, isParent]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


