"use client";

import { exportToCSV } from "@/lib/exportUtils";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveUsers,
} from "@/lib/live-api";
import type {
  Project,
  Booking,
  Maintenance,
  User as UserType,
} from "@/types/models";
import {
  ArrowLeft,
  Search,
  X,
  FolderOpen,
  Calendar,
  Wrench,
  ChevronRight,
  MapPin,
  Filter,
  Download,
  AlertTriangle,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Module = "All" | "Projects" | "Bookings" | "Maintenance";
type SortKey = "date" | "status" | "requester" | "module";

interface UnifiedRequest {
  id: string;
  module: "Projects" | "Bookings" | "Maintenance";
  title: string;
  status: string;
  priority?: string;
  requestedBy: string;
  date: string;
  raw: Project | Booking | Maintenance;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MODULE_META = {
  Projects: {
    color: "#1A3580",
    bg: "#EEF2FF",
    icon: <FolderOpen size={13} />,
    label: "requests.module.project",
  },
  Bookings: {
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: <Calendar size={13} />,
    label: "requests.module.booking",
  },
  Maintenance: {
    color: "#CC1F1A",
    bg: "#FFF1F1",
    icon: <Wrench size={13} />,
    label: "requests.module.maintenance",
  },
};

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

// getUserInfo is now handled inside the component with access to live users state


function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz =
    size === "lg"
      ? "w-10 h-10 text-sm"
      : size === "md"
        ? "w-8 h-8 text-xs"
        : "w-6 h-6 text-xs";
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-[#0E2271] to-[#1A3580] flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// Navigation handled via router.push to module-specific detail pages

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function AllRequestsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeModule, setActiveModule] = useState<Module>("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Live data fetched from backend ────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const getUserInfo = useCallback(
    (userId: string) => {
      return users.find((u) => String(u.id) === String(userId));
    },
    [users],
  );

  const refresh = async () => {
    try {
      const [liveProjects, liveBookings, liveMaintenance, liveUsers] =
        await Promise.all([
          fetchLiveProjects(),
          fetchLiveBookings(),
          fetchLiveMaintenance(),
          fetchLiveUsers(),
        ]);
      setProjects(liveProjects);
      setBookings(liveBookings);
      setMaintenance(liveMaintenance);
      setUsers(liveUsers);
    } catch (err) {
      console.error("Failed to refresh dashboard data", err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // ─── Unify all requests ────────────────────────────────────────────────────
  const allRequests = useMemo<UnifiedRequest[]>(
    () => [
      ...projects.map((p) => ({
        id: p.id,
        module: "Projects" as const,
        title: p.title,
        status: p.status,
        requestedBy: p.requestedBy,
        date: p.createdAt,
        raw: p,
      })),
      ...bookings.map((b) => ({
        id: b.id,
        module: "Bookings" as const,
        title: b.title,
        status: b.status,
        requestedBy: b.requestedBy,
        date: b.createdAt,
        raw: b,
      })),
      ...maintenance.map((m) => ({
        id: m.id,
        module: "Maintenance" as const,
        title: m.title,
        status: m.status,
        priority: m.priority,
        requestedBy: m.requestedBy,
        date: m.createdAt,
        raw: m,
      })),
    ],
    [projects, bookings, maintenance],
  );

  const allStatuses = useMemo(() => {
    const base = ["All"];
    const seen = new Set<string>();
    allRequests.forEach((r) => seen.add(r.status));
    return [...base, ...Array.from(seen).sort()];
  }, [allRequests]);

  const requesterUsers = useMemo(() => {
    const ids = new Set(allRequests.map((r) => String(r.requestedBy)));
    return users.filter((u) => ids.has(String(u.id)));
  }, [allRequests, users]);

  const filtered = useMemo(() => {
    let list = allRequests;
    if (activeModule !== "All")
      list = list.filter((r) => r.module === activeModule);
    if (statusFilter !== "All")
      list = list.filter((r) => r.status === statusFilter);
    if (userFilter !== "All")
      list = list.filter((r) => r.requestedBy === userFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          getUserInfo(r.requestedBy)?.name.toLowerCase().includes(q) ||
          getUserInfo(r.requestedBy)?.department.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "requester")
        cmp = (getUserInfo(a.requestedBy)?.name || "").localeCompare(
          getUserInfo(b.requestedBy)?.name || "",
        );
      else if (sortKey === "module") cmp = a.module.localeCompare(b.module);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [
    allRequests,
    activeModule,
    statusFilter,
    userFilter,
    search,
    sortKey,
    sortAsc,
    getUserInfo,
  ]);

  const stats = useMemo(
    () => ({
      total: allRequests.length,
      projects: allRequests.filter((r) => r.module === "Projects").length,
      bookings: allRequests.filter((r) => r.module === "Bookings").length,
      maintenance: allRequests.filter((r) => r.module === "Maintenance").length,
      pending: allRequests.filter((r) =>
        ["Submitted", "Under Review", "Reviewed"].includes(r.status),
      ).length,
    }),
    [allRequests],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <ChevronRight
        size={11}
        className={`transition-transform ${sortAsc ? "-rotate-90" : "rotate-90"}`}
      />
    ) : null;

  return (
    <div className="space-y-5">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground mt-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A3580]" />
              <span className="text-xs font-semibold text-[#1A3580] uppercase tracking-wider">
                {t("role.ADMIN")} · {t("requests.allUserRequests")}
              </span>
            </div>
            <h1 className="text-[#0E2271]">{t("requests.allUserRequests")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("requests.unifiedView")} · {stats.total}{" "}
              {t("requests.requestsCount")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const exportData = filtered.map((r) => {
                const requester = getUserInfo(r.requestedBy);
                return {
                  ID: r.id,
                  Module: r.module,
                  Title: r.title,
                  Status: r.status,
                  Priority: r.priority || "N/A",
                  RequestedBy: requester?.name || r.requestedBy,
                  Department: requester?.department || "N/A",
                  Date: r.date,
                };
              });
              exportToCSV(
                exportData,
                `CMBM_Report_Admin_${new Date().toISOString().split("T")[0]}`,
              );
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-sm font-semibold text-[#1A3580] hover:bg-secondary transition-all shadow-sm"
          >
            <Download size={14} /> {t("requests.exportReport")}
          </button>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: t("reports.totalRequests_row"),
            value: stats.total,
            color: "#0E2271",
            bg: "#EEF2FF",
            icon: <LayoutList size={15} />,
          },
          {
            label: t("nav.projects"),
            value: stats.projects,
            color: "#1A3580",
            bg: "#EEF2FF",
            icon: <FolderOpen size={15} />,
          },
          {
            label: t("nav.bookings"),
            value: stats.bookings,
            color: "#7C3AED",
            bg: "#F5F3FF",
            icon: <Calendar size={15} />,
          },
          {
            label: t("nav.maintenance"),
            value: stats.maintenance,
            color: "#CC1F1A",
            bg: "#FFF1F1",
            icon: <Wrench size={15} />,
          },
          {
            label: t("requests.needsAttention"),
            value: stats.pending,
            color: "#F5B800",
            bg: "#FFFBEB",
            icon: <AlertTriangle size={15} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-border px-4 py-3 shadow-sm flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.bg, color: s.color }}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p
                className="text-xl font-bold leading-none"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Module Tab Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {(["All", "Projects", "Bookings", "Maintenance"] as Module[]).map(
            (mod) => {
              const meta = mod !== "All" ? MODULE_META[mod] : null;
              const count =
                mod === "All"
                  ? stats.total
                  : mod === "Projects"
                    ? stats.projects
                    : mod === "Bookings"
                      ? stats.bookings
                      : stats.maintenance;
              return (
                <button
                  key={mod}
                  onClick={() => {
                    setActiveModule(mod);
                    setStatusFilter("All");
                  }}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    activeModule === mod
                      ? "border-[#1A3580] text-[#1A3580]"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                >
                  {meta ? (
                    <span
                      style={{ color: activeModule === mod ? meta.color : "" }}
                    >
                      {meta.icon}
                    </span>
                  ) : (
                    <LayoutList size={13} />
                  )}
                  {mod === "All"
                    ? t("common.all")
                    : mod === "Projects"
                      ? t("nav.projects")
                      : mod === "Bookings"
                        ? t("nav.bookings")
                        : t("nav.maintenance")}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeModule === mod
                        ? "bg-[#EEF2FF] text-[#1A3580]"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
          <div className="flex-1" />
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
              showFilters
                ? "border-[#1A3580] text-[#1A3580] bg-[#EEF2FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal size={13} /> {t("requests.filtersBtn")}
          </button>
        </div>

        {/* ── Filters Bar ──────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-border flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("requests.searchRequests")}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 py-3 border-b border-border bg-secondary/20 flex gap-4 flex-wrap items-end">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                {t("form.status")}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      statusFilter === s
                        ? "bg-[#1A3580] text-white"
                        : "bg-secondary text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s === "All" ? t("common.all") : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Requester */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                {t("requests.requester")}
              </p>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm outline-none focus:border-[#1A3580]"
              >
                <option value="All">{t("requests.allUsersOption")}</option>
                {requesterUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setStatusFilter("All");
                setUserFilter("All");
                setSearch("");
              }}
              className="text-xs text-[#CC1F1A] hover:underline font-medium self-end pb-1.5"
            >
              {t("notifications.clearAll")}
            </button>
          </div>
        )}

        {/* ── Results count + sort ──────────────────────────────────────────── */}
        <div className="px-4 py-2.5 bg-secondary/10 flex items-center justify-between text-xs border-b border-border">
          <span className="text-muted-foreground">
            {t("common.showing")}{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            {t("common.of")} {allRequests.length} {t("requests.requestsCount")}
          </span>
          <div className="flex items-center gap-1">
            <Filter size={11} className="text-muted-foreground mr-1" />
            {(
              [
                ["date", t("requests.sortDate")],
                ["status", t("requests.sortStatus")],
                ["requester", t("requests.sortRequester")],
                ["module", t("requests.sortModule")],
              ] as [SortKey, string][]
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded transition-all ${
                  sortKey === k
                    ? "bg-[#1A3580] text-white"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {lbl} <SortIcon k={k} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Request List ─────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <LayoutList
              size={40}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <h3 className="text-[#0E2271] mb-1">
              {t("requests.noRequestsFound")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("requests.noRequestsMatch")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((req) => {
              const meta = MODULE_META[req.module];
              const requester = getUserInfo(req.requestedBy);
              return (
                <div
                  key={req.id}
                  onClick={() => {
                    const path =
                      req.module === "Projects"
                        ? `/dashboard/projects/${req.id}`
                        : req.module === "Maintenance"
                          ? `/dashboard/maintenance/${req.id}`
                          : `/dashboard/bookings/${req.id}`;
                    router.push(path);
                  }}
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-secondary/30 group"
                >
                  {/* Module Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.icon}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: meta.color }}
                      >
                        {req.id}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {t(meta.label)}
                      </span>
                      <StatusBadge status={req.status} />
                      {req.priority && (
                        <PriorityBadge priority={req.priority as any} />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#0E2271] truncate leading-snug">
                      {req.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.date}
                    </p>
                  </div>

                  {/* Requester */}
                  {requester && (
                    <div className="flex items-center gap-2 flex-shrink-0 hidden sm:flex">
                      <Avatar name={requester.name} size="sm" />
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-semibold text-foreground">
                          {requester.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {requester.department}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chevron */}
                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 transition-all text-muted-foreground/40 group-hover:text-[#1A3580] group-hover:translate-x-1"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
