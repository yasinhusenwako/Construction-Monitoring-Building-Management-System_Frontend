import { UserRole } from "@/types/models";
import { WorkflowStatus } from "./workflow";

/**
 * Backend role string to frontend UserRole type
 */
export type BackendRole = "ADMIN" | "USER" | "SUPERVISOR" | "PROFESSIONAL";

export function mapRoleFromBackend(role: string | BackendRole): UserRole {
  const normalized = role?.toUpperCase();
  switch (normalized) {
    case "ADMIN":
      return "admin";
    case "SUPERVISOR":
      return "supervisor";
    case "PROFESSIONAL":
      return "professional";
    default:
      return "user";
  }
}

/**
 * Frontend UserRole type to backend role string
 */
export function mapRoleToBackend(role: UserRole): BackendRole {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "supervisor":
      return "SUPERVISOR";
    case "professional":
      return "PROFESSIONAL";
    default:
      return "USER";
  }
}

/**
 * Map backend status strings to frontend WorkflowStatus
 */
export function mapStatusFromBackend(status: string): WorkflowStatus {
  // Most backend statuses match frontend labels but with different casing or underscores
  const normalized = status?.replace(/_/g, " ").toLowerCase();
  
  const statusMap: Record<string, WorkflowStatus> = {
    "submitted": "Submitted",
    "under review": "Under Review",
    "assigned to supervisor": "Assigned to Supervisor",
    "assigned to professionals": "Assigned to Professionals",
    "in progress": "In Progress",
    "completed": "Completed",
    "reviewed": "Reviewed",
    "approved": "Approved",
    "rejected": "Rejected",
    "closed": "Closed",
  };

  return statusMap[normalized] || "Submitted";
}

/**
 * Map frontend WorkflowStatus to backend status strings (UPPER_SNAKE_CASE)
 */
export function mapStatusToBackend(status: WorkflowStatus): string {
  return status.toUpperCase().replace(/\s+/g, "_");
}
