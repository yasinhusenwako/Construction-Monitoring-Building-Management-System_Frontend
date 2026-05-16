"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { divisions } from "@/types/models";
import {
  fetchLiveMaintenance,
  fetchLiveUsers,
  supervisorAssignProfessional,
  supervisorReviewRequest,
} from "@/lib/live-api";
import { AssignProfessionalsDialog } from "@/components/maintenance/AssignProfessionalsDialog";
import { ProfessionalChipsCompact } from "@/components/common/ProfessionalChips";
import { useProfessionalsById } from "@/hooks/use-professionals";
import { CompletionReportModal } from "./CompletionReportModal";
import { AsyncState } from "@/components/common/AsyncState";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import {
  ClipboardList,
  CheckCircle,
  Send,
  User,
  Copy,
  ExternalLink,
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
  "Assigned to Supervisor": "status.assignedToSupervisor",
  "WorkOrder Created": "status.workOrderCreated",
  "Assigned to Professionals": "status.assignedToProfessional",
  "In Progress": "status.inProgress",
  Completed: "status.completed",
  Reviewed: "status.reviewed",
};

const typeTranslationKeys: Record<string, string> = {
  HVAC: "maintenance.hvacIssue",
  Electrical: "maintenance.electricalIssue",
  Plumbing: "maintenance.plumbingIssue",
  Structural: "maintenance.structuralIssue",
  General: "maintenance.generalIssue",
  "General Maintenance": "maintenance.generalIssue",
  "Urgent Repair": "maintenance.urgentRepair",
};

