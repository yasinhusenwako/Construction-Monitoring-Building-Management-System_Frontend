"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { mockMaintenance, mockUsers } from "../../data/mockData";
import type { Maintenance } from "../../data/mockData";
import {
  StatusBadge,
  PriorityBadge,
} from "../../components/common/StatusBadge";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  MapPin,
  User,
  FileText,
  Upload,
  DollarSign,
  Package,
} from "lucide-react";
import {
  canTransition,
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
  WorkflowStatus,
} from "../../lib/workflow";
import { getMaintenanceWithStored, updateMaintenance } from "../../lib/storage";
import {
  addNotification,
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from "../../lib/notifications";
import { WorkflowVisualizer } from "../../components/common/WorkflowVisualizer";

export function MaintenanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const role = currentUser?.role;

  const [maintenanceItem, setMaintenanceItem] = useState<Maintenance | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [actionDone, setActionDone] = useState("");
  const [techNote, setTechNote] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [selectedTech, setSelectedTech] = useState("");
  // Cost tracking state
  const [materialCost, setMaterialCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [costSaved, setCostSaved] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const merged = getMaintenanceWithStored(mockMaintenance);
      setMaintenanceItem(merged.find((m) => m.id === id) || null);
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("insa-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("insa-storage", refresh);
    };
  }, [id]);

  if (!maintenanceItem)
    return (
      <div className="text-center py-16">
        <h2 className="text-[#0E2271]">{t("maintenance.ticketNotFound")}</h2>
        <button
          onClick={() => router.push("/dashboard/maintenance")}
          className="mt-4 text-[#1A3580] hover:underline"
        >
          ← {t("action.back")}
        </button>
      </div>
    );

  const maint = maintenanceItem;
  const copyId = () => {
    try {
      navigator.clipboard.writeText(maint.id);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = maint.id;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const requester = mockUsers.find((u) => u.id === maint.requestedBy);
  const assignee = mockUsers.find((u) => u.id === maint.assignedTo);
  const professionals = mockUsers.filter((u) => u.role === "professional");

  const totalCost = parseInt(materialCost || "0") + parseInt(laborCost || "0");

  const handleAction = (
    action: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Maintenance>,
  ) => {
    if (!canTransition(actorRole, maint.status, action)) {
      setActionDone("Action not allowed for current status.");
      setTimeout(() => setActionDone(""), 3000);
      return;
    }
    const updated = {
      ...maint,
      ...extraUpdates,
      status: action,
      updatedAt: new Date().toISOString(),
    };
    setMaintenanceItem(updated);
    updateMaintenance(updated);
    if (extraUpdates?.supervisorId) {
      addNotification(
        createNotification({
          title: "Maintenance Assigned",
          message: `You have been assigned ${updated.id} for supervision.`,
          userId: extraUpdates.supervisorId,
          link: `/dashboard/maintenance/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (extraUpdates?.assignedTo) {
      addNotification(
        createNotification({
          title: "Maintenance Task Assigned",
          message: `You have been assigned ${updated.id} to complete.`,
          userId: extraUpdates.assignedTo,
          link: `/dashboard/maintenance/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (
      action === "Completed" &&
      actorRole === "professional" &&
      updated.supervisorId
    ) {
      addNotification(
        createNotification({
          title: "Maintenance Completed",
          message: `${updated.id} has been completed and needs review.`,
          userId: updated.supervisorId,
          link: `/dashboard/maintenance/${updated.id}`,
          type: "info",
        }),
      );
    }
    if (action === "Reviewed" && actorRole === "supervisor") {
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "Maintenance Ready for Approval",
            message: `${updated.id} reviewed by supervisor, awaiting admin approval.`,
            userId: id,
            link: `/dashboard/maintenance/${updated.id}`,
            type: "info",
          }),
        ),
      );
    }
    if (
      (action === "Approved" || action === "Rejected" || action === "Closed") &&
      actorRole === "admin"
    ) {
      addNotification(
        createNotification({
          title: `Maintenance ${action}`,
          message: `Your maintenance request ${updated.id} has been ${action.toLowerCase()}.`,
          userId: updated.requestedBy,
          link: `/dashboard/maintenance/${updated.id}`,
          type:
            action === "Approved"
              ? "success"
              : action === "Rejected"
                ? "error"
                : "info",
        }),
      );
    }
    setActionDone(message);
    setTimeout(() => setActionDone(""), 3000);
  };

  const handleSaveCost = () => {
    setCostSaved(true);
    setTimeout(() => setCostSaved(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard/maintenance")}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground mt-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-bold text-[#CC1F1A]">
                {maint.id}
              </span>
              <button
                onClick={copyId}
                className="text-muted-foreground hover:text-[#CC1F1A]"
              >
                {copied ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <StatusBadge
                status={getUserFacingStatus(maint.status, role as WorkflowRole)}
                size="md"
              />
              <PriorityBadge priority={maint.priority} />
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {maint.type}
              </span>
            </div>
            <h1 className="text-[#0E2271]">{maint.title}</h1>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
          {t("maintenance.maintenanceWorkflow")}
        </h3>
        <WorkflowVisualizer currentStatus={maint.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("maintenance.issueDescription")}
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {maint.description}
            </p>
            {maint.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {t("maintenance.additionalNotes")}
                </p>
                <p className="text-sm text-foreground">{maint.notes}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
              {t("maintenance.ticketDetails")}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                {
                  icon: <MapPin size={14} />,
                  label: t("maintenance.location_label"),
                  value: maint.location,
                },
                {
                  icon: <MapPin size={14} />,
                  label: t("maintenance.floor_label"),
                  value: maint.floor,
                },
                {
                  icon: <User size={14} />,
                  label: t("maintenance.reportedBy_label"),
                  value: requester?.name || maint.requestedBy,
                },
                {
                  icon: <User size={14} />,
                  label: t("maintenance.assignedTo_label"),
                  value: assignee?.name || t("maintenance.notAssigned"),
                },
                {
                  icon: <Clock size={14} />,
                  label: t("maintenance.created_label"),
                  value: maint.createdAt,
                },
                {
                  icon: <Clock size={14} />,
                  label: t("maintenance.resolved_label"),
                  value: maint.resolvedAt || t("maintenance.pending_label"),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-[#CC1F1A] mt-0.5 flex-shrink-0">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("maintenance.attachments_label")}
            </h3>
            {maint.attachments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("maintenance.noAttachments")}
              </p>
            ) : (
              <div className="space-y-2">
                {maint.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5"
                  >
                    <FileText size={16} className="text-[#CC1F1A]" />
                    <span className="text-sm flex-1">{att}</span>
                    <button className="text-xs text-[#1A3580] hover:underline">
                      {t("action.download")}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Professional can upload proof */}
            {role === "professional" && maint.status === "In Progress" && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-bold text-[#CC1F1A] uppercase tracking-wider mb-2">
                  Upload Completion Proof
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-[#CC1F1A]/50 hover:bg-red-50/30 transition-all group">
                    <Upload
                      size={24}
                      className="mx-auto text-muted-foreground mb-2 group-hover:text-[#CC1F1A]"
                    />
                    <p className="text-sm font-semibold text-[#0E2271]">
                      Upload Photos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Before / After repair images
                    </p>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-[#CC1F1A]/50 hover:bg-red-50/30 transition-all group">
                    <FileText
                      size={24}
                      className="mx-auto text-muted-foreground mb-2 group-hover:text-[#CC1F1A]"
                    />
                    <p className="text-sm font-semibold text-[#0E2271]">
                      Upload Documents
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receipts, manuals, or reports
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cost Tracking Panel — Professional & Admin */}
          {(role === "professional" || role === "admin") &&
            [
              "In Progress",
              "Completed",
              "Reviewed",
              "Approved",
              "Rejected",
              "Closed",
            ].includes(maint.status) && (
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
                  <DollarSign size={15} className="text-[#F5B800]" />{" "}
                  {t("maintenance.repairCostTracking")}
                </h3>
                {costSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} /> {t("maintenance.costDataSaved")}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t("maintenance.materialsCost")}
                    </label>
                    <input
                      type="number"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#CC1F1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t("maintenance.laborCostETB")}
                    </label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#CC1F1A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t("maintenance.partsUsed")}
                  </label>
                  <input
                    value={partsUsed}
                    onChange={(e) => setPartsUsed(e.target.value)}
                    placeholder="e.g. Capacitor x2, Fan Belt x1, Filter x3"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#CC1F1A]"
                  />
                </div>
                {totalCost > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-amber-800">
                      {t("maintenance.totalRepairCost")}
                    </span>
                    <span className="font-bold text-[#F5B800] text-lg">
                      ETB {totalCost.toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleSaveCost}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: "#F5B800", color: "#1A1A1A" }}
                >
                  <DollarSign size={14} /> {t("maintenance.saveCostData")}
                </button>
              </div>
            )}

          {/* Timeline */}
          {role !== "user" && (
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("maintenance.activityTimeline")}
              </h3>
              <div className="space-y-4">
                {maint.timeline.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-[#CC1F1A] flex items-center justify-center flex-shrink-0">
                        <Clock size={12} className="text-[#CC1F1A]" />
                      </div>
                      {i < maint.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={event.action} />
                        <span className="text-xs text-muted-foreground">
                          {event.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        by{" "}
                        <span className="font-medium text-foreground">
                          {event.actor}
                        </span>
                      </p>
                      {event.note && (
                        <p className="text-sm text-foreground mt-1 bg-secondary/50 rounded px-3 py-2">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("maintenance.adminActions_label")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={14} /> "{actionDone}" applied
                </div>
              )}

              <div className="space-y-2">
                {maint.status === "Submitted" && (
                  <button
                    onClick={() =>
                      handleAction("Under Review", "admin", "Review started")
                    }
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#7C3AED" }}
                  >
                    Start Review
                  </button>
                )}
                {maint.status === "Under Review" && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Assign Supervisor
                    </p>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none mb-2"
                    >
                      <option value="">Select Supervisor</option>
                      {mockUsers
                        .filter((u) => u.role === "supervisor")
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        // Auto-include the supervisor's divisionId so their dashboard shows the task
                        const supervisorUser = mockUsers.find(
                          (u) => u.id === selectedTech,
                        );
                        handleAction(
                          "Assigned to Supervisor",
                          "admin",
                          "Assigned to Supervisor",
                          {
                            supervisorId: selectedTech,
                            divisionId: supervisorUser?.divisionId,
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                      style={{ background: "#1A3580" }}
                    >
                      Assign to Supervisor
                    </button>
                  </div>
                )}
                {maint.status === "Reviewed" && (
                  <>
                    <button
                      onClick={() =>
                        handleAction("Approved", "admin", "Approved")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-green-600 hover:bg-green-700"
                    >
                      Approve Completion
                    </button>
                    <button
                      onClick={() =>
                        handleAction("Rejected", "admin", "Rejected")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-[#CC1F1A] hover:bg-red-700"
                    >
                      Reject to Div
                    </button>
                  </>
                )}
                {["Approved", "Rejected"].includes(maint.status) && (
                  <button
                    onClick={() => handleAction("Closed", "admin", "Closed")}
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-gray-600 hover:bg-gray-700"
                  >
                    {t("maintenance.verifyAndClose")}
                  </button>
                )}
                <div className="pt-2 border-t border-border">
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Add admin note..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      setActionDone("Note added");
                      setTimeout(() => setActionDone(""), 3000);
                      setAdminNote("");
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg text-sm border border-border hover:bg-secondary"
                  >
                    {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supervisor Actions */}
          {role === "supervisor" && maint.supervisorId === currentUser?.id && (
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                Supervisor Actions
              </h3>
              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={14} /> Status updated to "{actionDone}"
                </div>
              )}
              <div className="space-y-2">
                {maint.status === "Assigned to Supervisor" && (
                  <button
                    onClick={() => {
                      const workOrderId = maint.workOrderId || `WO-${maint.id}`;
                      handleAction(
                        "WorkOrder Created",
                        "supervisor",
                        "WorkOrder created",
                        { workOrderId },
                      );
                    }}
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#1A3580" }}
                  >
                    Create WorkOrder
                  </button>
                )}
                {maint.status === "WorkOrder Created" && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Assign to Professional
                    </p>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none mb-2"
                    >
                      <option value="">Select Professional</option>
                      {mockUsers
                        .filter((u) => u.role === "professional")
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        handleAction(
                          "Assigned to Professional",
                          "supervisor",
                          "Assigned to Professional",
                          { assignedTo: selectedTech },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                      style={{ background: "#CC1F1A" }}
                    >
                      Assign to Professional
                    </button>
                  </div>
                )}
                {maint.status === "Completed" && (
                  <button
                    onClick={() =>
                      handleAction("Reviewed", "supervisor", "Reviewed")
                    }
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#0891B2" }}
                  >
                    Submit Completion Report to Admin
                  </button>
                )}
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Supervisor Note
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder="Add supervision notes..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      setActionDone("Note saved");
                      setTimeout(() => setActionDone(""), 3000);
                      setTechNote("");
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg text-sm border border-border hover:bg-secondary"
                  >
                    {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {role === "professional" && maint.assignedTo === currentUser?.id && (
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("maintenance.updateStatus")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={14} /> Status updated to "{actionDone}"
                </div>
              )}

              <div className="space-y-2">
                {maint.status === "Assigned to Professional" && (
                  <button
                    onClick={() =>
                      handleAction("In Progress", "professional", "In Progress")
                    }
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#EA580C" }}
                  >
                    {t("maintenance.startRepair")}
                  </button>
                )}
                {maint.status === "In Progress" && (
                  <button
                    onClick={() =>
                      handleAction("Completed", "professional", "Completed")
                    }
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#0D9488" }}
                  >
                    Mark as Completed
                  </button>
                )}
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    {t("maintenance.technicianNote")}
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder="Add work notes, findings, or parts used..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      setActionDone("Note saved");
                      setTimeout(() => setActionDone(""), 3000);
                      setTechNote("");
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg text-sm border border-border hover:bg-secondary"
                  >
                    {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("maintenance.ticketInfo")}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("maintenance.ticketID")}
                </span>
                <span className="font-mono font-semibold text-[#CC1F1A]">
                  {maint.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("maintenance.timelineEvents_label")}
                </span>
                <span className="font-medium">{maint.timeline.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("maintenance.attachmentsCount")}
                </span>
                <span className="font-medium">{maint.attachments.length}</span>
              </div>
              {totalCost > 0 && (
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign size={12} /> {t("maintenance.totalCost")}
                  </span>
                  <span className="font-semibold text-[#F5B800]">
                    ETB {totalCost.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
