import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { SupervisorDashboard } from "../../pages/supervisor/SupervisorDashboard";

export default function SupervisorPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <SupervisorDashboard />
    </ProtectedRoute>
  );
}
