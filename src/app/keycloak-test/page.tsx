'use client';

import { useEffect, useState } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import UserProfile from '@/components/auth/UserProfile';
import RoleGuard from '@/components/auth/RoleGuard';
import { keycloakApi } from '@/lib/keycloak-api';

export default function KeycloakTestPage() {
  const { authenticated, loading, user, roles, token, login } = useKeycloakAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (authenticated && token) {
      // Test API call
      setApiLoading(true);
      keycloakApi.getProjects()
        .then((data: any) => {
          setProjects(data);
          setApiError(null);
        })
        .catch((error) => {
          setApiError(error.message);
        })
        .finally(() => {
          setApiLoading(false);
        });
    }
  }, [authenticated, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Keycloak...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Keycloak Test Page</h1>
          <p className="text-gray-600 mb-6">You need to login to access this page.</p>
          <button
            onClick={login}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login with Keycloak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🎉 Keycloak Integration Test</h1>
            <UserProfile />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">✅ Authentication</h2>
              <p className="text-green-700">Status: Authenticated</p>
              <p className="text-green-700">User: {user?.email}</p>
            </div>

            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">👤 User Information</h2>
              <p className="text-blue-700">Name: {user?.firstName} {user?.lastName}</p>
              <p className="text-blue-700">Email: {user?.email}</p>
              <p className="text-blue-700">Username: {user?.username}</p>
            </div>

            {/* Roles */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">🔐 Roles</h2>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Token Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">🔑 Token</h2>
              <p className="text-yellow-700 text-sm">Length: {token?.length} characters</p>
              <p className="text-yellow-700 text-sm break-all">
                Preview: {token?.substring(0, 50)}...
              </p>
            </div>
          </div>

          {/* API Test */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">🔌 API Integration Test</h2>
            {apiLoading ? (
              <p className="text-gray-600">Loading projects...</p>
            ) : apiError ? (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700">❌ API Error: {apiError}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-700">✅ API Call Successful!</p>
                <p className="text-green-700">Projects retrieved: {projects.length}</p>
              </div>
            )}
          </div>

          {/* Role-Based UI Test */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Role-Based UI Test</h2>
            
            <RoleGuard roles={['ADMIN']}>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-red-700 font-medium">✅ Admin Only Content - You can see this!</p>
              </div>
            </RoleGuard>

            <RoleGuard 
              roles={['SUPERVISOR']}
              fallback={
                <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-3">
                  <p className="text-gray-600">❌ Supervisor Only Content - Hidden</p>
                </div>
              }
            >
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <p className="text-blue-700 font-medium">✅ Supervisor Only Content - You can see this!</p>
              </div>
            </RoleGuard>

            <RoleGuard 
              roles={['PROFESSIONAL']}
              fallback={
                <div className="bg-gray-100 border border-gray-300 rounded p-3">
                  <p className="text-gray-600">❌ Professional Only Content - Hidden</p>
                </div>
              }
            >
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-700 font-medium">✅ Professional Only Content - You can see this!</p>
              </div>
            </RoleGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