// Task Row Component
function TaskRow({
  task,
  copied,
  onCopyId,
  onAssign,
  onReport,
  translateType,
  router,
  t,
}: {
  task: any;
  copied: string;
  onCopyId: (id: string) => void;
  onAssign: () => void;
  onReport: () => void;
  translateType: (type?: string) => string;
  router: any;
  t: any;
}) {
  const { professionals } = useProfessionalsById(task.assignedToProfessionals || []);
  const detailPath = `/dashboard/maintenance/${task.id}`;

  return (
    <tr className="hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono text-xs font-semibold text-[#7C3AED]">
            {task.id}
          </span>
          <button
            onClick={() => onCopyId(task.id)}
            className="text-muted-foreground hover:text-[#7C3AED]"
          >
            {copied === task.id ? (
              <CheckCircle size={11} className="text-green-500" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        </div>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm font-medium text-foreground truncate">
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {task.description || ""}
        </p>
        {/* Display assigned professionals */}
        {professionals.length > 0 && (
          <div className="mt-1">
            <ProfessionalChipsCompact professionals={professionals} maxDisplay={2} />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {translateType(task.type)}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={task.priority || "Medium"} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {task.location || "-"}
        {task.floor ? `, ${task.floor}` : ""}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {task.createdAt.split("T")[0].split(" ")[0]}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push(detailPath)}
            className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline font-medium"
          >
            <ExternalLink size={12} /> {t("action.view")}
          </button>
          {task.status === "Completed" && (
            <button
              onClick={onReport}
              className="flex items-center gap-1 text-xs text-white px-2 py-1 rounded bg-[#0891B2] hover:bg-[#0e7490] font-medium"
            >
              <Send size={12} /> {t("supervisor.submitReport")}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function TaskManagementPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const uid = currentUser?.id || "";

  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const translateStatus = (status: string) =>
    statusTranslationKeys[status] ? t(statusTranslationKeys[status]) : status;
  const translateType = (type?: string) =>
    type && typeTranslationKeys[type] ? t(typeTranslationKeys[type]) : type || t("maintenance.title");
  const translatePriority = (priority: string) =>
    t(`priority.${priority.toLowerCase()}` as any);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        const [maintenance, liveUsers] = await Promise.all([
          fetchLiveMaintenance(),
          fetchLiveUsers(),
        ]);
        setAllTasks([...maintenance]);
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
  }, [currentUser?.divisionId, uid]);

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

  const handleAssign = async (professionalIds: string[], instructions: string) => {
    if (!selectedTask) return;

    try {
      // For now, assign to the first professional (backward compatible)
      // TODO: Update backend API to accept multiple professional IDs
      await supervisorAssignProfessional({
        module: "MAINTENANCE",
        businessId: selectedTask.id,
        professionalId: professionalIds[0], // Use first professional for now
        instructions,
      });

      setAllTasks((prev) =>
        prev.map((item) =>
          item.id === selectedTask.id
            ? {
                ...item,
                status: "Assigned to Professionals",
                assignedTo: professionalIds[0],
                assignedToProfessionals: professionalIds, // Store all assigned professionals
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setActionMsg(t("supervisor.action.assigned"));
      setTimeout(() => setActionMsg(""), 4000);
      setShowAssignDialog(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Assignment failed:", error);
      setActionMsg(t("common.error"));
      throw error; // Re-throw to let dialog handle error display
    }
  };

  const handleSubmitReport = async (id: string) => {
    const task = myTasks.find((item) => item.id === id);
    if (!task) return;

    try {
      await supervisorReviewRequest({
        module: "MAINTENANCE",
        businessId: id,
      });
      setAllTasks((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Reviewed",
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setActionMsg(t("supervisor.action.reportSubmitted", { id }));
      setTimeout(() => setActionMsg(""), 4000);
    } catch (error) {
      console.error("Review failed:", error);
      setActionMsg(t("common.error"));
    }
    setReportTarget(null);
  };

  const assignTargetTask = myTasks.find((item) => item.id === assignTarget);

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

  const filteredTasks = useMemo(() => {
    let filtered = myTasks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.id.toLowerCase().includes(query) ||
          task.title.toLowerCase().includes(query) ||
          task.location.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((task) => task.type === typeFilter);
    }

    return filtered;
  }, [myTasks, priorityFilter, searchQuery, statusFilter, typeFilter]);

  if (loading) {
    return (
      <AsyncState
        title={t("loading.data")}
        state="loading"
        message={t("loading.pleaseWait")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Multiple Professional Assignment Dialog */}
      <AssignProfessionalsDialog
        isOpen={showAssignDialog}
        onClose={() => {
          setShowAssignDialog(false);
          setSelectedTask(null);
        }}
        onAssign={handleAssign}
        currentlyAssigned={selectedTask?.assignedToProfessionals || []}
        divisionId={normalizedUserDivision || undefined}
        title={`Assign Professionals - ${selectedTask?.title || ""}`}
      />

      {reportTarget && (
        <CompletionReportModal
          ticketId={reportTarget}
          onClose={() => {
            setReportTarget(null);
          }}
          onSubmit={handleSubmitReport}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("supervisor.taskManagement")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {currentUser?.name} · {divisionName}
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder={t("supervisor.taskSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allStatuses")}</option>
            <option value="Assigned to Supervisor">
              {t("status.assignedToSupervisor")}
            </option>
            <option value="WorkOrder Created">{t("status.workOrderCreated")}</option>
            <option value="Assigned to Professionals">
              {t("status.assignedToProfessional")}
            </option>
            <option value="In Progress">{t("status.inProgress")}</option>
            <option value="Completed">{t("status.completed")}</option>
            <option value="Reviewed">{t("status.reviewed")}</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allPriorities")}</option>
            <option value="Routine">{t("maintenance.priority.routine")}</option>
            <option value="Medium">{t("priority.medium")}</option>
            <option value="High">{t("priority.high")}</option>
            <option value="Critical">{t("priority.critical")}</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allTypes")}</option>
            <option value="HVAC">{t("maintenance.hvacIssue")}</option>
            <option value="Electrical">{t("maintenance.electricalIssue")}</option>
            <option value="Plumbing">{t("maintenance.plumbingIssue")}</option>
            <option value="Structural">{t("maintenance.structuralIssue")}</option>
            <option value="General">{t("maintenance.generalIssue")}</option>
            <option value="Urgent Repair">{t("maintenance.urgentRepair")}</option>
          </select>
        </div>

        {(searchQuery ||
          statusFilter !== "all" ||
          priorityFilter !== "all" ||
          typeFilter !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
            <span className="text-xs text-muted-foreground">
              {t("requests.activeFilters")}:
            </span>
            {searchQuery && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                {t("action.search")}: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:text-purple-900"
                >
                  x
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                {t("export.status")}: {translateStatus(statusFilter)}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-blue-900"
                >
                  x
                </button>
              </span>
            )}
            {priorityFilter !== "all" && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                {t("export.priority")}: {translatePriority(priorityFilter)}
                <button
                  onClick={() => setPriorityFilter("all")}
                  className="hover:text-orange-900"
                >
                  x
                </button>
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                {t("export.type")}: {translateType(typeFilter)}
                <button
                  onClick={() => setTypeFilter("all")}
                  className="hover:text-green-900"
                >
                  x
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setTypeFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              {t("notifications.clearAll")}
            </button>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {t("common.showing")}{" "}
            <span className="font-semibold text-foreground">
              {filteredTasks.length}
            </span>{" "}
            {t("common.of")}{" "}
            <span className="font-semibold text-foreground">{myTasks.length}</span>{" "}
            {t("supervisor.tasksLabel")}
          </p>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <ClipboardList
            size={48}
            className="mx-auto text-muted-foreground/40 mb-3"
          />
          <h3 className="text-[#0E2271]">
            {myTasks.length === 0
              ? t("supervisor.noTasksAssigned")
              : t("requests.noRequestsFound")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {myTasks.length === 0
              ? t("supervisor.noTasksDesc")
              : t("requests.tryAdjusting")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {t("maintenance.ticketID")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.title")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("maintenance.type")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.status")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("maintenance.priority")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.location")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.updated")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => {
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      copied={copied}
                      onCopyId={copyId}
                      onAssign={() => {
                        setSelectedTask(task);
                        setShowAssignDialog(true);
                      }}
                      onReport={() => setReportTarget(task.id)}
                      translateType={translateType}
                      router={router}
                      t={t}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("common.showing")} {filteredTasks.length} {t("common.of")}{" "}
              {myTasks.length} {t("supervisor.tasksLabel")}
            </p>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 rounded border border-border text-xs hover:bg-secondary">
                {t("common.previous")}
              </button>
              <button className="px-3 py-1 rounded bg-[#7C3AED] text-white text-xs">
                1
              </button>
              <button className="px-3 py-1 rounded border border-border text-xs hover:bg-secondary">
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
