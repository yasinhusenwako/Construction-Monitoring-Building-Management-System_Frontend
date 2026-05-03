'use client';

import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useAuth } from '@/context/AuthContext';

export default function DebugAuthPage() {
  const keycloakAuth = useKeycloakAuth();
  const oldAuth = useAuth();

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>

        {/* Keycloak Auth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Keycloak Auth Context</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Authenticated:</strong> {String(keycloakAuth.authenticated)}</div>
            <div><strong>Loading:</strong> {String(keycloakAuth.loading)}</div>
            <div><strong>User:</strong> {JSON.stringify(keycloakAuth.user, null, 2)}</div>
            <div><strong>Roles:</strong> {JSON.stringify(keycloakAuth.roles, null, 2)}</div>
            <div><strong>Division ID:</strong> {keycloakAuth.divisionId || 'undefined'}</div>
            <div><strong>Is Admin:</strong> {String(keycloakAuth.isAdmin())}</div>
            <div><strong>Is Supervisor:</strong> {String(keycloakAuth.isSupervisor())}</div>
            <div><strong>Is Professional:</strong> {String(keycloakAuth.isProfessional())}</div>
          </div>
        </div>

        {/* Old Auth (Compat) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Old Auth Context (Compat)</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Authenticated:</strong> {String(oldAuth.isAuthenticated)}</div>
            <div><strong>Loading:</strong> {String(oldAuth.isLoading)}</div>
            <div><strong>Current User:</strong> {JSON.stringify(oldAuth.currentUser, null, 2)}</div>
          </div>
        </div>

        {/* Token Info */}
        {keycloakAuth.token && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">JWT Token Payload</h2>
            <div className="space-y-2 font-mono text-sm overflow-auto">
              <pre>{JSON.stringify(
                JSON.parse(atob(keycloakAuth.token.split('.')[1])),
                null,
                2
              )}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
