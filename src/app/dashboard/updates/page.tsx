"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProgressUpdatesPage } from '@/views/professional/ProgressUpdatesPage';

export default function UpdatesPage() {
  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <ProgressUpdatesPage />
    </ProtectedRoute>
  );
}
