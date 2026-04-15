"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TeamOverviewPage } from '@/views/supervisor/TeamOverviewPage';

export default function TeamPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <TeamOverviewPage />
    </ProtectedRoute>
  );
}
