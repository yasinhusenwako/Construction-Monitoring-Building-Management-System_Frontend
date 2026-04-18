import { expect, test } from "@playwright/test";

import {
  canTransition,
  getAllowedTransitions,
  type WorkflowModule,
  type WorkflowRole,
  type WorkflowStatus,
} from "../../src/lib/workflow";

test.describe("Workflow Logic", () => {
  const modules: WorkflowModule[] = ["maintenance", "project", "booking"];
  const roles: WorkflowRole[] = ["admin", "supervisor", "professional", "user"];
  const statuses: WorkflowStatus[] = [
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

  test("allows only valid transitions for each module", () => {
    modules.forEach((module) => {
      statuses.forEach((from) => {
        statuses.forEach((to) => {
          roles.forEach((role) => {
            const allowed = getAllowedTransitions(role, from, module);
            const can = canTransition(role, from, to, module);

            expect(can).toBe(allowed.includes(to));
          });
        });
      });
    });
  });

  test("rejects invalid modules", () => {
    expect(
      canTransition(
        "admin",
        "Submitted",
        "Under Review",
        "invalid" as unknown as WorkflowModule,
      ),
    ).toBe(false);
  });

  test("rejects transitions when the role is not the owner", () => {
    expect(
      canTransition("user", "Submitted", "Under Review", "maintenance"),
    ).toBe(false);
    expect(getAllowedTransitions("user", "Submitted", "maintenance")).toEqual(
      [],
    );
  });

  test("logs a warning for invalid transitions", () => {
    const originalWarn = console.warn;
    const warnings: unknown[][] = [];

    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };

    try {
      canTransition("user", "Submitted", "Under Review", "maintenance");
      expect(warnings.length).toBeGreaterThan(0);
    } finally {
      console.warn = originalWarn;
    }
  });
});
