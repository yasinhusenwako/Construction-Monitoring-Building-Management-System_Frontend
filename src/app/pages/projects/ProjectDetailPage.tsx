"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { mockProjects, mockUsers } from "../../data/mockData";
import type { Project } from "../../data/mockData";
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
  DollarSign,
  Calendar,
  User,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
} from "lucide-react";
import {
  canTransition,
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
  WorkflowStatus,
} from "../../lib/workflow";
import { getProjectsWithStored, updateProject } from "../../lib/storage";
import {
  addNotification,
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from "../../lib/notifications";
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

  useEffect(() => {
    const refresh = () => {
      const merged = getProjectsWithStored(mockProjects);
      setProjectItem(merged.find((p) => p.id === id) || null);
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("insa-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("insa-storage", refresh);
    };
  }, [id]);

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

  const requester = mockUsers.find((u) => u.id === project.requestedBy);
  const assignee = mockUsers.find((u) => u.id === project.assignedTo);

  const handleAction = (
    action: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Project>,
  ) => {
    if (!canTransition(actorRole, project.status, action)) {
      setActionDone("Action not allowed for current status.");
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
    updateProject(updated);
    if (extraUpdates?.supervisorId) {
      addNotification(
        createNotification({
          title: "Project Assigned",
          message: `You have been assigned ${updated.id} for supervision.`,
          userId: extraUpdates.supervisorId,
          link: `/dashboard/projects/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (extraUpdates?.assignedTo) {
      addNotification(
        createNotification({
          title: "Project Task Assigned",
          message: `You have been assigned ${updated.id} to complete.`,
          userId: extraUpdates.assignedTo,
          link: `/dashboard/projects/${updated.id}`,
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
          title: "Project Completed",
          message: `${updated.id} has been completed and needs review.`,
          userId: updated.supervisorId,
          link: `/dashboard/projects/${updated.id}`,
          type: "info",
        }),
      );
    }
    if (action === "Reviewed" && actorRole === "supervisor") {
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "Project Ready for Approval",
            message: `${updated.id} reviewed by supervisor, awaiting admin approval.`,
            userId: id,
            link: `/dashboard/projects/${updated.id}`,
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
          title: `Project ${action}`,
          message: `Your project request ${updated.id} has been ${action.toLowerCase()}.`,
          userId: updated.requestedBy,
          link: `/dashboard/projects/${updated.id}`,
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
              <PriorityBadge priority={project.priority} />
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
          {/* Description */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
              {t("projects.description")}
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Key Details */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
              {t("projects.projectDetails")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                  label: t("form.createdBy"),
                  value: requester?.name || project.requestedBy,
                },
                {
                  icon: <User size={14} />,
                  label: t("form.assignedTo"),
                  value: assignee?.name || t("projects.notYetAssigned"),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-[#1A3580] mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                    <button className="text-xs text-[#1A3580] hover:underline">
                      {t("projects.download")}
                    </button>
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
        <div className="space-y-4">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                {t("projects.adminActions")}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={14} /> {t("projects.actionApplied")}: "
                  {actionDone}"
                </div>
              )}

              <div className="space-y-2">
                {project.status === "Submitted" && (
                  <button
                    onClick={() =>
                      handleAction("Under Review", "admin", "Review started")
                    }
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold transition-all"
                    style={{ background: "#7C3AED" }}
                  >
                    {t("projects.startReview")}
                  </button>
                )}
                {project.status === "Under Review" && (
                  <div className="border-t border-border pt-3 mt-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Assign Supervisor
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none mb-2"
                    >
                      <option value="">Select Supervisor</option>
                      {mockUsers
                        .filter((u) => u.role === "supervisor")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
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
                          "Assigned to Supervisor",
                          {
                            supervisorId: selectedTech,
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2 rounded-lg text-sm font-medium border-2 border-[#1A3580] text-[#1A3580] hover:bg-secondary disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} /> Assign Supervisor
                    </button>
                  </div>
                )}
                {project.status === "Reviewed" && (
                  <>
                    <button
                      onClick={() =>
                        handleAction("Approved", "admin", "Approved")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ThumbsUp size={14} /> {t("projects.approveProject")}
                    </button>
                    <button
                      onClick={() =>
                        handleAction("Rejected", "admin", "Rejected")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-[#CC1F1A] hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ThumbsDown size={14} /> {t("projects.rejectProject")}
                    </button>
                  </>
                )}
                {["Approved", "Rejected"].includes(project.status) && (
                  <button
                    onClick={() => handleAction("Closed", "admin", "Closed")}
                    className="w-full py-2 rounded-lg text-white text-sm font-semibold bg-gray-600 hover:bg-gray-700 transition-all"
                  >
                    Close Request
                  </button>
                )}

                {/* Note */}
                <div className="border-t border-border pt-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t("projects.addNote")}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder={t("projects.addCommentOrReason")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      setActionDone("Note Added");
                      setTimeout(() => setActionDone(""), 3000);
                      setAdminNote("");
                    }}
                    className="w-full py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-secondary mt-2 flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={13} /> {t("projects.sendToRequester")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supervisor Actions */}
          {role === "supervisor" &&
            project.supervisorId === currentUser?.id && (
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                  Supervisor Actions
                </h3>
                {actionDone && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} /> {actionDone}
                  </div>
                )}
                <div className="space-y-2">
                  {project.status === "Assigned to Supervisor" && (
                    <button
                      onClick={() => {
                        const workOrderId =
                          project.workOrderId || `WO-${project.id}`;
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
                  {project.status === "WorkOrder Created" && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Assign Professional
                      </label>
                      <select
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none mb-2"
                      >
                        <option value="">Select Professional</option>
                        {mockUsers
                          .filter((u) => u.role === "professional")
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
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
                        className="w-full py-2 rounded-lg text-sm font-medium border-2 border-[#1A3580] text-[#1A3580] hover:bg-secondary disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus size={14} /> Assign Professional
                      </button>
                    </div>
                  )}
                  {project.status === "Completed" && (
                    <button
                      onClick={() =>
                        handleAction("Reviewed", "supervisor", "Reviewed")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ background: "#0891B2" }}
                    >
                      Submit Review to Admin
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Professional Actions */}
          {role === "professional" &&
            project.assignedTo === currentUser?.id && (
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0E2271] mb-4">
                  Professional Actions
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
                          "In Progress",
                        )
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ background: "#EA580C" }}
                    >
                      Start Work
                    </button>
                  )}
                  {project.status === "In Progress" && (
                    <button
                      onClick={() =>
                        handleAction("Completed", "professional", "Completed")
                      }
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ background: "#0D9488" }}
                    >
                      Mark Completed
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
