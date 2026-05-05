import keycloak from './keycloak';

const API_BASE_URL = 'http://localhost:8080/api';

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

// Generic API request function
async function keycloakApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
          throw new Error(`API request failed: ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      } catch (error) {
        // Refresh failed, redirect to login
        keycloak.login();
        throw new Error('Authentication required');
      }
    }
    
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Export API functions
export const keycloakApi = {
  // Projects
  getProjects: () => keycloakApiRequest('/projects', { method: 'GET' }),
  getProject: (id: number) => keycloakApiRequest(`/projects/${id}`, { method: 'GET' }),
  createProject: (data: any) => keycloakApiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProject: (id: number, data: any) => keycloakApiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProject: (id: number) => keycloakApiRequest(`/projects/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: () => keycloakApiRequest('/bookings', { method: 'GET' }),
  getBooking: (id: number) => keycloakApiRequest(`/bookings/${id}`, { method: 'GET' }),
  createBooking: (data: any) => keycloakApiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBooking: (id: number, data: any) => keycloakApiRequest(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteBooking: (id: number) => keycloakApiRequest(`/bookings/${id}`, { method: 'DELETE' }),

  // Maintenance
  getMaintenance: () => keycloakApiRequest('/maintenance', { method: 'GET' }),
  getMaintenanceItem: (id: number) => keycloakApiRequest(`/maintenance/${id}`, { method: 'GET' }),
  createMaintenance: (data: any) => keycloakApiRequest('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMaintenance: (id: number, data: any) => keycloakApiRequest(`/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteMaintenance: (id: number) => keycloakApiRequest(`/maintenance/${id}`, { method: 'DELETE' }),

  // Users
  getCurrentUser: () => keycloakApiRequest('/users/me', { method: 'GET' }),
  getUsers: () => keycloakApiRequest('/users', { method: 'GET' }),
  getUser: (id: number) => keycloakApiRequest(`/users/${id}`, { method: 'GET' }),

  // Reports
  getReports: () => keycloakApiRequest('/reports', { method: 'GET' }),
  
  // Notifications
  getNotifications: () => keycloakApiRequest('/notifications', { method: 'GET' }),
};

export default keycloakApi;
