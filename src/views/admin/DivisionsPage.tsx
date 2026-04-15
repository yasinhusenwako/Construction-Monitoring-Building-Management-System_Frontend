"use client";

import React, { useMemo } from "react";
import { useLanguage } from '@/context/LanguageContext';
import { mockProjects, mockMaintenance, divisions } from '@/data/mockData';
import {
  Building2,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function DivisionsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const divisionStats = useMemo(() => {
    return divisions.map((div) => {
      const divProjects = mockProjects.filter((p) => p.assignedTo === div.id);
      const divTasks = mockMaintenance.filter((m) => m.divisionId === div.id);

      const activeProjects = divProjects.filter(
        (p) => !["Approved", "Rejected", "Closed"].includes(p.status),
      ).length;
      const activeTasks = divTasks.filter(
        (m) => !["Completed", "Closed"].includes(m.status),
      ).length;

      return {
        ...div,
        projectCount: divProjects.length,
        activeProjects,
        taskCount: divTasks.length,
        activeTasks,
        totalActive: activeProjects + activeTasks,
      };
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0E2271]">
            {t("divisions.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("divisions.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#0E2271] text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2">
            <BarChart2 size={16} /> {t("divisions.reports")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {divisionStats.map((div) => (
          <div
            key={div.id}
            className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            <div
              className={`p-6 bg-gradient-to-br ${
                div.id === "1"
                  ? "from-blue-500 to-blue-700"
                  : div.id === "2"
                    ? "from-cyan-500 to-cyan-700"
                    : "from-indigo-500 to-indigo-700"
              } text-white`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Building2 size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">
                  ID: {div.id}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{div.name}</h3>
              <p className="text-blue-100 text-sm line-clamp-1">
                {div.description}
              </p>
            </div>

            <div className="p-6 flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("nav.projects")}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {div.projectCount}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold mb-1.5">
                      {div.activeProjects} {t("divisions.active")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("divisions.fixedTasks")}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {div.taskCount}
                    </span>
                    <span className="text-[10px] text-orange-600 font-bold mb-1.5">
                      {div.activeTasks} {t("divisions.active")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />{" "}
                    {t("divisions.currentWorkload")}
                  </span>
                  <span className="font-bold text-gray-900">
                    {div.totalActive} {t("divisions.assignments")}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((div.totalActive / 15) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-auto">
                <button
                  onClick={() =>
                    router.push(`/dashboard/team?division=${div.id}`)
                  }
                  className="w-full py-2.5 rounded-xl border border-border text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <Users size={16} /> {t("divisions.viewTeam")}
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <ClipboardList size={32} className="text-blue-600" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-[#0E2271]">
            {t("divisions.globalDistribution")}
          </h4>
          <p className="text-sm text-blue-800/70">
            {t("divisions.reassignNote")}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/requests")}
          className="px-6 py-2.5 bg-white text-blue-700 border border-blue-200 rounded-xl font-bold text-sm hover:shadow-md transition-all"
        >
          {t("divisions.openConsole")}
        </button>
      </div>
    </div>
  );
}
