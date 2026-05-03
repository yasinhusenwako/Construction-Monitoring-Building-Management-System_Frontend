'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredRole?: string; // Keep for backward compatibility
}

export default function ProtectedRoute({ children, allowedRoles, requiredRole }: ProtectedRouteProps) {
  const { authenticated, loading, hasRole, login } = useKeycloakAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!authenticated) {
        // Redirect to login
        login();
      } else {
        // Check if user has required role
        const rolesToCheck = allowedRoles || (requiredRole ? [requiredRole] : []);
        if (rolesToCheck.length > 0) {
          const hasRequiredRole = rolesToCheck.some(role => hasRole(role.toUpperCase()));
          if (!hasRequiredRole) {
            // User doesn't have required role
            router.push('/unauthorized');
          }
        }
      }
    }
  }, [authenticated, loading, allowedRoles, requiredRole, hasRole, login, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  // Check if user has required role
  const rolesToCheck = allowedRoles || (requiredRole ? [requiredRole] : []);
  if (rolesToCheck.length > 0) {
    const hasRequiredRole = rolesToCheck.some(role => hasRole(role.toUpperCase()));
    if (!hasRequiredRole) {
      return null; // Will redirect to unauthorized
    }
  }

  return <>{children}</>;
}
