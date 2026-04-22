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
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

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
  }, [isLoading, isAuthenticated, currentUser, allowedRoles, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC1F1A]"></div>
      </div>
    );
  }

  // Don't render children if not authenticated or no permission
  if (!isAuthenticated) return null;
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role))
    return null;

  return <>{children}</>;
}
