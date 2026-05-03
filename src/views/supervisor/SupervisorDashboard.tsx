"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  ClipboardList,
  AlertTriangle,
  Activity,
  CheckCircle,
  Send,
  Download,
} from "lucide-react";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const uid = currentUser?.id || "";

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        // Token is automatically sent via httpOnly cookie
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

    // Keep supervisor board in sync with professional updates.
    const refreshInterval = setInterval(refresh, 15000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Get current user's division
  const userDivision = currentUser?.divisionId;
  const divisionName = divisions.find((d) => d.id === userDivision)?.name || "Division";

  // Debug: Log division filtering
  console.log("=== Supervisor Dashboard Division Filter ===");
  console.log("Current User:", currentUser?.name);
  console.log("User Division ID:", userDivision);
  console.log("Division Name:", divisionName);
  console.log("Total Tasks:", allTasks.length);
  console.log("Tasks with divisionId:", allTasks.filter(t => t.divisionId).map(t => ({
    id: t.id,
    title: t.title,
    divisionId: t.divisionId,
    supervisorId: t.supervisorId,
    status: t.status,
  })));

  const supervisorTrackedStatuses = [
    "Submitted",  // Added: Supervisors should see newly submitted requests in their division
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professionals",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",  // Added: Supervisors should see approved tasks for tracking
    "Rejected",  // Added: Supervisors should see rejected tasks for follow-up
    "Closed",    // Added: Supervisors should see closed tasks for historical records
  ];

  // My assigned tasks — primary key is supervisorId, divisionId is informational only
  const myTasks = allTasks.filter(
    (m) => {
      const matchesSupervisor = m.supervisorId === uid;
      const matchesDivision = userDivision &&
        m.divisionId === userDivision &&
        supervisorTrackedStatuses.includes(m.status);
      
      // Debug log for each task
      if (m.divisionId) {
        console.log(`Task ${m.id}:`, {
          divisionId: m.divisionId,
          supervisorId: m.supervisorId,
          status: m.status,
          matchesSupervisor,
          matchesDivision,
          included: matchesSupervisor || matchesDivision,
        });
      }
      
      return matchesSupervisor || matchesDivision;
    }
  );
  
  console.log("Filtered Tasks (myTasks):", myTasks.length);
  console.log("===================================");
  const pendingAssignment = myTasks.filter((m) =>
    ["Assigned to Supervisor", "WorkOrder Created"].includes(m.status),
  );
  const withProfessionals = myTasks.filter((m) =>
    ["Assigned to Professionals", "In Progress"].includes(m.status),
  );
  const completedTasks = myTasks.filter((m) => m.status === "Completed");
  const reviewedTasks = myTasks.filter((m) => m.status === "Reviewed");
  const approvedTasks = myTasks.filter((m) => m.status === "Approved");
  const rejectedTasks = myTasks.filter((m) => m.status === "Rejected");
  const closedTasks = myTasks.filter((m) => m.status === "Closed");
  const approvedProfessionals = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "professional" &&
          String(u.status || "active").toLowerCase() === "active" &&
          userDivision &&
          u.divisionId === userDivision  // STRICT: Only professionals from supervisor's division
      ),
    [users, userDivision],
  );

  return (
    <div className="space-y-6">
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
                {currentUser?.name} · {divisionName}
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
                      users.find((u) => u.id === t.assignedTo)?.name ||
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

      {/* Registered & Approved Professionals */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#0E2271] font-semibold">
            {t("supervisor.professionals")}
          </h3>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded">
            {approvedProfessionals.length} active
          </span>
        </div>
        {approvedProfessionals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("supervisor.noProfessionalsDesc")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedProfessionals.map((pro) => (
              <div
                key={pro.id}
                className="border border-border rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{pro.name}</p>
                  <p className="text-xs text-muted-foreground">{pro.email}</p>
                    {!pro.divisionId && (
                      <p className="text-[11px] text-amber-700 mt-0.5">Division will be set on first assignment</p>
                    )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#0E2271]">Profession</p>
                  <p className="text-xs text-muted-foreground">
                    {pro.department || "Not specified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Management - Navigate to dedicated page */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[#0E2271] font-semibold text-lg mb-1">
              {t("supervisor.taskManagement")}
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage all assigned tasks, assign professionals, and submit completion reports
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#7C3AED] mb-1">{myTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingAssignment.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Need Assignment</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{withProfessionals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-teal-600">{completedTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/supervisor/tasks")}
          className="w-full px-6 py-3 rounded-lg text-white text-sm font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors flex items-center justify-center gap-2"
        >
          <ClipboardList size={18} />
          Open Task Management
        </button>
      </div>
    </div>
  );
}
