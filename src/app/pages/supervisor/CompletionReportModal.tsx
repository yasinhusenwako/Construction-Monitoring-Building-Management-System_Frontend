"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function CompletionReportModal({
  ticketId,
  onClose,
  onSubmit,
}: {
  ticketId: string;
  onClose: () => void;
  onSubmit: (id: string, note: string) => void;
}) {
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
            <Send size={15} /> Submit Completion Report to Admin
          </h2>
          <p className="text-white/60 text-xs mt-0.5">{ticketId}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              Supervisor Report / Findings
            </label>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              rows={5}
              placeholder="Describe the work completed, findings, parts used, and any follow-up recommendations..."
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#0891B2] resize-none"
            />
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-xs text-cyan-800">
            <p className="font-semibold mb-1">📋 What happens next?</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Report submitted to Administration for approval</li>
              <li>Admin will approve or reject the completion</li>
              <li>User will be notified upon Admin approval</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/30">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(ticketId, reportNote)}
            disabled={!reportNote.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #0E7490, #0891B2)",
            }}
          >
            Submit to Admin
          </button>
        </div>
      </div>
    </div>
  );
}
