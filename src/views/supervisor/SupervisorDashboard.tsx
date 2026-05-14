"use client";

import { useEffect, useMemo, useState } from "react";
import { exportToCSV } from "@/lib/exportUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { divisions } from "@/types/models";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveUsers,
} from "@/lib/live-api";
import { AsyncState } from "@/components/common/AsyncState";
import {
  ClipboardList,
  AlertTriangle,
  Activity,
  CheckCircle,
  Send,
  Download,
} from "lucide-react";

function normalizeDivisionId(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase().replace("_", "-");
  if (/^DIV-\d+$/.test(upper)) {
    return `DIV-${upper.slice(4).padStart(3, "0")}`;
  }
  if (/^DIV\d+$/.test(upper)) {
    return `DIV-${upper.slice(3).padStart(3, "0")}`;
  }
  if (/^\d+$/.test(upper)) {
    return `DIV-${upper.padStart(3, "0")}`;
  }
  return upper;
}

const statusTranslationKeys: Record<string, string> = {
  Submitted: "status.submitted",
  "Assigned to Supervisor": "status.assignedToSupervisor",
  "WorkOrder Created": "status.workOrderCreated",
  "Assigned to Professionals": "status.assignedToProfessional",
  "In Progress": "status.inProgress",
  Completed: "status.completed",
  Reviewed: "status.reviewed",
  Approved: "status.approved",
  Rejected: "status.rejected",
  Closed: "status.closed",
};

