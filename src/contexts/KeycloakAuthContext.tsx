'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import type { KeycloakInstance, KeycloakProfile } from 'keycloak-js';

interface KeycloakAuthContextType {
  keycloak: KeycloakInstance | null;
  authenticated: boolean;
  user: KeycloakProfile | null;
  token: string | null;
  roles: string[];
  divisionId: string | undefined;
  loading: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  isProfessional: () => boolean;
}

const KeycloakAuthContext = createContext<KeycloakAuthContextType | undefined>(undefined);

export function KeycloakAuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<KeycloakProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [divisionId, setDivisionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Expose Keycloak instance IMMEDIATELY so old auth can detect it
    if (typeof window !== 'undefined') {
      (window as any).keycloak = keycloak;
      (window as any).keycloakInitializing = true;
    }

    // Add timeout to prevent infinite loading
    const initTimeout = setTimeout(() => {
      console.error('Keycloak initialization timeout - proceeding without Keycloak');
      setLoading(false);
      setAuthenticated(false);
      if (typeof window !== 'undefined') {
        (window as any).keycloakInitializing = false;
      }
    }, 10000); // 10 second timeout

    // Initialize Keycloak
    // console.log('Initializing Keycloak...');
    // console.log('Keycloak config:', {
    //   url: 'http://localhost:8090',
    //   realm: 'insa',
    //   clientId: 'insa-frontend'
    // });
    // console.log('Current URL:', window.location.href);
    
    // Try to initialize with minimal config
    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
      })
      .then((auth) => {
        clearTimeout(initTimeout);
        // console.log('✅ Keycloak initialized successfully, authenticated:', auth);
        setAuthenticated(auth);
        
        if (typeof window !== 'undefined') {
          (window as any).keycloakInitializing = false;
        }
        
        if (auth) {
          // Load user profile (optional - don't block if it fails)
          keycloak.loadUserProfile().then((profile) => {
            setUser(profile);
            // console.log('User profile loaded:', profile);
          }).catch((error) => {
            console.warn('Could not load user profile from Keycloak (non-critical):', error.message);
            // Set a minimal user object from token claims instead
            if (keycloak.tokenParsed) {
              setUser({
                username: keycloak.tokenParsed.preferred_username || '',
                email: keycloak.tokenParsed.email || '',
                firstName: keycloak.tokenParsed.given_name || '',
                lastName: keycloak.tokenParsed.family_name || '',
                emailVerified: keycloak.tokenParsed.email_verified || false,
              } as any);
            }
          });

          // Get token
          setToken(keycloak.token || null);

          // Extract divisionId from JWT token
          if (keycloak.token) {
            try {
              const tokenPayload = JSON.parse(atob(keycloak.token.split('.')[1]));
              const extractedDivisionId = tokenPayload.divisionId || tokenPayload.division_id || tokenPayload.divisionid;
              
              if (extractedDivisionId) {
                setDivisionId(extractedDivisionId);
                console.log('✅ Division ID extracted from token:', extractedDivisionId);
              } else {
                // Fallback: Fetch divisionId from backend API
                console.log('⚠️ divisionId not in token, fetching from backend...');
                fetch('http://localhost:8080/api/users/me', {
                  credentials: 'include',
                  headers: {
                    'Authorization': `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                  },
                })
                  .then(res => {
                    if (!res.ok) {
                      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    return res.json();
                  })
                  .then(userData => {
                    console.log('📥 User data from backend:', userData);
                    if (userData.divisionId) {
                      setDivisionId(userData.divisionId);
                      console.log('✅ Division ID fetched from backend:', userData.divisionId);
                    } else {
                      console.log('⚠️ No divisionId found for user');
                      setDivisionId(undefined);
                    }
                  })
                  .catch(error => {
                    console.error('❌ Failed to fetch divisionId from backend:', error);
                    setDivisionId(undefined);
                  });
              }
            } catch (error) {
              console.error('❌ Failed to extract divisionId from token:', error);
              setDivisionId(undefined);
            }
          }

          // Get roles
          const realmRoles = keycloak.realmAccess?.roles || [];
          setRoles(realmRoles);
          // console.log('User roles:', realmRoles);

          // Setup token refresh
          const refreshInterval = setInterval(() => {
            keycloak.updateToken(70).then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token || null);
                
                // Re-extract divisionId from refreshed token
                if (keycloak.token) {
                  try {
                    const tokenPayload = JSON.parse(atob(keycloak.token.split('.')[1]));
                    const extractedDivisionId = tokenPayload.divisionId || tokenPayload.division_id || tokenPayload.divisionid;
                    setDivisionId(extractedDivisionId);
                  } catch (error) {
                    console.error('Failed to extract divisionId from refreshed token:', error);
                  }
                }
                
                // console.log('Token refreshed');
              }
            }).catch(() => {
              console.error('Failed to refresh token');
              setAuthenticated(false);
            });
          }, 60000); // Check every minute

          // Cleanup interval on unmount - but don't return here!
          // Store cleanup function for later
          (window as any).keycloakRefreshCleanup = () => clearInterval(refreshInterval);
        }

        // Always set loading to false after initialization
        setLoading(false);
        // console.log('✅ Keycloak loading complete');
      })
      .catch((error) => {
        clearTimeout(initTimeout);
        console.error('❌ Keycloak initialization failed:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        
        // Check if it's a CSP error
        if (error?.message?.includes('eval') || error?.message?.includes('CSP')) {
          console.error('🚨 CSP is blocking Keycloak! Check Content-Security-Policy headers.');
        }
        
        setLoading(false);
        setAuthenticated(false);
        if (typeof window !== 'undefined') {
          (window as any).keycloakInitializing = false;
        }
      });

    // Cleanup timeout on unmount
    return () => clearTimeout(initTimeout);
  }, []);

  const login = () => {
    // Don't specify redirectUri - let Keycloak use the configured one
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isSupervisor = (): boolean => {
    return hasRole('SUPERVISOR');
  };

  const isProfessional = (): boolean => {
    return hasRole('PROFESSIONAL');
  };

  const value = {
    keycloak,
    authenticated,
    user,
    token,
    roles,
    divisionId,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isSupervisor,
    isProfessional,
  };

  return (
    <KeycloakAuthContext.Provider value={value}>
      {children}
    </KeycloakAuthContext.Provider>
  );
}

export function useKeycloakAuth() {
  const context = useContext(KeycloakAuthContext);
  if (context === undefined) {
    throw new Error('useKeycloakAuth must be used within KeycloakAuthProvider');
  }
  return context;
}
