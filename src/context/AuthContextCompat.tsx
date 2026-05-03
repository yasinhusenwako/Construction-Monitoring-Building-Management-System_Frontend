'use client';

/**
 * Compatibility wrapper for old useAuth hook
 * Maps Keycloak authentication to the old Auth interface
 */

import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import type { User } from '@/types/models';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => void;
}

export function useAuth(): AuthContextType {
  const { user, authenticated, loading, logout: keycloakLogout, login: keycloakLogin, roles, divisionId, token } = useKeycloakAuth();

  // Map Keycloak user to old User format
  // Use role priority: ADMIN > SUPERVISOR > PROFESSIONAL > USER
  const getUserRole = (): 'admin' | 'supervisor' | 'professional' | 'user' => {
    if (roles.includes('ADMIN')) return 'admin';
    if (roles.includes('SUPERVISOR')) return 'supervisor';
    if (roles.includes('PROFESSIONAL')) return 'professional';
    return 'user';
  };

  // Extract user info from JWT token if profile loading failed
  const getUserInfoFromToken = () => {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email || payload.preferred_username,
        username: payload.preferred_username,
        firstName: payload.given_name,
        lastName: payload.family_name,
        name: payload.name,
      };
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  };

  const tokenInfo = getUserInfoFromToken();
  const userInfo = user || tokenInfo;

  const currentUser: User | null = authenticated && userInfo ? {
    id: userInfo.email || userInfo.username || roles[0] || 'keycloak-user',
    name: userInfo.name || (userInfo.firstName && userInfo.lastName 
      ? `${userInfo.firstName} ${userInfo.lastName}` 
      : userInfo.username || userInfo.email || 'User'),
    email: userInfo.email || userInfo.username || '',
    password: '',
    role: getUserRole(),
    department: '',
    divisionId: divisionId, // Extract from JWT token
    phone: '',
    avatar: (userInfo.username || userInfo.email || 'U').substring(0, 2).toUpperCase(),
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
  } : null;

  return {
    currentUser,
    isAuthenticated: authenticated,
    isLoading: loading,
    login: async () => {
      keycloakLogin();
      return { success: true };
    },
    logout: keycloakLogout,
    register: async () => {
      keycloakLogin();
      return { success: true };
    },
    forgotPassword: async () => ({ success: true }),
    updateUser: () => {},
  };
}
