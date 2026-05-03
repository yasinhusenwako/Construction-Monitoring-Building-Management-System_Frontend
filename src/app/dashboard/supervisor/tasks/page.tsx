import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TaskManagementPage } from '@/views/supervisor/TaskManagementPage';

export default function SupervisorTasksPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <TaskManagementPage />
    </ProtectedRoute>
  );
}
