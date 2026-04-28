/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CheckCircle, Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PriorityBadge,
  StatusBadge,
} from '@/components/common/StatusBadge';
import { Maintenance, User as UserType } from '@/types/models';
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
  onDelete,
  assignTarget,
  selectedTech,
  onSelectTech,
  onConfirmAssign,
  onCancelAssign,
  filteredProfessionals,
  currentUserId,
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
  onDelete: (m: Maintenance) => void;
  assignTarget: string | null;
  selectedTech: string;
  onSelectTech: (id: string) => void;
  onConfirmAssign: (m: Maintenance) => void;
  onCancelAssign: () => void;
  filteredProfessionals: UserType[];
  currentUserId?: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const detailPath = m.id.startsWith("PRJ-")
    ? `/dashboard/projects/${m.id}`
    : m.id.startsWith("BKG-") || m.id.startsWith("ALLOC-")
      ? `/dashboard/bookings/${m.id}`
      : `/dashboard/maintenance/${m.id}`;

  return (
    <>
      <tr className="hover:bg-secondary/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-mono text-xs font-semibold text-[#CC1F1A]">{m.id}</span>
            <button onClick={() => onCopyId(m.id)} className="text-muted-foreground hover:text-[#CC1F1A]">
              {copiedId === m.id ? <CheckCircle size={11} className="text-green-500" /> : <Copy size={11} />}
            </button>
          </div>
        </td>
        <td className="px-4 py-3 max-w-xs">
          <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
          <p className="text-xs text-muted-foreground truncate">{m.description || (m as any).purpose || ""}</p>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {(m as any).type || (m as any).category || "—"}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={getUserFacingStatus(m.status, role as WorkflowRole)} />
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={(m as any).priority || "Medium"} />
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {(m as any).location || (m as any).space || "—"}
          {m.floor ? `, ${m.floor}` : ""}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{m.createdAt.split("T")[0].split(" ")[0]}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Admin: Only View and Delete */}
            {role === "admin" ? (
              <>
                {/* View */}
                <button onClick={() => router.push(detailPath)} className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium">
                  <ExternalLink size={12} /> {t("action.view")}
                </button>
                {/* Delete */}
                <button onClick={() => onDelete(m)} className="flex items-center gap-1 text-xs text-red-600 hover:underline font-medium">
                  <Trash2 size={12} /> {t("action.delete")}
                </button>
              </>
            ) : (
              <>
                {/* Workflow action buttons for non-admin roles */}
                {role === "supervisor" && m.status === "Assigned to Supervisor" && (
                  <button onClick={() => onCreateWorkOrder(m)} className="text-xs bg-[#1A3580] text-white px-2 py-1 rounded font-bold uppercase tracking-wider">
                    {t("maintenance.createWorkOrder")}
                  </button>
                )}
                {role === "supervisor" && m.status === "WorkOrder Created" && (
                  <button onClick={() => onAssign(m.id)} className="text-xs bg-[#CC1F1A] text-white px-2 py-1 rounded font-bold uppercase tracking-wider">
                    {t("maintenance.assignProfessional")}
                  </button>
                )}
                {role === "supervisor" && m.status === "Completed" && (
                  <button onClick={() => onApprove(m)} className="text-xs bg-teal-600 text-white px-2 py-1 rounded font-bold uppercase">
                    {t("maintenance.submitReviewAdmin")}
                  </button>
                )}
                {/* Edit */}
                {role === "user" && m.status === "Submitted" && m.requestedBy === currentUserId && (
                  <button onClick={() => router.push(`/dashboard/maintenance/edit/${m.id}`)} className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium">
                    <Pencil size={12} /> {t("action.edit")}
                  </button>
                )}
                {/* View */}
                <button onClick={() => router.push(detailPath)} className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium">
                  <ExternalLink size={12} /> {t("action.view")}
                </button>
                {/* Delete */}
                {(role === "user" && m.requestedBy === currentUserId && ["Submitted", "Approved", "Rejected", "Closed"].includes(m.status)) && (
                  <button onClick={() => onDelete(m)} className="flex items-center gap-1 text-xs text-red-600 hover:underline font-medium">
                    <Trash2 size={12} /> {t("action.delete")}
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
      {/* Inline assign panel as a full-width row */}
      {assignTarget === m.id && (
        <tr>
          <td colSpan={8} className="px-4 py-3 bg-secondary/20 border-t border-border">
            <div className="flex gap-2">
              <select
                value={selectedTech}
                onChange={(e) => onSelectTech(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-input-background"
              >
                <option value="">
                  {role === "admin" ? t("maintenance.selectSupervisor") : t("maintenance.selectProfessional")}
                </option>
                {filteredProfessionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button onClick={() => onConfirmAssign(m)} disabled={!selectedTech} className="px-4 py-1.5 bg-[#1A3580] text-white text-sm rounded-lg disabled:opacity-50">
                {t("maintenance.assign")}
              </button>
              <button onClick={onCancelAssign} className="px-3 py-1.5 border border-border text-sm rounded-lg hover:bg-secondary">
                {t("projects.cancel")}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

