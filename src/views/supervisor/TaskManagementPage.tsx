"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
  fetchLiveUsers,
  supervisorAssignProfessional,
  supervisorReviewRequest,
} from "@/lib/live-api";
import { AssignmentModal } from "./AssignmentModal";
import { CompletionReportModal } from "./CompletionReportModal";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import {
  ClipboardList,
  AlertTriangle,
  Activity,
  CheckCircle,
  Send,
  MapPin,
  Clock,
  User,
  UserCheck,
  Eye,
} from "lucide-react";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
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
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
  const divisionName = currentUser?.department || "General";

  const supervisorTrackedStatuses = [
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professionals",
    "In Progress",
    "Completed",
    "Reviewed",
  ];

  // My assigned tasks — primary key is supervisorId, divisionId is informational only
  const myTasks = allTasks.filter(
    (m) =>
      m.supervisorId === uid ||
      // Fallback: division-scoped workflow items should remain visible to supervisor.
      (userDivision &&
        m.divisionId === userDivision &&
        supervisorTrackedStatuses.includes(m.status)),
  );
  const pendingAssignment = myTasks.filter((m) =>
    ["Assigned to Supervisor", "WorkOrder Created"].includes(m.status),
  );
  const withProfessionals = myTasks.filter((m) =>
    ["Assigned to Professionals", "In Progress"].includes(m.status),
  );
  const completedTasks = myTasks.filter((m) => m.status === "Completed");
  const reviewedTasks = myTasks.filter((m) => m.status === "Reviewed");
  const approvedProfessionals = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "professional" &&
          String(u.status || "active").toLowerCase() === "active" &&
          (!userDivision ||
            u.divisionId === userDivision ||
            !u.divisionId),
      ),
    [users, userDivision],
  );

  const handleAssign = async (professionalId: string, instructions: string) => {
    const task = myTasks.find((m) => m.id === assignTarget);
    if (!task) return;
    const requestModule = task.id.startsWith("PRJ-")
      ? "PROJECT"
      : (task.id.startsWith("BKG-") || task.id.startsWith("ALLOC-"))
        ? "BOOKING"
        : "MAINTENANCE";

    try {
      await supervisorAssignProfessional({
        module: requestModule,
        businessId: task.id,
        professionalId,
        instructions,
      });

      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "Assigned to Professionals",
                assignedTo: professionalId,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
      setActionMsg(t("supervisor.action.assigned"));
      setTimeout(() => setActionMsg(""), 4000);
    } catch (error) {
      console.error("Assignment failed:", error);
      setActionMsg(t("common.error"));
    }
    setAssignTarget(null);
  };

  const handleSubmitReport = async (id: string) => {
    const task = myTasks.find((m) => m.id === id);
    if (!task) return;
    const requestModule = id.startsWith("PRJ-")
      ? "PROJECT"
      : (id.startsWith("BKG-") || id.startsWith("ALLOC-"))
        ? "BOOKING"
        : "MAINTENANCE";

    try {
      await supervisorReviewRequest({
        module: requestModule,
        businessId: id,
      });
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "Reviewed", updatedAt: new Date().toISOString() }
            : t,
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

  const assignTargetTask = myTasks.find((m) => m.id === assignTarget);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = myTasks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.id.toLowerCase().includes(query) ||
          task.title.toLowerCase().includes(query) ||
          task.location.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((task) => task.type === typeFilter);
    }

    return filtered;
  }, [myTasks, searchQuery, statusFilter, priorityFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Assignment Modal */}
      {assignTarget && assignTargetTask && (
        <AssignmentModal
          ticketId={assignTarget}
          ticketTitle={assignTargetTask.title}
          professionals={approvedProfessionals}
          activeTasks={allTasks}
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

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder={t("requests.searchPlaceholder") || "Search by ID, title, or location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allStatuses") || "All Statuses"}</option>
            <option value="Assigned to Supervisor">Assigned to Supervisor</option>
            <option value="WorkOrder Created">WorkOrder Created</option>
            <option value="Assigned to Professionals">Assigned to Professionals</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Reviewed">Reviewed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allPriorities") || "All Priorities"}</option>
            <option value="Routine">Routine</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          >
            <option value="all">{t("common.allTypes") || "All Types"}</option>
            <option value="Project">Project</option>
            <option value="Booking">Booking</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:text-purple-900">×</button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("all")} className="hover:text-blue-900">×</button>
              </span>
            )}
            {priorityFilter !== "all" && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                Priority: {priorityFilter}
                <button onClick={() => setPriorityFilter("all")} className="hover:text-orange-900">×</button>
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter("all")} className="hover:text-green-900">×</button>
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
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredTasks.length}</span> of <span className="font-semibold text-foreground">{myTasks.length}</span> tasks
          </p>
        </div>
      </div>

      {/* List View */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-16 text-center">
            <ClipboardList
              size={48}
              className="mx-auto text-muted-foreground/40 mb-3"
            />
            <h3 className="text-[#0E2271]">
              {myTasks.length === 0 ? t("supervisor.noTasksAssigned") : "No tasks match your filters"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {myTasks.length === 0 ? t("supervisor.noTasksDesc") : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          filteredTasks.map((m) => {
            const assignee = users.find((u) => u.id === m.assignedTo);
            const priorityColors = {
              Critical: "border-l-red-500",
              High: "border-l-orange-500",
              Medium: "border-l-yellow-500",
              Routine: "border-l-blue-500",
            };
            const priorityBorderClass = priorityColors[m.priority as keyof typeof priorityColors] || "border-l-gray-300";
            
            return (
              <div
                key={m.id}
                className={`bg-white rounded-xl border border-border border-l-4 ${priorityBorderClass} p-5 shadow-sm hover:shadow-md transition-shadow`}
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
                          : (m.id.startsWith("BKG-") || m.id.startsWith("ALLOC-"))
                            ? `/dashboard/bookings/${m.id}`
                            : `/dashboard/maintenance/${m.id}`;
                        router.push(path);
                      }}
                      className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline"
                    >
                      <Eye size={12} /> {t("supervisor.viewDetails")}
                    </button>
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
