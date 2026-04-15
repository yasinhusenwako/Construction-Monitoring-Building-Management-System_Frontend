"use client";

import { useState, useEffect, useMemo } from "react";
import { exportToCSV } from '@/lib/exportUtils';
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  mockMaintenance,
  mockProjects,
  mockBookings,
  mockUsers,
  getProfessionalsByDivision,
  getDivisionById,
} from '@/data/mockData';
import {
  getMaintenanceWithStored,
  getProjectsWithStored,
  getBookingsWithStored,
} from '@/lib/storage';
import {
  StatusBadge,
  PriorityBadge,
} from '@/components/common/StatusBadge';
import {
  ClipboardList,
  CheckCircle,
  Shield,
  UserCheck,
  XCircle,
  AlertTriangle,
  Activity,
  Send,
  MapPin,
  Clock,
  User,
  Eye,
  Download,
} from "lucide-react";
import { AssignmentModal } from "./AssignmentModal";
import { CompletionReportModal } from "./CompletionReportModal";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  supervisorAssignProfessional,
  supervisorReviewRequest,
} from "@/lib/live-api";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const uid = currentUser?.id || "";

  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("insa_token") || undefined
            : undefined;
        const [maintenance, projects, bookings] = await Promise.all([
          fetchLiveMaintenance(token),
          fetchLiveProjects(token),
          fetchLiveBookings(token),
        ]);
        setAllTasks([...maintenance, ...projects, ...bookings]);
      } catch {
        setAllTasks([
          ...getMaintenanceWithStored(mockMaintenance),
          ...getProjectsWithStored(mockProjects),
          ...getBookingsWithStored(mockBookings),
        ]);
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("insa-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("insa-storage", refresh);
    };
  }, []);

  // Get current user's division
  const userDivision = currentUser?.divisionId;
  const divisionInfo = userDivision ? getDivisionById(userDivision) : null;

  // My assigned tasks — primary key is supervisorId, divisionId is informational only
  const myTasks = allTasks.filter(
    (m) =>
      m.supervisorId === uid ||
      // Fallback: division-scoped tasks that haven't had supervisorId stamped yet
      (userDivision &&
        m.divisionId === userDivision &&
        ["Assigned to Supervisor", "WorkOrder Created"].includes(m.status) &&
        !m.supervisorId),
  );
  const pendingAssignment = myTasks.filter((m) =>
    ["Assigned to Supervisor", "WorkOrder Created"].includes(m.status),
  );
  const withProfessionals = myTasks.filter((m) =>
    ["Assigned to Professional", "In Progress"].includes(m.status),
  );
  const completedTasks = myTasks.filter((m) => m.status === "Completed");
  const reviewedTasks = myTasks.filter((m) => m.status === "Reviewed");

  const handleAssign = async (professionalId: string, instructions: string) => {
    const task = myTasks.find((m) => m.id === assignTarget);
    if (!task) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("insa_token") || undefined
        : undefined;
    try {
      if (task.id.startsWith("MNT-")) {
        await supervisorAssignProfessional({
          module: "MAINTENANCE", businessId: task.id,
          professionalId,
          instructions,
          token,
        });
      }
      window.dispatchEvent(new Event("insa-storage"));
      setActionMsg(t("supervisor.action.assigned"));
    } catch {
      setActionMsg(t("common.error"));
    }
    setAssignTarget(null);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleSubmitReport = async (id: string) => {
    const task = myTasks.find((m) => m.id === id);
    if (!task) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("insa_token") || undefined
        : undefined;
    try {
      await supervisorReviewRequest({
        module: id.startsWith("PRJ-")
          ? "PROJECT"
          : id.startsWith("BKG-")
            ? "BOOKING"
            : "MAINTENANCE",
        businessId: id,
        token,
      });
      window.dispatchEvent(new Event("insa-storage"));
      setActionMsg(t("supervisor.action.reportSubmitted", { id }));
    } catch {
      setActionMsg(t("common.error"));
    }
    setReportTarget(null);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const assignTargetTask = myTasks.find((m) => m.id === assignTarget);

  return (
    <div className="space-y-6">
      {/* Assignment Modal */}
      {assignTarget && assignTargetTask && (
        <AssignmentModal
          ticketId={assignTarget}
          ticketTitle={assignTargetTask.title}
          professionals={
            assignTargetTask.divisionId
              ? getProfessionalsByDivision(assignTargetTask.divisionId)
              : []
          }
          activeTasks={mockMaintenance}
          onAssign={handleAssign}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <CompletionReportModal
          ticketId={reportTarget}
          onClose={() => {
            setReportTarget(null);
          }}
          onSubmit={handleSubmitReport}
        />
      )}

      {/* Header */}
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
              <h1 className="text-white text-xl">
                {t("supervisor.dashboard")}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                {currentUser?.name} ·{" "}
                {divisionInfo?.name || currentUser?.department}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const exportData = myTasks.map((t) => ({
                    ID: t.id,
                    Title: t.title,
                    Status: t.status,
                    Priority: t.priority,
                    Location: `${t.location}, ${t.floor}`,
                    ReportedBy: t.requestedBy,
                    Date: t.createdAt,
                    AssignedPro:
                      mockUsers.find((u) => u.id === t.assignedTo)?.name ||
                      t("common.unassigned"),
                  }));
                  exportToCSV(
                    exportData,
                    `Division_Report_${divisionInfo?.name || "Maintenance"}_${new Date().toISOString().split("T")[0]}`,
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

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Task Management */}
      <h2 className="text-[#0E2271]">{t("supervisor.taskManagement")}</h2>

      {/* List View */}
      <div className="space-y-3">
        {myTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-16 text-center">
            <ClipboardList
              size={48}
              className="mx-auto text-muted-foreground/40 mb-3"
            />
            <h3 className="text-[#0E2271]">
              {t("supervisor.noTasksAssigned")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("supervisor.noTasksDesc")}
            </p>
          </div>
        ) : (
          myTasks.map((m) => {
            const assignee = mockUsers.find((u) => u.id === m.assignedTo);
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#7C3AED]">
                        {m.id}
                      </span>
                      <StatusBadge status={m.status} />
                      <PriorityBadge priority={m.priority} />
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {m.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#0E2271]">{m.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} /> {m.location}, {m.floor}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} /> {m.createdAt.split(" ")[0]}
                      </span>
                      {assignee && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User size={12} /> {assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => {
                        const path = m.id.startsWith("PRJ-")
                          ? `/dashboard/projects/${m.id}`
                          : m.id.startsWith("BKG-")
                            ? `/dashboard/bookings/${m.id}`
                            : `/dashboard/maintenance/${m.id}`;
                        router.push(path);
                      }}
                      className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline"
                    >
                      <Eye size={12} /> {t("supervisor.viewDetails")}
                    </button>
                    {m.status === "Assigned to Supervisor" && (
                      <button
                        onClick={() => setAssignTarget(m.id)}
                        className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-[#7C3AED]"
                      >
                        <UserCheck size={12} />{" "}
                        {t("supervisor.assignProfessional")}
                      </button>
                    )}
                    {m.status === "Completed" && (
                      <button
                        onClick={() => setReportTarget(m.id)}
                        className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-[#0891B2]"
                      >
                        <Send size={12} /> {t("supervisor.submitReport")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
