import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && /4\d\d/.test(error.message)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});

// Query keys factory for better organization
export const queryKeys = {
  // Projects
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  
  // Bookings
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
  },
  
  // Maintenance
  maintenance: {
    all: ["maintenance"] as const,
    lists: () => [...queryKeys.maintenance.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.maintenance.lists(), filters] as const,
    details: () => [...queryKeys.maintenance.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
  },
  
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
  },
  
  // Notifications
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    unread: () => [...queryKeys.notifications.all, "unread"] as const,
  },
  
  // Reports
  reports: {
    all: ["reports"] as const,
    overview: () => [...queryKeys.reports.all, "overview"] as const,
    mttr: () => [...queryKeys.reports.all, "mttr"] as const,
    analytics: () => [...queryKeys.reports.all, "analytics"] as const,
  },
  
  // Spaces
  spaces: {
    all: ["spaces"] as const,
    lists: () => [...queryKeys.spaces.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.spaces.lists(), filters] as const,
  },
} as const;
