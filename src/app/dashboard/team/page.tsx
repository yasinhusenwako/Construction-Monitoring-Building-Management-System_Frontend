"use client";

import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { TeamOverviewPage } from "../../pages/supervisor/TeamOverviewPage";

export default function TeamPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <TeamOverviewPage />
    </ProtectedRoute>
  );
}
