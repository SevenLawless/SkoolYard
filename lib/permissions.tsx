"use client";

import { useAuth } from "./auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { StaffPermissions } from "./data";

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: keyof StaffPermissions): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to protect a route based on permissions
 * Redirects to dashboard if user doesn't have permission
 */
export function useRequirePermission(permission: keyof StaffPermissions) {
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (!hasPermission(permission)) {
      router.push("/dashboard");
    }
  }, [user, permission, hasPermission, router]);

  return hasPermission(permission);
}

/**
 * Hook to protect a route for admin only
 */
export function useRequireAdmin() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (!isAdmin()) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  return isAdmin();
}

/**
 * Hook to protect a route for authenticated users
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  return !!user;
}