export function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const uid = currentUser?.id || "";

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translateStatus = (status: string) =>
    statusTranslationKeys[status] ? t(statusTranslationKeys[status]) : status;
  const translatePriority = (priority?: string) =>
    priority ? t(`priority.${priority.toLowerCase()}` as any) : "";

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        const [maintenance, projects, bookings, liveUsers] = await Promise.all([
          fetchLiveMaintenance(),
          fetchLiveProjects(),
          fetchLiveBookings(),
          fetchLiveUsers(),
        ]);
        setAllTasks([...maintenance, ...projects, ...bookings]);
        setUsers(liveUsers);
      } catch (error) {
        console.error("Failed to refresh supervisor tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    refresh();

    const refreshInterval = setInterval(refresh, 15000);
    return () => clearInterval(refreshInterval);
  }, []);

  const userDivision = currentUser?.divisionId;
  const normalizedUserDivision = normalizeDivisionId(userDivision);
  const normalizedDivisionNumber = normalizedUserDivision
    ? String(parseInt(normalizedUserDivision.replace("DIV-", ""), 10))
    : undefined;
  const divisionName =
    divisions.find(
      (d) =>
        d.id === userDivision ||
        (normalizedDivisionNumber && d.id === normalizedDivisionNumber),
    )?.name || t("supervisor.divisionFallback");

  const supervisorTrackedStatuses = [
    "Submitted",
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professionals",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",
    "Rejected",
    "Closed",
  ];

  const myTasks = allTasks.filter((task) => {
    const matchesSupervisor = task.supervisorId === uid;
    const matchesDivision =
      normalizedUserDivision &&
      normalizeDivisionId(task.divisionId) === normalizedUserDivision &&
      supervisorTrackedStatuses.includes(task.status);
    return matchesSupervisor || matchesDivision;
  });

  const pendingAssignment = myTasks.filter((task) =>
    ["Assigned to Supervisor", "WorkOrder Created"].includes(task.status),
  );
  const withProfessionals = myTasks.filter((task) =>
    ["Assigned to Professionals", "In Progress"].includes(task.status),
  );
  const completedTasks = myTasks.filter((task) => task.status === "Completed");
  const reviewedTasks = myTasks.filter((task) => task.status === "Reviewed");

  const approvedProfessionals = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "professional" &&
          String(user.status || "active").toLowerCase() === "active" &&
          normalizedUserDivision &&
          normalizeDivisionId(user.divisionId) === normalizedUserDivision,
      ),
    [normalizedUserDivision, users],
  );

  if (loading) {
    return (
      <AsyncState
        title={t("loading.dashboard")}
        state="loading"
        message={t("loading.pleaseWait")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #3B0764 0%, #5B21B6 60%, #7C3AED 100%)",
        }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                  <ClipboardList size={14} className="text-white" />
                </div>
                <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  {t("supervisor.title")}
                </span>
              </div>
              <h1 className="text-white text-xl">{t("supervisor.dashboard")}</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {currentUser?.name} · {divisionName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const columns = {
                    id: t("export.id"),
                    title: t("export.title"),
                    status: t("export.status"),
                    priority: t("export.priority"),
                    location: t("form.location"),
                    requester: t("export.requester"),
                    date: t("export.date"),
                    assignedTo: t("form.assignedTo"),
                  };
                  const exportData = myTasks.map((task) => ({
                    [columns.id]: task.id,
                    [columns.title]: task.title,
                    [columns.status]: translateStatus(task.status),
                    [columns.priority]: translatePriority(task.priority),
                    [columns.location]: `${task.location}, ${task.floor}`,
                    [columns.requester]: task.requestedBy,
                    [columns.date]: task.createdAt,
                    [columns.assignedTo]:
                      users.find((user) => user.id === task.assignedTo)?.name ||
                      t("common.unassigned"),
                  }));
                  exportToCSV(
                    exportData,
                    `Division_Report_${divisionName}_${new Date().toISOString().split("T")[0]}`,
                  );
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold text-white transition-all backdrop-blur-md shadow-lg"
              >
                <Download size={16} /> {t("supervisor.exportReport")}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingAssignment.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-white text-xs font-semibold">
                  {pendingAssignment.length} {t("supervisor.needAssignment")}
                </span>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-white text-xs font-semibold">
                  {completedTasks.length} {t("supervisor.pendingReview")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: t("supervisor.totalAssigned"),
            value: myTasks.length,
            color: "#7C3AED",
            bg: "#F5F3FF",
            icon: <ClipboardList size={18} />,
          },
          {
            label: t("requests.needsAttention"),
            value: pendingAssignment.length,
            color: "#F59E0B",
            bg: "#FFFBEB",
            icon: <AlertTriangle size={18} />,
          },
          {
            label: t("supervisor.withProfessionals"),
            value: withProfessionals.length,
            color: "#EA580C",
            bg: "#FFF7ED",
            icon: <Activity size={18} />,
          },
          {
            label: t("status.completed"),
            value: completedTasks.length,
            color: "#0D9488",
            bg: "#F0FDFA",
            icon: <CheckCircle size={18} />,
          },
          {
            label: t("supervisor.submittedToAdmin"),
            value: reviewedTasks.length,
            color: "#0891B2",
            bg: "#ECFEFF",
            icon: <Send size={18} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-xl" style={{ background: stat.bg }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#0E2271] font-semibold">
            {t("supervisor.professionals")}
          </h3>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded">
            {approvedProfessionals.length} {t("status.active")}
          </span>
        </div>
        {approvedProfessionals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("supervisor.noProfessionalsDesc")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedProfessionals.map((professional) => (
              <div
                key={professional.id}
                className="border border-border rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {professional.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {professional.email}
                  </p>
                  {!professional.divisionId && (
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {t("supervisor.divisionAssignedOnFirstTask")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#0E2271]">
                    {t("users.department")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {professional.department || t("common.notSpecified")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[#0E2271] font-semibold text-lg mb-1">
              {t("supervisor.taskManagement")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("supervisor.taskManagementDesc")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#7C3AED] mb-1">
              {myTasks.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("supervisor.totalTasks")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {pendingAssignment.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("supervisor.needAssignment")}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {withProfessionals.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("status.inProgress")}
            </p>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-teal-600">
              {completedTasks.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("status.completed")}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/supervisor/tasks")}
          className="w-full px-6 py-3 rounded-lg text-white text-sm font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors flex items-center justify-center gap-2"
        >
          <ClipboardList size={18} />
          {t("supervisor.openTaskManagement")}
        </button>
      </div>
    </div>
  );
}
