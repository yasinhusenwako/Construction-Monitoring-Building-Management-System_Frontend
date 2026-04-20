"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Project,
  Booking,
  Maintenance,
  Notification,
} from "@/types/models";
import {
  fetchLiveProjects,
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveNotifications,
} from "@/lib/live-api";

// Query keys for cache management
export const queryKeys = {
  projects: ["projects"] as const,
  bookings: ["bookings"] as const,
  maintenance: ["maintenance"] as const,
  notifications: ["notifications"] as const,
  dashboard: ["dashboard"] as const,
  all: ["projects", "bookings", "maintenance", "notifications"] as const,
};

// Projects
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => fetchLiveProjects(),
    enabled: typeof window !== "undefined",
  });
}

// Bookings
export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => fetchLiveBookings(),
    enabled: typeof window !== "undefined",
  });
}

// Maintenance
export function useMaintenance() {
  return useQuery({
    queryKey: queryKeys.maintenance,
    queryFn: () => fetchLiveMaintenance(),
    enabled: typeof window !== "undefined",
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => fetchLiveNotifications(),
    enabled: typeof window !== "undefined",
  });
}

// Combined dashboard data
export function useDashboardData() {
  const projects = useProjects();
  const bookings = useBookings();
  const maintenance = useMaintenance();
  const notifications = useNotifications();

  const isLoading =
    projects.isLoading ||
    bookings.isLoading ||
    maintenance.isLoading ||
    notifications.isLoading;

  const isError =
    projects.isError ||
    bookings.isError ||
    maintenance.isError ||
    notifications.isError;

  const error =
    projects.error ||
    bookings.error ||
    maintenance.error ||
    notifications.error;

  return {
    data: {
      projects: projects.data ?? [],
      bookings: bookings.data ?? [],
      maintenance: maintenance.data ?? [],
      notifications: notifications.data ?? [],
    },
    isLoading,
    isError,
    error,
    refetch: () => {
      projects.refetch();
      bookings.refetch();
      maintenance.refetch();
      notifications.refetch();
    },
  };
}

// Hook to invalidate and refresh dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    refreshProjects: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
    refreshBookings: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
    refreshMaintenance: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance });
    },
    refreshNotifications: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  };
}
