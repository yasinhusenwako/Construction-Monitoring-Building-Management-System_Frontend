"use client";

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AllRequestsPage } from '@/views/admin/AllRequestsPage';

export default function AdminRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AllRequestsPage />
    </ProtectedRoute>
  );
}
