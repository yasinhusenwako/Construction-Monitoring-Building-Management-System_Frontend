"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveUsers,
} from "@/lib/live-api";
import { StatusBadge } from "@/components/common/StatusBadge";
import type {
  UserRole,
  Project,
  Booking,
  Maintenance,
  Space,
} from "@/types/models";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { exportToCSV } from "@/lib/exportUtils";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  FolderOpen,
  Calendar,
  Wrench,
  ArrowRight,
  ChevronRight,
  Settings,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  ArrowUpRight,
  UserCog,
  FileText,
  Flag,
  GitBranch,
  Layers,
  Target,
  RefreshCw,
  Package,
  Bell,
  Inbox,
  Download,
} from "lucide-react";
import {
  KpiCard,
  SectionHeader,
  AlertRow,
  ModulePanel,
} from "@/components/dashboard/DashboardWidgets";

// ─── helpers ───────────────────────────────────────────────────────────────
function kpiColor(v: number, thresholds: [number, string][]): string {
  for (const [t, c] of thresholds) if (v >= t) return c;
  return thresholds[thresholds.length - 1][1];
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "workflow"
  >("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<Maintenance[]>([]);
  const [liveUsers, setLiveUsers] = useState<
    Array<{
      id: string;
      name: string;
      role: UserRole;
      status: string;
      avatar: string;
      department: string;
    }>
  >([]);

  useEffect(() => {
    const refresh = async () => {
      try {
        // Token is automatically sent via httpOnly cookie
        const [p, b, m, u] = await Promise.all([
          fetchLiveProjects(),
          fetchLiveBookings(),
          fetchLiveMaintenance(),
          fetchLiveUsers(),
        ]);
        setProjects(p);
        setBookings(b);
        setMaintenanceItems(m);
        setLiveUsers(u);
      } catch {
        // backend unreachable
      }
    };

    void refresh();
  }, []);

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalUsers = liveUsers.length;
  const activeUsers = liveUsers.filter((u) => u.status === "active").length;
  const technicians = liveUsers.filter((u) => u.role === "professional");
  const supervisors = liveUsers.filter((u) => u.role === "supervisor");

  // Projects
  const pendingProjects = projects.filter((p) =>
    ["Submitted", "Under Review"].includes(p.status),
  );
  const inProgressProjects = projects.filter((p) => p.status === "In Progress");
  const completedProjects = projects.filter((p) => p.status === "Completed");
  const rejectedProjects = projects.filter((p) => p.status === "Rejected");
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);

  // Bookings
  const pendingBookings = bookings.filter((b) => b.status === "Submitted");
  const reviewBookings = bookings.filter((b) => b.status === "Under Review");
  const approvedBookings = bookings.filter((b) => b.status === "Approved");

  // Maintenance
  const openTickets = maintenanceItems.filter((m) =>
    [
      "Submitted",
      "Under Review",
      "Assigned to Supervisor",
      "WorkOrder Created",
      "Assigned to Professionals",
      "In Progress",
      "Completed",
      "Reviewed",
    ].includes(m.status),
  );
  const criticalTickets = maintenanceItems.filter(
    (m) => m.priority === "Critical" && m.status !== "Closed",
  );
  const unassignedTickets = maintenanceItems.filter(
    (m) => m.status === "Submitted",
  );
  const pendingSupervisorReview = maintenanceItems.filter(
    (m) => m.status === "Completed",
  );
  const pendingAdminFinalReview = maintenanceItems.filter(
    (m) => m.status === "Reviewed",
  );
  const resolvedTickets = maintenanceItems.filter((m) =>
    ["Approved", "Rejected", "Closed"].includes(m.status),
  );
  const slaCompliance = Math.round(
    (resolvedTickets.length / Math.max(maintenanceItems.length, 1)) * 100,
  );

  // Professional workload
  const techWorkload = technicians.map((t) => ({
    name: t.name.split(" ")[0],
    assigned: maintenanceItems.filter(
      (m) =>
        m.assignedTo === t.id &&
        !["Approved", "Rejected", "Closed"].includes(m.status),
    ).length,
    completed: maintenanceItems.filter(
      (m) =>
        m.assignedTo === t.id &&
        ["Approved", "Rejected", "Closed"].includes(m.status),
    ).length,
  }));

  // Chart data
  const requestVolumeData = [
    {
      name: "Projects",
      total: projects.length,
      pending: pendingProjects.length,
      done: completedProjects.length,
    },
    {
      name: "Bookings",
      total: bookings.length,
      pending: pendingBookings.length + reviewBookings.length,
      done: approvedBookings.length,
    },
    {
      name: "Maintenance",
      total: maintenanceItems.length,
      pending: unassignedTickets.length,
      done: resolvedTickets.length,
    },
  ];

  const projectStatusData = [
    {
      name: t("status.submitted"),
      value: pendingProjects.length,
      color: "#F5B800",
    },
    {
      name: t("status.inProgress"),
      value: inProgressProjects.length,
      color: "#1A3580",
    },
    {
      name: t("status.completed"),
      value: completedProjects.length,
      color: "#16A34A",
    },
    {
      name: t("status.rejected"),
      value: rejectedProjects.length,
      color: "#CC1F1A",
    },
  ].filter((d) => d.value > 0);

  const maintTypeData = (() => {
    const counts: Record<string, number> = {};
    maintenanceItems.forEach((m) => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const activityTrend = [
    { month: t("month.nov"), projects: 2, bookings: 3, maintenance: 4 },
    { month: t("month.dec"), projects: 3, bookings: 4, maintenance: 5 },
    { month: t("month.jan"), projects: 4, bookings: 5, maintenance: 3 },
    { month: t("month.feb"), projects: 3, bookings: 6, maintenance: 6 },
    { month: t("month.mar"), projects: 5, bookings: 4, maintenance: 4 },
    {
      month: t("month.apr"),
      projects: projects.length,
      bookings: bookings.length,
      maintenance: maintenanceItems.length,
    },
  ];

  // Alerts / workflow items
  const workflowAlerts = [
    ...pendingProjects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.title,
      issue: `${t("admin.awaitingReview")} — ${t("priority.title")}`,

      color: "#1A3580",
      path: `/dashboard/projects/${p.id}`,
      cta: "Review",
    })),
    ...unassignedTickets.map((m) => ({
      type: "maintenance" as const,
      id: m.id,
      title: m.title,
      issue: `${t("admin.newSubmission")} — ${t(`priority.${m.priority.toLowerCase()}` as any)} ${t("priority.title")}`,

      color: "#CC1F1A",
      path: `/dashboard/maintenance/${m.id}`,
      cta: "Assign",
    })),
    ...pendingSupervisorReview.map((m) => ({
      type: "maintenance" as const,
      id: m.id,
      title: m.title,
      issue: t("admin.supervisorReviewedAwaiting"),

      color: "#0891B2",
      path: `/dashboard/maintenance/${m.id}`,
      cta: "Approve",
    })),
    ...[...pendingBookings, ...reviewBookings].map((b) => ({
      type: "booking" as const,
      id: b.id,
      title: b.title,
      issue: t("admin.spaceBookingUnderReview"),

      color: "#7C3AED",
      path: `/dashboard/bookings`,
      cta: "Approve",
    })),
  ].slice(0, 6);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("greeting.morning");
    if (h < 17) return t("greeting.afternoon");
    return t("greeting.evening");
  };

  const handleExportReport = () => {
    const projectData = projects.map((p) => ({
      ID: p.id,
      Type: "Project",
      Title: p.title,
      Status: p.status,
      Requester:
        liveUsers.find((u) => u.id === p.requestedBy)?.name || p.requestedBy,
      Date: p.createdAt,
    }));

    const bookingData = bookings.map((b) => ({
      ID: b.id,
      Type: "Booking",
      Title: b.title || b.space,
      Status: b.status,
      Priority: "Medium",
      Requester:
        liveUsers.find((u) => u.id === b.requestedBy)?.name || b.requestedBy,
      Date: b.createdAt,
    }));

    const maintenanceData = maintenanceItems.map((m) => ({
      ID: m.id,
      Type: "Maintenance",
      Title: m.title,
      Status: m.status,
      Priority: m.priority,
      Requester:
        liveUsers.find((u) => u.id === m.requestedBy)?.name || m.requestedBy,
      Date: m.createdAt,
    }));

    const allData = [...projectData, ...bookingData, ...maintenanceData];
    exportToCSV(
      allData,
      `INSA_CSBMS_Global_Report_${new Date().toISOString().split("T")[0]}`,
    );
  };

  // ── Quick control actions ──────────────────────────────────────────────────
  const controlActions = [
    {
      label: t("users.title"),
      icon: <UserCog size={18} />,
      desc: t("admin.usersDesc"),

      path: "/admin/users",
      color: "#0E2271",
      badge: null,
    },
    {
      label: t("admin.allUserRequests"),
      icon: <Inbox size={18} />,
      desc: t("admin.allRequestsDesc"),

      path: "/admin/requests",
      color: "#1A3580",
      badge:
        pendingProjects.length +
          pendingBookings.length +
          unassignedTickets.length +
          pendingAdminFinalReview.length || null,
    },
    {
      label: t("nav.config"),
      icon: <Settings size={18} />,
      desc: t("admin.configDesc"),

      path: "/admin/config",
      color: "#7C3AED",
      badge: null,
    },
    {
      label: t("projects.title"),
      icon: <FolderOpen size={18} />,
      desc: t("admin.projectsDesc"),

      path: "/dashboard/projects",
      color: "#1A3580",
      badge: pendingProjects.length || null,
    },
    {
      label: t("module.bookings"),
      icon: <Calendar size={18} />,
      desc: t("admin.bookingsDesc"),

      path: "/dashboard/bookings",
      color: "#7C3AED",
      badge: pendingBookings.length || null,
    },
    {
      label: t("maintenance.assignTechnician"),
      icon: <Wrench size={18} />,
      desc: t("admin.maintenanceDesc"),

      path: "/dashboard/maintenance",
      color: "#CC1F1A",
      badge: unassignedTickets.length || null,
    },
    {
      label: t("nav.reports"),
      icon: <BarChart3 size={18} />,
      desc: t("admin.reportsDesc"),

      path: "/dashboard/reports",
      color: "#16A34A",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg border border-[#0E2271]/20"
        style={{
          background:
            "linear-gradient(135deg, #0E2271 0%, #1A3580 60%, #CC1F1A 100%)",
        }}
      >
        <div className="px-6 py-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                <ShieldCheck size={18} className="text-white drop-shadow-md" />
              </div>
              <div>
                <span className="text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] block leading-tight">
                  {t("admin.masterControlLayer")}
                </span>
                <span className="text-white/60 text-[10px] uppercase font-medium">
                  {t("admin.systemAdministrator")}
                </span>
              </div>
            </div>
            <h1 className="text-white text-3xl font-bold tracking-tight">
              {getGreeting()}, {adminName.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-1.5 flex items-center gap-2">
              <Activity size={12} className="text-green-400" />
              <span>
                {t("admin.systemOnline")} ·{" "}
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
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold text-white transition-all backdrop-blur-md shadow-lg"
            >
              <Download size={16} />
              {t("admin.exportGlobalReport")}
            </button>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
                {t("admin.globalHealth")}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="text-white text-lg font-bold">98.2%</span>
              </div>
            </div>
            {criticalTickets.length > 0 && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-red-200 text-[10px] uppercase font-bold tracking-wider mb-1">
                  {t("admin.criticalIssues")}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span className="text-white text-lg font-bold">
                    {criticalTickets.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex gap-2 px-6 pb-0 border-t border-white/10 bg-black/5">
          {(["overview", "analytics", "workflow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab
                  ? "text-white border-white bg-white/10"
                  : "text-white/40 border-transparent hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {tab === "overview"
                ? t("admin.overview")
                : tab === "analytics"
                  ? t("admin.analytics")
                  : t("admin.workflow")}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard
              icon={<Users size={18} />}
              label={t("admin.activeUsers")}
              color="#0E2271"
              value={activeUsers}
              sub={`${t("common.of")} ${totalUsers} ${t("common.total")}`}
              trend={{ val: t("admin.usersTrend"), up: true }}
              onClick={() => router.push("/admin/users")}
            />
            <KpiCard
              icon={<FolderOpen size={18} />}
              label={t("admin.pendingReviews")}
              color="#1A3580"
              value={pendingProjects.length}
              sub={t("admin.projectsAwaitingAction")}
              trend={{
                val:
                  pendingProjects.length > 2
                    ? t("admin.high")
                    : t("admin.normal"),
                up: false,
              }}
              onClick={() => router.push("/dashboard/projects")}
            />
            <KpiCard
              icon={<Calendar size={18} />}
              label={t("admin.spaceRequests")}
              color="#7C3AED"
              value={pendingBookings.length}
              sub={t("admin.pendingApproval")}
              onClick={() => router.push("/dashboard/bookings")}
            />
            <KpiCard
              icon={<Wrench size={18} />}
              label={t("admin.maintenanceTickets")}
              color="#DC2626"
              value={
                openTickets.length +
                pendingProjects.length +
                pendingBookings.length
              }
              sub={`${unassignedTickets.length} ${t("admin.new")} · ${criticalTickets.length} ${t("admin.critical")}`}
              trend={{
                val:
                  criticalTickets.length > 0
                    ? t("admin.urgent")
                    : unassignedTickets.length > 0
                      ? t("admin.actionRequired")
                      : t("admin.ok"),
                up: criticalTickets.length === 0,
              }}
              onClick={() => router.push("/admin/requests")}
            />
            <KpiCard
              icon={<Target size={18} />}
              label={t("admin.slaCompliance")}
              color="#16A34A"
              value={`${slaCompliance}%`}
              sub={t("admin.ticketsResolvedOnTime")}
              trend={{
                val:
                  slaCompliance >= 70
                    ? t("admin.onTrack")
                    : t("admin.belowTarget"),
                up: slaCompliance >= 70,
              }}
            />
            <KpiCard
              icon={<RefreshCw size={18} />}
              label={t("admin.reviewQueue")}
              color="#0891B2"
              value={
                pendingSupervisorReview.length + pendingAdminFinalReview.length
              }
              sub={`${pendingSupervisorReview.length} Div · ${pendingAdminFinalReview.length} Admin`}
              trend={{
                val:
                  pendingAdminFinalReview.length > 0
                    ? t("admin.actionNeeded")
                    : t("admin.clear"),
                up: pendingAdminFinalReview.length === 0,
              }}
              onClick={() => router.push("/admin/requests")}
            />
            <KpiCard
              icon={<TrendingUp size={18} />}
              label={t("admin.totalBudget")}
              color="#F5B800"
              value={`${(totalBudget / 1_000_000).toFixed(1)}M`}
              sub={t("admin.etbAcrossProjects")}
              onClick={() => router.push("/dashboard/reports")}
            />
          </div>

          {/* Quick Control Actions */}
          <div>
            <SectionHeader
              title={t("admin.adminControlPanel")}
              sub={t("admin.navigateToKeyAreas")}
              icon={<Zap size={15} />}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {controlActions.map((a) => (
                <button
                  key={a.path}
                  onClick={() => router.push(a.path)}
                  className="bg-white border border-border rounded-2xl p-4 hover:shadow-md transition-all text-left group relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl"
                    style={{ background: a.color }}
                  />
                  {a.badge !== null && Number(a.badge) > 0 && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: a.color }}
                    >
                      {a.badge}
                    </div>
                  )}
                  <div
                    className="p-2 rounded-xl w-fit mb-3"
                    style={{ background: a.color + "15" }}
                  >
                    <span style={{ color: a.color }}>{a.icon}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {a.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {a.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Three Module Panels */}
          <div>
            <SectionHeader
              title={t("admin.moduleOversight")}
              sub={t("admin.statusAcrossStreams")}
              icon={<Layers size={15} />}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ModulePanel
                title={t("module.projects")}
                stream="Stream A"
                color="#1A3580"
                icon={<FolderOpen size={14} />}
                stats={[
                  {
                    label: "Pending Review",
                    value: pendingProjects.length,
                    highlight: pendingProjects.length > 0,
                  },
                  { label: "In Progress", value: inProgressProjects.length },
                  { label: "Completed", value: completedProjects.length },
                ]}
                items={[...pendingProjects, ...inProgressProjects].map((p) => ({
                  id: p.id,
                  title: p.title,
                  status: p.status,
                }))}
                onView={() => router.push("/dashboard/projects")}
              />
              <ModulePanel
                title={t("module.bookings")}
                stream="Stream B"
                color="#7C3AED"
                icon={<Calendar size={14} />}
                stats={[
                  {
                    label: "Submitted",
                    value: pendingBookings.length,
                    highlight: pendingBookings.length > 0,
                  },
                  { label: "Under Review", value: reviewBookings.length },
                  { label: "Approved", value: approvedBookings.length },
                ]}
                items={[...pendingBookings, ...reviewBookings].map((b) => ({
                  id: b.id,
                  title: b.title,
                  status: b.status,
                  badge: b.attendees > 100 ? `${b.attendees} pax` : undefined,
                }))}
                onView={() => router.push("/dashboard/bookings")}
              />
              <ModulePanel
                title={t("module.maintenance")}
                stream="Stream C"
                color="#CC1F1A"
                icon={<Wrench size={14} />}
                stats={[
                  {
                    label: "New Submissions",
                    value: unassignedTickets.length,
                    highlight: unassignedTickets.length > 0,
                  },
                  {
                    label: "In Progress",
                    value: maintenanceItems.filter(
                      (m) => m.status === "In Progress",
                    ).length,
                  },
                  {
                    label: "Pending Admin Review",
                    value: pendingSupervisorReview.length,
                    highlight: pendingSupervisorReview.length > 0,
                  },
                ]}
                items={openTickets.map((m) => ({
                  id: m.id,
                  title: m.title,
                  status: m.status,
                  badge:
                    m.priority === "Critical"
                      ? "🔴 Critical"
                      : m.priority === "High"
                        ? "🟡 High"
                        : undefined,
                }))}
                onView={() => router.push("/dashboard/maintenance")}
              />
            </div>
          </div>

          {/* Bottom: Activity + Technician Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* System Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                  <Activity size={14} className="text-[#1A3580]" />{" "}
                  {t("admin.systemWideActivity")}
                </h3>
                <button
                  onClick={() => router.push("/dashboard/reports")}
                  className="text-xs text-[#1A3580] hover:underline flex items-center gap-1"
                >
                  {t("admin.fullReport")} <ChevronRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {[
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
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 10)
                  .map((item) => (
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
                          <FolderOpen size={14} />
                        ) : item.type === "Booking" ? (
                          <Calendar size={14} />
                        ) : (
                          <Wrench size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {item.date.split("T")[0]}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Technician Workload + User Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                    <UserCog size={14} className="text-[#CC1F1A]" />{" "}
                    {t("admin.professionalWorkload")}
                  </h3>
                </div>
                <div className="p-3 space-y-2.5">
                  {techWorkload.map((t) => {
                    const total = t.assigned + t.completed;
                    const pct =
                      total > 0 ? Math.round((t.assigned / total) * 100) : 0;
                    const loadColor =
                      pct > 70 ? "#CC1F1A" : pct > 40 ? "#F5B800" : "#16A34A";
                    return (
                      <div key={t.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1A3580] flex items-center justify-center text-white text-xs font-bold">
                              {t.name[0]}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {t.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {t.assigned} active
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: loadColor }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: loadColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => router.push("/admin/users")}
                    className="w-full mt-2 text-xs text-[#1A3580] hover:underline flex items-center justify-center gap-1 py-1"
                  >
                    {t("admin.manageUsers")} <ChevronRight size={11} />
                  </button>
                </div>
              </div>

              {/* Role distribution */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                    {t("admin.userDistribution")}
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    {
                      role: "Administrator",
                      count: liveUsers.filter((u) => u.role === "admin").length,
                      color: "#0E2271",
                    },
                    {
                      role: "Div. Supervisors",
                      count: liveUsers.filter((u) => u.role === "supervisor")
                        .length,
                      color: "#7C3AED",
                    },
                    {
                      role: "Professionals",
                      count: liveUsers.filter((u) => u.role === "professional")
                        .length,
                      color: "#CC1F1A",
                    },
                    {
                      role: "Users (Requesters)",
                      count: liveUsers.filter((u) => u.role === "user").length,
                      color: "#F5B800",
                    },
                  ].map((r) => (
                    <div
                      key={r.role}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: r.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {r.role}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {r.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: ANALYTICS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div className="space-y-5">
          {/* System Performance KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "MTTR (avg)",
                value: "1.8 days",
                sub: "Mean Time to Resolve",
                color: "#1A3580",
                icon: <Timer size={18} />,
              },
              {
                label: "Request Backlog",
                value:
                  pendingProjects.length +
                  pendingBookings.length +
                  unassignedTickets.length,
                sub: "Unprocessed requests",
                color: "#F5B800",
                icon: <Package size={18} />,
              },
              {
                label: "SLA Compliance",
                value: `${slaCompliance}%`,
                sub: "Resolved within SLA",
                color: "#16A34A",
                icon: <CheckCircle2 size={18} />,
              },
              {
                label: "Escalations",
                value: criticalTickets.length,
                sub: "Critical & unresolved",
                color: "#CC1F1A",
                icon: <Flag size={18} />,
              },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-2 rounded-xl"
                    style={{ background: k.color + "15" }}
                  >
                    <span style={{ color: k.color }}>{k.icon}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: k.color }}>
                  {k.value}
                </p>
                <p className="text-sm font-medium text-foreground">{k.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Activity Trend */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> {t("admin.systemActivityTrend")}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={activityTrend}
                  margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A3580" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1A3580" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMaint" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CC1F1A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#CC1F1A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="projects"
                    name={t("module.projects")}
                    stroke="#1A3580"
                    fill="url(#gProj)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name={t("module.bookings")}
                    stroke="#7C3AED"
                    fill="url(#gBook)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="maintenance"
                    name={t("module.maintenance")}
                    stroke="#CC1F1A"
                    fill="url(#gMaint)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Project Status Donut */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
                <FolderOpen size={14} /> {t("admin.projectStatusDistribution")}
              </h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {projectStatusData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t(
                            `status.${d.name.charAt(0).toLowerCase()}${d.name.slice(1).replace(/\s+/g, "")}` as any,
                          )}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {d.value}
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("admin.totalBudget")}
                      </span>
                      <span className="text-xs font-bold text-[#0E2271]">
                        {(totalBudget / 1_000_000).toFixed(1)}M ETB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Request Volume by Module */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
                <BarChart3 size={14} /> {t("admin.requestVolumeByModule")}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={requestVolumeData}
                  margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="total"
                    name={t("common.total")}
                    fill="#0E2271"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name={t("status.submitted")}
                    fill="#F5B800"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="done"
                    name={t("admin.completedThisCycle")}
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Maintenance by Category */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
                <Wrench size={14} /> {t("admin.maintenanceByCategory")}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={maintTypeData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, bottom: 0, left: 20 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar
                    dataKey="value"
                    name={t("maintenance.title")}
                    fill="#CC1F1A"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technician Performance table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                {t("admin.technicianPerformanceOverview")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    {[
                      "Technician",
                      "Department",
                      "Active Tasks",
                      "Completed",
                      "Total Handled",
                      "Workload",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {t(
                          `table.${h.toLowerCase().replace(/\s+/g, "")}` as any,
                        ) || h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {technicians.map((tech) => {
                    const active = maintenanceItems.filter(
                      (m) =>
                        m.assignedTo === tech.id &&
                        !["Approved", "Rejected", "Closed"].includes(m.status),
                    ).length;
                    const done = maintenanceItems.filter(
                      (m) =>
                        m.assignedTo === tech.id &&
                        ["Approved", "Rejected", "Closed"].includes(m.status),
                    ).length;
                    const total = active + done;
                    const pct =
                      total > 0 ? Math.round((active / total) * 100) : 0;
                    const loadColor =
                      pct > 70 ? "#CC1F1A" : pct > 40 ? "#F5B800" : "#16A34A";
                    const loadLabel =
                      pct > 70
                        ? t("admin.high")
                        : pct > 40
                          ? t("admin.medium")
                          : t("admin.available");

                    return (
                      <tr
                        key={tech.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#CC1F1A] flex items-center justify-center text-white text-xs font-bold">
                              {tech.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {tech.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {tech.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {tech.department}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#CC1F1A]">
                          {active}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#16A34A]">
                          {done}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">
                          {total}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-1.5 min-w-16">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: loadColor,
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: loadColor }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: loadColor + "18",
                              color: loadColor,
                            }}
                          >
                            {loadLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: WORKFLOW
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "workflow" && (
        <div className="space-y-5">
          {/* Workflow status overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: t("admin.awaitingApproval"),
                value: pendingProjects.length + pendingBookings.length,
                color: "#F5B800",
                icon: <Clock size={18} />,
                desc: `${t("module.projects")} + ${t("module.bookings")}`,
              },
              {
                label: t("admin.unassignedTickets"),
                value: unassignedTickets.length,
                color: "#CC1F1A",
                icon: <AlertTriangle size={18} />,
                desc: t("admin.needsTechnician"),
              },
              {
                label: t("admin.activeWorkflows"),
                value: inProgressProjects.length + openTickets.length,
                color: "#1A3580",
                icon: <GitBranch size={18} />,
                desc: t("dashboard.inExecution"),
              },
              {
                label: t("admin.completedThisCycle"),
                value: completedProjects.length + resolvedTickets.length,
                color: "#16A34A",
                icon: <CheckCircle2 size={18} />,
                desc: t("admin.resolvedClosed"),
              },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm"
              >
                <div
                  className="p-2.5 rounded-xl w-fit mb-2"
                  style={{ background: k.color + "15" }}
                >
                  <span style={{ color: k.color }}>{k.icon}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: k.color }}>
                  {k.value}
                </p>
                <p className="text-sm font-medium text-foreground">{k.label}</p>
                <p className="text-xs text-muted-foreground">{k.desc}</p>
              </div>
            ))}
          </div>

          {/* Workflow alerts list */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                <Bell size={14} className="text-amber-500" />{" "}
                {t("admin.pendingAdminActions")}
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {workflowAlerts.length}
                </span>
              </h3>

              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {t("admin.requiresAttention")}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {workflowAlerts.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={36}
                    className="mx-auto text-green-500 mb-2"
                  />
                  <p className="font-medium text-foreground">
                    {t("admin.allWorkflowsOnTrack")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.noPendingActions")}
                  </p>
                </div>
              ) : (
                workflowAlerts.map((a) => (
                  <AlertRow
                    key={a.id}
                    icon={
                      a.type === "project" ? (
                        <FolderOpen size={14} />
                      ) : a.type === "booking" ? (
                        <Calendar size={14} />
                      ) : (
                        <Wrench size={14} />
                      )
                    }
                    text={`[${a.id}] ${a.title}`}
                    sub={a.issue}
                    color={a.color}
                    cta={a.cta}
                    onCta={() => router.push(a.path)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Workflow stages table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Project pipeline */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                  <FolderOpen size={14} className="text-[#1A3580]" />{" "}
                  {t("admin.projectPipeline")}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  {
                    stage: "Submitted",
                    items: projects.filter((p) => p.status === "Submitted"),
                    color: "#F5B800",
                  },
                  {
                    stage: "Under Review",
                    items: projects.filter((p) => p.status === "Under Review"),
                    color: "#1A3580",
                  },
                  {
                    stage: "Approved",
                    items: projects.filter((p) => p.status === "Approved"),
                    color: "#7C3AED",
                  },
                  {
                    stage: "In Progress",
                    items: projects.filter((p) => p.status === "In Progress"),
                    color: "#16A34A",
                  },
                  {
                    stage: "Completed",
                    items: projects.filter((p) => p.status === "Completed"),
                    color: "#6B7280",
                  },
                  {
                    stage: "Rejected",
                    items: projects.filter((p) => p.status === "Rejected"),
                    color: "#CC1F1A",
                  },
                ].map((row) => (
                  <div key={row.stage} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-40 flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: row.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t(
                          `status.${row.stage.charAt(0).toLowerCase()}${row.stage.slice(1).replace(/\s+/g, "")}` as any,
                        ) || row.stage}
                      </span>
                    </div>
                    <div className="flex-1 bg-secondary rounded-full h-5 relative overflow-hidden">
                      <div
                        className="h-5 rounded-full transition-all"
                        style={{
                          width: `${Math.max((row.items.length / Math.max(projects.length, 1)) * 100, row.items.length > 0 ? 8 : 0)}%`,
                          background: row.color + "aa",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-5 text-right">
                      {row.items.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance pipeline */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                  <Wrench size={14} className="text-[#CC1F1A]" />{" "}
                  {t("admin.maintenancePipeline")}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  {
                    stage: "Submitted",
                    items: maintenanceItems.filter(
                      (m) => m.status === "Submitted",
                    ),
                    color: "#F5B800",
                  },
                  {
                    stage: "Assigned to Supervisor",
                    items: maintenanceItems.filter(
                      (m) => m.status === "Assigned to Supervisor",
                    ),
                    color: "#1A3580",
                  },
                  {
                    stage: "In Progress",
                    items: maintenanceItems.filter(
                      (m) => m.status === "In Progress",
                    ),
                    color: "#EA580C",
                  },
                  {
                    stage: "Reviewed",
                    items: maintenanceItems.filter(
                      (m) => m.status === "Reviewed",
                    ),
                    color: "#0891B2",
                  },
                  {
                    stage: "Approved",
                    items: maintenanceItems.filter(
                      (m) => m.status === "Approved",
                    ),
                    color: "#16A34A",
                  },
                ].map((row) => (
                  <div key={row.stage} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-40 flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: row.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t(
                          `status.${row.stage.charAt(0).toLowerCase()}${row.stage.slice(1).replace(/\s+/g, "")}` as any,
                        ) || row.stage}
                      </span>
                    </div>
                    <div className="flex-1 bg-secondary rounded-full h-5 relative overflow-hidden">
                      <div
                        className="h-5 rounded-full transition-all"
                        style={{
                          width: `${Math.max((row.items.length / Math.max(maintenanceItems.length, 1)) * 100, row.items.length > 0 ? 8 : 0)}%`,
                          background: row.color + "aa",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-5 text-right">
                      {row.items.length}
                    </span>
                  </div>
                ))}
              </div>

              {/* SLA snapshot */}
              <div className="px-4 pb-4 pt-1">
                <div
                  className="rounded-xl p-3 mt-1"
                  style={{
                    background: slaCompliance >= 70 ? "#16A34A12" : "#CC1F1A12",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: slaCompliance >= 70 ? "#16A34A" : "#CC1F1A",
                      }}
                    >
                      {t("admin.slaCompliance")}: {slaCompliance}%
                    </span>
                    <button
                      onClick={() => router.push("/dashboard/reports")}
                      className="text-xs underline"
                      style={{
                        color: slaCompliance >= 70 ? "#16A34A" : "#CC1F1A",
                      }}
                    >
                      {t("action.viewReport")}
                    </button>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${slaCompliance}%`,
                        background: slaCompliance >= 70 ? "#16A34A" : "#CC1F1A",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Policy Notes */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#0E2271]" />{" "}
                {t("admin.adminGovernanceReminders")}
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: t("admin.strategicControlOnly"),
                  desc: t("admin.adminMonitoringDesc"),

                  icon: "🎯",
                  color: "#0E2271",
                },
                {
                  title: t("admin.overrideWithJustification"),
                  desc: t("admin.overrideDesc"),
                  icon: "⚖️",
                  color: "#CC1F1A",
                },

                {
                  title: t("admin.rbacEnforcement"),
                  desc: t("admin.rbacDesc"),
                  icon: "🔐",
                  color: "#F5B800",
                },
              ].map((n) => (
                <div
                  key={n.title}
                  className="flex gap-3 p-3 rounded-xl border border-border"
                >
                  <span className="text-xl mt-0.5">{n.icon}</span>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: n.color }}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
