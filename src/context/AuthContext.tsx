/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * All authentication now uses Keycloak via KeycloakAuthContext.
 * This file re-exports the compatibility wrapper.
 */

export { useAuth } from './AuthContextCompat';
export type { AuthContextType } from './AuthContextCompat';
