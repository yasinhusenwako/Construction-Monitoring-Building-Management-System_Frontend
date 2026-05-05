'use client';

/**
 * Simplified auth hook - uses Keycloak directly
 * Replaces the old AuthContext compatibility layer
 */

import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'professional' | 'user';
  divisionId?: string;
  avatar: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  currentUser: AuthUser | null; // Alias for backward compatibility
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  isProfessional: () => boolean;
  token: string | null;
}

export function useAuth(): UseAuthReturn {
  const {
    user: keycloakUser,
    authenticated,
    loading,
    login,
    logout,
    roles,
    divisionId,
    token,
    hasRole,
    isAdmin,
    isSupervisor,
    isProfessional,
  } = useKeycloakAuth();

  // Determine primary role (highest priority)
  const getPrimaryRole = (): 'admin' | 'supervisor' | 'professional' | 'user' => {
    if (roles.includes('ADMIN')) return 'admin';
    if (roles.includes('SUPERVISOR')) return 'supervisor';
    if (roles.includes('PROFESSIONAL')) return 'professional';
    return 'user';
  };

  // Map Keycloak user to simplified auth user
  const user: AuthUser | null = authenticated && keycloakUser ? {
    id: keycloakUser.email || keycloakUser.username || '',
    name: keycloakUser.firstName && keycloakUser.lastName
      ? `${keycloakUser.firstName} ${keycloakUser.lastName}`
      : keycloakUser.username || keycloakUser.email || 'User',
    email: keycloakUser.email || keycloakUser.username || '',
    role: getPrimaryRole(),
    divisionId: divisionId,
    avatar: (keycloakUser.firstName?.[0] || keycloakUser.username?.[0] || 'U').toUpperCase() +
            (keycloakUser.lastName?.[0] || keycloakUser.email?.[0] || 'S').toUpperCase(),
  } : null;

  return {
    user,
    currentUser: user, // Alias for backward compatibility
    isAuthenticated: authenticated,
    isLoading: loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isSupervisor,
    isProfessional,
    token,
  };
}
