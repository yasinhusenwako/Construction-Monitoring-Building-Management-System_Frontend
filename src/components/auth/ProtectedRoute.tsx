"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // If role restrictions exist and user doesn't have permission, redirect to dashboard
    if (
      allowedRoles &&
      currentUser &&
      !allowedRoles.includes(currentUser.role)
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, currentUser, allowedRoles, router]);

  // Don't render children if not authenticated or no permission
  if (!isAuthenticated) return null;
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role))
    return null;

  return <>{children}</>;
}
