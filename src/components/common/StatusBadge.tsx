"use client";

import { useLanguage } from '@/context/LanguageContext';

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> =
  {
    // Workflow statuses (new)
    Submitted: {
      bg: "bg-amber-50/50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      border: "border-amber-200/50",
    },
    "Under Review": {
      bg: "bg-purple-50/50",
      text: "text-purple-700",
      dot: "bg-purple-500",
      border: "border-purple-200/50",
    },
    "Assigned to Supervisor": {
      bg: "bg-blue-50/50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200/50",
    },
    "WorkOrder Created": {
      bg: "bg-sky-50/50",
      text: "text-sky-700",
      dot: "bg-sky-500",
      border: "border-sky-200/50",
    },
    "Assigned to Professional": {
      bg: "bg-indigo-50/50",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
      border: "border-indigo-200/50",
    },
    "In Progress": {
      bg: "bg-orange-50/50",
      text: "text-orange-700",
      dot: "bg-orange-500",
      border: "border-orange-200/50",
    },
    Completed: { bg: "bg-teal-50/50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-200/50" },
    Reviewed: { bg: "bg-cyan-50/50", text: "text-cyan-700", dot: "bg-cyan-500", border: "border-cyan-200/50" },
    Approved: {
      bg: "bg-green-50/50",
      text: "text-green-700",
      dot: "bg-green-500",
      border: "border-green-200/50",
    },
    Rejected: { bg: "bg-red-50/50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200/50" },
    Closed: { bg: "bg-gray-100/50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200/50" },
    "In Process": {
      bg: "bg-gray-100/50",
      text: "text-gray-700",
      dot: "bg-gray-400",
      border: "border-gray-200/50",
    },
    // User statuses
    active: { bg: "bg-green-50/50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200/50" },
    inactive: { bg: "bg-gray-100/50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200/50" },
    locked: { bg: "bg-red-50/50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200/50" },
  };

const priorityConfig: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "bg-red-100", text: "text-red-800" },
  High: { bg: "bg-orange-100", text: "text-orange-800" },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
  Low: { bg: "bg-gray-100", text: "text-gray-700" },
};

// Status translation map
const statusTranslationKeys: Record<string, string> = {
  // Workflow
  Submitted: "status.submitted",
  "Under Review": "status.underReview",
  "Assigned to Supervisor": "status.assignedToSupervisor",
  "WorkOrder Created": "status.workOrderCreated",
  "Assigned to Professional": "status.assignedToProfessional",
  "In Progress": "status.inProgress",
  Completed: "status.completed",
  Reviewed: "status.reviewed",
  Approved: "status.approved",
  Rejected: "status.rejected",
  Closed: "status.closed",
  "In Process": "status.inProcess",
  // User
  active: "status.active",
  inactive: "status.inactive",
  locked: "status.locked",
};

// Priority translation map
const priorityTranslationKeys: Record<string, string> = {
  Critical: "priority.critical",
  High: "priority.high",
  Medium: "priority.medium",
  Low: "priority.low",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status] || {
    bg: "bg-gray-100/50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200/50",
  };
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const translationKey = statusTranslationKeys[status];
  const displayText = translationKey ? t(translationKey) : status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${padding} shadow-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayText}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useLanguage();
  const config = priorityConfig[priority] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  const translationKey = priorityTranslationKeys[priority];
  const displayText = translationKey ? t(translationKey) : priority;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {displayText}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const { t } = useLanguage();
  const config: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-[#1A3580]", text: "text-white" },
    supervisor: { bg: "bg-[#7C3AED]", text: "text-white" },
    professional: { bg: "bg-[#CC1F1A]", text: "text-white" },
    user: { bg: "bg-[#F5B800]", text: "text-gray-900" },
    technician: { bg: "bg-[#CC1F1A]", text: "text-white" },
  };
  const c = config[role] || { bg: "bg-gray-200", text: "text-gray-700" };
  const label = t(`role.${role}`);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold capitalize ${c.bg} ${c.text}`}
    >
      {label}
    </span>
  );
}
