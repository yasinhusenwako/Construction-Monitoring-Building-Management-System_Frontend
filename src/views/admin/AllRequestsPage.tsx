"use client";

import { exportToCSV } from "@/lib/exportUtils";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  adminAssignProfessional,
  adminAssignRequest,
  adminDecision,
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveUsers,
} from "@/lib/live-api";
import type { Project, Booking, Maintenance, User as UserType } from "@/types/models";
import { divisions } from "@/types/models";
import {
  ArrowLeft,
  Search,
  X,
  FolderOpen,
  Calendar,
  Wrench,
  ChevronRight,
  MapPin,
  DollarSign,
  Users,
  Clock,
  FileText,
  User,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Building2,
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

/**
 * Suggests a division based on keywords in the title, description, and category.
 */
function suggestDivision(title: string, description: string, category: string): string {
  const text = `${title} ${description} ${category}`.toLowerCase();
  for (const div of divisions) {
    if (div.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return div.id;
    }
  }
  // Default to facility admin if no matches
  return "DIV-002"; 
}

/**
 * Filters the list of users to find supervisors belonging to a specific division.
 */
function getSupervisorsByDivision(users: UserType[], divisionId: string): Array<{ id: string; name: string }> {
  return users
    .filter((u) => u.role === "supervisor" && (u.divisionId === divisionId || !divisionId))
    .map((u) => ({ id: u.id, name: u.name }));
}

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

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  req,
  onClose,
  onNavigate,
  token,
  onRefresh,
  getUserInfo,
  users,
}: {
  req: UnifiedRequest;
  onClose: () => void;
  onNavigate: (path: string) => void;
  token?: string;
  onRefresh: () => Promise<void> | void;
  getUserInfo: (userId: string) => UserType | undefined;
  users: UserType[];
}) {
  const { t } = useLanguage();
  const meta = MODULE_META[req.module];
  const requester = getUserInfo(req.requestedBy);
  const [adminNote, setAdminNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const [actionError, setActionError] = useState("");
  const [liveSupervisors, setLiveSupervisors] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [liveProfessionals, setLiveProfessionals] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [assignMode, setAssignMode] = useState<"team" | "professional">("team");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>(() => {
    if (req.module === "Maintenance") {
      const m = req.raw as Maintenance;
      return (
        m.divisionId || suggestDivision(m.title, m.description, m.type) || ""
      );
    }
    if (req.module === "Projects") {
      return (req.raw as Project).divisionId || "";
    }
    return "";
  });
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(() => {
    if (req.module === "Maintenance") {
      return (req.raw as Maintenance).supervisorId || "";
    }
    if (req.module === "Projects") {
      return (req.raw as Project).assignedSupervisorId || (req.raw as Project).supervisorId || "";
    }
    return "";
  });

  useEffect(() => {
    const loadUsers = async () => {
      if (!token) return;
      try {
        const users = await fetchLiveUsers(token);
        setLiveSupervisors(
          users
            .filter((u) => u.role === "supervisor")
            .map((u) => ({ id: u.id, name: u.name })),
        );
        setLiveProfessionals(
          users
            .filter((u) => u.role === "professional")
            .map((u) => ({ id: u.id, name: u.name })),
        );
      } catch {
        setLiveSupervisors([]);
        setLiveProfessionals([]);
      }
    };
    loadUsers();
  }, [token]);

  const availableSupervisors = useMemo(() => {
    if (liveSupervisors.length > 0) return liveSupervisors;
    // Fallback using the passed users list and division filter
    return selectedDivision ? getSupervisorsByDivision(users, selectedDivision) : [];
  }, [liveSupervisors, selectedDivision, users]);

  const sendNote = () => {
    if (!adminNote.trim()) return;
    setNoteSent(true);
    setAdminNote("");
    setTimeout(() => setNoteSent(false), 3000);
  };

  const runAction = async (action: () => Promise<void>) => {
    setActionError("");
    setBusy(true);
    try {
      await action();
      await onRefresh();
      setNoteSent(true);
      setTimeout(() => setNoteSent(false), 3000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const detailPath =
    req.module === "Projects"
      ? `/dashboard/projects/${req.id}`
      : req.module === "Maintenance"
        ? `/dashboard/maintenance/${req.id}`
        : "/dashboard/bookings";

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(14,34,113,0.30)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ml-auto w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* ── Panel Header ───────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${meta.color}f2, ${meta.color})`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="text-white">{meta.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  {t(meta.label)}
                </span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white font-mono text-xs font-bold">
                  {req.id}
                </span>
              </div>
              <p className="text-white font-semibold text-sm leading-tight mt-0.5 truncate max-w-64">
                {req.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(detailPath)}
              title={t("requests.openFullDetail")}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Status + Priority row */}
          <div className="px-5 pt-4 pb-3 flex items-center gap-2 flex-wrap border-b border-border">
            <StatusBadge status={req.status} size="md" />
            {req.priority && <PriorityBadge priority={req.priority as any} />}
            <span className="ml-auto text-xs text-muted-foreground">
              {t("requests.submitted")} {req.date}
            </span>
          </div>

          {/* Requester Card */}
          {requester && (
            <div className="mx-5 mt-4 rounded-xl border border-border bg-secondary/30 p-3 flex items-center gap-3">
              <Avatar name={requester.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0E2271] truncate">
                  {requester.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {requester.department}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono text-muted-foreground">
                  {requester.id}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    requester.role === "admin"
                      ? "bg-[#EEF2FF] text-[#1A3580]"
                      : requester.role === "user"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {requester.role}
                </span>
              </div>
            </div>
          )}

          {/* ─── Project Detail ───────────────────────────────────────────────── */}
          {req.module === "Projects" &&
            (() => {
              const p = req.raw as Project;
              return (
                <div className="px-5 space-y-4 mt-4">
                  <Section title={t("form.description")}>
                    <p className="text-sm text-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </Section>

                  <Section title={t("projects.classification")}>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "#EEF2FF", color: "#1A3580" }}
                    >
                      <FolderOpen size={11} />{" "}
                      {p.classification.replace(/^A\d+\s*-\s*/, "")}
                    </span>
                  </Section>

                  <Section title={t("projects.projectDetails")}>
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: <MapPin size={13} />,
                          label: t("form.location"),
                          value: p.location,
                        },
                        {
                          icon: <DollarSign size={13} />,
                          label: t("form.budget"),
                          value: `ETB ${p.budget.toLocaleString()}`,
                        },
                        {
                          icon: <Calendar size={13} />,
                          label: t("form.startDate"),
                          value: p.startDate,
                        },
                        {
                          icon: <Calendar size={13} />,
                          label: t("form.endDate"),
                          value: p.endDate,
                        },
                        {
                          icon: <User size={13} />,
                          label: t("form.assignedTo"),
                          value:
                            getUserInfo(p.assignedTo || "")?.name ||
                            t("projects.notYetAssigned"),
                        },
                      ].map((item) => (
                        <DetailRow
                          key={item.label}
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          color="#1A3580"
                        />
                      ))}
                    </div>
                  </Section>

                  {p.documents.length > 0 && (
                    <Section
                      title={`${t("projects.documents")} (${p.documents.length})`}
                    >
                      <div className="space-y-1.5">
                        {p.documents.map((doc, i) => (
                          <a
                            key={i}
                            href={`/${doc}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors"
                            title={t("action.download") || "Download"}
                          >
                            <FileText size={13} className="text-[#1A3580]" />
                            <span className="text-xs flex-1 truncate">
                              {doc}
                            </span>
                            <Download
                              size={11}
                              className="text-muted-foreground hover:text-[#1A3580]"
                            />
                          </a>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title={t("projects.activityTimeline")}>
                    <Timeline events={p.timeline} color="#1A3580" />
                  </Section>

                  {/* --- Project Assignment Workflow (B2) --- */}
                  <Section title={t("requests.teamAssignment")}>
                    <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                      {/* Sub Tabs */}
                      <div className="flex p-1 bg-secondary/30 rounded-lg mb-2">
                        <button
                          onClick={() => setAssignMode("team")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "team"
                              ? "bg-white shadow-sm text-[#1A3580]"
                              : "text-muted-foreground hover:text-[#1A3580]"
                          }`}
                        >
                          {t("requests.assignToTeam") || "Assign Team"}
                        </button>
                        <button
                          onClick={() => setAssignMode("professional")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "professional"
                              ? "bg-white shadow-sm text-[#1A3580]"
                              : "text-muted-foreground hover:text-[#1A3580]"
                          }`}
                        >
                          {t("requests.assignDirect") || "Assign Direct"}
                        </button>
                      </div>

                      {assignMode === "team" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectDivision")}
                            </label>
                            <select
                              value={selectedDivision}
                              onChange={(e) => {
                                setSelectedDivision(e.target.value);
                                setSelectedSupervisor("");
                              }}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#1A3580]"
                            >
                              <option value="">
                                {t("requests.selectDivision")}
                              </option>
                              {divisions.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.assignLeadSupervisor")}
                            </label>
                            <select
                              disabled={!selectedDivision}
                              value={selectedSupervisor}
                              onChange={(e) =>
                                setSelectedSupervisor(e.target.value)
                              }
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#1A3580] disabled:opacity-50"
                            >
                              <option value="">
                                {t("requests.assignLeadSupervisor")}
                              </option>
                              {availableSupervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            disabled={!selectedDivision || !selectedSupervisor || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignRequest({
                                  module: "PROJECT",
                                  businessId: p.id,
                                  divisionId: selectedDivision,
                                  supervisorId: selectedSupervisor,
                                  priority: "Medium",
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#1A3580] hover:bg-[#0E2271] transition-all disabled:opacity-40"
                          >
                            {t("maintenance.assignSupervisor") ||
                              t("requests.processAssignment")}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectProfessional") || "Select Professional"}
                            </label>
                            <select
                              value={selectedProfessional}
                              onChange={(e) => setSelectedProfessional(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#1A3580]"
                            >
                              <option value="">{t("common.select") || "Select"}</option>
                              {liveProfessionals.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            disabled={!selectedProfessional || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignProfessional({
                                  module: "PROJECT",
                                  businessId: p.id,
                                  professionalId: selectedProfessional,
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#1A3580] hover:bg-[#0E2271] transition-all disabled:opacity-40"
                          >
                            {t("requests.assignDirect") || "Assign Direct"}
                          </button>
                        </>
                      )}
                    </div>
                  </Section>
                </div>
              );
            })()}

          {/* ─── Booking Detail ───────────────────────────────────────────────── */}
          {req.module === "Bookings" &&
            (() => {
              const b = req.raw as Booking;
              return (
                <div className="px-5 space-y-4 mt-4">
                  <Section title={t("bookings.step.eventDetails")}>
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: <Building2 size={13} />,
                          label: t("bookings.spaceName"),
                          value: b.space,
                        },
                        {
                          icon: <Calendar size={13} />,
                          label: t("form.date"),
                          value: b.date,
                        },
                        {
                          icon: <Clock size={13} />,
                          label: t("bookings.timeKey"),
                          value: `${b.startTime} – ${b.endTime}`,
                        },
                        {
                          icon: <Users size={13} />,
                          label: t("bookings.attendees"),
                          value: `${b.attendees} ${t("dashboard.attendees")}`,
                        },
                        {
                          icon: <FileText size={13} />,
                          label: t("form.type"),
                          value: b.type,
                        },
                      ].map((item) => (
                        <DetailRow
                          key={item.label}
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          color="#7C3AED"
                        />
                      ))}
                    </div>
                  </Section>

                  <Section title={t("bookings.purpose")}>
                    <p className="text-sm text-foreground leading-relaxed">
                      {b.purpose}
                    </p>
                  </Section>

                  <Section title={t("bookings.requirements")}>
                    <p className="text-sm text-foreground">
                      {b.requirements || "—"}
                    </p>
                  </Section>

                  <Section title={t("form.date")}>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        {t("projects.created")}:{" "}
                        <span className="font-medium text-foreground">
                          {b.createdAt}
                        </span>
                      </span>
                      <span>
                        {t("projects.lastUpdated")}:{" "}
                        <span className="font-medium text-foreground">
                          {b.updatedAt}
                        </span>
                      </span>
                    </div>
                  </Section>

                  {/* --- Booking Actions Workflow (B2) --- */}
                  <Section title="Booking Actions">
                    <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex gap-2">
                        {b.status === "Submitted" && (
                          <>
                            <button
                              onClick={() =>
                                runAction(async () => {
                                  await adminDecision({
                                    module: "BOOKING",
                                    businessId: b.id,
                                    action: "approve",
                                    token,
                                  });
                                })
                              }
                              className="flex-1 py-2 rounded-lg text-white text-xs font-semibold bg-green-600 hover:bg-green-700 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                runAction(async () => {
                                  await adminDecision({
                                    module: "BOOKING",
                                    businessId: b.id,
                                    action: "reject",
                                    token,
                                  });
                                })
                              }
                              className="flex-1 py-2 rounded-lg text-white text-xs font-semibold bg-red-600 hover:bg-red-700 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(b.status === "Approved" ||
                          b.status === "Rejected") && (
                          <button
                            onClick={() =>
                              runAction(async () => {
                                await adminDecision({
                                  module: "BOOKING",
                                  businessId: b.id,
                                  action: "close",
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-gray-600 hover:bg-gray-700 transition-all"
                          >
                            {t("requests.markClosed")}
                          </button>
                        )}
                      </div>
                    </div>
                  </Section>

                  <Section title={t("requests.assignment") || "Assignment"}>
                    <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                      {/* Sub Tabs */}
                      <div className="flex p-1 bg-secondary/30 rounded-lg mb-2">
                        <button
                          onClick={() => setAssignMode("team")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "team"
                              ? "bg-white shadow-sm text-[#7C3AED]"
                              : "text-muted-foreground hover:text-[#7C3AED]"
                          }`}
                        >
                          {t("requests.assignToTeam") || "Assign Team"}
                        </button>
                        <button
                          onClick={() => setAssignMode("professional")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "professional"
                              ? "bg-white shadow-sm text-[#7C3AED]"
                              : "text-muted-foreground hover:text-[#7C3AED]"
                          }`}
                        >
                          {t("requests.assignDirect") || "Assign Direct"}
                        </button>
                      </div>

                      {assignMode === "team" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectDivision")}
                            </label>
                            <select
                              value={selectedDivision}
                              onChange={(e) => {
                                setSelectedDivision(e.target.value);
                                setSelectedSupervisor("");
                              }}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#7C3AED]"
                            >
                              <option value="">{t("requests.selectDivision")}</option>
                              {divisions.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.assignLeadSupervisor")}
                            </label>
                            <select
                              disabled={!selectedDivision}
                              value={selectedSupervisor}
                              onChange={(e) => setSelectedSupervisor(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#7C3AED] disabled:opacity-50"
                            >
                              <option value="">{t("requests.assignLeadSupervisor")}</option>
                              {availableSupervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            disabled={!selectedDivision || !selectedSupervisor || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignRequest({
                                  module: "BOOKING",
                                  businessId: b.id,
                                  divisionId: selectedDivision,
                                  supervisorId: selectedSupervisor,
                                  priority: "Medium",
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#7C3AED] hover:bg-[#5B21B6] transition-all disabled:opacity-40"
                          >
                            {t("requests.processAssignment")}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectProfessional") || "Select Professional"}
                            </label>
                            <select
                              value={selectedProfessional}
                              onChange={(e) => setSelectedProfessional(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#7C3AED]"
                            >
                              <option value="">{t("common.select") || "Select"}</option>
                              {liveProfessionals.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            disabled={!selectedProfessional || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignProfessional({
                                  module: "BOOKING",
                                  businessId: b.id,
                                  professionalId: selectedProfessional,
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#7C3AED] hover:bg-[#5B21B6] transition-all disabled:opacity-40"
                          >
                            {t("requests.assignDirect") || "Assign Direct"}
                          </button>
                        </>
                      )}
                    </div>
                  </Section>
                </div>
              );
            })()}

          {/* ─── Maintenance Detail ──────────────────────────────────────────── */}
          {req.module === "Maintenance" &&
            (() => {
              const m = req.raw as Maintenance;
              const assignee = getUserInfo(m.assignedTo || "");
              return (
                <div className="px-5 space-y-4 mt-4">
                  <Section title={t("maintenance.issueDescription")}>
                    <p className="text-sm text-foreground leading-relaxed">
                      {m.description}
                    </p>
                    {m.notes && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-amber-800 mb-0.5">
                          {t("maintenance.additionalNotes")}
                        </p>
                        <p className="text-xs text-amber-700">{m.notes}</p>
                      </div>
                    )}
                  </Section>

                  <Section title={t("maintenance.ticketDetails")}>
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: <FileText size={13} />,
                          label: t("form.type"),
                          value: m.type,
                        },
                        {
                          icon: <MapPin size={13} />,
                          label: t("maintenance.location_label"),
                          value: m.location,
                        },
                        {
                          icon: <MapPin size={13} />,
                          label: t("maintenance.floor_label"),
                          value: m.floor,
                        },
                        {
                          icon: <User size={13} />,
                          label: t("form.assignedTo"),
                          value: assignee?.name || t("maintenance.unassigned"),
                        },
                        {
                          icon: <Clock size={13} />,
                          label:
                            t("maintenance.reported_label") ||
                            t("maintenance.reportedOn"),
                          value: m.createdAt,
                        },
                        {
                          icon: <Clock size={13} />,
                          label: t("maintenance.resolved_label"),
                          value: m.resolvedAt || t("maintenance.pending_label"),
                        },
                      ].map((item) => (
                        <DetailRow
                          key={item.label}
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          color="#CC1F1A"
                        />
                      ))}
                    </div>
                  </Section>

                  {m.attachments.length > 0 && (
                    <Section
                      title={`${t("maintenance.attachments_label")} (${m.attachments.length})`}
                    >
                      <div className="space-y-1.5">
                        {m.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={`/${att}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors"
                            title={t("action.download") || "Download"}
                          >
                            <FileText size={13} className="text-[#CC1F1A]" />
                            <span className="text-xs flex-1 truncate">
                              {att}
                            </span>
                            <Download
                              size={11}
                              className="text-muted-foreground hover:text-[#CC1F1A]"
                            />
                          </a>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title={t("maintenance.activityTimeline")}>
                    <Timeline events={m.timeline} color="#CC1F1A" />
                  </Section>

                  <Section title={t("requests.assignment") || "Assignment"}>
                    <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex p-1 bg-secondary/30 rounded-lg mb-2">
                        <button
                          onClick={() => setAssignMode("team")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "team"
                              ? "bg-white shadow-sm text-[#CC1F1A]"
                              : "text-muted-foreground hover:text-[#CC1F1A]"
                          }`}
                        >
                          {t("requests.assignToTeam") || "Assign Team"}
                        </button>
                        <button
                          onClick={() => setAssignMode("professional")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            assignMode === "professional"
                              ? "bg-white shadow-sm text-[#CC1F1A]"
                              : "text-muted-foreground hover:text-[#CC1F1A]"
                          }`}
                        >
                          {t("requests.assignDirect") || "Assign Direct"}
                        </button>
                      </div>

                      {assignMode === "team" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectDivision")}
                            </label>
                            <select
                              value={selectedDivision}
                              onChange={(e) => {
                                setSelectedDivision(e.target.value);
                                setSelectedSupervisor("");
                              }}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#CC1F1A]"
                            >
                              <option value="">{t("requests.selectDivision")}</option>
                              {divisions.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectSupervisor")}
                            </label>
                            <select
                              disabled={!selectedDivision}
                              value={selectedSupervisor}
                              onChange={(e) => setSelectedSupervisor(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#CC1F1A] disabled:opacity-50"
                            >
                              <option value="">{t("requests.selectSupervisor")}</option>
                              {availableSupervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            disabled={!selectedDivision || !selectedSupervisor || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignRequest({
                                  module: "MAINTENANCE",
                                  businessId: m.id,
                                  divisionId: selectedDivision,
                                  supervisorId: selectedSupervisor,
                                  priority: m.priority || "Medium",
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#CC1F1A] hover:bg-[#991B1B] transition-all disabled:opacity-40"
                          >
                            {t("maintenance.assignSupervisor") || t("requests.processAssignment")}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                              {t("requests.selectProfessional") || "Select Professional"}
                            </label>
                            <select
                              value={selectedProfessional}
                              onChange={(e) => setSelectedProfessional(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#CC1F1A]"
                            >
                              <option value="">{t("common.select") || "Select"}</option>
                              {liveProfessionals.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            disabled={!selectedProfessional || busy}
                            onClick={() =>
                              runAction(async () => {
                                await adminAssignProfessional({
                                  module: "MAINTENANCE",
                                  businessId: m.id,
                                  professionalId: selectedProfessional,
                                  token,
                                });
                              })
                            }
                            className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#CC1F1A] hover:bg-[#991B1B] transition-all disabled:opacity-40"
                          >
                            {t("requests.assignDirect") || "Assign Direct"}
                          </button>
                        </>
                      )}
                    </div>
                  </Section>
                </div>
              );
            })()}

          {/* ─── Admin Note ───────────────────────────────────────────────────── */}
          <div className="mx-5 mt-4 mb-6 rounded-xl border border-[#1A3580]/20 bg-[#EEF2FF]/60 p-4">
            <p className="text-xs font-semibold text-[#0E2271] mb-2 flex items-center gap-1.5">
              <User size={12} /> {t("requests.adminNote")}
            </p>
            {noteSent && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2 text-xs text-green-700">
                <CheckCircle size={12} /> {t("requests.noteSent")}
              </div>
            )}
            {actionError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2 text-xs text-red-700">
                <AlertTriangle size={12} /> {actionError}
              </div>
            )}
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder={t("requests.adminNotePlaceholder")}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white outline-none focus:border-[#1A3580] resize-none"
            />
            <button
              onClick={sendNote}
              disabled={!adminNote.trim()}
              className="mt-2 w-full py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-40 transition-all"
              style={{
                background: "linear-gradient(135deg, #0E2271, #1A3580)",
              }}
            >
              {t("requests.sendNote")}
            </button>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onNavigate(detailPath)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${meta.color}e0, ${meta.color})`,
            }}
          >
            {t("requests.openFullDetail")} <ExternalLink size={13} />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable bits ──────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0" style={{ color }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Timeline({
  events,
  color,
}: {
  events: {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    note?: string;
  }[];
  color: string;
}) {
  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2"
              style={{ background: color + "15", borderColor: color }}
            >
              <Clock size={10} style={{ color }} />
            </div>
            {i < events.length - 1 && (
              <div
                className="w-0.5 flex-1 mt-1"
                style={{ background: color + "30" }}
              />
            )}
          </div>
          <div className="pb-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={ev.action} />
              <span className="text-xs text-muted-foreground">
                {ev.timestamp}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              by <span className="font-medium text-foreground">{ev.actor}</span>
            </p>
            {ev.note && (
              <p className="text-xs text-foreground mt-1 bg-secondary/60 rounded px-2 py-1.5 leading-relaxed">
                {ev.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [selectedReq, setSelectedReq] = useState<UnifiedRequest | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(sessionStorage.getItem("insa_token") || undefined);
    }
  }, []);

  // ─── Live data fetched from backend ────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const getUserInfo = useCallback((userId: string) => {
    return users.find((u) => String(u.id) === String(userId));
  }, [users]);

  const refresh = async () => {
    try {
      const [liveProjects, liveBookings, liveMaintenance, liveUsers] = await Promise.all([
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
      {/* Detail Panel */}
      {selectedReq && (
        <DetailPanel
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          token={token}
          users={users}
          getUserInfo={getUserInfo}
          onRefresh={refresh}
          onNavigate={(path) => {
            setSelectedReq(null);
            router.push(path);
          }}
        />
      )}

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
              const isSelected = selectedReq?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className={`px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-secondary/30 group ${
                    isSelected ? "bg-[#EEF2FF]" : ""
                  }`}
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
                        {meta.label}
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
                    className={`flex-shrink-0 transition-all ${
                      isSelected
                        ? "text-[#1A3580]"
                        : "text-muted-foreground/40 group-hover:text-muted-foreground"
                    }`}
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
