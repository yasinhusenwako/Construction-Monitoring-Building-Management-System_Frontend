"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getUserFacingStatus, WorkflowRole } from "@/lib/workflow";
import { useDashboardData } from "@/hooks/use-queries";
import { AdminDashboard } from "./AdminDashboard";
import { AsyncState } from "@/components/common/AsyncState";
import {
  FolderOpen,
  Calendar,
  Wrench,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Activity,
  Plus,
  Hammer,
} from "lucide-react";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all text-left w-full group"
    >
      <div className="flex items-start justify-between">
        <div
          className={`p-2.5 rounded-xl`}
          style={{ background: color + "15" }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <ArrowRight
          size={14}
          className="text-muted-foreground group-hover:text-[#1A3580] transition-colors"
        />
      </div>
      <p className="text-2xl font-bold mt-3" style={{ color }}>
        {value}
      </p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

export function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const role = currentUser?.role;
  const uid = currentUser?.id;

  // Token is automatically sent via httpOnly cookie
  const { data, isLoading, isError, error, refetch } = useDashboardData();
  const {
    projects,
    bookings,
    maintenance: maintenanceItems,
    notifications,
  } = data;

  // Compute stats
  const myProjects = projects.filter((p) => p.requestedBy === uid);
  const myBookings = bookings.filter((b) => b.requestedBy === uid);
  const myMaintenance = maintenanceItems.filter((m) => m.requestedBy === uid);

  const displayCriticalAlerts =
    role === "user"
      ? myMaintenance.filter(
          (m) => m.priority === "Critical" && m.status !== "Closed",
        )
      : maintenanceItems.filter(
          (m) => m.priority === "Critical" && m.status !== "Closed",
        );

  const displayUpcomingBookings =
    role === "user"
      ? myBookings.filter((b) => b.status === "Approved")
      : bookings.filter((b) => b.status === "Approved");

  const myActivities = [
    ...myProjects.map((p) => ({
      ...p,
      type: "Project" as const,
      path: `/dashboard/projects/${p.id}`,
    })),
    ...myBookings.map((b) => ({
      ...b,
      type: "Booking" as const,
      path: `/dashboard/bookings`,
    })),
    ...myMaintenance.map((m) => ({
      ...m,
      type: "Maintenance" as const,
      path: `/dashboard/maintenance/${m.id}`,
    })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const allSystemTasks = [...maintenanceItems, ...projects, ...bookings];

  const assignedTasks = allSystemTasks.filter(
    (m: { assignedTo?: string }) => m.assignedTo === uid,
  );

  const supervisorTasks = allSystemTasks.filter(
    (m: { supervisorId?: string; divisionId?: string; status: string }) =>
      m.supervisorId === uid ||
      (currentUser?.divisionId &&
        m.divisionId === currentUser?.divisionId &&
        ["Assigned to Supervisor", "WorkOrder Created"].includes(m.status) &&
        !m.supervisorId),
  );

  const unreadNotifs = notifications.filter((n) => n.userId === uid && !n.read);

  const myRecentActivity = [
    ...myProjects.map((p) => ({
      id: p.id,
      type: "Project" as const,
      title: p.title,
      status: p.status,
      date: p.updatedAt,
      path: `/dashboard/projects/${p.id}`,
    })),
    ...myBookings.map((b) => ({
      id: b.id,
      type: "Booking" as const,
      title: b.title,
      status: b.status,
      date: b.updatedAt,
      path: `/dashboard/bookings`,
    })),
    ...myMaintenance.map((m) => ({
      id: m.id,
      type: "Maintenance" as const,
      title: m.title,
      status: m.status,
      date: m.updatedAt,
      path: `/dashboard/maintenance/${m.id}`,
    })),
  ];

  const allRecentActivity = [
    ...projects.map((p) => ({
      id: p.id,
      type: "Project",
      title: p.title,
      status: p.status,
      date: p.updatedAt,
      path: `/dashboard/projects/${p.id}`,
    })),
    ...bookings.map((b) => ({
      id: b.id,
      type: "Booking",
      title: b.title,
      status: b.status,
      date: b.updatedAt,
      path: `/dashboard/bookings`,
    })),
    ...maintenanceItems.map((m) => ({
      id: m.id,
      type: "Maintenance",
      title: m.title,
      status: m.status,
      date: m.updatedAt,
      path: `/dashboard/maintenance/${m.id}`,
    })),
  ];

  const recentActivity = (
    role === "user" ? myRecentActivity : allRecentActivity
  )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("greeting.morning");
    if (h < 17) return t("greeting.afternoon");
    return t("greeting.evening");
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AsyncState
          title={t("loading.dashboard")}
          state="loading"
          message={t("loading.pleaseWait")}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <AsyncState
          title={t("error.loadFailed")}
          state="error"
          message={error instanceof Error ? error.message : t("error.unknown")}
          actionLabel={t("action.retry")}
          onAction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin gets its own full Master Control dashboard */}
      {role === "admin" && (
        <AdminDashboard adminName={currentUser?.name || "Administrator"} />
      )}

      {/* Supervisor gets redirected to supervisor dashboard */}
      {role === "supervisor" && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[#0E2271]">
                {getGreeting()}, {currentUser?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {t("dashboard.divisionSupervisor")} ·{" "}
                {t("dashboard.manageAssignedTasks")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Wrench size={20} />}
              label={t("dashboard.assignedToDivision")}
              value={supervisorTasks.length}
              sub={t("dashboard.totalAssignedTasks")}
              color="#1A3580"
              onClick={() => router.push("/dashboard/supervisor")}
            />
            <StatCard
              icon={<Activity size={20} />}
              label={t("dashboard.activeOperations")}
              value={
                supervisorTasks.filter((m) =>
                  ["Assigned to Professional", "In Progress"].includes(
                    m.status,
                  ),
                ).length
              }
              sub={t("dashboard.inExecution")}
              color="#EA580C"
              onClick={() => router.push("/dashboard/supervisor")}
            />
            <StatCard
              icon={<CheckCircle size={20} />}
              label={t("dashboard.pendingReview")}
              value={
                supervisorTasks.filter((m) => m.status === "Completed").length
              }
              sub={t("dashboard.awaitingReview")}
              color="#0D9488"
              onClick={() => router.push("/dashboard/supervisor")}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label={t("dashboard.processed")}
              value={
                supervisorTasks.filter((m) => m.status === "Reviewed").length
              }
              sub={t("dashboard.processed")}
              color="#10B981"
              onClick={() => router.push("/dashboard/supervisor")}
            />
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm text-center">
            <p className="text-muted-foreground text-sm mb-3">
              {t("dashboard.goFullSupervisor")}
            </p>

            <button
              onClick={() => router.push("/dashboard/supervisor")}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
              }}
            >
              {t("dashboard.openSupervisor")} →
            </button>
          </div>
        </div>
      )}

      {/* Non-admin, non-supervisor shared header */}
      {role !== "admin" && role !== "supervisor" && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[#0E2271]">
                {getGreeting()}, {currentUser?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {role === "user" && t("dashboard.trackRequests")}
                {role === "professional" && t("dashboard.assignedTasksQueue")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-2">
              <Clock size={14} />
              <span>
                {new Date().toLocaleDateString(
                  t("lang.code") === "am" ? "am-ET" : "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </div>
          </div>

          {/* Stats Grid - Role Based */}
          {role === "user" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<FolderOpen size={20} />}
                label={t("dashboard.myProjects")}
                value={myProjects.length}
                sub={`${myProjects.filter((p) => p.status === "In Progress").length} ${t("dashboard.inProgress")}`}
                color="#1A3580"
                onClick={() => router.push("/dashboard/projects")}
              />
              <StatCard
                icon={<Calendar size={20} />}
                label={t("dashboard.myBookings")}
                value={myBookings.length}
                sub={`${myBookings.filter((b) => b.status === "Approved").length} ${t("dashboard.confirmed")}`}
                color="#7C3AED"
                onClick={() => router.push("/dashboard/bookings")}
              />
              <StatCard
                icon={<Wrench size={20} />}
                label={t("dashboard.myMaintenance")}
                value={myMaintenance.length}
                sub={`${myMaintenance.filter((m) => m.status === "Closed").length} ${t("dashboard.resolved")}`}
                color="#CC1F1A"
                onClick={() => router.push("/dashboard/maintenance")}
              />
              <StatCard
                icon={<Bell size={20} />}
                label={t("dashboard.unreadAlerts")}
                value={unreadNotifs.length}
                sub={t("notifications.title")}
                color="#F5B800"
                onClick={() => router.push("/dashboard/notifications")}
              />
            </div>
          )}

          {role === "professional" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<ClipboardList size={20} />}
                label={t("dashboard.assignedTasks")}
                value={assignedTasks.length}
                sub={t("dashboard.totalAssigned")}
                color="#1A3580"
                onClick={() => router.push("/dashboard/updates")}
              />
              <StatCard
                icon={<Activity size={20} />}
                label={t("dashboard.activeRepairs")}
                value={
                  assignedTasks.filter((m: any) => m.status === "In Progress")
                    .length
                }
                sub={t("dashboard.currentlyWorking")}
                color="#CC1F1A"
                onClick={() => router.push("/dashboard/updates")}
              />
              <StatCard
                icon={<CheckCircle size={20} />}
                label={t("dashboard.completedTasks")}
                value={
                  assignedTasks.filter((m: any) =>
                    [
                      "Completed",
                      "Reviewed",
                      "Approved",
                      "Rejected",
                      "Closed",
                    ].includes(m.status),
                  ).length
                }
                sub={t("dashboard.thisMonth")}
                color="#16A34A"
                onClick={() => router.push("/dashboard/updates")}
              />
              <StatCard
                icon={<Bell size={20} />}
                label={t("dashboard.notifications")}
                value={unreadNotifs.length}
                sub={t("dashboard.unreadAlertsNotif")}
                color="#F5B800"
                onClick={() => router.push("/dashboard/notifications")}
              />
            </div>
          )}

          {/* Quick Actions - user only */}
          {role === "user" && (
            <div>
              <h2 className="text-[#0E2271] mb-3">
                {t("dashboard.quickActions")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    label: t("dashboard.submitProjectRequest"),
                    desc: t("module.projects"),
                    path: "/dashboard/projects/new",
                    color: "#1A3580",
                    icon: <Hammer size={24} />,
                  },
                  {
                    label: t("dashboard.bookASpace"),
                    desc: t("module.bookings"),
                    path: "/dashboard/bookings/new",
                    color: "#7C3AED",
                    icon: <Calendar size={24} />,
                  },
                  {
                    label: t("dashboard.reportMaintenance"),
                    desc: t("module.maintenance"),
                    path: "/dashboard/maintenance/new",
                    color: "#CC1F1A",
                    icon: <Wrench size={24} />,
                  },
                ].map((a) => (
                  <button
                    key={a.path}
                    onClick={() => router.push(a.path)}
                    className="bg-white border-2 border-dashed rounded-xl p-4 hover:shadow-md transition-all text-left group"
                    style={{ borderColor: a.color + "40" }}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <p
                      className="font-semibold text-sm mt-2"
                      style={{ color: a.color }}
                    >
                      {a.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-[#0E2271] text-base">
                  {t("dashboard.recentActivity")}
                </h2>
                <button
                  onClick={() => router.push("/dashboard/projects")}
                  className="text-xs text-[#1A3580] hover:underline flex items-center gap-1"
                >
                  {t("action.viewAll")} <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-border">
                {recentActivity.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(item.path)}
                    className="px-5 py-3 hover:bg-secondary/50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                        item.type === "Project"
                          ? "bg-blue-50 text-[#1A3580]"
                          : item.type === "Booking"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {item.type === "Project" ? (
                        <Hammer size={16} />
                      ) : item.type === "Booking" ? (
                        <Calendar size={16} />
                      ) : (
                        <Wrench size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.id} · {item.date.split("T")[0]}
                      </p>
                    </div>
                    <StatusBadge
                      status={getUserFacingStatus(
                        item.status,
                        role as WorkflowRole,
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Critical Alerts */}
              <div className="bg-white rounded-xl border border-border shadow-sm">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#CC1F1A]" />{" "}
                    {t("dashboard.criticalAlerts")}
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {displayCriticalAlerts.map((m) => (
                    <div
                      key={m.id}
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${m.id}`)
                      }
                      className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      <p className="text-xs font-semibold text-red-800">
                        {m.id}
                      </p>
                      <p className="text-sm text-red-900 font-medium mt-0.5 line-clamp-1">
                        {m.title}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <StatusBadge
                          status={getUserFacingStatus(
                            m.status,
                            role as WorkflowRole,
                          )}
                        />
                        <span className="text-xs text-red-600">
                          {m.location}
                        </span>
                      </div>
                    </div>
                  ))}
                  {displayCriticalAlerts.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-3">
                      {t("dashboard.noCriticalAlerts")}
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming Bookings */}
              <div className="bg-white rounded-xl border border-border shadow-sm">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-[#0E2271]">
                    {t("dashboard.upcomingBookings")}
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {displayUpcomingBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-purple-50 border border-purple-100 rounded-lg"
                    >
                      <p className="text-xs font-medium text-purple-800">
                        {b.date} · {b.startTime}-{b.endTime}
                      </p>
                      <p className="text-sm font-semibold text-purple-900 mt-0.5 line-clamp-1">
                        {b.space}
                      </p>
                      <p className="text-xs text-purple-700">
                        {b.attendees} {t("dashboard.attendees")}
                      </p>
                    </div>
                  ))}
                  {displayUpcomingBookings.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-3">
                      {t("dashboard.noUpcomingBookings")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
