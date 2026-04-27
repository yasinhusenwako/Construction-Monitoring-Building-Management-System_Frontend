"use client";

import { Clock, User, MessageSquare } from "lucide-react";

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
}

export function Timeline({ events, title = "Activity Timeline", emptyMessage = "No activity yet" }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-modern">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#1A3580]" />
          {title}
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="glass-card rounded-2xl p-6 shadow-modern">
      <h3 className="text-sm font-semibold text-[#0E2271] mb-6 flex items-center gap-2">
        <Clock size={16} className="text-[#1A3580]" />
        {title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1A3580] via-[#1A3580]/50 to-transparent" />
        
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-[#1A3580] flex items-center justify-center shadow-sm">
                <div className="w-3 h-3 rounded-full bg-[#1A3580]" />
              </div>
              
              {/* Event content */}
              <div className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#0E2271] mb-1">
                      {event.action}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      <span className="font-medium">{event.actor}</span>
                      <span className="text-border">•</span>
                      <Clock size={12} />
                      <span>
                        {new Date(event.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status badge based on action */}
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getActionColor(event.action)}`}>
                    {event.action}
                  </span>
                </div>
                
                {/* Note if present */}
                {event.note && event.note.trim() && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={14} className="text-[#CC1F1A] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {event.note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to get color classes based on action
function getActionColor(action: string): string {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes("submitted")) {
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }
  if (actionLower.includes("review") || actionLower.includes("under review")) {
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  }
  if (actionLower.includes("assigned")) {
    return "bg-purple-100 text-purple-700 border border-purple-200";
  }
  if (actionLower.includes("progress") || actionLower.includes("in progress")) {
    return "bg-orange-100 text-orange-700 border border-orange-200";
  }
  if (actionLower.includes("completed")) {
    return "bg-teal-100 text-teal-700 border border-teal-200";
  }
  if (actionLower.includes("reviewed")) {
    return "bg-cyan-100 text-cyan-700 border border-cyan-200";
  }
  if (actionLower.includes("approved")) {
    return "bg-green-100 text-green-700 border border-green-200";
  }
  if (actionLower.includes("rejected")) {
    return "bg-red-100 text-red-700 border border-red-200";
  }
  if (actionLower.includes("closed")) {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }
  if (actionLower.includes("note")) {
    return "bg-indigo-100 text-indigo-700 border border-indigo-200";
  }
  
  // Default
  return "bg-slate-100 text-slate-700 border border-slate-200";
}
