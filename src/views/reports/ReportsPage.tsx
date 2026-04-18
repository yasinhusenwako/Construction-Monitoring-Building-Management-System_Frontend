"use client";

import { useEffect, useState } from "react";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveReports,
} from "@/lib/live-api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Calendar,
  Wrench,
  FolderOpen,
  Users,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import type { Booking, Maintenance, Project } from "@/types/models";

// ─── Static Data ────────────────────────────────────────────────────────────

const preventiveSchedule = [
  {
    id: "PM-001",
    system: "HVAC – Floor 1 & 2",
    frequency: "Every 3 months",
    lastDone: "2026-01-15",
    nextDue: "2026-04-15",
    status: "Due Soon",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-002",
    system: "HVAC – Floor 3 & 4",
    frequency: "Every 3 months",
    lastDone: "2025-12-10",
    nextDue: "2026-03-10",
    status: "Overdue",
    assignee: "Dawit Tadesse",
  },
  {
    id: "PM-003",
    system: "Elevator A1 – Tower A",
    frequency: "Every 6 months",
    lastDone: "2025-10-06",
    nextDue: "2026-04-06",
    status: "Due Soon",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-004",
    system: "Generator – HQ Block A",
    frequency: "Every month",
    lastDone: "2026-02-28",
    nextDue: "2026-03-31",
    status: "Due Today",
    assignee: "Dawit Tadesse",
  },
  {
    id: "PM-005",
    system: "Fire Suppression System",
    frequency: "Every 6 months",
    lastDone: "2025-09-20",
    nextDue: "2026-03-20",
    status: "Overdue",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-006",
    system: "UPS & Power Systems",
    frequency: "Every 3 months",
    lastDone: "2026-01-05",
    nextDue: "2026-04-05",
    status: "Scheduled",
    assignee: "Dawit Tadesse",
  },
];

const teamPerformanceData = [
  {
    name: "Tekle Haile",
    assigned: 8,
    completed: 6,
    avgMTTR: 9,
    satisfaction: 88,
  },
  {
    name: "Dawit Tadesse",
    assigned: 6,
    completed: 5,
    avgMTTR: 14,
    satisfaction: 82,
  },
];

const radarData = [
  { metric: "Response Speed", "Tekle Haile": 90, "Dawit Tadesse": 75 },
  { metric: "Completion Rate", "Tekle Haile": 75, "Dawit Tadesse": 83 },
  { metric: "Quality Score", "Tekle Haile": 88, "Dawit Tadesse": 82 },
  { metric: "Communication", "Tekle Haile": 85, "Dawit Tadesse": 78 },
  { metric: "Safety Compliance", "Tekle Haile": 95, "Dawit Tadesse": 90 },
];

