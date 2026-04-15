"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MyRequestsPage } from '@/views/user/MyRequestsPage';

export default function RequestsPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <MyRequestsPage />
    </ProtectedRoute>
  );
}
