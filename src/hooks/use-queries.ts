"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type {
  Project,
  Booking,
  Maintenance,
  Notification,
  UserRole,
} from "@/types/models";
import {
  fetchLiveProjects,
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveNotifications,
  fetchLiveUsers,
  fetchLiveReports,
  updateProject,
  updateBooking,
  updateMaintenance,
  deleteUser,
  updateLiveUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/live-api";
import { showErrorToast, showSuccessToast } from "@/lib/error-handler";

// Projects
export function useProjects(projectId?: string) {
  return useQuery({
    queryKey: projectId
      ? queryKeys.projects.detail(projectId)
      : queryKeys.projects.lists(),
    queryFn: () => fetchLiveProjects(projectId),
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      updateProject(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
      showSuccessToast("Project updated successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Update Project");
    },
  });
}

// Bookings
export function useBookings(bookingId?: string) {
  return useQuery({
    queryKey: bookingId
      ? queryKeys.bookings.detail(bookingId)
      : queryKeys.bookings.lists(),
    queryFn: () => fetchLiveBookings(bookingId),
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      updateBooking(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(variables.id),
      });
      showSuccessToast("Booking updated successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Update Booking");
    },
  });
}

// Maintenance
export function useMaintenance(maintenanceId?: string) {
  return useQuery({
    queryKey: maintenanceId
      ? queryKeys.maintenance.detail(maintenanceId)
      : queryKeys.maintenance.lists(),
    queryFn: () => fetchLiveMaintenance(maintenanceId),
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Maintenance>;
    }) => updateMaintenance(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.maintenance.detail(variables.id),
      });
      showSuccessToast("Maintenance request updated successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Update Maintenance");
    },
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.lists(),
    queryFn: fetchLiveNotifications,
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error) => {
      showErrorToast(error, "Mark Notification as Read");
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      showSuccessToast("All notifications marked as read");
    },
    onError: (error) => {
      showErrorToast(error, "Mark All as Read");
    },
  });
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: fetchLiveUsers,
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      userId: string;
      name: string;
      email: string;
      role: UserRole;
      phone: string;
      department: string;
      profession?: string;
      divisionId?: string;
    }) => updateLiveUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showSuccessToast("User updated successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Update User");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showSuccessToast("User deleted successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Delete User");
    },
  });
}

// Reports
export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports.overview(),
    queryFn: fetchLiveReports,
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    refreshProjects: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
    refreshBookings: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    refreshMaintenance: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    refreshNotifications: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  };
}
