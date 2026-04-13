"use client";

import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { DivisionsPage } from "../../pages/admin/DivisionsPage";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DivisionsPage />
    </ProtectedRoute>
  );
}
