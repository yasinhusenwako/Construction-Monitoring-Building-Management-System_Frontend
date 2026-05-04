"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from '@/context/LanguageContext';
import {
  Building2,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart2,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { divisions } from "@/types/models";
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { getUserFacingStatus, type WorkflowRole } from '@/lib/workflow';
import { apiRequest } from "@/lib/api";
import { useProjects, useMaintenance } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export function DivisionsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  // Use React Query hooks for automatic real-time updates with polling
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { data: maintenance = [], isLoading: maintenanceLoading, refetch: refetchMaintenance } = useMaintenance();

  const loading = projectsLoading || maintenanceLoading;

  // Set up automatic polling for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetchProjects();
      refetchMaintenance();
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [refetchProjects, refetchMaintenance]);

  const divisionStats = useMemo(() => {
    // Debug: Log the actual division IDs in the data
    console.log("=== DIVISIONS PAGE DEBUG ===");
    console.log("Projects:", projects?.length || 0);
    console.log("Maintenance:", maintenance?.length || 0);
    
    if (projects && projects.length > 0) {
      const projectDivisions = [...new Set(projects.map(p => p.divisionId))];
      console.log("Unique project divisionIds:", projectDivisions);
    }
    
    if (maintenance && maintenance.length > 0) {
      const maintenanceDivisions = [...new Set(maintenance.map(m => m.divisionId))];
      console.log("Unique maintenance divisionIds:", maintenanceDivisions);
    }
    
    console.log("Expected division IDs:", divisions.map(d => d.id));
    
    return divisions.map((div) => {
      // Map division IDs: "1" -> "DIV-001", "2" -> "DIV-002", "3" -> "DIV-003"
      const backendDivisionId = `DIV-00${div.id}`;
      
      const divProjects = (projects || []).filter((p) => 
        p.divisionId === div.id || p.divisionId === backendDivisionId
      );
      // Only maintenance tasks for this division
      const divTasks = (maintenance || []).filter((m) => 
        m.divisionId === div.id || m.divisionId === backendDivisionId
      );
      
      console.log(`Division ${div.id} (${backendDivisionId}): ${divProjects.length} projects, ${divTasks.length} maintenance`);

      const activeProjects = divProjects.filter(
        (p) => !["Approved", "Rejected", "Closed"].includes(p.status),
      ).length;
      
      const openAssignments = divTasks.filter(
        (m) => ["Assigned to Supervisor", "WorkOrder Created", "Assigned to Professionals"].includes(m.status),
      ).length;

      return {
        ...div,
        projectCount: divProjects.length,
        activeProjects,
        serviceTickets: divTasks.length,
        activeServiceTickets: divTasks.filter(
          (m) => !["Completed", "Closed", "Approved"].includes(m.status),
        ).length,
        openAssignments,
        activeWorkload: openAssignments,
        // Only maintenance items, not projects or bookings
        maintenanceItems: divTasks,
      };
    });
  }, [projects, maintenance]);

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

  const handleDeleteMaintenance = async (m: any) => {
    const confirmed = confirm(
      "Are you sure you want to delete this maintenance request? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/api/maintenance/${m.dbId ?? m.id}`, {
        method: "DELETE",
      });
      // Invalidate and refetch maintenance data
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    } catch (error) {
      alert(
        "Failed to delete maintenance request: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const handleManualRefresh = async () => {
    // Refetch both projects and maintenance data
    await Promise.all([refetchProjects(), refetchMaintenance()]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0E2271] dark:text-blue-300">
            Divisions Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor workloads and performance across all operational divisions.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-[#7C3AED] text-[#7C3AED] rounded-xl text-sm font-semibold hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
          <button className="px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <BarChart2 size={16} /> Division Analytics
          </button>
        </div>
      </div>

      {/* Division Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {divisionStats.map((div, index) => {
          const gradients = [
            "from-[#7C3AED] to-[#5B21B6]", // Purple
            "from-[#3B82F6] to-[#1D4ED8]", // Blue
            "from-[#8B5CF6] to-[#6D28D9]", // Violet
          ];
          
          const divisionIds = [
            "1",
            "2", 
            "3"
          ];

          return (
            <div
              key={div.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Header with gradient */}
              <div className={`p-6 bg-gradient-to-br ${gradients[index]} text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Building2 size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      ID: {divisionIds[index]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{div.name}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {div.description}
                  </p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-6 space-y-5">
                {/* Projects & Service Tickets */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      PROJECTS
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0E2271] dark:text-blue-300">
                        {div.projectCount}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        {div.activeProjects} Active
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      SERVICE TICKETS
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0E2271] dark:text-blue-300">
                        {div.serviceTickets}
                      </span>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        {div.activeServiceTickets} Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Workload */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Activity size={16} className="text-orange-500" />
                      Active Workload
                    </span>
                    <span className="font-bold text-[#0E2271] dark:text-blue-300">
                      {div.openAssignments} Open Assignments
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((div.openAssignments / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* View Team Button */}
                <div className="pt-3">
                  <button
                    onClick={() => router.push(`/dashboard/team?division=${div.id}`)}
                    className="w-full py-3 rounded-xl border-2 border-border text-[#0E2271] dark:text-blue-300 font-semibold text-sm hover:bg-secondary dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Users size={16} /> View Division Team
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>

                {/* View Maintenance List Button */}
                <div>
                  <button
                    onClick={() => setExpandedDivision(expandedDivision === div.id ? null : div.id)}
                    className="w-full py-3 rounded-xl border-2 border-border text-[#0E2271] dark:text-blue-300 font-semibold text-sm hover:bg-secondary dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 group"
                  >
                    <ClipboardList size={16} /> View Maintenance List
                    {expandedDivision === div.id ? (
                      <ChevronUp size={16} className="transition-transform" />
                    ) : (
                      <ChevronDown size={16} className="transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Maintenance List for Selected Division */}
      {expandedDivision && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#CC1F1A] to-[#7A0E0E] text-white px-6 py-4">
            <h3 className="text-lg font-bold">
              {divisionStats.find(d => d.id === expandedDivision)?.name} - Maintenance Tasks
            </h3>
            <p className="text-sm text-white/80 mt-1">
              {divisionStats.find(d => d.id === expandedDivision)?.maintenanceItems.length || 0} maintenance tasks assigned to this division
            </p>
          </div>
          
          {divisionStats.find(d => d.id === expandedDivision)?.maintenanceItems.length === 0 ? (
            <div className="p-16 text-center">
              <ClipboardList size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-[#0E2271]">No Maintenance Tasks</h3>
              <p className="text-muted-foreground text-sm">This division has no maintenance tasks assigned yet.</p>
            </div>
          ) : (
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
                  {divisionStats.find(d => d.id === expandedDivision)?.maintenanceItems.map((m: any) => (
                    <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-[#CC1F1A]">{m.id}</span>
                          <button onClick={() => copyId(m.id)} className="text-muted-foreground hover:text-[#CC1F1A]">
                            {copied === m.id ? <CheckCircle size={11} className="text-green-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.description || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {m.type || "Maintenance"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={getUserFacingStatus(m.status, "admin" as WorkflowRole)} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={m.priority || "Medium"} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.location || m.space || "—"}
                        {m.floor ? `, ${m.floor}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {m.createdAt.split("T")[0].split(" ")[0]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/maintenance/${m.id}`)}
                            className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium"
                          >
                            <ExternalLink size={12} /> {t("action.view")}
                          </button>
                          <button
                            onClick={() => handleDeleteMaintenance(m)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:underline font-medium"
                          >
                            <Trash2 size={12} /> {t("action.delete")}
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
      )}

      {/* Global Resource Distribution Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <ClipboardList size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-[#0E2271] dark:text-blue-300 mb-1">
            Global Resource Distribution
          </h4>
          <p className="text-sm text-blue-800/70 dark:text-blue-300/70">
            Administrators can reassign tasks between divisions or override assignments from the master console.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/requests")}
          className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 rounded-xl font-semibold text-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2"
        >
          Open Management Console
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

