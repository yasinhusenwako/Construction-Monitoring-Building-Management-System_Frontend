import {
  adminAssignProfessional,
  adminAssignRequest,
  adminDecision,
  adminStartReview,
  professionalUpdateTaskStatus,
  supervisorAssignProfessional,
  supervisorReviewRequest,
} from "@/lib/live-api";
import {
  canTransition,
  type WorkflowModule,
  type WorkflowRole,
  type WorkflowStatus,
} from "@/lib/workflow";

export type WorkflowActionModule = "PROJECT" | "BOOKING" | "MAINTENANCE";

export type WorkflowActionUpdates = {
  supervisorId?: string;
  divisionId?: string;
  assignedTo?: string;
  notes?: string;
};

export type WorkflowActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "transition" | "validation" | "unsupported" | "request";
      message: string;
    };

type WorkflowActionFailureReason = Extract<
  WorkflowActionResult,
  { ok: false }
>["reason"];

function resolveWorkflowModule(module: WorkflowActionModule): WorkflowModule {
  if (module === "PROJECT") return "project";
  if (module === "BOOKING") return "booking";
  return "maintenance";
}

function fail(
  reason: WorkflowActionFailureReason,
  message: string,
): WorkflowActionResult {
  return { ok: false, reason, message };
}

export async function executeWorkflowAction(params: {
  module: WorkflowActionModule;
  businessId: string;
  requestId?: number;
  currentStatus: WorkflowStatus;
  nextStatus: WorkflowStatus;
  actorRole: WorkflowRole;
  extraUpdates?: WorkflowActionUpdates;
  token?: string;
}): Promise<WorkflowActionResult> {
  const workflowModule = resolveWorkflowModule(params.module);
  // Token is automatically sent via httpOnly cookie

  if (
    !canTransition(
      params.actorRole,
      params.currentStatus,
      params.nextStatus,
      workflowModule,
    )
  ) {
    return fail("transition", "Transition not allowed.");
  }

  try {
    if (params.actorRole === "admin") {
      if (params.nextStatus === "Assigned to Supervisor") {
        if (params.module !== "MAINTENANCE") {
          return fail(
            "unsupported",
            "Supervisor assignment is only supported for maintenance.",
          );
        }

        if (!params.extraUpdates?.divisionId) {
          return fail(
            "validation",
            "Division is required for this assignment.",
          );
        }

        await adminAssignRequest({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
          divisionId: params.extraUpdates.divisionId,
          supervisorId: params.extraUpdates.supervisorId,
        });
        return { ok: true };
      }

      if (params.nextStatus === "Under Review") {
        await adminStartReview({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
        });
        return { ok: true };
      }

      // Admin assigns professional for PROJECT and BOOKING only
      // MAINTENANCE is handled by supervisor
      if (
        params.nextStatus === "Assigned to Professionals" &&
        params.module !== "MAINTENANCE"
      ) {
        if (!params.extraUpdates?.assignedTo) {
          return fail(
            "validation",
            "A professional must be selected before assigning this request.",
          );
        }

        await adminAssignProfessional({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
          professionalId: params.extraUpdates.assignedTo,
        });
        return { ok: true };
      }

      if (
        params.nextStatus === "Approved" ||
        params.nextStatus === "Rejected" ||
        params.nextStatus === "Closed"
      ) {
        const action =
          params.nextStatus === "Approved"
            ? "approve"
            : params.nextStatus === "Rejected"
              ? "reject"
              : "close";

        await adminDecision({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
          action,
        });
        return { ok: true };
      }
    }

    if (params.actorRole === "supervisor") {
      if (params.nextStatus === "WorkOrder Created") {
        return { ok: true };
      }

      if (params.nextStatus === "Assigned to Professionals") {
        if (!params.extraUpdates?.assignedTo) {
          return fail(
            "validation",
            "A professional must be selected before assigning this request.",
          );
        }

        const instructions = params.extraUpdates?.notes?.trim();
        if (!instructions) {
          return fail(
            "validation",
            "Instructions are required before assigning to a professional.",
          );
        }

        await supervisorAssignProfessional({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
          professionalId: params.extraUpdates.assignedTo,
          instructions,
        });
        return { ok: true };
      }

      if (params.nextStatus === "Reviewed") {
        await supervisorReviewRequest({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
        });
        return { ok: true };
      }
    }

    if (params.actorRole === "professional") {
      if (
        params.nextStatus === "In Progress" ||
        params.nextStatus === "Completed"
      ) {
        await professionalUpdateTaskStatus({
          module: params.module,
          businessId: params.businessId,
          requestId: params.requestId,
          status: params.nextStatus,
        });
        return { ok: true };
      }
    }

    return fail(
      "unsupported",
      `Unsupported workflow action: ${params.actorRole} -> ${params.nextStatus}`,
    );
  } catch (error) {
    return fail(
      "request",
      error instanceof Error
        ? error.message
        : "Failed to perform workflow action.",
    );
  }
}
