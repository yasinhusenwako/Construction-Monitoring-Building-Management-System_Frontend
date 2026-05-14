import keycloak from './keycloak';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

function resolveUrl(endpoint: string): string {
  const path = `/api/keycloak/users${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

// Get auth headers with Keycloak token
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (keycloak.token) {
    headers['Authorization'] = `Bearer ${keycloak.token}`;
  }

  return headers;
}

// Generic API request function with token refresh
async function keycloakApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = resolveUrl(endpoint);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, try to refresh
      try {
        await keycloak.updateToken(5);
        // Retry the request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...getAuthHeaders(),
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(errorText || `API request failed: ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      } catch (error) {
        // Refresh failed, redirect to login
        keycloak.login();
        throw new Error('Authentication required');
      }
    }
    
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  roles: string[];
  phone?: string;
  department?: string;
  divisionId?: string;
  profession?: string;
  status: 'active' | 'inactive' | 'locked';
  avatar: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
  enabled?: boolean;
  phone?: string;
  department?: string | null;
  divisionId?: string | null;
  profession?: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  roles?: string[];
  phone?: string;
  department?: string | null;
  divisionId?: string | null;
  profession?: string | null;
}

// Export API functions
export const keycloakUserApi = {
  // Get all users
  getAllUsers: (): Promise<KeycloakUser[]> => 
    keycloakApiRequest('', { method: 'GET' }),

  // Get single user
  getUser: (userId: string): Promise<KeycloakUser> => 
    keycloakApiRequest(`/${userId}`, { method: 'GET' }),

  // Create user
  createUser: (data: CreateUserRequest): Promise<{ id: string; message: string }> => 
    keycloakApiRequest('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update user
  updateUser: (userId: string, data: UpdateUserRequest): Promise<{ message: string }> => 
    keycloakApiRequest(`/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete user
  deleteUser: (userId: string): Promise<void> => 
    keycloakApiRequest(`/${userId}`, { method: 'DELETE' }),

  // Toggle user status
  toggleUserStatus: (userId: string, enabled: boolean): Promise<{ message: string }> => 
    keycloakApiRequest(`/${userId}/status?enabled=${enabled}`, { method: 'PATCH' }),

  // Reset password
  resetPassword: (userId: string, password: string, temporary: boolean = false): Promise<{ message: string }> => 
    keycloakApiRequest(`/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password, temporary: temporary.toString() }),
    }),

  // Get available roles
  getAvailableRoles: (): Promise<string[]> => 
    keycloakApiRequest('/roles', { method: 'GET' }),
};

export default keycloakUserApi;
