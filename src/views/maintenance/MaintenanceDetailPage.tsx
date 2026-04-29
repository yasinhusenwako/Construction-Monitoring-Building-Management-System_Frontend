"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Maintenance, divisions } from "../../types/models";
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
  UserPlus,
  Users as UsersIcon,
  ThumbsDown,
  Info,
  Calendar,
} from "lucide-react";
import { fetchLiveMaintenance, fetchLiveUsers, fetchRequestHistory } from "@/lib/live-api";
import { apiRequest } from "@/lib/api";
import { executeWorkflowAction } from "@/lib/workflow-actions";
import { FileViewer } from "@/components/common/FileViewer";
import { convertDocumentsToFiles } from "@/lib/file-upload";
import { Timeline } from "@/components/common/Timeline";

import {
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
  WorkflowStatus,
  canViewItem,
} from "../../lib/workflow";
import { WorkflowVisualizer } from "../../components/common/WorkflowVisualizer";

const MAINTENANCE_DIVISIONS = [
  {
    id: "1",
    name: "Power Supply Division",
    tasks: [
      "Generator Installation and Maintenance",
      "Electric line Installation and Maintenance",
      "AC (Air Conditioning) Installation and Maintenance",
      "UPS Installation and Maintenance",
      "Boiler Installation and Maintenance",
      "Stove Installation and Maintenance",
      "Water Distiller Installation and Maintenance",
      "Divider Maintenance",
      "Chiller Maintenance",
      "LIFT (Elevator) Maintenance",
      "Preventive Maintenance for: Generators, UPS, AC, Lifts, and Water Distillers",
    ],
  },
  {
    id: "2",
    name: "Facility Administration Division",
    tasks: [
      "Cleaning services for the entire building",
      "Gardening and landscaping",
      "Maintaining the beauty of the compound",
      "Moving and shifting furniture/office items",
    ],
  },
  {
    id: "3",
    name: "Infrastructure Development and Building Maintenance Division",
    tasks: [
      "Executing building maintenance work",
      "Executing building construction work",
      "Executing water and sewerage line installation and maintenance",
      "Executing electrical line installation and maintenance",
      "Executing carpentry and woodwork",
      "Manufacturing furniture",
    ],
  },
];

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
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  // Cost tracking state
  const [materialCost, setMaterialCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [costSaved, setCostSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [assignMode, setAssignMode] = useState<"team" | "professional">("team");
  const [busy, setBusy] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        // Token is automatically sent via httpOnly cookie
        const [liveMaintenance, liveUsers] = await Promise.all([
          fetchLiveMaintenance(id),
          fetchLiveUsers(),
        ]);
        setSystemUsers(liveUsers);
        const found = liveMaintenance.find((m) => m.id === id);

        if (
          found &&
          canViewItem(role as WorkflowRole, found, currentUser?.id)
        ) {
          setMaintenanceItem(found);
          // Initialize cost fields if they exist
          if (found.materialCost) setMaterialCost(found.materialCost.toString());
          if (found.laborCost) setLaborCost(found.laborCost.toString());
          if (found.partsUsed) setPartsUsed(found.partsUsed);
          // Auto-set assign mode based on role for maintenance
          if (role === "admin") setAssignMode("team");
          else if (role === "supervisor") setAssignMode("professional");

          // Fetch real timeline from backend
          if (found.dbId) {
            try {
              const history = await fetchRequestHistory("MAINTENANCE", found.dbId, liveUsers);
              if (history.length > 0) {
                setMaintenanceItem({ ...found, timeline: history });
              }
            } catch { /* keep default */ }
          }
          
          // Fetch uploaded files from backend
          if (found.dbId) {
            try {
              const files = await apiRequest<any[]>(`/api/files/request/MAINTENANCE/${found.dbId}`);
              setUploadedFiles(files || []);
            } catch (error) {
              console.error("Failed to fetch files:", error);
              setUploadedFiles([]);
            }
          }
        } else {
          setMaintenanceItem(null);
        }
      } catch (error) {
        console.error("Failed to fetch maintenance detail:", error);
        setMaintenanceItem(null);
      } finally {
        setLoading(false);
      }
    };

    refresh();
  }, [id, role, currentUser]);

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
  const requester = systemUsers.find((u) => u.id === maint.requestedBy);
  const assignee = systemUsers.find((u) => u.id === maint.assignedTo);
  const professionals = systemUsers.filter((u) => u.role === "professional");
  
  // Maintenance uses professionals from the 3 maintenance divisions (DIV-001, DIV-002, DIV-003)
  // NOT from "OTHER" division
  const maintenanceDivisions = ["DIV-001", "DIV-002", "DIV-003"];
  const divisionProfessionals = professionals.filter(
    (u) => u.divisionId && maintenanceDivisions.includes(u.divisionId.toUpperCase())
  );
  
  // Further filter by profession/task type if selected
  const taskTypeDivisionProfessionals = divisionProfessionals.filter(
    (u) => u.profession === selectedTaskType
  );

  // Debug: Log delete button visibility
  console.log("=== Delete Button Debug (Maintenance) ===");
  console.log("Role:", role);
  console.log("Current User ID:", currentUser?.id);
  console.log("Maintenance Requested By:", maint.requestedBy);
  console.log("Maintenance Status:", maint.status);
  console.log("Is User:", role === "user");
  console.log("Is Creator:", maint.requestedBy === currentUser?.id);
  console.log("Is Submitted:", maint.status === "Submitted");
  console.log("User Can Delete:", role === "user" && maint.requestedBy === currentUser?.id && maint.status === "Submitted");
  console.log("Admin Can Delete:", role === "admin");
  console.log("Show Delete Button:", ((role === "user" && maint.requestedBy === currentUser?.id && maint.status === "Submitted") || role === "admin"));

  const totalCost = parseInt(materialCost || "0") + parseInt(laborCost || "0");

  const persistCostData = async (): Promise<Maintenance> => {
    if (!maint.dbId) throw new Error("Maintenance request id is missing");

    const materialCostValue = parseInt(materialCost || "0");
    const laborCostValue = parseInt(laborCost || "0");
    const totalCostValue = materialCostValue + laborCostValue;

    await apiRequest(`/api/professional/tasks/${maint.dbId}/cost`, {
      method: "PATCH",
      body: {
        maintenanceRequestId: maint.dbId,
        materialCost: materialCostValue,
        laborCost: laborCostValue,
        partsUsed,
      },
    });

    return {
      ...maint,
      materialCost: materialCostValue,
      laborCost: laborCostValue,
      totalCost: totalCostValue,
      partsUsed,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleAction = async (
    action: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Maintenance>,
    note?: string,
  ) => {
    if (role === "professional" && action === "Completed") {
      try {
        const updatedWithCost = await persistCostData();
        setMaintenanceItem(updatedWithCost);
        setCostSaved(true);
        setTimeout(() => setCostSaved(false), 3000);
      } catch (error) {
        console.error("Failed to save cost data before completion:", error);
        alert("Please save valid cost data before marking task as completed.");
        return;
      }
    }

    const trimmedNote = note?.trim();
    const isNoteOnly = action === maint.status && !!trimmedNote;

    // Skip if already in target status
    if (action === maint.status) {
      setActionDone(`Already in ${action} status`);
      setTimeout(() => setActionDone(""), 2000);
      return;
    }

    if (!isNoteOnly) {
      const result = await executeWorkflowAction({
        module: "MAINTENANCE",
        businessId: maint.id,
        requestId: maint.dbId,
        currentStatus: maint.status,
        nextStatus: action,
        actorRole,
        extraUpdates,
      });

      if (!result.ok) {
        console.error("Action failed:", JSON.stringify(result, null, 2));
        console.error("Request details:", {
          module: "MAINTENANCE",
          businessId: maint.id,
          requestId: maint.dbId,
          action,
          actorRole,
        });
        setActionDone(
          result.message ||
            t("message.error") ||
            `Error: Action failed - ${result.reason || "Unknown error"}`,
        );
        setTimeout(() => setActionDone(""), 3000);
        return;
      }
    }

    const now = new Date().toISOString();
    const timelineAction = isNoteOnly ? "Note Added" : action;
    const newEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      action: timelineAction,
      actor: currentUser?.name || actorRole,
      timestamp: now,
      note: trimmedNote || "",
    };

    const updated = {
      ...maint,
      ...extraUpdates,
      status: isNoteOnly ? maint.status : action,
      updatedAt: now,
      timeline: [...maint.timeline, newEvent],
    };
    setMaintenanceItem(updated);

    if (isNoteOnly) {
      setActionDone(message);
      setTimeout(() => setActionDone(""), 3000);
      return;
    }

    // Re-sync after action — merge backend data but keep optimistic timeline
    try {
      // Token is automatically sent via httpOnly cookie
      const liveMaintenance = await fetchLiveMaintenance(id);
      const found = liveMaintenance.find((m) => m.id === id);
      if (found) {
        // Merge: use backend data but ensure our new event is present
        const mergedTimeline = [
          ...found.timeline.filter((e) => e.id !== newEvent.id),
          newEvent,
        ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMaintenanceItem({ ...found, timeline: mergedTimeline });
      }
    } catch (err) {
      console.error("Failed to re-sync maintenance after action", err);
    }

    setActionDone(message);
    setTimeout(() => setActionDone(""), 3000);
  };

  const handleSaveCost = async () => {
    if (!maint.dbId) return;

    try {
      const updated = await persistCostData();
      setMaintenanceItem(updated);
      setCostSaved(true);
      setTimeout(() => setCostSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save cost data:", error);
      alert("Failed to save cost data. Please try again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!maint.id) {
      alert("Cannot upload files: Maintenance request ID is missing");
      return;
    }

    try {
      // Upload files to backend
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("entityType", "maintenance");
      formData.append("entityId", maint.id); // Use business ID, not dbId

      const uploadedFileData = await apiRequest<any>(
        `/api/files/upload`,
        {
          method: "POST",
          body: formData,
          headers: {}, // Let browser set Content-Type with boundary
        }
      );

      // Refresh uploaded files list
      const updatedFiles = await apiRequest<any[]>(
        `/api/files/request/MAINTENANCE/${maint.dbId}`
      );
      setUploadedFiles(updatedFiles || []);

      setActionDone(`${files.length} file(s) uploaded successfully`);
      setTimeout(() => setActionDone(""), 3000);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl modern-form">
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
              {/* Show human-readable category (subType) from the form */}
              <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                {maint.subType || maint.type}
              </span>
            </div>
            <h1 className="text-[#0E2271]">{maint.title}</h1>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="glass-card rounded-2xl p-6 shadow-modern">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
          {t("maintenance.maintenanceWorkflow")}
        </h3>
        <WorkflowVisualizer currentStatus={maint.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Details Mega Card */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-modern">
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
                  ...(maint.building
                    ? [
                        {
                          icon: <MapPin size={16} />,
                          label:
                            t("maintenance.placeholder.building") || "Building / Site",
                          value: maint.building,
                        },
                      ]
                    : []),
                  {
                    icon: <MapPin size={16} />,
                    label: t("maintenance.floor_label"),
                    value: maint.floor && maint.floor !== "N/A" ? maint.floor : null,
                  },
                  ...(maint.roomArea
                    ? [
                        {
                          icon: <MapPin size={16} />,
                          label: t("bookings.spaceKey") || "Room / Area",
                          value: maint.roomArea,
                        },
                      ]
                    : []),
                  ...(maint.subType && maint.subType !== maint.type
                    ? [
                        {
                          icon: <FileText size={16} />,
                          label: t("form.category") || "Issue Category",
                          value: maint.subType,
                        },
                      ]
                    : []),
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
                ]
                  .filter((item) => item.value)
                  .map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-[#CC1F1A] mt-0.5 flex-shrink-0 bg-red-50 p-1.5 rounded-md border border-red-100">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-medium text-foreground text-sm">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Attachments */}
            <div className="p-6">
              <FileViewer
                files={uploadedFiles.length > 0 
                  ? uploadedFiles.map(f => ({
                      id: f.id.toString(),
                      name: f.fileName,
                      url: `/api/files/download/${f.id}`,
                      size: undefined,
                      type: undefined,
                      uploadedAt: f.uploadedAt,
                    }))
                  : (maint.files || convertDocumentsToFiles(maint.attachments))
                }
                title={t("maintenance.attachments_label")}
                showDownload={true}
                showPreview={true}
                emptyMessage={t("maintenance.noAttachments")}
              />
              
              {/* Professional can upload proof */}
              {role === "professional" && (maint.status === "In Progress" || maint.status === "Assigned to Professionals") && (
                <div className="mt-5 border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50">
                  <p className="text-[11px] font-bold text-[#CC1F1A] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Upload size={14} />{" "}
                    {t("maintenance.uploadCompletionProof") || "UPLOAD COMPLETION PROOF"}
                  </p>
                  <input
                    id="pro-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() =>
                        document.getElementById("pro-upload")?.click()
                      }
                      className="border border-border rounded-xl p-5 text-center cursor-pointer hover:border-[#CC1F1A] hover:bg-white transition-all shadow-sm group"
                    >
                      <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#CC1F1A] transition-colors">
                        <Upload
                          size={18}
                          className="text-[#CC1F1A] group-hover:text-white"
                        />
                      </div>
                      <p className="text-sm font-bold text-[#0E2271] group-hover:text-[#CC1F1A] transition-colors">
                        {t("maintenance.uploadPhotos") || "Upload Photos"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("maintenance.beforeAfterImages") || "Before / After repair images"}
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        document.getElementById("pro-upload")?.click()
                      }
                      className="border border-border rounded-xl p-5 text-center cursor-pointer hover:border-[#CC1F1A] hover:bg-white transition-all shadow-sm group"
                    >
                      <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#CC1F1A] transition-colors">
                        <FileText
                          size={18}
                          className="text-[#CC1F1A] group-hover:text-white"
                        />
                      </div>
                      <p className="text-sm font-bold text-[#0E2271] group-hover:text-[#CC1F1A] transition-colors">
                        {t("maintenance.uploadDocs") || "Upload Documents"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("maintenance.receiptsManuals") || "Receipts, manuals, or reports"}
                      </p>
                    </div>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {uploadedFiles.length} file(s) uploaded
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cost Information Display - For Supervisor and Admin (Read-only) */}
            {(role === "supervisor" || role === "admin") &&
              maint.totalCost &&
              maint.totalCost > 0 && (
                <>
                  <div className="h-px w-full bg-border" />
                  <div className="p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
                    <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                      <span className="bg-amber-100 p-1.5 rounded-md border border-amber-200">
                        <DollarSign size={16} className="text-amber-600" />
                      </span>
                      {t("maintenance.costInformation")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.materialsCost")}
                        </p>
                        <p className="text-2xl font-black text-amber-600">
                          ETB {(maint.materialCost || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.laborCostETB")}
                        </p>
                        <p className="text-2xl font-black text-amber-600">
                          ETB {(maint.laborCost || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-4 shadow-md">
                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider mb-2">
                          {t("maintenance.totalRepairCost")}
                        </p>
                        <p className="text-2xl font-black text-white">
                          ETB {maint.totalCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {maint.partsUsed && (
                      <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Package size={14} />
                          {t("maintenance.partsUsed")}
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {maint.partsUsed}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

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
                        <CheckCircle size={16} />{" "}
                        <span className="font-medium">
                          {t("maintenance.costDataSaved")}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-5 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.materialsCost")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">
                            ETB
                          </span>
                          <input
                            type="number"
                            value={materialCost}
                            onChange={(e) => setMaterialCost(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all shadow-sm font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.laborCostETB")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">
                            ETB
                          </span>
                          <input
                            type="number"
                            value={laborCost}
                            onChange={(e) => setLaborCost(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all shadow-sm font-medium"
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
                        className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none focus:border-[#CC1F1A] focus:ring-2 focus:ring-[#CC1F1A]/20 transition-all shadow-sm font-medium"
                      />
                    </div>
                    {totalCost > 0 && (
                      <div className="mt-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <DollarSign size={16} />{" "}
                          {t("maintenance.totalRepairCost")}
                        </span>
                        <span className="font-black text-amber-600 text-xl tracking-tight">
                          ETB {totalCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveCost}
                      className="mt-4 flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all"
                      style={{ background: "#d97706" }}
                    >
                      <CheckCircle size={16} /> {t("maintenance.saveCostData")}
                    </button>
                  </div>
                </>
              )}

            {/* Timeline */}
            <>
              <div className="h-px w-full bg-border" />
              <div className="p-6">
                <Timeline
                  events={maint.timeline}
                  title={t("maintenance.activityTimeline")}
                  emptyMessage={t("maintenance.noActivityYet") || "No activity recorded yet"}
                  userRole={role as WorkflowRole}
                />
              </div>
            </>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#0E2271]">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#CC1F1A]" />
                {t("maintenance.adminActions_label")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {maint.status === "Submitted" && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    <div className="mb-4 pb-4 border-b border-dashed border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Quick Actions: Approve/Reject directly or start review process.
                      </p>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() =>
                            handleAction("Approved", "admin", t("requests.approved"))
                          }
                          className="flex-1 py-2.5 rounded-lg text-white text-sm font-bold bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt("Please enter the reason for rejection:");
                            if (reason !== null) {
                              try {
                                await apiRequest(`/api/maintenance/${maint.dbId}/reject`, {
                                  method: "PATCH",
                                  body: { reason },
                                });
                                window.location.reload();
                              } catch (error) {
                                alert("Failed to reject maintenance: " + (error instanceof Error ? error.message : "Unknown error"));
                              }
                            }
                          }}
                          className="flex-1 py-2.5 rounded-lg text-[#CC1F1A] text-sm font-bold border-2 border-[#CC1F1A] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          <ThumbsDown size={16} /> Reject
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">OR</div>
                      <button
                        onClick={() =>
                          handleAction(
                            "Under Review",
                            "admin",
                            t("requests.under_review"),
                          )
                        }
                        className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all shadow-premium hover-lift flex items-center justify-center gap-2"
                        style={{ background: "#7C3AED" }}
                      >
                        <User size={16} /> {t("maintenance.startReview")}
                      </button>
                    </div>
                  </div>
                )}
                
                {(maint.status === "Submitted" ||
                  maint.status === "Under Review") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">

                    {/* Assignment Mode UI - Restricted by role in Maintenance */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-border">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1A3580] flex items-center gap-1.5">
                        {role === "admin" ? (
                          <>
                            <UsersIcon size={12} />{" "}
                            {t("requests.assignToTeam") ||
                              "Division Assignment"}
                          </>
                        ) : (
                          <>
                            <User size={12} />{" "}
                            {t("requests.assignDirect") ||
                              "Professional Assignment"}
                          </>
                        )}
                      </h4>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100 uppercase">
                        {role}
                      </span>
                    </div>

                    {assignMode === "team" ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {t("requests.selectDivision")}
                          </label>
                          <select
                            value={selectedDivisionId}
                            onChange={(e) => {
                              setSelectedDivisionId(e.target.value);
                            }}
                            className="w-full text-sm px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm outline-none focus:border-[#1A3580] shadow-sm transition-all"
                          >
                            <option value="">
                              {t("requests.selectDivision")}
                            </option>
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          disabled={!selectedDivisionId || busy}
                          onClick={() => {
                            setBusy(true);
                            handleAction(
                              "Assigned to Supervisor",
                              "admin",
                              t("requests.assigned_to_supervisor"),
                              {
                                divisionId: selectedDivisionId,
                              },
                            ).finally(() => setBusy(false));
                          }}
                          className="w-full py-3 rounded-xl text-white text-sm font-bold bg-[#1A3580] shadow-premium hover-lift transition-all disabled:opacity-40 disabled:hover:transform-none"
                        >
                          {t("maintenance.assignSupervisor") ||
                            "Process Assignment"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {t("requests.selectProfessional") ||
                              "Select Professional"}
                          </label>
                          <select
                            value={selectedTech}
                            onChange={(e) => setSelectedTech(e.target.value)}
                            className="w-full text-sm px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm outline-none focus:border-[#1A3580] shadow-sm transition-all"
                          >
                            <option value="">
                              {t("common.select") || "Select"}
                            </option>
                            {divisionProfessionals.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          disabled={!selectedTech || busy}
                          onClick={() => {
                            setBusy(true);
                            handleAction(
                              "Assigned to Professionals",
                              "admin",
                              "Assigned to Professionals",
                              {
                                assignedTo: selectedTech,
                              },
                            ).finally(() => setBusy(false));
                          }}
                          className="w-full py-3 rounded-xl text-white text-sm font-bold bg-[#1A3580] shadow-premium hover-lift transition-all disabled:opacity-40 disabled:hover:transform-none"
                        >
                          {t("requests.assignDirect") || "Assign Direct"}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {maint.status === "Reviewed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Final decision required for this maintenance ticket.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "Approved",
                          "admin",
                          t("requests.approved"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold bg-green-600 shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />{" "}
                      {t("maintenance.approveCompletion")}
                    </button>
                    <button
                      onClick={async () => {
                        const reason = prompt("Please enter the reason for rejection:");
                        if (reason !== null) {
                          try {
                            await apiRequest(`/api/maintenance/${maint.dbId}/reject`, {
                              method: "PATCH",
                              body: { reason },
                            });
                            window.location.reload();
                          } catch (error) {
                            alert("Failed to reject maintenance: " + (error instanceof Error ? error.message : "Unknown error"));
                          }
                        }
                      }}
                      className="w-full py-2.5 rounded-lg text-[#CC1F1A] text-sm font-bold border-2 border-[#CC1F1A] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} /> {t("maintenance.rejectToDiv")}
                    </button>
                  </div>
                )}
                {["Approved", "Rejected"].includes(maint.status) && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <button
                      onClick={() =>
                        handleAction("Closed", "admin", t("status.closed"))
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold bg-slate-700 shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />{" "}
                      {t("maintenance.verifyAndClose")}
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
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none resize-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all shadow-sm"
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
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#CC1F1A]">
              <h3 className="text-sm font-bold text-[#CC1F1A] mb-5 flex items-center gap-2">
                <CheckCircle size={16} />
                {t("maintenance.supervisorActions")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}
              <div className="space-y-4">
                {maint.status === "Assigned to Supervisor" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-4">
                      Task has been assigned to you. Select an available professional to begin.
                    </p>
                    
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      {t("maintenance.assignProfessional")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all shadow-sm"
                    >
                      <option value="">Select professional...</option>
                      {divisionProfessionals.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}{tech.profession ? ` - ${tech.profession}` : " - General"}
                          </option>
                        ))}
                    </select>
                    
                    {divisionProfessionals.length === 0 && (
                      <p className="text-xs text-amber-600 mb-3 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        No professionals available in this division
                      </p>
                    )}

                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        const selectedProfessional = systemUsers.find(u => u.id === selectedTech);
                        handleAction(
                          "Assigned to Professionals",
                          "supervisor",
                          t("requests.assigned_to_professional"),
                          {
                            assignedTo: selectedTech,
                            notes: selectedProfessional?.profession || "General maintenance",
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-[#CC1F1A] text-white shadow-premium hover-lift transition-all disabled:bg-red-200 disabled:text-red-400 disabled:hover:transform-none flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />{" "}
                      {t("maintenance.assignProfessional")}
                    </button>
                  </div>
                )}
                {maint.status === "WorkOrder Created" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      Select Profession Type
                    </label>
                    <select
                      value={selectedTaskType}
                      onChange={(e) => {
                        setSelectedTaskType(e.target.value);
                        setSelectedTech(""); // Reset professional selection when profession changes
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all shadow-sm"
                    >
                      <option value="">Select profession type...</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="HVAC Technician">HVAC Technician</option>
                      <option value="Mason">Mason</option>
                      <option value="Painter">Painter</option>
                      <option value="Welder">Welder</option>
                      <option value="General Maintenance">General Maintenance</option>
                    </select>

                    {selectedTaskType && (
                      <>
                        <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide opacity-80 mt-4">
                          {t("maintenance.assignProfessional")} ({selectedTaskType})
                        </label>
                        <select
                          value={selectedTech}
                          onChange={(e) => setSelectedTech(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all shadow-sm"
                        >
                          <option value="">Select professional...</option>
                          {taskTypeDivisionProfessionals.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name} - {tech.profession}
                              </option>
                            ))}
                        </select>
                        {taskTypeDivisionProfessionals.length === 0 && (
                          <p className="text-xs text-amber-600 mb-3 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            No {selectedTaskType} professionals available in this division
                          </p>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => {
                        if (!selectedTech || !selectedTaskType) return;
                        handleAction(
                          "Assigned to Professionals",
                          "supervisor",
                          t("requests.assigned_to_professional"),
                          {
                            assignedTo: selectedTech,
                            notes: selectedTaskType,
                          },
                        );
                      }}
                      disabled={!selectedTech || !selectedTaskType}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-[#CC1F1A] text-white shadow-premium hover-lift transition-all disabled:bg-red-200 disabled:text-red-400 disabled:hover:transform-none flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />{" "}
                      {t("maintenance.assignProfessional")}
                    </button>
                  </div>
                )}
                {maint.status === "Completed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Work has been completed by the professional. Review and
                      submit to admin.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "Reviewed",
                          "supervisor",
                          t("requests.reviewed"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                      style={{ background: "#0891B2" }}
                    >
                      <CheckCircle size={16} /> {t("maintenance.submitToAdmin")}
                    </button>
                  </div>
                )}

                {/* Note Field */}
                <div className="glass-effect rounded-xl p-5 shadow-sm mt-3">
                  <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                    {t("maintenance.supervisorActions")} Note
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder={t("projects.addCommentOrReason")}
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none resize-none focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all shadow-sm"
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
                    className="w-full py-3 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 hover-lift transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {role === "professional" && maint.assignedTo === currentUser?.id && (
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#EA580C]">
              <h3 className="text-sm font-bold text-[#EA580C] mb-5 flex items-center gap-2">
                <CheckCircle size={16} />
                {t("maintenance.updateStatus")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {maint.status === "Assigned to Professionals" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      You have been assigned to this ticket. Begin the repair
                      tracking.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "In Progress",
                          "professional",
                          t("requests.in_progress"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}
                    >
                      <Clock size={16} /> {t("maintenance.startRepair")}
                    </button>
                  </div>
                )}
                {maint.status === "In Progress" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      If the repair is finished, finalize the status below.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "Completed",
                          "professional",
                          t("requests.completed"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                      style={{ background: "#0D9488" }}
                    >
                      <CheckCircle size={16} /> Mark as Completed
                    </button>
                  </div>
                )}

                {/* Note Field */}
                <div className="glass-effect rounded-xl p-5 shadow-sm mt-3">
                  <label className="block text-xs font-semibold text-[#EA580C] mb-2 uppercase tracking-wide">
                    {t("maintenance.technicianNote")}
                  </label>
                  <textarea
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    rows={3}
                    placeholder="Add work notes, findings, or parts used..."
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm text-sm outline-none resize-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all shadow-sm"
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
                    className="w-full py-3 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 hover-lift transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("maintenance.saveNote")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="glass-card rounded-2xl p-6 shadow-modern">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
              <Info size={16} className="text-[#CC1F1A]" />
              {t("maintenance.ticketInfo")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} />
                  {t("maintenance.ticketID")}
                </span>
                <span className="font-mono font-semibold text-[#CC1F1A]">
                  {maint.id}
                </span>
              </div>
              <div className="h-px bg-border"></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={14} />
                  {t("maintenance.created_label")}
                </span>
                <span className="font-medium text-xs">
                  {new Date(maint.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} />
                  {t("maintenance.lastUpdated")}
                </span>
                <span className="font-medium text-xs">
                  {new Date(maint.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="h-px bg-border"></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} />
                  {t("maintenance.attachmentsCount")}
                </span>
                <span className="font-semibold text-[#CC1F1A]">
                  {uploadedFiles.length > 0 ? uploadedFiles.length : maint.attachments.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} />
                  {t("maintenance.timelineEvents_label")}
                </span>
                <span className="font-semibold text-[#CC1F1A]">
                  {maint.timeline.length}
                </span>
              </div>
              {totalCost > 0 && (
                <>
                  <div className="h-px bg-border"></div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign size={14} />
                      {t("maintenance.totalCost")}
                    </span>
                    <span className="font-bold text-[#F5B800]">
                      ETB {totalCost.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
