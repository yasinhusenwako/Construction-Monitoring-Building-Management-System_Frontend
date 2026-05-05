"use client";

import {
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Wrench,
  UserCheck,
  Archive,
  FileText,
  StickyNote,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { WorkflowRole, WorkflowStatus } from "@/lib/workflow";

export interface TimelineEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
  emptyMessage?: string;
  accentColor?: string;
  userRole?: WorkflowRole;
}

// ── Status config: icon + colors per action ──────────────────────────────────
function getStatusConfig(action: string): {
  icon: React.ReactNode;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
} {
  const a = action.toLowerCase();

  if (a.includes("submitted"))
    return {
      icon: <Send size={14} />,
      dotColor: "bg-blue-500",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      borderColor: "border-blue-200",
    };
  if (a.includes("in process"))
    return {
      icon: <Wrench size={14} />,
      dotColor: "bg-blue-500",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      borderColor: "border-blue-200",
    };
  if (a.includes("under review") || (a.includes("review") && !a.includes("reviewed")))
    return {
      icon: <Eye size={14} />,
      dotColor: "bg-amber-500",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      borderColor: "border-amber-200",
    };
  if (a.includes("assigned to supervisor"))
    return {
      icon: <UserCheck size={14} />,
      dotColor: "bg-violet-500",
      badgeBg: "bg-violet-50",
      badgeText: "text-violet-700",
      borderColor: "border-violet-200",
    };
  if (a.includes("workorder") || a.includes("work order"))
    return {
      icon: <FileText size={14} />,
      dotColor: "bg-indigo-500",
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-700",
      borderColor: "border-indigo-200",
    };
  if (a.includes("assigned to professional") || a.includes("assigned to tech"))
    return {
      icon: <Wrench size={14} />,
      dotColor: "bg-purple-500",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      borderColor: "border-purple-200",
    };
  if (a.includes("assigned"))
    return {
      icon: <UserCheck size={14} />,
      dotColor: "bg-purple-400",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      borderColor: "border-purple-200",
    };
  if (a.includes("in progress"))
    return {
      icon: <Wrench size={14} />,
      dotColor: "bg-orange-500",
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-700",
      borderColor: "border-orange-200",
    };
  if (a === "completed" || a.includes("completed"))
    return {
      icon: <CheckCircle size={14} />,
      dotColor: "bg-teal-500",
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-700",
      borderColor: "border-teal-200",
    };
  if (a.includes("reviewed"))
    return {
      icon: <ShieldCheck size={14} />,
      dotColor: "bg-cyan-500",
      badgeBg: "bg-cyan-50",
      badgeText: "text-cyan-700",
      borderColor: "border-cyan-200",
    };
  if (a.includes("approved"))
    return {
      icon: <CheckCircle size={14} />,
      dotColor: "bg-green-500",
      badgeBg: "bg-green-50",
      badgeText: "text-green-700",
      borderColor: "border-green-200",
    };
  if (a.includes("rejected"))
    return {
      icon: <XCircle size={14} />,
      dotColor: "bg-red-500",
      badgeBg: "bg-red-50",
      badgeText: "text-red-700",
      borderColor: "border-red-200",
    };
  if (a.includes("closed"))
    return {
      icon: <Archive size={14} />,
      dotColor: "bg-slate-500",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-600",
      borderColor: "border-slate-200",
    };
  if (a.includes("note"))
    return {
      icon: <StickyNote size={14} />,
      dotColor: "bg-indigo-400",
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-700",
      borderColor: "border-indigo-200",
    };
  if (a.includes("cost") || a.includes("material") || a.includes("labor"))
    return {
      icon: <DollarSign size={14} />,
      dotColor: "bg-emerald-500",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      borderColor: "border-emerald-200",
    };

  return {
    icon: <AlertCircle size={14} />,
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    borderColor: "border-slate-200",
  };
}

function formatTimestamp(ts: string): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function Timeline({
  events,
  title = "Activity Timeline",
  emptyMessage = "No activity recorded yet",
  userRole,
}: TimelineProps) {
  // Sort oldest → newest so the timeline reads top-to-bottom chronologically
  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  
  // Helper function to get display action based on user role
  // Note: Timeline shows actual statuses for historical record
  // Only the current status badge is simplified for users
  const getDisplayAction = (action: string): string => {
    return action;
  };

  return (
    <div>
      {/* Header */}
      <h3 className="text-sm font-bold text-[#0E2271] mb-6 flex items-center gap-2">
        <span className="bg-indigo-50 p-1.5 rounded-md border border-indigo-100">
          <Clock size={16} className="text-indigo-600" />
        </span>
        {title}
        {sorted.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {sorted.length} {sorted.length === 1 ? "event" : "events"}
          </span>
        )}
      </h3>

      {sorted.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {sorted.map((event, i) => {
            const displayAction = getDisplayAction(event.action);
            const cfg = getStatusConfig(displayAction);
            const { date, time } = formatTimestamp(event.timestamp);
            const isLast = i === sorted.length - 1;

            return (
              <div key={event.id} className="flex gap-4 group">
                {/* Left: dot + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${cfg.borderColor} ${isLast ? "ring-2 ring-offset-1 ring-opacity-40 " + cfg.dotColor.replace("bg-", "ring-") : ""}`}
                  >
                    <span className={cfg.badgeText}>{cfg.icon}</span>
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-border my-1 group-hover:bg-slate-300 transition-colors min-h-[20px]" />
                  )}
                </div>

                {/* Right: content */}
                <div className={`pb-5 flex-1 pt-1 ${isLast ? "pb-0" : ""}`}>
                  {/* Action badge + timestamp */}
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderColor}`}
                    >
                      {cfg.icon}
                      {displayAction}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md flex-shrink-0">
                      <Clock size={11} />
                      <span>{date}</span>
                      <span className="text-border">·</span>
                      <span className="font-semibold">{time}</span>
                    </div>
                  </div>

                  {/* Actor */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <User size={11} />
                    <span>
                      by{" "}
                      <span className="font-semibold text-[#0E2271]">
                        {/* Show friendly name: strip email domain if it looks like an email */}
                        {event.actor && event.actor.includes("@")
                          ? event.actor.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                          : event.actor || "System"}
                      </span>
                    </span>
                  </div>

                  {/* Note */}
                  {event.note && event.note.trim() && (
                    <div className="mt-2 bg-secondary/60 border border-border rounded-lg p-3 relative">
                      <div className="absolute -top-1.5 left-4 w-3 h-3 bg-secondary/60 border-t border-l border-border rotate-45" />
                      <div className="flex items-start gap-2">
                        <MessageSquare
                          size={13}
                          className="text-[#CC1F1A] mt-0.5 flex-shrink-0"
                        />
                        <p className="text-sm text-foreground leading-relaxed">
                          {event.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

