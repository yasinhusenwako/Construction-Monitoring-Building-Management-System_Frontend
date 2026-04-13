"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { mockMaintenance } from "../../data/mockData";
import { StatusBadge } from "../../components/common/StatusBadge";
import { WorkflowStatus, getAllowedTransitions } from "../../lib/workflow";
import { Activity, CheckCircle, Clock, Play, MapPin, AlertCircle, Send, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProgressUpdatesPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const uid = currentUser?.id;

  const [activeTasks, setActiveTasks] = useState(() => 
    mockMaintenance.filter(m => 
      m.assignedTo === uid && 
      ["Assigned to Professional", "In Progress"].includes(m.status)
    )
  );

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateStatus = (taskId: string, newStatus: WorkflowStatus) => {
    setUpdating(taskId);
    // In a real app, this would be an API call
    setTimeout(() => {
      setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      setUpdating(null);
    }, 800);
  };

  const handleAddNote = (taskId: string) => {
    if (!notes[taskId]) return;
    // In a real app, this would save the note
    // Localized feedback would be better but for now keep consistent with original
    setNotes(prev => ({ ...prev, [taskId]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0E2271]">{t("professional.progressUpdates")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("professional.updateStatusDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {activeTasks.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-muted-foreground">
            <CheckCircle size={48} className="mx-auto text-green-500/20 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t("professional.allClear")}</h3>
            <p className="text-gray-500">{t("professional.noPendingTasks")}</p>
          </div>
        ) : (
          activeTasks.map((task) => {
            const allowed = getAllowedTransitions("professional", task.status as WorkflowStatus);
            
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {task.id}
                    </span>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{task.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} /> {task.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} /> {task.createdAt.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={task.status as any} />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
                   <div className="flex-1">
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("projects.actions")}</p>
                     <div className="flex flex-wrap gap-2">
                       {allowed.map(nextStatus => (
                         <button
                           key={nextStatus}
                           disabled={updating === task.id}
                           onClick={() => handleUpdateStatus(task.id, nextStatus)}
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                             nextStatus === 'In Progress' ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm' :
                             nextStatus === 'Completed' ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' :
                             'bg-gray-100 text-gray-700 hover:bg-gray-200'
                           } disabled:opacity-50`}
                         >
                           {nextStatus === 'In Progress' && <Play size={14} fill="currentColor" />}
                           {nextStatus === 'Completed' && <CheckCircle size={14} />}
                           {nextStatus === 'In Progress' ? t("professional.markInProgress") : 
                            nextStatus === 'Completed' ? t("professional.markCompleted") : 
                            `${t("professional.markAs")} ${t(`status.${nextStatus.toLowerCase().replace(/ /g, '')}`)}`}
                         </button>
                       ))}
                       {allowed.length === 0 && (
                         <p className="text-xs text-muted-foreground italic">{t("professional.noActionsRequired")}</p>
                       )}
                     </div>
                   </div>
                   <button 
                     onClick={() => router.push(`/dashboard/maintenance/${task.id}`)}
                     title={t("supervisor.viewDetails")}
                     className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                   >
                     <Activity size={18} />
                   </button>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                     <MessageSquare size={10} /> {t("professional.addProgressNote")}
                   </label>
                   <div className="flex gap-2">
                     <input 
                       type="text"
                       placeholder={t("professional.notePlaceholder")}
                       className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                       value={notes[task.id] || ""}
                       onChange={(e) => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                     />
                     <button 
                       onClick={() => handleAddNote(task.id)}
                       disabled={!notes[task.id]}
                       className="px-3 py-2 bg-[#0E2271] text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                     >
                       <Send size={14} />
                     </button>
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
