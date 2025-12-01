"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User, StaffPermissions } from "@/lib/data";

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
  login: (username: string, password: string, users: User[]) => boolean;
  logout: () => void;
  hasPermission: (permission: keyof StaffPermissions) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isParent: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = "schoolyard-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(AUTH_KEY);
    } catch {}
  }, [user]);

  const login = useCallback((username: string, password: string, users: User[]) => {
    const foundUser = users.find((u) => u.username === username && u.password === password);
    if (foundUser) {
      const authUser: AuthUser = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        staffId: foundUser.staffId,
        permissions: foundUser.permissions,
        studentIds: foundUser.studentIds,
      };
      setUser(authUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
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
    () => ({ user, login, logout, hasPermission, isAdmin, isStaff, isParent }),
    [user, login, logout, hasPermission, isAdmin, isStaff, isParent]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


