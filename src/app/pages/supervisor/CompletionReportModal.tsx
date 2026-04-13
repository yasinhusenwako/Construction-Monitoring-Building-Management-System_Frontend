"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export function CompletionReportModal({
  ticketId,
  onClose,
  onSubmit,
}: {
  ticketId: string;
  onClose: () => void;
  onSubmit: (id: string, note: string) => void;
}) {
  const { t } = useLanguage();
  const [reportNote, setReportNote] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,34,113,0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div
          className="px-6 py-4 border-b border-border"
          style={{
            background: "linear-gradient(135deg, #0E7490, #0891B2)",
          }}
        >
          <h2 className="text-white text-sm font-bold flex items-center gap-2">
            <Send size={15} /> {t("supervisor.reportModalTitle")}
          </h2>
          <p className="text-white/60 text-xs mt-0.5">{ticketId}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("supervisor.reportFindings")}
            </label>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              rows={5}
              placeholder={t("supervisor.reportPlaceholder")}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#0891B2] resize-none"
            />
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-xs text-cyan-800">
            <p className="font-semibold mb-1">
              📋 {t("supervisor.whatHappensNext")}
            </p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>{t("supervisor.nextStep1")}</li>
              <li>{t("supervisor.nextStep2")}</li>
              <li>{t("supervisor.nextStep3")}</li>
            </ul>
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
            onClick={() => onSubmit(ticketId, reportNote)}
            disabled={!reportNote.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #0E7490, #0891B2)",
            }}
          >
            {t("supervisor.submitReport")}
          </button>
        </div>
      </div>
    </div>
  );
}
