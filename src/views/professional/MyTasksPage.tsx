"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { fetchProfessionalTasks } from "@/lib/live-api";
import { getMyAssignments, getMyBookingAssignments } from "@/lib/multi-professional-api";
import type { Maintenance, Project, Booking } from "@/types/models";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import {
  canViewItem,
  canTransition,
  getVisibleStatusesForRole,
  type WorkflowRole,
  type WorkflowStatus,
} from "@/lib/workflow";
import { apiRequest } from "@/lib/api";
import { professionalUpdateTaskStatus } from "@/lib/live-api";
import { Wrench, FolderOpen, Calendar, Clock, CheckCircle, Search, ClipboardList } from "lucide-react";

// Unified task type that can represent maintenance tasks, project assignments, and booking assignments
interface UnifiedTask {
  id: string;
  dbId?: number;
  title: string;
  description: string;
  type: "MAINTENANCE" | "PROJECT" | "BOOKING";
  category: string;
  status: WorkflowStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  location: string;
  building?: string;
  floor?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  supervisorId?: string;
  requestedBy?: string;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
}

// Convert Maintenance to UnifiedTask
function maintenanceToUnifiedTask(m: Maintenance): UnifiedTask {
  return {
    id: m.id,
    dbId: m.dbId,
    title: m.title || m.type,
    description: m.description,
    type: "MAINTENANCE",
    category: m.type,
    status: m.status,
    priority: m.priority,
    location: m.location,
    building: m.building,
    floor: m.floor,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    assignedTo: m.assignedTo,
    supervisorId: m.supervisorId,
    requestedBy: m.requestedBy,
    materialCost: m.materialCost,
    laborCost: m.laborCost,
    totalCost: m.totalCost,
    partsUsed: m.partsUsed,
  };
}

// Convert Project to UnifiedTask
function projectToUnifiedTask(p: Project): UnifiedTask {
  return {
    id: p.id,
    dbId: p.dbId,
    title: p.title,
    description: p.description,
    type: "PROJECT",
    category: "Project",
    status: p.status,
    priority: "Medium", // Projects don't have priority in the same way
    location: p.location,
    building: undefined,
    floor: p.floor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    assignedTo: p.assignedTo,
    supervisorId: p.supervisorId,
    requestedBy: p.requestedBy,
    materialCost: p.materialCost,
    laborCost: p.laborCost,
    totalCost: p.totalCost,
    partsUsed: p.partsUsed,
  };
}

// Convert Booking to UnifiedTask
function bookingToUnifiedTask(b: Booking): UnifiedTask {
  return {
    id: b.id,
    dbId: b.dbId,
    title: b.title,
    description: b.purpose,
    type: "BOOKING",
    category: b.type,
    status: b.status,
    priority: "Medium", // Bookings don't have priority
    location: b.space,
    building: undefined,
    floor: undefined,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    assignedTo: b.assignedTo,
    supervisorId: b.supervisorId,
    requestedBy: b.requestedBy,
    materialCost: b.materialCost,
    laborCost: b.laborCost,
    totalCost: b.totalCost,
    partsUsed: b.partsUsed,
  };
}

