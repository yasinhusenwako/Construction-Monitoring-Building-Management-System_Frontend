import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SupervisorDashboard } from '@/views/supervisor/SupervisorDashboard';

export default function SupervisorPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <SupervisorDashboard />
    </ProtectedRoute>
  );
}
