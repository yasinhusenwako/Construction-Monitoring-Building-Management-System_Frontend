"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Project } from "../../types/models";
import { StatusBadge } from "../../components/common/StatusBadge";
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
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  Briefcase,
} from "lucide-react";
import {
  fetchLiveProjects,
  fetchLiveUsers,
} from "@/lib/live-api";
import { executeWorkflowAction } from "@/lib/workflow-actions";
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
  const [copied, setCopied] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedTech, setSelectedTech] = useState("");
  const [actionDone, setActionDone] = useState("");
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      try {
        const [liveProjects, liveUsers] = await Promise.all([
          fetchLiveProjects(token, id),
          fetchLiveUsers(token),
        ]);
        setSystemUsers(liveUsers);
        const found = liveProjects.find((p) => p.id === id);

        if (
          found &&
          canViewItem(role as WorkflowRole, found, currentUser?.id)
        ) {
          setProjectItem(found);
        } else {
          setProjectItem(null);
        }
      } catch (error) {
        console.error("Failed to fetch project detail:", error);
        setProjectItem(null);
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

  const handleAction = async (
    action: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Project>,
  ) => {
    const result = await executeWorkflowAction({
      module: "PROJECT",
      businessId: project.id,
      requestId: project.dbId,
      currentStatus: project.status,
      nextStatus: action,
      actorRole,
      extraUpdates,
    });

    if (!result.ok) {
      setActionDone(result.message || (t("message.error") || "Error performing action"));
      setTimeout(() => setActionDone(""), 3000);
      return;
    }

    const updated = {
      ...project,
      ...extraUpdates,
      status: action,
      updatedAt: new Date().toISOString(),
    };
    setProjectItem(updated);

    // Re-sync after a short delay or immediately
    try {
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      const liveProjects = await fetchLiveProjects(token, id);
      const found = liveProjects.find((p) => p.id === id);
      if (found) setProjectItem(found);
    } catch (err) {
      console.error("Failed to re-sync after action", err);
    }

    setActionDone(message);
    setTimeout(() => setActionDone(""), 3000);
  };

  return (
    <div className="space-y-5 max-w-5xl">
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
            <h1 className="text-[#0E2271]">{project.title}</h1>
            <p className="text-muted-foreground text-sm">
              {project.classification.replace(/^A\d+\s*-\s*/, "")}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
          {t("projects.workflowProgress")}
        </h3>
        <WorkflowVisualizer currentStatus={project.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Combined Card for Description, Details, Contact, and Scope */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-8">
            {/* Description Section */}
            <div>
              <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
                {t("projects.description")}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Project Details Section */}
            <div>
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("projects.projectDetails")}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: <MapPin size={14} />,
                    label: t("form.location"),
                    value: project.location,
                  },
                  {
                    icon: <DollarSign size={14} />,
                    label: t("form.budget"),
                    value: `ETB ${project.budget.toLocaleString()}`,
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: t("form.startDate"),
                    value: project.startDate,
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: t("form.endDate"),
                    value: project.endDate,
                  },
                  {
                    icon: <User size={14} />,
                    label: t("form.assignedTo"),
                    value: assignee?.name || t("projects.notYetAssigned"),
                  },
                  ...(project.siteCondition
                    ? [
                        {
                          icon: <Info size={14} />,
                          label: t("common.other"),
                          value: project.siteCondition,
                        },
                      ]
                    : []),
                ].map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1A3580]">
                        {(item as any).icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {(item as any).label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {(item as any).value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Contact Information Section */}
            <div>
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("form.createdBy")} & Contact
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: <User size={14} />,
                    label: t("form.createdBy"),
                    value: requester?.name || project.requestedBy,
                  },
                  ...(project.department
                    ? [
                        {
                          icon: <Briefcase size={14} />,
                          label: t("users.department"),
                          value: project.department,
                        },
                      ]
                    : []),
                  ...(project.contactPerson
                    ? [
                        {
                          icon: <User size={14} />,
                          label: t("maintenance.contactPerson"),
                          value: project.contactPerson,
                        },
                      ]
                    : []),
                  ...(project.contactPhone
                    ? [
                        {
                          icon: <Phone size={14} />,
                          label: t("form.contactPhone"),
                          value: project.contactPhone,
                        },
                      ]
                    : []),
                ].map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground">
                        {(item as any).icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {(item as any).label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {(item as any).value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope Details Section (Dynamic fields from form) */}
            {Boolean(
              project.scope && Object.keys(project.scope).length > 0,
            ) && (
              <>
                <div className="h-px bg-border w-full" />
                <div>
                  <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                    Scope & Form Details
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(project.scope as any).map(
                      ([key, value]) => {
                        if (
                          !value ||
                          (Array.isArray(value) && value.length === 0)
                        )
                          return null;

                        // Make the key readable camelCase -> Title Case
                        const formattedKey = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase());
                        const displayValue = Array.isArray(value)
                          ? value.join(", ")
                          : String(value);

                        return (
                          <div key={key} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              <Info
                                size={14}
                                className="text-muted-foreground"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {formattedKey}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {displayValue}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("projects.documents")}
            </h3>
            {project.documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("projects.noDocumentsAttached")}
              </p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5"
                  >
                    <FileText size={16} className="text-[#1A3580]" />
                    <span className="text-sm flex-1">{doc}</span>
                    <a
                      href={`/${doc}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="text-xs text-[#1A3580] hover:underline cursor-pointer"
                    >
                      {t("projects.download")}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
              {t("projects.activityTimeline")}
            </h3>
            <div className="space-y-4">
              {project.timeline.map((event, i) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border-2 border-[#1A3580] flex items-center justify-center flex-shrink-0">
                      <Clock size={12} className="text-[#1A3580]" />
                    </div>
                    {i < project.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2">
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
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#f4f7fc] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0E2271]"></div>
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
                {(project.status === "Submitted" || project.status === "Under Review") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    {project.status === "Submitted" && (
                      <div className="mb-4 pb-4 border-b border-dashed border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          {t("requests.submitted")}: Ready for initial review.
                        </p>
                        <button
                          onClick={() =>
                            handleAction(
                              "Under Review",
                              "admin",
                              t("requests.under_review"),
                            )
                          }
                          className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ background: "#7C3AED" }}
                        >
                          <User size={16} /> {t("projects.startReview")}
                        </button>
                      </div>
                    )}

                    {project.status === "Under Review" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {t("requests.selectProfessional") || "Select Professional"}
                          </label>
                          <select
                            value={selectedTech}
                            onChange={(e) => setSelectedTech(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#1A3580]"
                          >
                            <option value="">{t("common.select") || "Select"}</option>
                            {systemUsers
                              .filter((u) => u.role === "professional")
                              .map((pr) => (
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
                              "Assigned to Professional",
                              "admin",
                              "Assigned to Professional",
                              {
                                assignedTo: selectedTech,
                              },
                            ).finally(() => setBusy(false));
                          }}
                          className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#1A3580] hover:bg-[#0E2271] transition-all disabled:opacity-40"
                        >
                          {t("requests.assignDirect") || "Assign Direct"}
                        </button>
                      </>
                    )}
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
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <ThumbsUp size={16} /> {t("projects.approveProject")}
                    </button>
                    <button
                      onClick={() =>
                        handleAction("Rejected", "admin", "Rejected")
                      }
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
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-slate-700 hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> {t("projects.closeRequest")}
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
                      setActionDone("Note Added");
                      setTimeout(() => setActionDone(""), 3000);
                      setAdminNote("");
                    }}
                    className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 mt-3 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {t("projects.sendToRequester")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {role === "professional" &&
            project.assignedTo === currentUser?.id && (
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                  {t("projects.professionalActions")}
                </h3>
                {actionDone && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} /> {actionDone}
                  </div>
                )}
                <div className="space-y-2">
                  {project.status === "Assigned to Professional" && (
                    <button
                      onClick={() =>
                        handleAction(
                          "In Progress",
                          "professional",
                          t("requests.in_progress"),
                        )
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold"
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
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ background: "#0D9488" }}
                    >
                      {t("maintenance.markFixed")}
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("projects.quickInfo")}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("projects.created")}
                </span>
                <span className="font-medium">{project.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("projects.lastUpdated")}
                </span>
                <span className="font-medium">{project.updatedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("form.attachments")}
                </span>
                <span className="font-medium">
                  {project.documents.length} {t("projects.filesCount")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("projects.timelineEventsCount")}
                </span>
                <span className="font-medium">{project.timeline.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
