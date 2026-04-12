export type WorkflowRole = "user" | "admin" | "supervisor" | "professional";

export type WorkflowStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned to Supervisor"
  | "WorkOrder Created"
  | "Assigned to Professional"
  | "In Progress"
  | "Completed"
  | "Reviewed"
  | "Approved"
  | "Rejected"
  | "Closed";

export type DisplayStatus = WorkflowStatus | "In Process";

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  "Submitted",
  "Under Review",
  "Assigned to Supervisor",
  "WorkOrder Created",
  "Assigned to Professional",
  "In Progress",
  "Completed",
  "Reviewed",
  "Approved",
  "Rejected",
  "Closed",
];

export const FINAL_STATUSES: WorkflowStatus[] = [
  "Approved",
  "Rejected",
  "Closed",
];

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  Submitted: ["Under Review"],
  "Under Review": ["Assigned to Supervisor"],
  "Assigned to Supervisor": ["WorkOrder Created"],
  "WorkOrder Created": ["Assigned to Professional"],
  "Assigned to Professional": ["In Progress"],
  "In Progress": ["Completed"],
  Completed: ["Reviewed"],
  Reviewed: ["Approved", "Rejected"],
  Approved: ["Closed"],
  Rejected: ["Closed"],
  Closed: [],
};

export const WORKFLOW_OWNER: Record<WorkflowStatus, WorkflowRole> = {
  Submitted: "admin",
  "Under Review": "admin",
  "Assigned to Supervisor": "supervisor",
  "WorkOrder Created": "supervisor",
  "Assigned to Professional": "professional",
  "In Progress": "professional",
  Completed: "supervisor",
  Reviewed: "admin",
  Approved: "admin",
  Rejected: "admin",
  Closed: "admin",
};

export function canTransition(
  role: WorkflowRole,
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  return (
    WORKFLOW_OWNER[from] === role && WORKFLOW_TRANSITIONS[from].includes(to)
  );
}

export function getAllowedTransitions(
  role: WorkflowRole,
  from: WorkflowStatus,
): WorkflowStatus[] {
  if (WORKFLOW_OWNER[from] !== role) return [];
  return WORKFLOW_TRANSITIONS[from];
}

export function getUserFacingStatus(
  status: WorkflowStatus,
  role?: WorkflowRole,
): DisplayStatus {
  if (role === "user" && !FINAL_STATUSES.includes(status)) {
    return "In Process";
  }
  return status;
}

export type WorkflowItem = {
  requestedBy?: string;
  supervisorId?: string;
  assignedTo?: string;
};

export function canViewItem(
  role: WorkflowRole | undefined,
  item: WorkflowItem,
  userId?: string,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (!userId) return false;
  if (role === "user") return item.requestedBy === userId;
  if (role === "supervisor") return item.supervisorId === userId;
  return item.assignedTo === userId;
}
