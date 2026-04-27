"use client";

import React, { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchLiveProjects, fetchLiveMaintenance } from "@/lib/live-api";
import { divisions } from "@/types/models";

export function DivisionsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveProjects, liveMaintenance] = await Promise.all([
          fetchLiveProjects(),
          fetchLiveMaintenance(),
        ]);
        setProjects(liveProjects);
        setMaintenance(liveMaintenance);
      } catch (error) {
        console.error("Failed to fetch division data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const divisionStats = useMemo(() => {
    return divisions.map((div) => {
      const divProjects = projects.filter((p) => p.divisionId === div.id);
      const divTasks = maintenance.filter((m) => m.divisionId === div.id);

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
      };
    });
  }, [projects, maintenance]);

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
            "DIV-001",
            "DIV-002", 
            "DIV-003"
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
              </div>
            </div>
          );
        })}
      </div>

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

