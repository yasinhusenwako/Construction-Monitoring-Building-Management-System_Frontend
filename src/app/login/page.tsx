'use client';

import { useEffect } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { authenticated, loading, login, roles } = useKeycloakAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (authenticated) {
      // Log user roles for debugging
      console.log('User authenticated with roles:', roles);
      
      // Redirect to dashboard - the dashboard will show role-specific content
      router.replace('/dashboard');
    } else {
      // Not authenticated, redirect to Keycloak login
      login();
    }
  }, [authenticated, loading, login, router, roles]);

  // Show loading while checking authentication or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E3A8A] mx-auto"></div>
        <p className="mt-4 text-slate-700 font-medium">
          {loading ? 'Initializing...' : 'Redirecting to login...'}
        </p>
      </div>
    </div>
  );
}