const repairCostData = [
  { ticket: "MNT-001", type: "HVAC", material: 12000, labor: 4000 },
  { ticket: "MNT-002", type: "Electrical", material: 3500, labor: 2000 },
  { ticket: "MNT-003", type: "Plumbing", material: 8000, labor: 3500 },
  { ticket: "MNT-004", type: "Structural", material: 25000, labor: 8000 },
  { ticket: "MNT-005", type: "HVAC", material: 2000, labor: 1500 },
  { ticket: "MNT-006", type: "General", material: 1500, labor: 2500 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: "up" | "down";
  trendLabel?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: color + "15" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportsPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceItems, setMaintenanceItems] =
    useState<Maintenance[]>([]);
  const [reportData, setReportData] = useState<{
    statusDistribution: { name: string; value: number; color: string }[];
    requestVolume: { month: string; projects: number; bookings: number; maintenance: number }[];
    mttr: { month: string; hours: number }[];
    spaceUtilization: { space: string; utilization: number }[];
    costTracking: { month: string; planned: number; actual: number }[];
  }>({
    statusDistribution: [],
    requestVolume: [],
    mttr: [],
    spaceUtilization: [],
    costTracking: [],
  });
  const [avgMTTR, setAvgMTTR] = useState(0);

  useEffect(() => {
    const load = async () => {
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      try {
        const [liveProjects, liveBookings, liveMaintenance, reportBundle] =
          await Promise.all([
            fetchLiveProjects(token),
            fetchLiveBookings(token),
            fetchLiveMaintenance(token),
            fetchLiveReports(token),
          ]);
        
        setProjects(liveProjects);
        setBookings(liveBookings);
        setMaintenanceItems(liveMaintenance);

        // Normalize backend report data with safe fallbacks
        const statusMap = reportBundle?.overview?.statusBreakdown || {};
        const dist = Object.entries(statusMap).map(([name, value], i) => ({
          name: name || t("common.unknown"),
          value: Number(value) || 0,
          color: ["#1A3580", "#CC1F1A", "#F5B800", "#16A34A", "#7C3AED", "#9CA3AF"][i % 6]
        }));
        
        const liveHours = reportBundle?.mttr?.mttrHours || 0;
        setAvgMTTR(Math.round(liveHours));

        setReportData({
          statusDistribution: dist.length > 0 ? dist : [],
          requestVolume: [], // To be populated by backend later
          mttr: [{ month: t("common.current"), hours: liveHours }],
          spaceUtilization: [],
          costTracking: [],
        });

      } catch (error) {
        console.error("Failed to load live reports:", error);
      }
    };
    void load();
  }, []);

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const confirmedBookings = bookings.filter(
    (b) => b.status === "Approved",
  ).length;
  const closedMaint = maintenanceItems.filter(
    (m) => m.status === "Closed",
  ).length;
  const overdueSchedules = preventiveSchedule.filter(
    (s) => s.status === "Overdue",
  ).length;

  const getScheduleStyle = (status: string) => {
    if (status === "Overdue")
      return "bg-red-100 text-red-700 border border-red-200";
    if (status === "Due Today")
      return "bg-amber-100 text-amber-700 border border-amber-200";
    if (status === "Due Soon")
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    return "bg-green-100 text-green-700 border border-green-200";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#0E2271]">{t("reports.reportsAndAnalytics")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("reports.systemWidePerformance")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FolderOpen size={20} />}
          label={t("reports.totalProjects_label")}
          value={projects.length.toString()}
          trend="up"
          trendLabel={t("reports.trendPlusTwo")}
          color="#1A3580"
        />
        <MetricCard
          icon={<Clock size={20} />}
          label={t("reports.avgMTTR")}
          value={`${avgMTTR}h`}
          trend="down"
          trendLabel={t("reports.trendMTTR")}
          color="#CC1F1A"
        />
        <MetricCard
          icon={<DollarSign size={20} />}
          label={t("reports.totalBudgetETB")}
          value={`${(totalBudget / 1000000).toFixed(1)}M`}
          trend="up"
          trendLabel={t("reports.trendBudget")}
          color="#F5B800"
        />
        <MetricCard
          icon={<Calendar size={20} />}
          label={t("reports.confirmedBookings_label")}
          value={confirmedBookings.toString()}
          trend="up"
          trendLabel={t("reports.trendBookings")}
          color="#16A34A"
        />
      </div>

      {/* Preventive Maintenance Alert Banner */}
      {overdueSchedules > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-[#CC1F1A] flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#CC1F1A] text-sm">
              {overdueSchedules} {t("reports.preventiveMaintSchedules")}
            </p>
            <p className="text-xs text-red-600">
              {t("reports.reviewAndDispatch")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.requestVolumeOverTime")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.monthlyBreakdown")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={reportData.requestVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7BA4" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7BA4" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e8edf8",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                key="projects-line"
                type="monotone"
                dataKey="projects"
                stroke="#1A3580"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Projects"
              />
              <Line
                key="bookings-line"
                type="monotone"
                dataKey="bookings"
                stroke="#7C3AED"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Bookings"
              />
              <Line
                key="maintenance-line"
                type="monotone"
                dataKey="maintenance"
                stroke="#CC1F1A"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Maintenance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.requestStatusDist")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.overallCompletionRates")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={reportData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {reportData.statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {reportData.statusDistribution.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs text-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MTTR */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.meanTimeToRepair")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.avgHoursToResolve")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData.mttr} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7BA4" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7BA4" }} unit="h" />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => [`${v}h`, "MTTR"]}
              />
              <Bar
                dataKey="hours"
                fill="#CC1F1A"
                radius={[4, 4, 0, 0]}
                name="MTTR (hours)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Space Utilization */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.spaceUtilizationRate")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.bookingFrequency")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={reportData.spaceUtilization}
              layout="vertical"
              barSize={16}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#6B7BA4" }}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="space"
                tick={{ fontSize: 10, fill: "#6B7BA4" }}
                width={75}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => [`${v}%`, "Utilization"]}
              />
              <Bar
                dataKey="utilization"
                radius={[0, 4, 4, 0]}
                name="Utilization"
              >
                {reportData.spaceUtilization.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.utilization >= 80
                        ? "#CC1F1A"
                        : entry.utilization >= 60
                          ? "#F5B800"
                          : "#16A34A"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget vs Actual – full width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.budgetVsActual")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.plannedVsActual")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={reportData.costTracking} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7BA4" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7BA4" }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                key="planned-bar"
                dataKey="planned"
                fill="#6C9BDC"
                radius={[4, 4, 0, 0]}
                name="Planned Budget"
              />
              <Bar
                key="actual-bar"
                dataKey="actual"
                fill="#1A3580"
                radius={[4, 4, 0, 0]}
                name="Actual Cost"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Repair Cost per Ticket – full width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271]">
              {t("reports.repairCostPerTicket")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.materialsLaborBreakdown")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={repairCostData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="ticket"
                tick={{ fontSize: 10, fill: "#6B7BA4" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7BA4" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                key="material-bar"
                dataKey="material"
                stackId="a"
                fill="#F5B800"
                name="Material Cost"
              />
              <Bar
                key="labor-bar"
                dataKey="labor"
                stackId="a"
                fill="#CC1F1A"
                radius={[4, 4, 0, 0]}
                name="Labor Cost"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance Radar */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271] flex items-center gap-2">
              <Users size={15} /> {t("reports.teamPerformance")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.multiDimensional")}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: "#6B7BA4" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
              />
              <Radar
                key="tekle-radar"
                name="Tekle Haile"
                dataKey="Tekle Haile"
                stroke="#1A3580"
                fill="#1A3580"
                fillOpacity={0.2}
              />
              <Radar
                key="dawit-radar"
                name="Dawit Tadesse"
                dataKey="Dawit Tadesse"
                stroke="#CC1F1A"
                fill="#CC1F1A"
                fillOpacity={0.15}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Technician KPI Cards */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0E2271] flex items-center gap-2">
              <BarChart3 size={15} /> {t("reports.technicianKPIs")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("reports.individualPerformance")}
            </p>
          </div>
          <div className="space-y-4">
            {teamPerformanceData.map((tech, i) => (
              <div
                key={tech.name}
                className={`rounded-xl p-4 border ${i === 0 ? "border-[#1A3580]/20 bg-blue-50/40" : "border-[#CC1F1A]/20 bg-red-50/30"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ${i === 0 ? "bg-[#1A3580]" : "bg-[#CC1F1A]"}`}
                    >
                      {tech.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <span className="font-semibold text-sm text-[#0E2271]">
                      {tech.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${tech.satisfaction >= 85 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {tech.satisfaction}% {t("reports.satisfaction")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    {
                      label: t("reports.assigned"),
                      value: tech.assigned,
                      color: "#1A3580",
                    },
                    {
                      label: t("reports.completed"),
                      value: tech.completed,
                      color: "#16A34A",
                    },
                    {
                      label: "Avg MTTR",
                      value: `${tech.avgMTTR}h`,
                      color: "#CC1F1A",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-lg p-2 border border-border/50"
                    >
                      <p
                        className="font-bold text-lg"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {t("reports.completionRate_label")}
                    </span>
                    <span className="font-medium">
                      {Math.round((tech.completed / tech.assigned) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${(tech.completed / tech.assigned) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preventive Maintenance Schedule Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-[#0E2271] flex items-center gap-2">
              <Wrench size={15} /> {t("reports.preventiveMaintenanceSched")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("reports.recurringSystemMaint")}
            </p>
          </div>
          <div className="flex gap-2 text-xs flex-wrap">
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 font-medium">
              {preventiveSchedule.filter((s) => s.status === "Overdue").length}{" "}
              Overdue
            </span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
              {
                preventiveSchedule.filter((s) => s.status === "Due Today")
                  .length
              }{" "}
              Due Today
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200 font-medium">
              {preventiveSchedule.filter((s) => s.status === "Due Soon").length}{" "}
              Due Soon
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  ID
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.system_equipment")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.frequency")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.lastDone")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.nextDue")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.assignee")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("form.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {preventiveSchedule.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-secondary/30 ${item.status === "Overdue" ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#1A3580] font-semibold">
                    {item.id}
                  </td>
                  <td className="px-5 py-3 font-medium text-foreground">
                    {item.system}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {item.frequency}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {item.lastDone}
                  </td>
                  <td
                    className={`px-5 py-3 text-xs font-medium ${item.status === "Overdue" ? "text-red-600" : "text-foreground"}`}
                  >
                    {item.nextDue}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {item.assignee}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScheduleStyle(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-[#0E2271]">
            {t("reports.performanceSummary")}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.metric")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.capitalProjects")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.spaceAndBooking")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.maintenance_col")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("reports.total_col")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                [
                  t("reports.totalRequests_row"),
                  projects.length,
                  bookings.length,
                  maintenanceItems.length,
                  projects.length +
                    bookings.length +
                    maintenanceItems.length,
                ],
                [
                  t("reports.completedConfirmed"),
                  projects.filter((p) => p.status === "Completed").length,
                  bookings.filter((b) => b.status === "Approved").length,
                  maintenanceItems.filter((m) => m.status === "Closed")
                    .length,
                  projects.filter((p) => p.status === "Completed").length +
                  bookings.filter((b) => b.status === "Approved").length +
                  maintenanceItems.filter((m) => m.status === "Closed").length,
                ],
                [
                  t("reports.pendingOpen"),
                  projects.filter((p) => p.status === "Submitted").length,
                  bookings.filter((b) => b.status === "Submitted").length,
                  maintenanceItems.filter((m) => m.status === "Submitted")
                    .length,
                  projects.filter((p) => p.status === "Submitted").length +
                    bookings.filter((b) => b.status === "Submitted")
                      .length +
                    maintenanceItems.filter((m) => m.status === "Submitted")
                      .length,
                ],
                [
                  t("reports.rejectedCancelled"),
                  projects.filter((p) => p.status === "Rejected").length,
                  bookings.filter((b) => b.status === "Rejected").length,
                  0,
                  projects.filter((p) => p.status === "Rejected").length +
                    bookings.filter((b) => b.status === "Rejected").length,
                ],
              ].map(([label, ...values]) => (
                <tr key={label as string} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {label}
                  </td>
                  {values.map((v, i) => (
                    <td key={i} className="px-5 py-3 text-muted-foreground">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
