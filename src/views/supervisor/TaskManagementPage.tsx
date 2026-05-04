"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { divisions } from "@/types/models";
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
  Copy,
  ExternalLink,
  Trash2,
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
  const [copied, setCopied] = useState("");
  
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
        // Only include maintenance tasks, exclude projects and bookings
        setAllTasks([...maintenance]);
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
  }, [currentUser?.divisionId, uid]);

  // Get current user's division
  const userDivision = currentUser?.divisionId;
  const divisionName = divisions.find((d) => d.id === userDivision)?.name || "Division";

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

  // Debug logging
  console.log("=== TASK MANAGEMENT PAGE DEBUG ===");
  console.log("Current User ID:", uid);
  console.log("User Division:", userDivision);
  console.log("Total Tasks Fetched:", allTasks.length);
  console.log("All Tasks:", allTasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    divisionId: t.divisionId,
    supervisorId: t.supervisorId,
  })));
  console.log("Supervisor Tracked Statuses:", supervisorTrackedStatuses);

  // My assigned tasks — primary key is supervisorId, divisionId is informational only
  const myTasks = allTasks.filter(
    (m) => {
      const matchesSupervisor = m.supervisorId === uid;
      const matchesDivision = userDivision &&
        m.divisionId === userDivision &&
        supervisorTrackedStatuses.includes(m.status);
      
      console.log(`Task ${m.id}:`, {
        status: m.status,
        divisionId: m.divisionId,
        supervisorId: m.supervisorId,
        matchesSupervisor,
        matchesDivision,
        statusInList: supervisorTrackedStatuses.includes(m.status),
        included: matchesSupervisor || matchesDivision,
      });
      
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

  const handleAssign = async (professionalId: string, instructions: string) => {
    const task = myTasks.find((m) => m.id === assignTarget);
    if (!task) return;
    // Only maintenance tasks now
    const requestModule = "MAINTENANCE";

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
    // Only maintenance tasks now
    const requestModule = "MAINTENANCE";

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
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Structural">Structural</option>
            <option value="General">General</option>
            <option value="Urgent Repair">Urgent Repair</option>
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

      {/* Table View */}
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
                {filteredTasks.map((m) => {
                  const assignee = users.find((u) => u.id === m.assignedTo);
                  // All tasks are maintenance now
                  const detailPath = `/dashboard/maintenance/${m.id}`;

                  return (
                    <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-[#7C3AED]">{m.id}</span>
                          <button onClick={() => copyId(m.id)} className="text-muted-foreground hover:text-[#7C3AED]">
                            {copied === m.id ? <CheckCircle size={11} className="text-green-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.description || ""}</p>
                        {assignee && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User size={10} /> {assignee.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {m.type || "Maintenance"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={m.priority || "Medium"} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.location || "—"}
                        {m.floor ? `, ${m.floor}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {m.createdAt.split("T")[0].split(" ")[0]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => router.push(detailPath)}
                            className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline font-medium"
                          >
                            <ExternalLink size={12} /> {t("action.view")}
                          </button>
                          {m.status === "Completed" && (
                            <button
                              onClick={() => setReportTarget(m.id)}
                              className="flex items-center gap-1 text-xs text-white px-2 py-1 rounded bg-[#0891B2] hover:bg-[#0e7490] font-medium"
                            >
                              <Send size={12} /> {t("supervisor.submitReport")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("common.showing")} {filteredTasks.length} {t("common.of")} {myTasks.length} {t("nav.maintenance").toLowerCase()}
            </p>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 rounded border border-border text-xs hover:bg-secondary">
                {t("common.previous")}
              </button>
              <button className="px-3 py-1 rounded bg-[#7C3AED] text-white text-xs">1</button>
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
