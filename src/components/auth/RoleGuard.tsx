'use client';

import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles. If false, user needs ANY role.
}

export default function RoleGuard({ 
  children, 
  roles, 
  fallback = null,
  requireAll = false 
}: RoleGuardProps) {
  const { hasRole, authenticated, loading } = useKeycloakAuth();

  if (loading) {
    return null;
  }

  if (!authenticated) {
    return <>{fallback}</>;
  }

  // Check if user has required roles
  const hasRequiredRoles = requireAll
    ? roles.every(role => hasRole(role.toUpperCase()))
    : roles.some(role => hasRole(role.toUpperCase()));

  if (!hasRequiredRoles) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
