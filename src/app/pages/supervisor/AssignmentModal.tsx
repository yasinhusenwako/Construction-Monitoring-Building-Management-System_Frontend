"use client";

import { CheckCircle, UserCheck } from "lucide-react";
import { useState } from "react";
import { User } from "../../data/mockData";
import { useLanguage } from "../../context/LanguageContext";

export function AssignmentModal({
  ticketId,
  ticketTitle,
  professionals,
  activeTasks,
  onAssign,
  onClose,
}: {
  ticketId: string;
  ticketTitle: string;
  professionals: User[];
  activeTasks: any[];
  onAssign: (professionalId: string, instructions: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [selectedPro, setSelectedPro] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState("Medium");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,34,113,0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-border"
          style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <UserCheck size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-sm font-bold">
                {t("supervisor.assignmentModalTitle")}
              </h2>
              <p className="text-white/60 text-xs truncate max-w-64">
                {ticketTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Professional select */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
              {t("supervisor.selectProfessional")}
            </label>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {professionals.map((pro) => {
                const activeCount = activeTasks.filter(
                  (m) =>
                    m.assignedTo === pro.id &&
                    !["Approved", "Closed"].includes(m.status),
                ).length;
                return (
                  <button
                    key={pro.id}
                    type="button"
                    onClick={() => setSelectedPro(pro.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      selectedPro === pro.id
                        ? "border-[#7C3AED] bg-purple-50"
                        : "border-border hover:border-purple-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#CC1F1A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {pro.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0E2271]">
                        {pro.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pro.department}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        activeCount > 3
                          ? "bg-red-50 text-red-700"
                          : activeCount > 1
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                      }`}
                    >
                      {activeCount} {t("users.active_count")}
                    </span>
                    {selectedPro === pro.id && (
                      <CheckCircle
                        size={14}
                        className="text-[#7C3AED] flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("supervisor.instructionsNotes")}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder={t("supervisor.instructionsPlaceholder")}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#7C3AED] resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("supervisor.taskPriority")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                    priority === p
                      ? p === "Critical"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : p === "High"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : p === "Medium"
                            ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                            : "border-gray-400 bg-gray-100 text-gray-700"
                      : "border-border text-muted-foreground hover:border-gray-300"
                  }`}
                >
                  {t(`priority.${p.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/30">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            {t("action.cancel")}
          </button>
          <button
            onClick={() => selectedPro && onAssign(selectedPro, instructions)}
            disabled={!selectedPro}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)" }}
          >
            {t("supervisor.assignProfessional")}
          </button>
        </div>
      </div>
    </div>
  );
}
