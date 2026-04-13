/**
 * Dashboard layout - wraps all protected routes with AppLayout
 */

import { AppLayout } from "../components/layout/AppLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
