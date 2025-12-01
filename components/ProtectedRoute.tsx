"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import toast from "react-hot-toast";
import type { StaffPermissions } from "@/lib/data";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePermission?: keyof StaffPermissions;
  fallbackPath?: string;
}

/**
 * Component to protect routes based on authentication and permissions
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requirePermission,
  fallbackPath = "/dashboard",
}: ProtectedRouteProps) {
  const { user, isAdmin, hasPermission, isParent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (requireAuth && !user) {
      router.push("/");
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin()) {
      toast.error("Access denied: Admin only");
      router.push(fallbackPath);
      return;
    }

    // Check permission requirement
    if (requirePermission && !hasPermission(requirePermission)) {
      toast.error("You don't have permission to access this page");
      router.push(fallbackPath);
      return;
    }

    // Parents can't access admin/staff routes
    if (isParent() && fallbackPath === "/dashboard") {
      router.push("/parent");
    }
  }, [user, requireAuth, requireAdmin, requirePermission, isAdmin, hasPermission, isParent, router, fallbackPath]);

  // Don't render anything while checking permissions
  if (requireAuth && !user) {
    return null;
  }

  if (requireAdmin && !isAdmin()) {
    return null;
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return null;
  }

  return <>{children}</>;
}

