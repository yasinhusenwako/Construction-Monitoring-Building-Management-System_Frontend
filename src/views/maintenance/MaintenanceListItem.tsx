/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CheckCircle, Copy, ExternalLink, MapPin, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PriorityBadge,
  StatusBadge,
} from '@/components/common/StatusBadge';
import { Maintenance, User as UserType } from '@/data/mockData';
import { getUserFacingStatus, WorkflowRole } from '@/lib/workflow';
import { useLanguage } from '@/context/LanguageContext';

export function MaintenanceListItem({
  m,
  role,
  tech,
  onCopyId,
  copiedId,
  onAssign,
  onStartReview,
  onCreateWorkOrder,
  onStartWork,
  onCompleteWork,
  onApprove,
  onFinalApprove,
  onReject,
  onClose,
  assignTarget,
  selectedTech,
  onSelectTech,
  onConfirmAssign,
  onCancelAssign,
  filteredProfessionals,
}: {
  m: Maintenance;
  role?: string;
  tech?: UserType;
  onCopyId: (id: string) => void;
  copiedId: string;
  onAssign: (id: string) => void;
  onStartReview: (m: Maintenance) => void;
  onCreateWorkOrder: (m: Maintenance) => void;
  onStartWork: (m: Maintenance) => void;
  onCompleteWork: (m: Maintenance) => void;
  onApprove: (m: Maintenance) => void;
  onFinalApprove: (m: Maintenance) => void;
  onReject: (m: Maintenance) => void;
  onClose: (m: Maintenance) => void;
  assignTarget: string | null;
  selectedTech: string;
  onSelectTech: (id: string) => void;
  onConfirmAssign: (m: Maintenance) => void;
  onCancelAssign: () => void;
  filteredProfessionals: UserType[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#CC1F1A]">
              {m.id}
            </span>
            <button
              onClick={() => onCopyId(m.id)}
              className="text-muted-foreground hover:text-[#CC1F1A]"
            >
              {copiedId === m.id ? (
                <CheckCircle size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </button>
            <StatusBadge
              status={getUserFacingStatus(m.status, role as WorkflowRole)}
            />
            <PriorityBadge priority={(m as any).priority || "Medium"} />
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {(m as any).type || (m as any).category || ""}
            </span>
          </div>
          <h3 className="font-semibold text-[#0E2271]">{m.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {m.description || (m as any).purpose || ""}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} /> {(m as any).location || (m as any).space}
              {m.floor ? `, ${m.floor}` : ""}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {/* Note: In a real app we'd use a clock icon here, but we'll stick to text for brevity */}
              {m.createdAt.split(" ")[0]}
            </span>
            {tech && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User size={12} /> {tech.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Admin: Start Review */}
          {role === "admin" && m.status === "Submitted" && (
            <button
              onClick={() => onStartReview(m)}
              className="text-xs bg-[#7C3AED] text-white px-3 py-1 rounded font-bold uppercase tracking-wider"
            >
              {t("maintenance.startReview")}
            </button>
          )}

          {/* Admin: Assign Supervisor */}
          {role === "admin" && m.status === "Under Review" && (
            <button
              onClick={() => onAssign(m.id)}
              className="text-xs border border-[#1A3580] text-[#1A3580] px-2 py-1 rounded hover:bg-blue-50"
            >
              {t("maintenance.assignSupervisor")}
            </button>
          )}

          {/* Supervisor: Create WorkOrder */}
          {role === "supervisor" && m.status === "Assigned to Supervisor" && (
            <button
              onClick={() => onCreateWorkOrder(m)}
              className="text-xs bg-[#1A3580] text-white px-3 py-1 rounded font-bold uppercase tracking-wider"
            >
              {t("maintenance.createWorkOrder")}
            </button>
          )}

          {/* Supervisor: Assign to Professional */}
          {role === "supervisor" && m.status === "WorkOrder Created" && (
            <button
              onClick={() => onAssign(m.id)}
              className="text-xs bg-[#CC1F1A] text-white px-3 py-1 rounded font-bold uppercase tracking-wider"
            >
              {t("maintenance.assignProfessional")}
            </button>
          )}

          {/* Professional Actions */}
          {role === "professional" &&
            m.status === "Assigned to Professional" && (
              <button
                onClick={() => onStartWork(m)}
                className="text-xs bg-orange-600 text-white px-3 py-1 rounded font-bold uppercase"
              >
                {t("maintenance.startWork")}
              </button>
            )}

          {role === "professional" && m.status === "In Progress" && (
            <button
              onClick={() => onCompleteWork(m)}
              className="text-xs bg-cyan-600 text-white px-3 py-1 rounded font-bold uppercase"
            >
              {t("maintenance.completeSubmit")}
            </button>
          )}

          {/* Supervisor Review */}
          {role === "supervisor" && m.status === "Completed" && (
            <div className="flex gap-1">
              <button
                onClick={() => onApprove(m)}
                className="text-xs bg-teal-600 text-white px-2 py-1 rounded font-bold uppercase"
              >
                {t("maintenance.submitReviewAdmin")}
              </button>
            </div>
          )}

          {/* Admin Final Review */}
          {role === "admin" && m.status === "Reviewed" && (
            <div className="flex gap-1">
              <button
                onClick={() => onFinalApprove(m)}
                className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-bold uppercase"
              >
                {t("status.approved")}
              </button>

              <button
                onClick={() => onReject(m)}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold uppercase"
              >
                {t("status.rejected")}
              </button>
            </div>
          )}

          {/* Admin Close */}
          {role === "admin" && ["Approved", "Rejected"].includes(m.status) && (
            <button
              onClick={() => onClose(m)}
              className="text-xs bg-gray-600 text-white px-3 py-1 rounded font-bold uppercase"
            >
              {t("status.closed")}
            </button>
          )}

          <button
            onClick={() => {
              const path = m.id.startsWith("PRJ-")
                ? `/dashboard/projects/${m.id}`
                : m.id.startsWith("BKG-")
                  ? `/dashboard/bookings/${m.id}`
                  : `/dashboard/maintenance/${m.id}`;
              router.push(path);
            }}
            className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline"
          >
            <ExternalLink size={12} /> {t("projects.review")}
          </button>
        </div>
      </div>
      {/* Inline assign panel */}
      {assignTarget === m.id && (
        <div className="mt-3 pt-3 border-t border-border flex gap-2">
          <select
            value={selectedTech}
            onChange={(e) => onSelectTech(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-input-background"
          >
            <option value="">
              {role === "admin"
                ? t("maintenance.selectSupervisor")
                : t("maintenance.selectProfessional")}
            </option>
            {filteredProfessionals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => onConfirmAssign(m)}
            disabled={!selectedTech}
            className="px-4 py-1.5 bg-[#1A3580] text-white text-sm rounded-lg disabled:opacity-50"
          >
            {t("maintenance.assign")}
          </button>

          <button
            onClick={onCancelAssign}
            className="px-3 py-1.5 border border-border text-sm rounded-lg hover:bg-secondary"
          >
            {t("projects.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