export function MyTasksPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const role = currentUser?.role;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [actionMsg, setActionMsg] = useState("");

  // Fetch all tasks for the current professional
  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      // Fetch maintenance tasks (from /api/professional/tasks)
      const maintenanceTasks = await fetchProfessionalTasks();
      
      // Fetch project assignments
      const projectAssignments = await getMyAssignments();
      
      // Fetch booking assignments
      const bookingAssignments = await getMyBookingAssignments();

      // Convert all to unified task format
      const unifiedMaintenance = maintenanceTasks.map(maintenanceToUnifiedTask);
      const unifiedProjects = projectAssignments.map(pa => ({
        id: `PRJ-${pa.projectId}`,
        dbId: pa.projectId,
        title: `Project Assignment #${pa.projectId}`,
        description: pa.instructions,
        type: "PROJECT" as const,
        category: "Project",
        status: pa.status as WorkflowStatus,
        priority: "Medium" as const,
        location: "N/A",
        createdAt: pa.createdAt,
        updatedAt: pa.createdAt,
        assignedTo: pa.professionalId,
      }));
      const unifiedBookings = bookingAssignments.map(ba => ({
        id: `BKG-${ba.bookingId}`,
        dbId: ba.bookingId,
        title: `Booking Assignment #${ba.bookingId}`,
        description: ba.instructions,
        type: "BOOKING" as const,
        category: "Booking",
        status: ba.status as WorkflowStatus,
        priority: "Medium" as const,
        location: "N/A",
        createdAt: ba.createdAt,
        updatedAt: ba.createdAt,
        assignedTo: ba.professionalId,
      }));

      // Combine all tasks
      const allTasks = [...unifiedMaintenance, ...unifiedProjects, ...unifiedBookings];
      
      // Sort by creation date (newest first)
      allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
    
    // Auto-refresh every 15 seconds to show newly assigned tasks
    refreshIntervalRef.current = setInterval(fetchAllTasks, 15000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [currentUser?.id]);

  // Calculate stats
  const stats = {
    total: tasks.length,
    maintenance: tasks.filter(t => t.type === "MAINTENANCE").length,
    projects: tasks.filter(t => t.type === "PROJECT").length,
    bookings: tasks.filter(t => t.type === "BOOKING").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    completed: tasks.filter(t => 
      ["Completed", "Reviewed", "Approved", "Rejected", "Closed"].includes(t.status)
    ).length,
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchSearch = !search || 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    
    const matchType = typeFilter === "All" || task.type === typeFilter;
    const matchStatus = statusFilter === "All" || task.status === statusFilter;
    const matchPriority = priorityFilter === "All" || task.priority === priorityFilter;

    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MAINTENANCE":
        return <Wrench size={16} className="text-[#CC1F1A]" />;
      case "PROJECT":
        return <FolderOpen size={16} className="text-[#1A3580]" />;
      case "BOOKING":
        return <Calendar size={16} className="text-[#7C3AED]" />;
      default:
        return <ClipboardList size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAINTENANCE":
        return "Maintenance";
      case "PROJECT":
        return "Project";
      case "BOOKING":
        return "Booking";
      default:
        return type;
    }
  };

  const handleStatusChange = async (task: UnifiedTask, newStatus: WorkflowStatus) => {
    const module = task.type === "PROJECT" ? "PROJECT" : task.type === "BOOKING" ? "BOOKING" : "MAINTENANCE";
    
    try {
      await professionalUpdateTaskStatus({
        module,
        businessId: task.id,
        status: newStatus as "In Progress" | "Completed",
      });

      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      ));

      setActionMsg(t("maintenance.taskStatusUpdated") || `Task status updated to ${newStatus}`);
      setTimeout(() => setActionMsg(""), 3000);
    } catch (error) {
      console.error("Failed to update task status:", error);
      setActionMsg(t("requests.submitFailed") || "Failed to update task status");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const priorities = ["All", "Critical", "High", "Medium", "Low"];
  const statuses = ["All", ...getVisibleStatusesForRole(role as WorkflowRole, "maintenance")];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0E2271]">{t("nav.myTasks")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("professional.allAssignedTasks") || "View all your assigned maintenance tasks, projects, and bookings"}
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0E2271]/10 text-[#0E2271]">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0E2271]">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#CC1F1A]/10 text-[#CC1F1A]">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#CC1F1A]">{stats.maintenance}</p>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1A3580]/10 text-[#1A3580]">
              <FolderOpen size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A3580]">{stats.projects}</p>
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#7C3AED]">{stats.bookings}</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-orange-600">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="flex gap-3 flex-wrap">
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
            <option value="All">{t("status.all")} Type</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="PROJECT">Project</option>
            <option value="BOOKING">Booking</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All"
                  ? t("status.all")
                  : t(
                      `status.${s.charAt(0).toLowerCase() + s.slice(1).replace(/\s+/g, "")}`,
                    )}
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
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#0E2271] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-[#0E2271] font-semibold">No tasks found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search || typeFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your filters"
                : "You don't have any assigned tasks at the moment"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("maintenance.ticketID")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.title")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("maintenance.category")}
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
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[#0E2271]">
                      {task.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(task.type)}
                        <span className="text-xs font-medium">{getTypeLabel(task.type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {task.category}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {task.location}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {task.status === "Assigned to Professionals" && (
                          <button
                            onClick={() => handleStatusChange(task, "In Progress")}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-[#1A3580] text-white hover:bg-[#0E2271] transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {task.status === "In Progress" && (
                          <button
                            onClick={() => handleStatusChange(task, "Completed")}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const routeMap = {
                              MAINTENANCE: `/dashboard/maintenance/${task.id}`,
                              PROJECT: `/dashboard/projects/${task.id}`,
                              BOOKING: `/dashboard/bookings/${task.id}`,
                            };
                            router.push(routeMap[task.type] || "/dashboard");
                          }}
                          className="px-3 py-1 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}