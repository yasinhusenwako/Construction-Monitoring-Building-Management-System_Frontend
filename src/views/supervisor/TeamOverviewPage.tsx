"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchLiveMaintenance,
  fetchLiveUsers,
  fetchLiveBookings,
  fetchLiveProjects,
} from "@/lib/live-api";
import { Users, Mail, Phone, Activity } from "lucide-react";

export function TeamOverviewPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [allTasks, setAllTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        // Token is automatically sent via httpOnly cookie
        const [users, maintenance, projects, bookings] = await Promise.all([
          fetchLiveUsers(),
          fetchLiveMaintenance(),
          fetchLiveProjects(),
          fetchLiveBookings(),
        ]);

        // Filter for professionals in my division
        const professionals = users.filter((u) => u.role === "professional");
        setTeamMembers(professionals);
        setAllTasks([...maintenance, ...projects, ...bookings]);
      } catch (error) {
        console.error("Failed to refresh team data:", error);
      } finally {
        setLoading(false);
      }
    };
    refresh();
  }, []);

  const getActiveTaskCount = (userId: string) => {
    return allTasks.filter(
      (m) =>
        m.assignedTo === userId &&
        (m.status === "In Progress" || m.status === "Assigned to Professional"),
    ).length;
  };

  const getCompletedTaskCount = (userId: string) => {
    return allTasks.filter(
      (m) => m.assignedTo === userId && m.status === "Completed",
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0E2271]">
            {t("supervisor.teamOverview")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("supervisor.manageMonitor")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
          <Users size={18} />
          <span className="font-semibold">
            {teamMembers.length} {t("supervisor.professionals")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teamMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {t("supervisor.noProfessionals")}
            </h3>
            <p className="text-gray-500">
              {t("supervisor.noProfessionalsDesc")}
            </p>
          </div>
        ) : (
          teamMembers.map((member) => {
            const activeTasks = getActiveTaskCount(member.id);
            const completedTasks = getCompletedTaskCount(member.id);

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0E2271] truncate max-w-[150px]">
                          {member.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {t(`status.${member.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} className="flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity size={14} className="flex-shrink-0" />
                      <span>
                        {t("workflow.currently")}:{" "}
                        <span className="text-foreground font-medium">
                          {activeTasks} {t("supervisor.activeTasks")}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                    <div className="text-center p-2 rounded-xl bg-blue-50/50">
                      <p className="text-xs text-muted-foreground">
                        {t("supervisor.active")}
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {activeTasks}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-teal-50/50">
                      <p className="text-xs text-muted-foreground">
                        {t("status.completed")}
                      </p>
                      <p className="text-lg font-bold text-teal-700">
                        {completedTasks}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    {t("supervisor.viewPerformance")}
                  </button>
                  <button className="text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                    {t("supervisor.viewWorkLog")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
