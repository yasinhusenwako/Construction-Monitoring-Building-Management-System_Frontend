/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * All authentication now uses Keycloak directly.
 * 
 * Migration: Replace imports from '@/context/AuthContext' with '@/hooks/useAuth'
 */

export { useAuth } from '../hooks/useAuth';
export type { UseAuthReturn as AuthContextType } from '../hooks/useAuth';
