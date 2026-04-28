"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Project } from "../../types/models";
import { StatusBadge } from "../../components/common/StatusBadge";
import { FileViewer } from "@/components/common/FileViewer";
import { convertDocumentsToFiles } from "@/lib/file-upload";
import { getClassificationLabel, getClassificationCode, formatProjectTitle } from "@/lib/classification-utils";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Phone,
  Info,
  Layers,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  Briefcase,
  Package,
  FileText,
} from "lucide-react";
import { fetchLiveProjects, fetchLiveUsers } from "@/lib/live-api";
import { apiRequest } from "@/lib/api";
import { executeWorkflowAction } from "@/lib/workflow-actions";
import { Timeline } from "@/components/common/Timeline";
import {
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
  WorkflowStatus,
  canViewItem,
} from "../../lib/workflow";
import { WorkflowVisualizer } from "../../components/common/WorkflowVisualizer";

export function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const role = currentUser?.role;

  const [projectItem, setProjectItem] = useState<Project | null>(null);
  const [linkedProject, setLinkedProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedTech, setSelectedTech] = useState("");
  const [actionDone, setActionDone] = useState("");
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [materialCost, setMaterialCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [partsUsed, setPartsUsed] = useState("");
  const [costSaved, setCostSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingProject, setRejectingProject] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        // Token is automatically sent via httpOnly cookie
        const [liveProjects, liveUsers] = await Promise.all([
          fetchLiveProjects(id),
          fetchLiveUsers(),
        ]);
        setSystemUsers(liveUsers);
        const found = liveProjects.find((p) => p.id === id);

        if (
          found &&
          canViewItem(role as WorkflowRole, found, currentUser?.id)
        ) {
          setProjectItem(found);
          if (found.materialCost)
            setMaterialCost(found.materialCost.toString());
          if (found.laborCost) setLaborCost(found.laborCost.toString());
          if (found.partsUsed) setPartsUsed(found.partsUsed);
          
          // Fetch uploaded files from backend
          if (found.dbId) {
            try {
              const files = await apiRequest<any[]>(`/api/files/request/PROJECT/${found.dbId}`);
              setUploadedFiles(files || []);
            } catch (error) {
              console.error("Failed to fetch files:", error);
              setUploadedFiles([]);
            }
          }
          
          // Fetch linked project if this is A5/A6 with linkedProjectId
          if (found.linkedProjectId) {
            try {
              const linkedProjects = await fetchLiveProjects(found.linkedProjectId);
              const linked = linkedProjects.find((p) => p.id === found.linkedProjectId);
              setLinkedProject(linked || null);
            } catch (error) {
              console.error("Failed to fetch linked project:", error);
              setLinkedProject(null);
            }
          } else {
            setLinkedProject(null);
          }
        } else {
          setProjectItem(null);
          setLinkedProject(null);
        }
      } catch (error) {
        console.error("Failed to fetch project detail:", error);
        setProjectItem(null);
        setLinkedProject(null);
      } finally {
        setLoading(false);
      }
    };

    refresh();
  }, [id, role, currentUser]);

  if (!projectItem)
    return (
      <div className="text-center py-16">
        <h2 className="text-[#0E2271]">{t("projects.projectNotFound")}</h2>
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="mt-4 text-[#1A3580] hover:underline"
        >
          {t("projects.backToProjects")}
        </button>
      </div>
    );

  const project = projectItem;
  const canShowProfessionalActions =
    role === "professional" &&
    (project.assignedTo === currentUser?.id || !project.assignedTo);
  
  // Debug: Log delete button visibility
  console.log("=== Delete Button Debug (Project) ===");
  console.log("Role:", role);
  console.log("Current User ID:", currentUser?.id);
  console.log("Project Requested By:", project.requestedBy);
  console.log("Project Status:", project.status);
  console.log("Is User:", role === "user");
  console.log("Is Creator:", project.requestedBy === currentUser?.id);
  console.log("Is Submitted:", project.status === "Submitted");
  console.log("User Can Delete:", role === "user" && project.requestedBy === currentUser?.id && project.status === "Submitted");
  console.log("Admin Can Delete:", role === "admin");
  console.log("Show Delete Button:", ((role === "user" && project.requestedBy === currentUser?.id && project.status === "Submitted") || role === "admin"));
  
  // Debug: Log project cost data
  console.log("=== Project Cost Data ===");
  console.log("Role:", role);
  console.log("Project ID:", project.id);
  console.log("Material Cost:", project.materialCost, typeof project.materialCost);
  console.log("Labor Cost:", project.laborCost, typeof project.laborCost);
  console.log("Total Cost:", project.totalCost, typeof project.totalCost);
  console.log("Parts Used:", project.partsUsed);
  
  const copyId = () => {
    try {
      navigator.clipboard.writeText(project.id);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = project.id;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requester = systemUsers.find((u) => u.id === project.requestedBy);
  const assignee = systemUsers.find((u) => u.id === project.assignedTo);
  const professionals = systemUsers.filter((u) => u.role === "professional");
  
  // Projects use professionals from "OTHER" division (not maintenance divisions)
  const projectProfessionals = professionals.filter(
    (u) => u.divisionId && u.divisionId.toUpperCase() === "OTHER"
  );
  const totalCost = parseInt(materialCost || "0") + parseInt(laborCost || "0");
  const requestModeLabel =
    project.requestMode === "existing" ? "Existing Project" : "New Project";
  const autoAssignMap: Record<string, string> = {
    A1: "Structural Engineer & Lead Architect",
    A2: "Interior / Renovation Specialist",
    A3: "Interior / Renovation Specialist",
    A4: "Landscape Architect",
    A5: "Quantity Surveyor",
    A6: "Site Supervision Team",
  };
  const classificationCode = (project.classification || "").slice(0, 2);
  const autoAssignTo = autoAssignMap[classificationCode] || "Not Defined";
  const timelineRange =
    project.startDate && project.endDate
      ? `${project.startDate} -> ${project.endDate}`
      : "Not specified";
  const contactSummary = [project.contactPerson, project.contactPhone]
    .filter(Boolean)
    .join(" | ");
  const actualLocation = project.location || "-";
  const block = project.block || "-";
  const floor = project.floor || "-";
  const scopeData = project.scope || {};

  const toScopeDisplayValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "-";
    }
    if (typeof value === "string") {
      return value.trim() ? value : "-";
    }
    if (typeof value === "number") {
      return String(value);
    }
    return "-";
  };

  const summaryScopeItems = (() => {
    const hasA1Scope =
      toScopeDisplayValue(scopeData.buildingType) !== "-" ||
      toScopeDisplayValue(scopeData.floorArea) !== "-" ||
      toScopeDisplayValue(scopeData.disciplines) !== "-";
    const hasA2Scope =
      toScopeDisplayValue(scopeData.interventionType) !== "-" ||
      toScopeDisplayValue(scopeData.a2DesignScope) !== "-" ||
      toScopeDisplayValue(scopeData.a2Deliverables) !== "-";
    const hasA3Scope =
      toScopeDisplayValue(scopeData.spaceType) !== "-" ||
      toScopeDisplayValue(scopeData.a3Deliverables) !== "-";
    const hasA4Scope =
      toScopeDisplayValue(scopeData.projectContext) !== "-" ||
      toScopeDisplayValue(scopeData.a4Deliverables) !== "-";
    const hasA5Scope = toScopeDisplayValue(scopeData.boqPurpose) !== "-";
    const hasA6Scope =
      toScopeDisplayValue(scopeData.supervisionTypes) !== "-";

    const inferredCode = hasA2Scope
      ? "A2"
      : hasA3Scope
        ? "A3"
        : hasA4Scope
          ? "A4"
          : hasA5Scope
            ? "A5"
            : hasA6Scope
              ? "A6"
              : hasA1Scope
                ? "A1"
                : classificationCode;

    const items = (() => {
      switch (inferredCode) {
      case "A1":
        return [
          {
            label: "Building Type",
            value: toScopeDisplayValue(scopeData.buildingType),
          },
          {
            label: "Floor Area",
            value: toScopeDisplayValue(scopeData.floorArea),
          },
          {
            label: "Disciplines",
            value: toScopeDisplayValue(scopeData.disciplines),
          },
        ];
      case "A2":
        return [
          {
            label: "Intervention Type",
            value: toScopeDisplayValue(scopeData.interventionType),
          },
          {
            label: "Design Disciplines",
            value: toScopeDisplayValue(scopeData.a2DesignScope),
          },
          {
            label: "Deliverables",
            value: toScopeDisplayValue(scopeData.a2Deliverables),
          },
        ];
      case "A3":
        return [
          {
            label: "Space Type",
            value: toScopeDisplayValue(scopeData.spaceType),
          },
          {
            label: "Deliverables",
            value: toScopeDisplayValue(scopeData.a3Deliverables),
          },
        ];
      case "A4":
        return [
          {
            label: "Project Context",
            value: toScopeDisplayValue(scopeData.projectContext),
          },
          {
            label: "Site Area (sq.m)",
            value: scopeData.siteArea || "-",
          },
          {
            label: "Deliverables",
            value: toScopeDisplayValue(scopeData.a4Deliverables),
          },
        ];
      case "A5":
        return [
          {
            label: "BOQ Purpose",
            value: toScopeDisplayValue(scopeData.boqPurpose),
          },
        ];
      case "A6":
        return [
          {
            label: "Supervision Types",
            value: toScopeDisplayValue(scopeData.supervisionTypes),
          },
        ];
      default:
        return [];
      }
    })();

    return items.filter((item) => item.value !== "-");
  })();

  // Debug logging for assign professional visibility
  console.log("DEBUG ProjectDetail:", {
    role,
    isAdmin: role === "admin",
    status: project.status,
    isUnderReview: project.status === "Under Review",
    systemUsersCount: systemUsers.length,
    professionalsCount: professionals.length,
    professionals: professionals.map((p) => ({ id: p.id, name: p.name })),
    projectProfessionalsCount: projectProfessionals.length,
    projectProfessionals: projectProfessionals.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  });

  const handleAction = async (
    action: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Project>,
  ) => {
    let currentStatus = project.status;

    if (actorRole === "professional") {
      try {
        const liveProjects = await fetchLiveProjects(id);
        const found = liveProjects.find((p) => p.id === id);
        if (found) {
          currentStatus = found.status;
          if (found.status !== project.status) {
            setProjectItem(found);
          }
        }
      } catch (err) {
        console.error("Failed to refresh project status before action", err);
      }

      if (
        action === "In Progress" &&
        currentStatus !== "Assigned to Professionals"
      ) {
        setActionDone(
          `Cannot start work. Current status: '${currentStatus}'. Expected: 'Assigned to Professionals'. Please refresh the page or contact admin.`,
        );
        setTimeout(() => setActionDone(""), 5000);
        return;
      }
      
      if (
        action === "Completed" &&
        currentStatus !== "In Progress"
      ) {
        setActionDone(
          `Cannot mark complete. Current status: '${currentStatus}'. Expected: 'In Progress'. Please start work first.`,
        );
        setTimeout(() => setActionDone(""), 5000);
        return;
      }
    }

    if (role === "professional" && action === "Completed") {
      try {
        const updatedWithCost = await persistCostData();
        setProjectItem(updatedWithCost);
        setCostSaved(true);
        setTimeout(() => setCostSaved(false), 3000);
      } catch (error) {
        console.error("Failed to save cost data before completion:", error);
        alert("Please save valid cost data before marking task as completed.");
        return;
      }
    }

    const result = await executeWorkflowAction({
      module: "PROJECT",
      businessId: project.id,
      requestId: project.dbId,
      currentStatus,
      nextStatus: action,
      actorRole,
      extraUpdates,
    });

    if (!result.ok) {
      setActionDone(
        result.message || t("message.error") || "Error performing action",
      );
      setTimeout(() => setActionDone(""), 3000);
      return;
    }

    const now = new Date().toISOString();
    const newEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      action: action,
      actor: currentUser?.name || actorRole,
      timestamp: now,
      note: "",
    };

    const updated = {
      ...project,
      ...extraUpdates,
      status: action,
      updatedAt: now,
      timeline: [...(project.timeline || []), newEvent],
    };
    setProjectItem(updated);

    // Re-sync after action — merge backend data but keep optimistic timeline event
    try {
      // Token is automatically sent via httpOnly cookie
      const liveProjects = await fetchLiveProjects(id);
      const found = liveProjects.find((p) => p.id === id);
      if (found) {
        const mergedTimeline = [
          ...found.timeline.filter((e) => e.id !== newEvent.id),
          newEvent,
        ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setProjectItem({ ...found, timeline: mergedTimeline });
      }
    } catch (err) {
      console.error("Failed to re-sync after action", err);
    }

    setActionDone(message);
    setTimeout(() => setActionDone(""), 3000);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }
    
    setRejectingProject(true);
    try {
      await apiRequest(`/api/projects/${project.dbId}/reject`, {
        method: "PATCH",
        body: { reason: rejectionReason },
      });
      setShowRejectModal(false);
      setRejectionReason("");
      window.location.reload();
    } catch (error) {
      alert("Failed to reject project: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRejectingProject(false);
    }
  };

  const persistCostData = async (): Promise<Project> => {
    if (!project.dbId) throw new Error("Project request id is missing");

    const materialCostValue = parseInt(materialCost || "0");
    const laborCostValue = parseInt(laborCost || "0");
    const totalCostValue = materialCostValue + laborCostValue;

    console.log("=== Saving cost data ===");
    console.log("Project DB ID:", project.dbId);
    console.log("Material Cost:", materialCostValue);
    console.log("Labor Cost:", laborCostValue);
    console.log("Parts Used:", partsUsed);
    console.log("Request URL:", `/api/professional/projects/${project.dbId}/cost`);

    const response = await apiRequest(`/api/professional/projects/${project.dbId}/cost`, {
      method: "PATCH",
      body: {
        materialCost: materialCostValue,
        laborCost: laborCostValue,
        partsUsed,
      },
    });

    console.log("Cost save response:", response);

    return {
      ...project,
      materialCost: materialCostValue,
      laborCost: laborCostValue,
      totalCost: totalCostValue,
      partsUsed,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveCost = async () => {
    if (!project.dbId) return;

    try {
      const updated = await persistCostData();
      setProjectItem(updated);
      setCostSaved(true);
      setTimeout(() => setCostSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save cost data:", error);
      alert("Failed to save cost data. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl modern-form">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground mt-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-[#1A3580]">
                {project.id}
              </span>
              <button
                onClick={copyId}
                className="text-muted-foreground hover:text-[#1A3580]"
              >
                {copied ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <StatusBadge
                status={getUserFacingStatus(
                  project.status,
                  role as WorkflowRole,
                )}
                size="md"
              />
            </div>
            <h1 className="text-[#0E2271]">{formatProjectTitle(project)}</h1>
            <p className="text-muted-foreground text-sm">
              {getClassificationLabel(project.classification)}
            </p>
            {project.linkedProjectId && (
              <p className="text-xs text-muted-foreground mt-1">
                Linked to: <span className="font-mono font-semibold text-[#1A3580]">{project.linkedProjectId}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2" />
      </div>

      {/* Rejection Reason Alert - Show if project is rejected */}
      {project.status === "Rejected" && project.rejectionReason && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <ThumbsDown size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 mb-2">
                Project Rejected
              </h3>
              <p className="text-sm text-red-800 font-medium mb-1">
                Reason for rejection:
              </p>
              <p className="text-sm text-red-700 bg-white/50 rounded-lg p-3 border border-red-200">
                {project.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="glass-card rounded-2xl p-6 shadow-modern">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
          {t("projects.workflowProgress")}
        </h3>
        <WorkflowVisualizer currentStatus={project.status} module="project" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Project Info for A5/A6 */}
          {linkedProject && (project.linkedProjectId) && (
            <div className="glass-card rounded-2xl p-6 shadow-modern border-2 border-[#1A3580]/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1A3580]/10 flex items-center justify-center flex-shrink-0">
                  <Layers size={18} className="text-[#1A3580]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#0E2271] mb-1">
                    Linked Existing Project
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This {getClassificationCode(project.classification) === "A5" ? "BOQ preparation" : "supervision"} request is for the following existing project:
                  </p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#1A3580]">
                    {linkedProject.id}
                  </span>
                  <button
                    onClick={() => router.push(`/dashboard/projects/${linkedProject.id}`)}
                    className="text-xs text-[#1A3580] hover:underline"
                  >
                    View Project →
                  </button>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {linkedProject.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getClassificationLabel(linkedProject.classification)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium text-foreground">{linkedProject.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium text-foreground">
                      ETB {linkedProject.budget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={linkedProject.status} size="sm" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium text-foreground">{linkedProject.startDate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Combined Card for Description, Details, Contact, and Scope */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-8">
            {/* Request Summary - Hidden for A5/A6 existing projects */}
            {!(["A5", "A6"].includes(classificationCode) && project.requestMode === "existing") && (
              <div>
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                  Request Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: <FileText size={16} />, label: "Request ID", value: project.id || "-" },
                    { icon: <Layers size={16} />, label: "Request Mode", value: requestModeLabel },
                    { icon: <Package size={16} />, label: "Classification", value: project.classification || "-" },
                    { icon: <FileText size={16} />, label: "Title", value: project.title || "-" },
                    { icon: <MapPin size={16} />, label: "Location", value: actualLocation },
                    { icon: <MapPin size={16} />, label: "Block", value: block },
                    { icon: <MapPin size={16} />, label: "Floor", value: floor },
                    { icon: <Briefcase size={16} />, label: "Department", value: project.department || "-" },
                    {
                      icon: <User size={16} />,
                      label: "Requested By",
                      value: requester?.name || project.requestedBy || "-",
                    },
                    { icon: <Phone size={16} />, label: "Contact", value: contactSummary || "-" },
                    {
                      icon: <Info size={16} />,
                      label: "Site Condition",
                      value: project.siteCondition || "-",
                    },
                    {
                      icon: <DollarSign size={16} />,
                      label: "Budget",
                      value: `ETB ${project.budget.toLocaleString()}`,
                    },
                    { icon: <Calendar size={16} />, label: "Timeline", value: timelineRange },
                    { icon: <UserPlus size={16} />, label: "Auto-Assign To", value: autoAssignTo },
                    ...summaryScopeItems.map(item => ({
                      icon: <Package size={16} />,
                      ...item
                    })),
                    {
                      icon: <Layers size={16} />,
                      label: "Linked Project",
                      value: project.linkedProjectId || "-",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#1A3580]">{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-foreground break-words">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Functional Description - Full Width */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#1A3580]">
                        <MessageSquare size={16} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                        Functional Description
                      </p>
                      <p className="text-sm font-medium text-foreground break-words leading-relaxed">
                        {project.description || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Information Display - For Supervisor and Admin (Read-only) */}
            {(role === "supervisor" || role === "admin") &&
              project.totalCost &&
              project.totalCost > 0 && (
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
                          ETB {(project.materialCost || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t("maintenance.laborCostETB")}
                        </p>
                        <p className="text-2xl font-black text-amber-600">
                          ETB {(project.laborCost || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-4 shadow-md">
                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider mb-2">
                          {t("maintenance.totalRepairCost")}
                        </p>
                        <p className="text-2xl font-black text-white">
                          ETB {project.totalCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {project.partsUsed && (
                      <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Package size={14} />
                          {t("maintenance.partsUsed")}
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {project.partsUsed}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

            {/* Cost Tracking Panel — Professional Only */}
            {role === "professional" &&
              [
                "Assigned to Professionals",
                "In Progress",
                "Completed",
                "Approved",
                "Rejected",
                "Closed",
              ].includes(project.status) && (
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
                        placeholder="e.g. Cement x10, Steel Rod x5, Paint x12"
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
          </div>

          {/* Documents */}
          <div className="glass-card rounded-2xl p-6 shadow-modern">
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
                : convertDocumentsToFiles(project.documents)
              }
              title={t("projects.documents")}
              showDownload={true}
              showPreview={true}
              emptyMessage={t("projects.noDocumentsAttached")}
            />
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-2xl p-6 shadow-modern">
            <Timeline
              events={project.timeline}
              title={t("projects.activityTimeline")}
              emptyMessage={t("projects.noActivityYet") || "No activity recorded yet"}
              userRole={role as WorkflowRole}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#0E2271]">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#CC1F1A]" />
                {t("projects.adminActions")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">
                    {t("projects.actionApplied")}:
                  </span>{" "}
                  {actionDone}
                </div>
              )}

              <div className="space-y-4">
                {(project.status === "Submitted" ||
                  project.status === "Under Review") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    {project.status === "Submitted" && (
                      <div className="mb-4 pb-4 border-b border-dashed border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          Quick Actions: Approve/Reject directly or start review process.
                        </p>
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() =>
                              handleAction("Approved", "admin", "Approved")
                            }
                            className="flex-1 py-2.5 rounded-lg text-white text-sm font-bold bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                          >
                            <ThumbsUp size={16} /> Approve
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
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
                          <User size={16} /> {t("projects.startReview")}
                        </button>
                      </div>
                    )}

                    {/* Approve/Reject buttons for Under Review status */}
                    {project.status === "Under Review" && (
                      <div className="mb-4 pb-4 border-b border-dashed border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          Review the project and make a decision before assigning to professional.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAction("Approved", "admin", "Approved")
                            }
                            className="flex-1 py-2.5 rounded-lg text-white text-sm font-bold bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                          >
                            <ThumbsUp size={16} /> Approve
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex-1 py-2.5 rounded-lg text-[#CC1F1A] text-sm font-bold border-2 border-[#CC1F1A] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                          >
                            <ThumbsDown size={16} /> Reject
                          </button>
                        </div>
                      </div>
                    )}

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
                          Select
                        </option>
                        {projectProfessionals.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.name}
                          </option>
                        ))}
                      </select>
                      {projectProfessionals.length === 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          No professional users found. Create a professional account first.
                        </p>
                      )}
                      {project.status === "Submitted" && (
                        <p className="text-[10px] text-muted-foreground">
                          Start review first, then assign a professional.
                        </p>
                      )}
                    </div>

                    <button
                      disabled={
                        project.status !== "Under Review" ||
                        !selectedTech ||
                        busy
                      }
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
                      {t("requests.assignToProfessional") ||
                        "Assign to Professional"}
                    </button>
                  </div>
                )}

                {project.status === "Completed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Professional has completed their work. Final decision
                      required for this project.
                    </p>
                    <button
                      onClick={() =>
                        handleAction("Approved", "admin", "Approved")
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold bg-green-600 shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                    >
                      <ThumbsUp size={16} /> {t("projects.approveProject")}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full py-2.5 rounded-lg text-[#CC1F1A] text-sm font-bold border-2 border-[#CC1F1A] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ThumbsDown size={16} /> {t("projects.rejectProject")}
                    </button>
                  </div>
                )}

                {["Approved", "Rejected"].includes(project.status) && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <button
                      onClick={() =>
                        handleAction("Closed", "admin", t("requests.closed"))
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold bg-slate-700 shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> {t("projects.closeRequest")}
                    </button>
                  </div>
                )}

                {/* Note Field */}
                <div className="glass-effect rounded-xl p-5 shadow-sm mt-3">
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
                      setActionDone("Note Added");
                      setTimeout(() => setActionDone(""), 3000);
                      setAdminNote("");
                    }}
                    className="w-full py-3 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 hover-lift transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("projects.sendToRequester")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {canShowProfessionalActions && (
              <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#EA580C]">
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center justify-between">
                  <span>{t("projects.professionalActions")}</span>
                  <button
                    onClick={async () => {
                      try {
                        const liveProjects = await fetchLiveProjects(id);
                        const found = liveProjects.find((p) => p.id === id);
                        if (found) {
                          setProjectItem(found);
                          setActionDone("Status refreshed");
                          setTimeout(() => setActionDone(""), 2000);
                        }
                      } catch (err) {
                        console.error("Failed to refresh", err);
                      }
                    }}
                    className="text-xs text-[#1A3580] hover:underline"
                  >
                    Refresh Status
                  </button>
                </h3>
                {project.assignedTo && project.assignedTo !== currentUser?.id && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-sm text-amber-700">
                    You are viewing this task, but it is assigned to another professional.
                  </div>
                )}
                {actionDone && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} /> {actionDone}
                  </div>
                )}
                <div className="space-y-2">
                  {project.status === "Assigned to Professionals" && (
                    <button
                      onClick={() =>
                        handleAction(
                          "In Progress",
                          "professional",
                          t("requests.in_progress"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all"
                      style={{ background: "#EA580C" }}
                    >
                      {t("maintenance.startWork")}
                    </button>
                  )}
                  {project.status === "In Progress" && (
                    <button
                      onClick={() =>
                        handleAction(
                          "Completed",
                          "professional",
                          t("requests.completed"),
                        )
                      }
                      className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all"
                      style={{ background: "#0D9488" }}
                    >
                      {t("maintenance.markFixed")}
                    </button>
                  )}
                  {project.status !== "Assigned to Professionals" && project.status !== "In Progress" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                      Current status: <span className="font-semibold">{project.status}</span>
                      {project.status === "Under Review" && (
                        <p className="text-xs mt-1 text-slate-500">Waiting for admin to assign this project to you.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Quick Info */}
          <div className="glass-card rounded-2xl p-6 shadow-modern">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-4 flex items-center gap-2">
              <Info size={16} className="text-[#1A3580]" />
              {t("projects.quickInfo")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} />
                  {t("projects.projectID")}
                </span>
                <span className="font-mono font-semibold text-[#1A3580]">
                  {project.id}
                </span>
              </div>
              <div className="h-px bg-border"></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={14} />
                  {t("projects.created")}
                </span>
                <span className="font-medium text-xs">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} />
                  {t("projects.lastUpdated")}
                </span>
                <span className="font-medium text-xs">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="h-px bg-border"></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} />
                  {t("form.attachments")}
                </span>
                <span className="font-semibold text-[#1A3580]">
                  {uploadedFiles.length > 0 ? uploadedFiles.length : project.documents.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} />
                  {t("projects.timelineEventsCount")}
                </span>
                <span className="font-semibold text-[#1A3580]">
                  {project.timeline.length}
                </span>
              </div>
              {project.budget && (
                <>
                  <div className="h-px bg-border"></div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign size={14} />
                      {t("projects.budget")}
                    </span>
                    <span className="font-bold text-[#F5B800]">
                      ETB {Number(project.budget).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              {project.totalCost && project.totalCost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Package size={14} />
                    {t("projects.totalCost")}
                  </span>
                  <span className="font-bold text-[#F5B800]">
                    ETB {Number(project.totalCost).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#0E2271] mb-4">
              Reject Project
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this project. This will be sent to the requester.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:border-[#1A3580] text-sm"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={rejectingProject}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectingProject || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingProject ? "Rejecting..." : "Reject Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
