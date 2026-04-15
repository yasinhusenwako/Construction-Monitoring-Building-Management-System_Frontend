/**
 * @deprecated All types have been moved to @/types/models.
 * This file is a backward-compatibility shim only.
 * Import from '@/types/models' in new code.
 * Mock data arrays have been removed — data comes from the Spring Boot API.
 */

export type {
  UserRole,
  DivisionType,
  Division,
  User,
  TimelineEvent,
  Project,
  Booking,
  Maintenance,
  Notification,
} from "@/types/models";

export { divisions } from "@/types/models";

import type { Division, User } from "@/types/models";
import { divisions } from "@/types/models";

// ─── Helper functions (kept for backward compatibility) ─────────────────────

/**
 * Suggest a division based on request title/description/type keywords.
 */
export function suggestDivision(
  title: string,
  description: string,
  type: string,
): string | null {
  const text = `${title} ${description} ${type}`.toLowerCase();
  for (const division of divisions) {
    for (const keyword of division.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return division.id;
      }
    }
  }
  return null;
}

/**
 * Get a division by its ID.
 */
export function getDivisionById(id: string): Division | undefined {
  return divisions.find((d) => d.id === id);
}

/**
 * @deprecated User lists now come from the backend API.
 * Returns an empty array — use fetchLiveUsers() from @/lib/live-api.
 */
export function getSupervisorsByDivision(_divisionId: string): User[] {
  return [];
}

/**
 * @deprecated User lists now come from the backend API.
 * Returns an empty array — use fetchLiveUsers() from @/lib/live-api.
 */
export function getProfessionalsByDivision(_divisionId: string): User[] {
  return [];
}

// ─── Empty stubs for removed mock arrays ────────────────────────────────────
// These prevent import errors while views are migrated to async fetching.

import type {
  Project,
  Booking,
  Maintenance,
  Notification,
} from "@/types/models";

/** @deprecated Use fetchLiveProjects() from @/lib/live-api */
export const mockUsers: User[] = [];
/** @deprecated Use fetchLiveProjects() from @/lib/live-api */
export const mockProjects: Project[] = [];
/** @deprecated Use fetchLiveBookings() from @/lib/live-api */
export const mockBookings: Booking[] = [];
/** @deprecated Use fetchLiveMaintenance() from @/lib/live-api */
export const mockMaintenance: Maintenance[] = [];
/** @deprecated Use fetchLiveNotifications() from @/lib/live-api */
export const mockNotifications: Notification[] = [];

/** Spaces config — kept as static reference data */
export const spaces = [
  {
    id: "SPC-001",
    name: "Fblock Hall",
    type: "Conference Hall",
    capacity: 800,
    floor: "1st",
    building: "Block F",
  },
  {
    id: "SPC-002",
    name: "A2block Hall",
    type: "Conference Hall",
    capacity: 110,
    floor: "1st",
    building: "Block A2",
  },
];

export const analyticsData = {
  mttr: [{ month: "Jan", hours: 4 }],
  requestVolume: [{ month: "Jan", count: 10 }],
  statusDistribution: [{ name: "Done", value: 10, color: "green" }],
  spaceUtilization: [{ area: "A", utilization: 80 }],
  costTracking: [{ month: "Jan", budget: 1000, actual: 950 }],
};
