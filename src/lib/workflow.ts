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

export type WorkflowModule = "project" | "booking" | "maintenance";

type WorkflowDefinition = {
  transitions: Partial<Record<WorkflowStatus, WorkflowStatus[]>>;
  owner: Partial<Record<WorkflowStatus, WorkflowRole>>;
};

// Centralized workflow configuration for all modules
export const WORKFLOW_CONFIG: Record<WorkflowModule, WorkflowDefinition> = {
  maintenance: {
    transitions: {
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
    },
    owner: {
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
    },
  },
  project: {
    transitions: {
      Submitted: ["Under Review"],
      "Under Review": ["Assigned to Professional"],
      "Assigned to Professional": ["In Progress"],
      "In Progress": ["Completed"],
      Completed: ["Approved", "Rejected"],
      Approved: ["Closed"],
      Rejected: ["Closed"],
      Closed: [],
      // Not used in project: "Assigned to Supervisor", "WorkOrder Created", "Reviewed"
    },
    owner: {
      Submitted: "admin",
      "Under Review": "admin",
      "Assigned to Professional": "professional",
      "In Progress": "professional",
      Completed: "admin",
      Approved: "admin",
      Rejected: "admin",
      Closed: "admin",
    },
  },
  booking: {
    transitions: {
      Submitted: ["Under Review"],
      "Under Review": ["Assigned to Professional"],
      "Assigned to Professional": ["In Progress"],
      "In Progress": ["Completed"],
      Completed: ["Approved", "Rejected"],
      Approved: ["Closed"],
      Rejected: ["Closed"],
      Closed: [],
      // Not used in booking: "Assigned to Supervisor", "WorkOrder Created", "Reviewed"
    },
    owner: {
      Submitted: "admin",
      "Under Review": "admin",
      "Assigned to Professional": "professional",
      "In Progress": "professional",
      Completed: "admin",
      Approved: "admin",
      Rejected: "admin",
      Closed: "admin",
    },
  },
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
  module: WorkflowModule = "maintenance",
): boolean {
  const config = WORKFLOW_CONFIG[module];
  if (!config) {
    console.warn(
      `[Workflow] Invalid module: ${module} for transition from '${from}' to '${to}' by role '${role}'`,
    );
    return false;
  }
  const owner = config.owner[from];
  const allowedTransitions = config.transitions[from] ?? [];
  const isOwner = owner === role;
  const isAllowed = allowedTransitions.includes(to);
  if (!isOwner || !isAllowed) {
    console.warn(
      `[Workflow] Invalid transition: ${module} | ${role} cannot transition from '${from}' to '${to}'. Owner: ${owner}, Allowed: ${allowedTransitions.join(", ")}`,
    );
  }
  return isOwner && isAllowed;
}

export function getAllowedTransitions(
  role: WorkflowRole,
  from: WorkflowStatus,
  module: WorkflowModule = "maintenance",
): WorkflowStatus[] {
  const config = WORKFLOW_CONFIG[module];
  if (!config) return [];
  if (config.owner[from] !== role) return [];
  return config.transitions[from] ?? [];
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
