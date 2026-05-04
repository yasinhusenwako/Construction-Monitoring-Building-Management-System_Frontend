export type WorkflowRole = "user" | "admin" | "supervisor" | "professional";

export type WorkflowStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned to Supervisor"
  | "Assigned to Professionals"
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
  "Assigned to Professionals",
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
      "Assigned to Supervisor": ["Assigned to Professionals"],
      "Assigned to Professionals": ["In Progress"],
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
      "Assigned to Professionals": "supervisor",
      "In Progress": "professional",
      Completed: "professional",
      Reviewed: "supervisor",
      Approved: "admin",
      Rejected: "admin",
      Closed: "admin",
    },
  },
  project: {
    transitions: {
      Submitted: ["Under Review"],
      "Under Review": ["Assigned to Professionals"],
      "Assigned to Professionals": ["In Progress"],
      "In Progress": ["Completed"],
      Completed: ["Approved", "Rejected"],
      Approved: ["Closed"],
      Rejected: ["Closed"],
      Closed: [],
    },
    owner: {
      Submitted: "admin",
      "Under Review": "admin",
      "Assigned to Professionals": "admin",
      "In Progress": "professional",
      Completed: "professional",
      Approved: "admin",
      Rejected: "admin",
      Closed: "admin",
    },
  },
  booking: {
    transitions: {
      Submitted: ["Under Review"],
      "Under Review": ["Assigned to Professionals"],
      "Assigned to Professionals": ["In Progress"],
      "In Progress": ["Completed"],
      Completed: ["Approved", "Rejected"],
      Approved: ["Closed"],
      Rejected: ["Closed"],
      Closed: [],
    },
    owner: {
      Submitted: "admin",
      "Under Review": "admin",
      "Assigned to Professionals": "admin",
      "In Progress": "professional",
      Completed: "professional",
      Approved: "admin",
      Rejected: "admin",
      Closed: "admin",
    },
  },
};

export const WORKFLOW_OWNER: Record<WorkflowStatus, WorkflowRole> = {
  Submitted: "admin",
  "Under Review": "admin",
  "Assigned to Supervisor": "admin",
  "Assigned to Professionals": "supervisor",
  "In Progress": "professional",
  Completed: "professional",
  Reviewed: "supervisor",
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
  const fromOwner = config.owner[from];
  const toOwner = config.owner[to];
  const allowedTransitions = config.transitions[from] ?? [];

  // DEBUG: Log the exact values
  console.log("[Workflow DEBUG]", {
    module,
    role,
    from,
    to,
    fromOwner,
    toOwner,
    allowedTransitions,
    "to in allowedTransitions": allowedTransitions.includes(to),
    "exact match check": allowedTransitions.map((t) => ({
      status: t,
      matches: t === to,
      length: t.length,
      toLength: to.length,
    })),
  });

  // A transition can be triggered either by the current stage owner
  // (handoff action) or the next stage owner (self-progress action).
  const isOwner = fromOwner === role || toOwner === role;
  const isAllowed = allowedTransitions.includes(to);
  if (!isOwner || !isAllowed) {
    console.warn(
      `[Workflow] Invalid transition: ${module} | ${role} cannot transition from '${from}' to '${to}'. FromOwner: ${fromOwner}, ToOwner: ${toOwner}, Allowed: ${allowedTransitions.join(", ")}`,
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
  const candidates = config.transitions[from] ?? [];
  return candidates.filter(
    (to) => config.owner[from] === role || config.owner[to] === role,
  );
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
  divisionId?: string;
};

export function canViewItem(
  role: WorkflowRole | undefined,
  item: WorkflowItem,
  userId?: string,
  userDivisionId?: string,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (!userId) return false;

  // ANY role can view a request they created
  // Note: USR-000 means no valid requestedBy, so we should show these to users
  if (item.requestedBy === userId) return true;

  // For users, also show items with no valid requestedBy (USR-000)
  // This handles legacy data or items created before user tracking
  if (role === "user" && item.requestedBy === "USR-000") return true;

  if (role === "user") return false; // already checked requestedBy

  // Supervisors can view items assigned to them OR items in their division
  if (role === "supervisor") {
    return (
      item.supervisorId === userId ||
      (!!userDivisionId && item.divisionId === userDivisionId)
    );
  }

  return item.assignedTo === userId;
}

/**
 * Get the list of statuses that should be visible to a specific role in filter tabs
 */
export function getVisibleStatusesForRole(
  role: WorkflowRole | undefined,
  module: WorkflowModule = "maintenance",
): WorkflowStatus[] {
  if (!role) return [];

  // Admin sees different statuses based on module
  if (role === "admin") {
    if (module === "maintenance") {
      // For maintenance, admin sees all statuses (full workflow visibility)
      return WORKFLOW_STATUSES;
    } else {
      // For projects and bookings, exclude supervisor-only stages that don't exist
      return WORKFLOW_STATUSES.filter(
        (status) =>
          status !== "Assigned to Supervisor" && status !== "WorkOrder Created",
      );
    }
  }

  // User sees simplified statuses
  if (role === "user") {
    return ["Submitted", "Approved", "Rejected", "Closed"];
  }

  // Supervisor sees supervisor-relevant statuses
  if (role === "supervisor") {
    if (module === "maintenance") {
      return [
        "Assigned to Supervisor",
        "WorkOrder Created",
        "Assigned to Professionals",
        "In Progress",
        "Completed",
        "Reviewed",
        "Approved",
        "Rejected",
        "Closed",
      ];
    } else {
      // For projects and bookings, supervisors don't have specific workflow stages
      return [
        "Assigned to Professionals",
        "In Progress",
        "Completed",
        "Approved",
        "Rejected",
        "Closed",
      ];
    }
  }

  // Professional sees task-relevant statuses
  if (role === "professional") {
    return [
      "Assigned to Professionals",
      "In Progress",
      "Completed",
      "Reviewed",
      "Approved",
      "Rejected",
      "Closed",
    ];
  }

  return WORKFLOW_STATUSES;
}
