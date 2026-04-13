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
  MessageSquare,
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
    note?: string,
  ) => {
    if (!canTransition(actorRole, maint.status, action)) {
      setActionDone(t("message.error"));
      setTimeout(() => setActionDone(""), 3000);
      return;
    }
    const now = new Date().toISOString();
    const newEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      action: action,
      actor: currentUser?.name || actorRole,
      timestamp: now,
      note: note || "",
    };

    const updated = {
      ...maint,
      ...extraUpdates,
      status: action,
      updatedAt: now,
      timeline: [...maint.timeline, newEvent],
    };
    setMaintenanceItem(updated);
    updateMaintenance(updated);
    if (extraUpdates?.supervisorId) {
      addNotification(
        createNotification({
          title: t("notifications.title.assigned"),
          message: `${t("notifications.message.assigned")} (${updated.id})`,
          userId: extraUpdates.supervisorId,
          link: `/dashboard/maintenance/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (extraUpdates?.assignedTo) {
      addNotification(
        createNotification({
          title: t("notifications.title.taskAssigned"),
          message: `${t("notifications.message.taskAssigned")} (${updated.id})`,
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
          title: t("notifications.title.completed"),
          message: `${t("notifications.message.completed")} (${updated.id})`,
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
            title: t("notifications.title.readyApproval"),
            message: `${updated.id} ${t("notifications.message.readyApproval")}`,
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
          title: `${t("form.project")} ${t(`requests.${action.toLowerCase()}` as any) || action}`,
          message: `${t("projects.actionApplied")}: ${updated.id} ${t(`requests.${action.toLowerCase()}` as any) || action.toLowerCase()}.`,
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
    const updated = {
      ...maint,
      materialCost: parseInt(materialCost || "0"),
      laborCost: parseInt(laborCost || "0"),
      partsUsed: partsUsed,
      updatedAt: new Date().toISOString(),
    };
    setMaintenanceItem(updated);
    updateMaintenance(updated);
    setCostSaved(true);
    setTimeout(() => setCostSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map((f) => f.name);
    const updated = {
      ...maint,
      attachments: [...maint.attachments, ...newAttachments],
      updatedAt: new Date().toISOString(),
    };
    setMaintenanceItem(updated);
    updateMaintenance(updated);
    setActionDone(`${t("form.attachments")}: ${files.length}`);
    setTimeout(() => setActionDone(""), 3000);
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
          {/* Main Details Mega Card */}
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            
            {/* Description */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-[#0E2271] mb-3">
                {t("maintenance.issueDescription")}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {maint.description}
              </p>
              {maint.notes && (
                <div className="mt-4 pt-4 border-t border-border border-dashed">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t("maintenance.additionalNotes")}
                  </p>
                  <p className="text-sm text-foreground">{maint.notes}</p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-border" />

            {/* Details */}
            <div className="p-6 bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5">
                {t("maintenance.ticketDetails")}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                {[
                  {
                    icon: <MapPin size={16} />,
                    label: t("maintenance.location_label"),
                    value: maint.location,
                  },
                  ...(maint.building ? [{
                    icon: <MapPin size={16} />,
                    label: t("maintenance.placeholder.building") || "Building",
                    value: maint.building,
                  }] : []),
                  {
                    icon: <MapPin size={16} />,
                    label: t("maintenance.floor_label"),
                    value: maint.floor,
                  },
                  ...(maint.roomArea ? [{
                    icon: <MapPin size={16} />,
                    label: t("bookings.spaceKey") || "Room / Area",
                    value: maint.roomArea,
                  }] : []),
                  {
                    icon: <User size={16} />,
                    label: t("maintenance.reportedBy_label"),
                    value: requester?.name || maint.requestedBy,
                  },
                  {
                    icon: <User size={16} />,
                    label: t("maintenance.assignedTo_label"),
                    value: assignee?.name || t("maintenance.notAssigned"),
                  },
                  {
                    icon: <Clock size={16} />,
                    label: t("maintenance.created_label"),
                    value: maint.createdAt,
                  },
                  {
                    icon: <Clock size={16} />,
                    label: t("maintenance.resolved_label"),
                    value: maint.resolvedAt || t("maintenance.pending_label"),
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-[#CC1F1A] mt-0.5 flex-shrink-0 bg-red-50 p-1.5 rounded-md border border-red-100">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-medium text-foreground text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Attachments */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-[#0E2271] mb-4">
                {t("maintenance.attachments_label")}
              </h3>
              {maint.attachments.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">
                  {t("maintenance.noAttachments")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {maint.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:bg-secondary/60 transition-colors"
                    >
                      <FileText size={18} className="text-[#CC1F1A]" />
                      <span className="text-sm flex-1 font-medium truncate">{att}</span>
                      <button className="text-xs font-bold text-[#1A3580] hover:underline bg-[#1A3580]/10 px-2 py-1 rounded">
                        {t("action.download")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Professional can upload proof */}
              {role === "professional" && maint.status === "In Progress" && (
                <div className="mt-5 border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50">
                  <p className="text-[11px] font-bold text-[#CC1F1A] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Upload size={14} /> {t("maintenance.uploadCompletionProof")}
                  </p>
                  <input
                    id="pro-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => document.getElementById("pro-upload")?.click()}
                      className="border border-border rounded-xl p-5 text-center cursor-pointer hover:border-[#CC1F1A] hover:bg-white transition-all shadow-sm group"
                    >
                      <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#CC1F1A] transition-colors">
                        <Upload size={18} className="text-[#CC1F1A] group-hover:text-white" />
                      </div>
                      <p className="text-sm font-bold text-[#0E2271] group-hover:text-[#CC1F1A] transition-colors">
                        {t("maintenance.uploadPhotos")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("maintenance.beforeAfterImages")}
                      </p>
                    </div>
                    <div
                      onClick={() => document.getElementById("pro-upload")?.click()}
                      className="border border-border rounded-xl p-5 text-center cursor-pointer hover:border-[#CC1F1A] hover:bg-white transition-all shadow-sm group"
                    >
                      <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#CC1F1A] transition-colors">
                        <FileText size={18} className="text-[#CC1F1A] group-hover:text-white" />
                      </div>
                      <p className="text-sm font-bold text-[#0E2271] group-hover:text-[#CC1F1A] transition-colors">
                        {t("maintenance.uploadDocs")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("maintenance.receiptsManuals")}
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
                <>
                  <div className="h-px w-full bg-border" />
                  <div className="p-6 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                      <span className="bg-amber-100 p-1.5 rounded-md border border-amber-200">
                        <DollarSign size={16} className="text-amber-600" />
                      </span>
                      {t("maintenance.repairCostTracking")}
                    </h3>
                    {costSaved && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in">
                        <CheckCircle size={16} /> <span className="font-medium">{t("maintenance.costDataSaved")}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-5 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.materialsCost")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">ETB</span>
                          <input
                            type="number"
                            value={materialCost}
                            onChange={(e) => setMaterialCost(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.laborCostETB")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">ETB</span>
                          <input
                            type="number"
                            value={laborCost}
                            onChange={(e) => setLaborCost(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t("maintenance.partsUsed")}
                      </label>
                      <input
                        value={partsUsed}
                        onChange={(e) => setPartsUsed(e.target.value)}
                        placeholder="e.g. Capacitor x2, Fan Belt x1, Filter x3"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all font-medium"
                      />
                    </div>
                    {totalCost > 0 && (
                      <div className="mt-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <DollarSign size={16} /> {t("maintenance.totalRepairCost")}
                        </span>
                        <span className="font-black text-amber-600 text-xl tracking-tight">
                          ETB {totalCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveCost}
                      className="mt-4 flex items-center justify-center gap-2 px-5 py-2.5 w-full sm:w-auto rounded-lg text-white text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      style={{ background: "#d97706" }}
                    >
                      <CheckCircle size={16} /> {t("maintenance.saveCostData")}
                    </button>
                  </div>
                </>
              )}

            {/* Timeline */}
            {role !== "user" && (
              <>
                <div className="h-px w-full bg-border" />
                <div className="p-6">
                  <h3 className="text-sm font-bold text-[#0E2271] mb-6 flex items-center gap-2">
                    <span className="bg-indigo-50 p-1.5 rounded-md border border-indigo-100">
                      <Clock size={16} className="text-indigo-600" />
                    </span>
                    {t("maintenance.activityTimeline")}
                  </h3>
                  <div className="space-y-6">
                    {maint.timeline.map((event, i) => (
                      <div key={event.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-white border-[3px] border-[#CC1F1A]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#CC1F1A] transition-colors shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#CC1F1A]"></div>
                          </div>
                          {i < maint.timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-2 mb-2 group-hover:bg-[#CC1F1A]/30 transition-colors" />
                          )}
                        </div>
                        <div className="pb-2 flex-1 pt-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                            <div className="flex items-center gap-3">
                              <StatusBadge status={event.action} />
                              <span className="text-sm text-foreground font-medium">
                                {event.action}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1.5">
                            by <span className="font-bold text-[#0E2271]">{event.actor}</span>
                          </p>
                          {event.note && (
                            <div className="mt-3 bg-secondary/50 border border-border rounded-lg p-3 relative">
                              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-secondary/50 border-t border-l border-border transform rotate-45"></div>
                              <p className="text-sm text-foreground">{event.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel */}
        {/* Right Panel */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#f4f7fc] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0E2271]"></div>
              <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#CC1F1A]" />
                {t("maintenance.adminActions_label")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} /> <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {maint.status === "Submitted" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">{t("requests.submitted")}: Ready for initial review.</p>
                    <button
                      onClick={() =>
                        handleAction("Under Review", "admin", t("requests.under_review"))
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#7C3AED" }}
                    >
                      <User size={16} /> {t("maintenance.startReview")}
                    </button>
                  </div>
                )}
                {maint.status === "Under Review" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      {t("maintenance.assignSupervisor")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                    >
                      <option value="">{t("maintenance.placeholder.selectCategory").replace("category", "supervisor")}</option>
                      {mockUsers
                        .filter(
                          (u) =>
                            u.role === "supervisor" &&
                            u.divisionId === maint.divisionId,
                        )
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        const supervisorUser = mockUsers.find(
                          (u) => u.id === selectedTech,
                        );
                        handleAction(
                          "Assigned to Supervisor",
                          "admin",
                          t("requests.assigned_to_supervisor"),
                          {
                            supervisorId: selectedTech,
                            divisionId: supervisorUser?.divisionId,
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#1A3580] text-white hover:bg-[#0E2271] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> {t("maintenance.assignSupervisor")}
                    </button>
                  </div>
                )}
                {maint.status === "Reviewed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground mb-1">Final decision required for this maintenance ticket.</p>
                    <button
                      onClick={() =>
                        handleAction("Approved", "admin", t("requests.approved"))
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> {t("maintenance.approveCompletion")}
                    </button>
                    <button
                      onClick={() =>
                        handleAction("Rejected", "admin", t("requests.rejected"))
                      }
                      className="w-full py-2.5 rounded-lg text-[#CC1F1A] text-sm font-bold border-2 border-[#CC1F1A] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} /> {t("maintenance.rejectToDiv")}
                    </button>
                  </div>
                )}
                {["Approved", "Rejected"].includes(maint.status) && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <button
                      onClick={() => handleAction("Closed", "admin", t("status.closed"))}
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-slate-700 hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> {t("maintenance.verifyAndClose")}
                    </button>
                  </div>
                )}
                
                {/* Note Field */}
                <div className="p-4 bg-white rounded-lg border border-border shadow-sm mt-2">
                  <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                    {t("projects.addNote")}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder={t("projects.addCommentOrReason")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                  />
                  <button
                    onClick={() => {
                      if (!adminNote.trim()) return;
                      handleAction(
                        maint.status,
                        "admin",
                        t("maintenance.costDataSaved"),
                        {},
                        adminNote,
                      );
                      setAdminNote("");
                    }}
                    className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supervisor Actions */}
          {role === "supervisor" && maint.supervisorId === currentUser?.id && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#fff5f5] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#CC1F1A]"></div>
              <h3 className="text-sm font-bold text-[#CC1F1A] mb-5 flex items-center gap-2">
                <CheckCircle size={16} />
                {t("maintenance.supervisorActions")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} /> <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}
              <div className="space-y-4">
                {maint.status === "Assigned to Supervisor" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">Task has been assigned to you. Generate a work order to begin.</p>
                    <button
                      onClick={() => {
                        const workOrderId = maint.workOrderId || `WO-${maint.id}`;
                        handleAction(
                          "WorkOrder Created",
                          "supervisor",
                          t("requests.workorder_created"),
                          { workOrderId },
                        );
                      }}
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      style={{ background: "#1A3580" }}
                    >
                      <FileText size={16} /> {t("maintenance.createWorkOrder")}
                    </button>
                  </div>
                )}
                {maint.status === "WorkOrder Created" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      {t("maintenance.assignProfessional")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all"
                    >
                      <option value="">{t("maintenance.placeholder.selectCategory").replace("category", "professional")}</option>
                      {mockUsers
                        .filter(
                          (u) =>
                            u.role === "professional" &&
                            u.divisionId === maint.divisionId,
                        )
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
                          t("requests.assigned_to_professional"),
                          { assignedTo: selectedTech },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#CC1F1A] text-white hover:bg-[#aa1814] disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> {t("maintenance.assignProfessional")}
                    </button>
                  </div>
                )}
                {maint.status === "Completed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">Work has been completed by the professional. Review and submit to admin.</p>
                    <button
                      onClick={() =>
                        handleAction("Reviewed", "supervisor", t("requests.reviewed"))
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      style={{ background: "#0891B2" }}
                    >
                      <CheckCircle size={16} /> {t("maintenance.submitToAdmin")}
                    </button>
                  </div>
                )}
                
                {/* Note Field */}
                <div className="p-4 bg-white rounded-lg border border-border shadow-sm mt-2">
                  <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                    {t("maintenance.supervisorActions")} Note
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder={t("projects.addCommentOrReason")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all"
                  />
                  <button
                    onClick={() => {
                      if (!techNote.trim()) return;
                      handleAction(
                        maint.status,
                        "supervisor",
                        t("maintenance.noteSaved"),
                        {},
                        techNote,
                      );
                      setTechNote("");
                    }}
                    className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {role === "professional" && maint.assignedTo === currentUser?.id && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#fffbf0] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#EA580C]"></div>
              <h3 className="text-sm font-bold text-[#EA580C] mb-5 flex items-center gap-2">
                <CheckCircle size={16} />
                {t("maintenance.updateStatus")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} /> <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {maint.status === "Assigned to Professional" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">You have been assigned to this ticket. Begin the repair tracking.</p>
                    <button
                      onClick={() =>
                        handleAction("In Progress", "professional", t("requests.in_progress"))
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}
                    >
                      <Clock size={16} /> {t("maintenance.startRepair")}
                    </button>
                  </div>
                )}
                {maint.status === "In Progress" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">If the repair is finished, finalize the status below.</p>
                    <button
                      onClick={() =>
                        handleAction("Completed", "professional", t("requests.completed"))
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      style={{ background: "#0D9488" }}
                    >
                      <CheckCircle size={16} /> Mark as Completed
                    </button>
                  </div>
                )}
                
                {/* Note Field */}
                <div className="p-4 bg-white rounded-lg border border-border shadow-sm mt-2">
                  <label className="block text-xs font-semibold text-[#EA580C] mb-2 uppercase tracking-wide">
                    {t("maintenance.technicianNote")}
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder="Add work notes, findings, or parts used..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all"
                  />
                  <button
                    onClick={() => {
                      if (!techNote.trim()) return;
                      handleAction(
                        maint.status,
                        "professional",
                        t("maintenance.noteSaved"),
                        {},
                        techNote,
                      );
                      setTechNote("");
                    }}
                    className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("maintenance.saveNote")}
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
