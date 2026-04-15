"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Maintenance } from '@/types/models';
import { divisions } from '@/data/mockData';
import {
  canTransition,
  canViewItem,
  WorkflowRole,
  WorkflowStatus,
} from '@/lib/workflow';
import {
  addNotification,
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from '@/lib/notifications';
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
} from "@/lib/live-api";
import {
  StatusBadge,
  PriorityBadge,
} from '@/components/common/StatusBadge';
import { Plus, Search, Wrench, Clock, CheckCircle } from "lucide-react";
import { MaintenanceListItem } from "./MaintenanceListItem";

export function MaintenancePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const role = currentUser?.role;

  const [view, setView] = useState<"list">("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [copied, setCopied] = useState("");
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [maintenanceItems, setMaintenanceItems] =
    useState<Maintenance[]>([]);

  useEffect(() => {
    const refresh = async () => {
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      try {
        const [liveMaintenance, liveProjects, liveBookings] = await Promise.all([
          fetchLiveMaintenance(token),
          fetchLiveProjects(token),
          fetchLiveBookings(token),
        ]);
        let items: Maintenance[] = liveMaintenance;
        if (role === "professional") {
          items = [
            ...liveMaintenance,
            ...(liveProjects as unknown as Maintenance[]),
            ...(liveBookings as unknown as Maintenance[]),
          ];
        }
        setMaintenanceItems(items);
      } catch {
        // backend unreachable
      }
    };
    void refresh();
  }, [role]);

  const getFilteredProfessionals = (_m?: Maintenance) => {
    return [];
  };

  const types = [
    "All",
    "HVAC",
    "Electrical",
    "Plumbing",
    "Structural",
    "General",
    "Urgent Repair",
  ];
  const priorities = ["All", "Critical", "High", "Medium", "Low"];

  const filtered = maintenanceItems.filter((m) => {
    // Mock Data structures differ slightly between resources
    const mType = (m as any).type || (m as any).category || "";
    const mPriority = m.priority || "Medium";
    const mDescription = m.description || (m as any).purpose || "";

    const matchRole = canViewItem(
      role as WorkflowRole | undefined,
      m as any,
      currentUser?.id,
    );
    const matchSearch =
      !search ||
      (((m as any).title as string) || ((m as any).purpose as string) || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      mDescription.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || mType === typeFilter;
    const matchPriority =
      priorityFilter === "All" || mPriority === priorityFilter;

    // Override: Bookings do not have priority, default to Medium and let them show if Priority == Medium or All
    return matchRole && matchSearch && matchType && matchPriority;
  });

  const professionalSpecificStats =
    role === "professional"
      ? {
          assigned: filtered.length,
          inProgress: filtered.filter((m) => m.status === "In Progress").length,
          completed: filtered.filter((m) =>
            [
              "Completed",
              "Reviewed",
              "Approved",
              "Rejected",
              "Closed",
            ].includes(m.status),
          ).length,
        }
      : null;

  const copyId = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = id;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const applyTransition = (
    m: Maintenance,
    to: WorkflowStatus,
    actorRole: WorkflowRole,
    msg: string,
  ) => {
    if (!canTransition(actorRole, m.status, to)) {
      setActionMsg(t("maintenance.notAllowed"));
      setTimeout(() => setActionMsg(""), 3000);

      return false;
    }
    m.status = to;
    m.updatedAt = new Date().toISOString();
    // TODO: call API endpoint to persist status change

    if (to === "Completed" && actorRole === "professional" && m.supervisorId) {
      addNotification(
        createNotification({
          title: "Task Completed",
          message: `${m.id} has been completed and needs review.`,
          userId: m.supervisorId,
          link: m.id.startsWith("PRJ-")
            ? `/dashboard/projects/${m.id}`
            : m.id.startsWith("BKG-")
              ? `/dashboard/bookings/${m.id}`
              : `/dashboard/maintenance/${m.id}`,
          type: "info",
        }),
      );
    }
    if (to === "Reviewed" && actorRole === "supervisor") {
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "Task Ready for Approval",
            message: `${m.id} reviewed by supervisor, awaiting admin approval.`,
            userId: id,
            link: m.id.startsWith("PRJ-")
              ? `/dashboard/projects/${m.id}`
              : m.id.startsWith("BKG-")
                ? `/dashboard/bookings/${m.id}`
                : `/dashboard/maintenance/${m.id}`,
            type: "info",
          }),
        ),
      );
    }
    if (
      (to === "Approved" || to === "Rejected" || to === "Closed") &&
      actorRole === "admin"
    ) {
      addNotification(
        createNotification({
          title: `Task ${to}`,
          message: `Your request ${m.id} has been ${to.toLowerCase()}.`,
          userId: m.requestedBy,
          link: m.id.startsWith("PRJ-")
            ? `/dashboard/projects/${m.id}`
            : m.id.startsWith("BKG-")
              ? `/dashboard/bookings/${m.id}`
              : `/dashboard/maintenance/${m.id}`,
          type:
            to === "Approved"
              ? "success"
              : to === "Rejected"
                ? "error"
                : "info",
        }),
      );
    }
    setMaintenanceItems((prev) => [...prev]);
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
    return true;
  };

  const handleAssignConfirm = (m: Maintenance) => {
    const techName = selectedTech;
    if (role === "admin") {
      if (
        !applyTransition(
          m,
          "Assigned to Supervisor",
          "admin",
          `${t("maintenance.assigned_to")} ${techName}`,
        )
      ) {
        return;
      }
      m.supervisorId = selectedTech;
      addNotification(
        createNotification({
          title: "Task Assigned",
          message: `You have been assigned ${m.id} for supervision.`,
          userId: selectedTech,
          link: m.id.startsWith("PRJ-")
            ? `/dashboard/projects/${m.id}`
            : m.id.startsWith("BKG-")
              ? `/dashboard/bookings/${m.id}`
              : `/dashboard/maintenance/${m.id}`,
          type: "warning",
        }),
      );
    }

    if (role === "supervisor") {
      if (
        !applyTransition(
          m,
          "Assigned to Professional",
          "supervisor",
          `${t("maintenance.assigned_to")} ${techName}`,
        )
      ) {
        return;
      }
      m.assignedTo = selectedTech;
      addNotification(
        createNotification({
          title: "Task Assigned",
          message: `You have been assigned ${m.id} to complete.`,
          userId: selectedTech,
          link: m.id.startsWith("PRJ-")
            ? `/dashboard/projects/${m.id}`
            : m.id.startsWith("BKG-")
              ? `/dashboard/bookings/${m.id}`
              : `/dashboard/maintenance/${m.id}`,
          type: "warning",
        }),
      );
    }
    m.updatedAt = new Date().toISOString();
    // TODO: call API endpoint to persist assignment

    setSelectedTech("");
  };

  const handleCreateWorkOrder = (m: Maintenance) => {
    const created = applyTransition(
      m,
      "WorkOrder Created",
      "supervisor",
      `${t("maintenance.workOrderCreatedFor")} ${m.id}`,
    );

    if (created && !m.workOrderId) {
      m.workOrderId = `WO-${m.id}`;
    }
    m.updatedAt = new Date().toISOString();
    // TODO: persist via API
    setMaintenanceItems((prev) => [...prev]);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#CC1F1A]" />
            <span className="text-xs font-semibold text-[#CC1F1A] uppercase tracking-wider">
              {role === "professional"
                ? t("dashboard.activeOperations")
                : t("maintenance.urgentRepairsHVAC")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">
            {role === "professional"
              ? t("nav.myTasks")
              : t("maintenance.maintenanceAndRepairs")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {role === "professional"
              ? t("maintenance.yourAssignedTasks")
              : `${filtered.length} ${t("maintenance.ticketsCount")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === "user" && (
            <button
              onClick={() => router.push("/dashboard/maintenance/new")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm"
              style={{
                background: "linear-gradient(135deg, #7A0E0E, #CC1F1A)",
              }}
            >
              <Plus size={16} /> {t("maintenance.newRequest_btn")}
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* Role-specific stats for Professionals */}
      {role === "professional" && professionalSpecificStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-[#1A3580]">
              <Wrench size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A3580]">
                {professionalSpecificStats.assigned}
              </p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                {t("maintenance.assignedTasks")}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-orange-600">
                {professionalSpecificStats.inProgress}
              </p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                {t("maintenance.inProgress")}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">
                {professionalSpecificStats.completed}
              </p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                {t("maintenance.completed")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("maintenance.searchByTitleOrID")}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#CC1F1A]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none cursor-pointer"
        >
          {types.map((t_item) => (
            <option key={t_item}>
              {t_item === "All" ? t("status.all") : t_item}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none cursor-pointer"
        >
          {priorities.map((p) => (
            <option key={p}>{p === "All" ? t("status.all") : p}</option>
          ))}
        </select>
      </div>

      {/* List View */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-16 text-center">
            <Wrench
              size={48}
              className="mx-auto text-muted-foreground/40 mb-3"
            />
            <h3 className="text-[#0E2271]">
              {t("maintenance.noTicketsFound")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("maintenance.noTicketsMatch")}
            </p>
          </div>
        ) : (
          filtered.map((m) => {
            return (
              <MaintenanceListItem
                key={m.id}
                m={m}
                role={role}
                tech={undefined}
                onCopyId={copyId}
                copiedId={copied}
                onAssign={(id) =>
                  setAssignTarget(assignTarget === id ? null : id)
                }
                onStartReview={(m) =>
                  applyTransition(
                    m,
                    "Under Review",
                    "admin",
                    t("maintenance.reviewStarted"),
                  )
                }
                onCreateWorkOrder={handleCreateWorkOrder}
                onStartWork={(m) =>
                  applyTransition(
                    m,
                    "In Progress",
                    "professional",
                    t("maintenance.taskStarted"),
                  )
                }
                onCompleteWork={(m) =>
                  applyTransition(
                    m,
                    "Completed",
                    "professional",
                    t("maintenance.workSubmitted"),
                  )
                }
                onApprove={(m) =>
                  applyTransition(
                    m,
                    "Reviewed",
                    "supervisor",
                    t("maintenance.reviewSubmitted"),
                  )
                }
                onFinalApprove={(m) =>
                  applyTransition(m, "Approved", "admin", t("status.approved"))
                }
                onReject={(m) =>
                  applyTransition(m, "Rejected", "admin", t("status.rejected"))
                }
                onClose={(m) =>
                  applyTransition(m, "Closed", "admin", t("status.closed"))
                }
                assignTarget={assignTarget}
                selectedTech={selectedTech}
                onSelectTech={setSelectedTech}
                onConfirmAssign={handleAssignConfirm}
                onCancelAssign={() => {
                  setAssignTarget(null);
                  setSelectedTech("");
                }}
                filteredProfessionals={[]}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
