"use client";

import { Eye, MapPin, Send, User, UserCheck } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import {
  PriorityBadge,
  StatusBadge,
} from '@/components/common/StatusBadge';
import { User as UserType } from '@/data/mockData';

export function TaskCard({
  m,
  assignee,
  onAssign,
  onSubmitReport,
  onView,
}: {
  m: any;
  assignee?: UserType;
  onAssign: (id: string) => void;
  onSubmitReport: (id: string) => void;
  onView: (id: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-[#7C3AED]">
          {m.id}
        </span>
        <PriorityBadge priority={m.priority || "Medium"} />
      </div>
      <p className="text-sm font-semibold text-[#0E2271] mb-1 line-clamp-2">
        {m.title}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mb-2">
        <span className="flex items-center gap-1">
          <MapPin size={10} /> {m.location || m.space || "No Location"}
        </span>
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">
          {m.type || m.classification || m.category}
        </span>
      </div>
      {assignee && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <User size={10} /> <span>{assignee.name}</span>
        </div>
      )}
      <StatusBadge status={m.status} />
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => onView(m.id)}
          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-[#1A3580] border border-border rounded hover:bg-secondary"
        >
          <Eye size={10} /> {t("action.view")}
        </button>
        {m.status === "Assigned to Supervisor" && (
          <button
            onClick={() => onAssign(m.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-white rounded bg-[#7C3AED]"
          >
            <UserCheck size={10} /> {t("action.assign")}
          </button>
        )}
        {m.status === "Completed" && (
          <button
            onClick={() => onSubmitReport(m.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-white rounded bg-[#0891B2]"
          >
            <Send size={10} /> {t("action.submit")}
          </button>
        )}
      </div>
    </div>
  );
}
