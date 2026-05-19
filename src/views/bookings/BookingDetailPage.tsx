"use client";
// Force recompile
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { format12Hour } from "@/lib/time-utils";
import { Booking } from "../../types/models";
import { StatusBadge } from "../../components/common/StatusBadge";
import { WorkflowVisualizer } from "../../components/common/WorkflowVisualizer";
import { Timeline } from "../../components/common/Timeline";
import {
  canViewItem,
  getUserFacingStatus,
  WorkflowRole,
} from "../../lib/workflow";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  LayoutGrid,
  MapPin,
  Phone,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { fetchLiveBookings, fetchLiveUsers } from "@/lib/live-api";
import { apiRequest } from "@/lib/api";
import { executeWorkflowAction } from "@/lib/workflow-actions";
import {
  getBookingAssignments,
  getBookingReports,
  getMyBookingAssignments,
  deactivateBookingAssignment,
  startBookingAssignment,
  completeBookingAssignment,
  approveBookingAssignment,
  rejectBookingAssignment,
  requestBookingClarification,
  type ProjectAssignment,
  type ProfessionalReport,
} from "@/lib/multi-professional-api";
import { AdminAssignProfessionalFormBooking } from "@/components/bookings/AdminAssignProfessionalFormBooking";
import { AdminBookingAssignmentsList } from "@/components/bookings/AdminBookingAssignmentsList";
import { AdminBookingReportsDashboard } from "@/components/bookings/AdminBookingReportsDashboard";
import { ProfessionalMyBookingAssignments } from "@/components/bookings/ProfessionalMyBookingAssignments";
import { ProfessionalBookingReportSubmission } from "@/components/bookings/ProfessionalBookingReportSubmission";
import { toast } from "sonner";

export default function BookingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t, formatDate } = useLanguage();
  const role = currentUser?.role || "user";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionDone, setActionDone] = useState("");
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingBooking, setRejectingBooking] = useState(false);

  // Assignment state
  const [busy, setBusy] = useState(false);

  // Multi-professional booking state
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ProjectAssignment | null>(null);
  const [viewingReportForAssignmentId, setViewingReportForAssignmentId] = useState<number | null>(null);

  // Load multi-professional assignments and reports
  const loadAssignmentsAndReports = async () => {
    if (!booking?.dbId) return;
    setLoadingAssignments(true);
    try {
      const [assignmentData, reportData] = await Promise.all([
        getBookingAssignments(booking.dbId),
        getBookingReports(booking.dbId),
      ]);
      setAssignments(assignmentData);
      setReports(reportData);
    } catch (error) {
      console.error("Failed to load assignments/reports:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Load professional's own assignments
  const loadMyAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const data = await getMyBookingAssignments();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load my assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const [liveBookings, liveUsers] = await Promise.all([
          fetchLiveBookings(id),
          fetchLiveUsers(),
        ]);
        setSystemUsers(liveUsers);
        const found = liveBookings.find((b) => b.id === id);

        // For professionals, check if they're assigned via multi-professional system
        let isAssignedViaMultiProfessional = false;
        if (role === "professional" && found?.dbId) {
          try {
            const myAssignments = await getMyBookingAssignments();
            isAssignedViaMultiProfessional = myAssignments.some(
              (a) => a.bookingId === found.dbId
            );
          } catch (error) {
            console.error("Failed to check multi-professional assignments:", error);
          }
        }

        if (
          found &&
          canViewItem(
            role as WorkflowRole,
            found,
            currentUser?.id,
            currentUser?.divisionId,
            isAssignedViaMultiProfessional,
          )
        ) {
          setBooking(found);
          // Load assignments/reports for admins at any active status
          if (role === "admin" && found.dbId && !["Submitted", "Under Review", "Closed", "Rejected"].includes(found.status ?? "")) {
            loadAssignmentsAndReports();
          }
          // Fetch real timeline from backend
          // TODO: Implement fetchRequestHistory function
          // if (found.dbId) {
          //   try {
          //     const history = await fetchRequestHistory("BOOKING", found.dbId, liveUsers);
          //     if (history.length > 0) {
          //       setBooking({ ...found, timeline: history });
          //     }
          //   } catch { /* keep default */ }
          // }
        } else {
          setBooking(null);
        }
      } catch (error) {
        console.error("Failed to fetch booking detail:", error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchBooking();
  }, [id, role, currentUser?.id, currentUser?.divisionId]);

  // Load assignments when booking is updated
  useEffect(() => {
    if (booking?.dbId) {
      if (role === "admin" && !["Submitted", "Under Review", "Closed", "Rejected"].includes(booking.status ?? "")) {
        loadAssignmentsAndReports();
      } else if (role === "professional" && ["Assigned to Professionals", "In Progress"].includes(booking.status ?? "")) {
        loadMyAssignments();
      }
    }
  }, [booking?.dbId, booking?.status, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A3580]"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-border">
        <h2 className="text-[#0E2271] text-xl font-bold mb-2">
          {t("bookings.notFound") || "Booking Not Found"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("bookings.noPermission") ||
            "The booking doesn't exist or you don't have permission to view it."}
        </p>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="px-6 py-2 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271]"
        >
          {t("bookings.backToBookings") || "Back to Bookings"}
        </button>
      </div>
    );
  }

  const isOfficeAllocation = booking.type === "Office";

  const requester = systemUsers.find((u) => u.id === booking.requestedBy);
  const assignee = systemUsers.find((u) => u.id === booking.assignedTo);
  const supervisorUser = systemUsers.find((u) => u.id === booking.supervisorId);

  // Bookings use professionals from "OTHER" division (not maintenance divisions)
  const bookingProfessionals = systemUsers.filter(
    (u) =>
      u.role === "professional" &&
      u.divisionId &&
      u.divisionId.toUpperCase() === "OTHER",
  );

  // Debug: Log delete button visibility
  // console.log("=== Delete Button Debug (Booking) ===");
  // console.log("Role:", role);
  // console.log("Current User ID:", currentUser?.id);
  // console.log("Booking Requested By:", booking.requestedBy);
  // console.log("Booking Status:", booking.status);
  // console.log("Is User:", role === "user");
  // console.log("Is Creator:", booking.requestedBy === currentUser?.id);
  // console.log("Is Submitted:", booking.status === "Submitted");
  // console.log("User Can Delete:", role === "user" && booking.requestedBy === currentUser?.id && booking.status === "Submitted");
  // console.log("Admin Can Delete:", role === "admin");
  // console.log("Show Delete Button:", ((role === "user" && booking.requestedBy === currentUser?.id && booking.status === "Submitted") || role === "admin"));

  const copyId = () => {
    try {
      navigator.clipboard.writeText(booking.id);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = booking.id;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (
    nextStatus: Booking["status"],
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Booking>,
  ) => {
    const result = await executeWorkflowAction({
      module: "BOOKING",
      businessId: booking.id,
      requestId: booking.dbId,
      currentStatus: booking.status,
      nextStatus,
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
      action: nextStatus,
      actor: currentUser?.name || actorRole,
      timestamp: now,
      note: "",
    };

    const updated = {
      ...booking,
      ...extraUpdates,
      status: nextStatus,
      updatedAt: now,
      timeline: [...(booking.timeline || []), newEvent],
    };

    setBooking(updated);

    // Re-sync after action — merge backend data but keep optimistic timeline event
    try {
      const liveBookings = await fetchLiveBookings(id);
      const found = liveBookings.find((b) => b.id === id);
      if (found) {
        const mergedTimeline = [
          ...found.timeline.filter((e) => e.id !== newEvent.id),
          newEvent,
        ].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        setBooking({ ...found, timeline: mergedTimeline });
      }
    } catch (err) {
      console.error("Failed to re-sync booking after action", err);
    }

    setActionDone(t(message) || message);
    setTimeout(() => setActionDone(""), 3000);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(t("requests.rejectionReasonRequired"));
      return;
    }

    setRejectingBooking(true);
    try {
      await apiRequest(`/api/bookings/${booking.dbId}/reject`, {
        method: "PATCH",
        body: { reason: rejectionReason },
      });
      setShowRejectModal(false);
      setRejectionReason("");
      window.location.reload();
    } catch (error) {
      alert(
        `${t("bookings.rejectBooking")}: ` +
          (error instanceof Error ? error.message : t("error.unknown")),
      );
    } finally {
      setRejectingBooking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl modern-form">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard/bookings")}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground mt-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-bold text-green-700">
                {booking.id}
              </span>
              <button
                onClick={copyId}
                className="text-muted-foreground hover:text-green-700"
              >
                {copied ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <StatusBadge
                status={getUserFacingStatus(
                  booking.status,
                  role as WorkflowRole,
                )}
                size="md"
              />
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  isOfficeAllocation
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {isOfficeAllocation
                  ? "🏢 B1 · Office Allocation"
                  : "🏛️ B2 · Hall Booking"}
              </span>
            </div>
            <h1 className="text-[#0E2271]">{booking.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Edit Button - Only show if user is the creator and status is Submitted */}
          {role === "user" &&
            booking.requestedBy === currentUser?.id &&
            booking.status === "Submitted" && (
              <button
                onClick={() =>
                  router.push(`/dashboard/bookings/${booking.id}/edit`)
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A3580] text-white text-sm font-semibold hover:bg-[#0E2271] transition-all"
              >
                <FileText size={16} />
                {t("action.edit") || "Edit Request"}
              </button>
            )}
        </div>
      </div>

      {/* Workflow */}
      <div className="glass-card rounded-2xl p-6 shadow-modern">
        <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
          {t("projects.workflowProgress") || "Workflow Progress"}
        </h3>
        <WorkflowVisualizer currentStatus={booking.status} module="booking" />
      </div>

      {/* Rejection Reason Alert - Show if booking is rejected */}
      {booking.status === "Rejected" && booking.rejectionReason && (
        <div>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ThumbsDown size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900 mb-2">
                  {t("bookings.bookingRejected")}
                </h3>
                <p className="text-sm text-red-800 font-medium mb-1">
                  {t("requests.reasonForRejection")}
                </p>
                <p className="text-sm text-red-700 bg-white/50 rounded-lg p-3 border border-red-200">
                  {booking.rejectionReason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Details - Left Side */}
        <div className="space-y-5">
          {/* ── Purpose / Description Card ── */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-modern">
            <div className="p-6">
              <h3 className="text-sm font-bold text-[#0E2271] mb-3">
                {isOfficeAllocation
                  ? t("bookings.reasonKey") || "Reason for Allocation"
                  : t("bookings.purpose") || "Event Purpose"}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {booking.purpose || "—"}
              </p>

              {booking.notes && (
                <div className="mt-4 pt-4 border-t border-border border-dashed">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t("maintenance.additionalNotes") || "Additional Notes"}
                  </p>
                  <p className="text-sm text-foreground">{booking.notes}</p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-border" />

            {/* ── Core Booking Details Grid ── */}
            <div className="p-6 bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5">
                {t("bookings.bookingDetails") || "Booking Details"}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                {isOfficeAllocation ? (
                  <>
                    <DetailRow
                      icon={<Briefcase size={16} />}
                      label={t("users.department") || "Department"}
                      value={booking.department}
                    />
                    <DetailRow
                      icon={<LayoutGrid size={16} />}
                      label={t("bookings.officeTypeKey") || "Office Type"}
                      value={booking.officeType}
                    />
                    <DetailRow
                      icon={<MapPin size={16} />}
                      label={
                        t("bookings.preferredLocationKey") ||
                        "Preferred Location"
                      }
                      value={
                        booking.space !== "N/A" ? booking.space : undefined
                      }
                    />
                    <DetailRow
                      icon={<Users size={16} />}
                      label={t("bookings.seniorStaffKey") || "Senior Staff"}
                      value={booking.seniorStaff}
                    />
                    <DetailRow
                      icon={<Users size={16} />}
                      label={t("bookings.supportStaffKey") || "Support Staff"}
                      value={booking.supportStaff}
                    />
                    <DetailRow
                      icon={<Users size={16} />}
                      label={
                        t("bookings.totalHeadcountKey") || "Total Headcount"
                      }
                      value={
                        booking.attendees > 0
                          ? `${booking.attendees} people`
                          : undefined
                      }
                    />
                    <DetailRow
                      icon={<User size={16} />}
                      label={
                        t("maintenance.reportedBy_label") || "Requested By"
                      }
                      value={requester?.name || booking.requestedBy}
                    />
                    <DetailRow
                      icon={<User size={16} />}
                      label={t("maintenance.assignedTo_label") || "Assigned To"}
                      value={assignee?.name}
                    />
                    <DetailRow
                      icon={<Calendar size={16} />}
                      label={t("form.date") || "Submitted On"}
                      value={booking.date}
                    />
                  </>
                ) : (
                  <>
                    <DetailRow
                      icon={<LayoutGrid size={16} />}
                      label={t("bookings.spaceKey") || "Space"}
                      value={booking.space}
                    />
                    <DetailRow
                      icon={<Calendar size={16} />}
                      label={t("bookings.date") || "Date"}
                      value={booking.date}
                    />
                    <DetailRow
                      icon={<Clock size={16} />}
                      label={t("bookings.startTime") || "Start Time"}
                      value={format12Hour(booking.startTime)}
                    />
                    <DetailRow
                      icon={<Clock size={16} />}
                      label={t("bookings.endTime") || "End Time"}
                      value={
                        booking.endTime !== booking.startTime
                          ? format12Hour(booking.endTime)
                          : undefined
                      }
                    />
                    <DetailRow
                      icon={<Users size={16} />}
                      label={t("dashboard.attendees") || "Attendees"}
                      value={
                        booking.attendees > 0
                          ? booking.attendees.toString()
                          : undefined
                      }
                    />
                    <DetailRow
                      icon={<FileText size={16} />}
                      label={t("bookings.layoutKey") || "Room Layout"}
                      value={booking.roomLayout}
                    />
                    <DetailRow
                      icon={<User size={16} />}
                      label={
                        t("maintenance.reportedBy_label") || "Requested By"
                      }
                      value={requester?.name || booking.requestedBy}
                    />
                    <DetailRow
                      icon={<User size={16} />}
                      label={t("maintenance.assignedTo_label") || "Assigned To"}
                      value={assignee?.name}
                    />
                  </>
                )}
              </div>
            </div>

            {/* ── Contact Info (B1 only) ── */}
            {isOfficeAllocation &&
              (booking.contactPerson || booking.contactPhone) && (
                <>
                  <div className="h-px w-full bg-border" />
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-[#0E2271] mb-4">
                      {t("form.contact") || "Contact Information"}
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-4">
                      <DetailRow
                        icon={<User size={16} />}
                        label={
                          t("maintenance.contactPerson") || "Contact Person"
                        }
                        value={booking.contactPerson}
                      />
                      <DetailRow
                        icon={<Phone size={16} />}
                        label={t("form.contactPhone") || "Contact Phone"}
                        value={booking.contactPhone}
                      />
                    </div>
                  </div>
                </>
              )}

            {/* ── Special Requirements / Amenities ── */}
            {booking.requirements && (
              <>
                <div className="h-px w-full bg-border" />
                <div className="p-6">
                  <h3 className="text-sm font-bold text-[#0E2271] mb-4">
                    {isOfficeAllocation
                      ? t("bookings.specialReqsKey") || "Special Requirements"
                      : t("bookings.amenitiesKey") || "Amenities Requested"}
                  </h3>
                  <ChipList
                    items={booking.requirements
                      .split(",")
                      .map((r) => r.trim())
                      .filter(Boolean)}
                  />
                </div>
              </>
            )}
          </div>


        </div>

        {/* Right Panel - Admin Actions, Professional Tasks, Quick Summary */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#0E2271]">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                {t("maintenance.adminActions_label") || "Admin Actions"}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />
                  <span className="font-medium">Applied:</span> {actionDone}
                </div>
              )}

              <div className="space-y-4">
                {(booking.status === "Submitted" ||
                  booking.status === "Under Review") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    {booking.status === "Submitted" && (
                      <div className="mb-4 pb-4 border-b border-dashed border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          Quick Actions: Approve/Reject directly or start review
                          process.
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
                        <div className="text-xs text-muted-foreground mb-2">
                          OR
                        </div>
                        <button
                          onClick={() =>
                            handleAction(
                              "Under Review",
                              "admin",
                              "Started Review",
                            )
                          }
                          className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all shadow-premium hover-lift flex items-center justify-center gap-2"
                          style={{ background: "#7C3AED" }}
                        >
                          <User size={16} /> Start Review Process
                        </button>
                      </div>
                    )}

                    {booking.status === "Under Review" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 mb-3">
                          Use the "Professional Assignments" section below to assign professionals with specific scopes.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mark as Completed — admin manual trigger */}
                {(booking.status === "Assigned to Professionals" ||
                  booking.status === "In Progress") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    <div className="mb-2 pb-4 border-b border-dashed border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Once professionals have finished their tasks, you can
                        mark the entire booking as Completed.
                      </p>
                      <button
                        onClick={() =>
                          handleAction(
                            "Completed",
                            "admin",
                            "Booking marked as Completed",
                          )
                        }
                        className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                        style={{ background: "#0D9488" }}
                      >
                        <CheckCircle size={16} /> Mark Booking as Completed
                      </button>
                    </div>
                  </div>
                )}

                {booking.status === "Completed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Professional has completed their work. Final decision
                      required.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          handleAction("Approved", "admin", "Booking Approved")
                        }
                        className="py-3 rounded-xl text-white text-sm font-bold bg-green-600 shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={16} /> Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ background: "#CC1F1A" }}
                      >
                        <ThumbsDown size={16} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {["Approved", "Rejected"].includes(booking.status) && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                      Process completed. Finalize the ticket.
                    </p>
                    <button
                      onClick={() =>
                        handleAction("Closed", "admin", "Booking Closed")
                      }
                      className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all hover-lift"
                    >
                      Close Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Tasks */}
          {role === "professional" && (
            <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative border-l-4 border-l-[#EA580C]">
              <h3 className="text-sm font-bold text-[#EA580C] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#EA580C]" />
                Professional Tasks
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />
                  <span className="font-medium">Applied:</span> {actionDone}
                </div>
              )}

              <div className="space-y-4">
                {(() => {
                  const myAssignment = assignments.find(a =>
                    a.professionalId === String(currentUser?.id) ||
                    a.professionalId === `USR-${String(currentUser?.id).padStart(3, '0')}` ||
                    a.professionalId === currentUser?.email
                  );

                  if (!myAssignment) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        <p className="font-bold mb-1">Observation Only</p>
                        You are viewing this booking but are not currently assigned to any specific task.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Assignment Scope */}
                      <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Your Assigned Scope:</p>
                        <p className="text-sm text-foreground leading-relaxed italic">"{myAssignment.instructions}"</p>
                      </div>

                      {/* Task Management Buttons */}
                      {["ACTIVE", "NEEDS_CLARIFICATION", "IN_PROGRESS"].includes(myAssignment.status) ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-bold text-[#0E2271] px-1">Task Management</p>
                          {myAssignment.status === "ACTIVE" ? (
                            <button
                              onClick={async () => {
                                try {
                                  await startBookingAssignment(myAssignment.id);
                                  toast.success("Task started successfully!");
                                  await loadMyAssignments();
                                } catch {
                                  toast.error("Failed to start assignment");
                                }
                              }}
                              className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                              <Clock size={16} /> Announce I Started
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await completeBookingAssignment(myAssignment.id);
                                  toast.success("Assignment marked as completed!");
                                  await loadMyAssignments();
                                } catch {
                                  toast.error("Failed to update assignment status");
                                }
                              }}
                              className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-premium hover-lift transition-all flex items-center justify-center gap-2"
                              style={{ background: "#0D9488" }}
                            >
                              <CheckCircle size={16} /> Mark My Assignment as Finished
                            </button>
                          )}
                          <p className="text-[10px] text-muted-foreground text-center italic">
                            {myAssignment.status === "ACTIVE" ? "Click this to let the admin know you have started working on this task." : "Click this only when you have finished all your assigned tasks."}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700">
                          <CheckCircle size={20} className="flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold">Assignment Finished</p>
                            <p className="text-xs opacity-80">You have successfully completed your tasks for this booking.</p>
                          </div>
                        </div>
                      )}

                      {/* Submit Daily Report Button */}
                      <div className="border-t border-border pt-4">
                        {viewingReportForAssignmentId === myAssignment.id ? null : (
                          <button
                            onClick={() => setViewingReportForAssignmentId(myAssignment.id)}
                            className="w-full py-2.5 rounded-xl text-[#1A3580] text-sm font-bold border-2 border-[#1A3580]/30 hover:border-[#1A3580] hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={16} /> Submit Daily Report
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Report Submission Component - INSIDE Professional Tasks */}
              {["Assigned to Professionals", "In Progress"].includes(booking.status ?? "") && (
                <div className="border-t border-border pt-6">
                  {viewingReportForAssignmentId !== null && assignments.length > 0 ? (
                    <ProfessionalBookingReportSubmission
                      assignment={assignments.find(a => a.id === viewingReportForAssignmentId) || assignments[0]}
                      systemUsers={systemUsers}
                      onBack={() => {
                        setViewingReportForAssignmentId(null);
                        loadMyAssignments();
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Quick Summary Card */}
          <div className="glass-card rounded-2xl p-5 shadow-modern space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Quick Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold text-[#0E2271]">
                  {booking.type}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={booking.status} size="sm" />
              </div>
              {booking.attendees > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Headcount</span>
                  <span className="font-semibold text-[#0E2271]">
                    {booking.attendees}
                  </span>
                </div>
              )}
              {assignee && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-semibold text-[#0E2271] text-right">
                    {assignee.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Professional Assignment Section */}
      {role === "admin" && !["Closed", "Rejected"].includes(booking.status) && (
        <div className="glass-card rounded-2xl p-6 shadow-modern border-2 border-[#0E2271]/10">
          <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
            <Users size={16} className="text-[#1A3580]" />
            Professional Assignments
          </h3>

          <AdminAssignProfessionalFormBooking
            bookingId={booking.dbId}
            bookingTitle={booking.title}
            professionals={bookingProfessionals}
            onAssignmentSuccess={async () => {
              await loadAssignmentsAndReports();
              toast.success("Professional assigned successfully!");
            }}
          />

          {/* Assigned professionals list */}
          {!loadingAssignments && assignments.length > 0 && (
            <div className="mt-6 border-t border-border pt-5">
              <AdminBookingAssignmentsList
                assignments={assignments}
                systemUsers={systemUsers}
                allReports={reports}
                onDeactivate={async (assignmentId) => {
                  try {
                    await deactivateBookingAssignment(assignmentId);
                    toast.success("Professional removed from booking");
                    await loadAssignmentsAndReports();
                  } catch {
                    toast.error("Failed to remove professional");
                  }
                }}
                onViewReports={async () => {
                  await loadAssignmentsAndReports();
                }}
                onApprove={async (assignmentId) => {
                  try {
                    await approveBookingAssignment(assignmentId);
                    toast.success("Assignment approved");
                    await loadAssignmentsAndReports();
                  } catch {
                    toast.error("Failed to approve assignment");
                  }
                }}
                onReject={async (assignmentId) => {
                  try {
                    await rejectBookingAssignment(assignmentId);
                    toast.success("Assignment rejected");
                    await loadAssignmentsAndReports();
                  } catch {
                    toast.error("Failed to reject assignment");
                  }
                }}
                onClarify={async (assignmentId) => {
                  try {
                    await requestBookingClarification(assignmentId);
                    toast.success("Clarification requested from professional");
                    await loadAssignmentsAndReports();
                  } catch {
                    toast.error("Failed to request clarification");
                  }
                }}
              />
            </div>
          )}


        </div>
      )}

      {/* Professional View: My Assignments for this booking */}
      {role === "professional" && booking.status === "Assigned to Professionals" && (
        <div className="space-y-6">
          {!selectedAssignment ? (
            <div className="glass-card rounded-2xl p-6 shadow-modern">
              {loadingAssignments ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]"></div>
                </div>
              ) : (
                <ProfessionalMyBookingAssignments
                  assignments={assignments}
                  bookings={[
                    {
                      id: String(booking.dbId),
                      title: booking.title,
                      bookingId: booking.id,
                    },
                  ]}
                  onSelectAssignment={(assignment) => {
                    setSelectedAssignment(assignment);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 shadow-modern">
              <ProfessionalBookingReportSubmission
                assignment={selectedAssignment}
                systemUsers={systemUsers}
                onBack={() => {
                  setSelectedAssignment(null);
                  loadMyAssignments();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline (Moved here) */}
      <div className="glass-card rounded-2xl p-6 shadow-modern border-2 border-[#0E2271]/10">
        <Timeline
          events={booking.timeline}
          title={t("bookings.activityTimeline") || "Activity Timeline"}
          emptyMessage={
            t("bookings.noActivityYet") || "No activity recorded yet"
          }
          userRole={role as WorkflowRole}
        />
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#0E2271] mb-4">
              {t("bookings.rejectBooking")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("requests.rejectionReasonPrompt")}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("requests.rejectionReasonPlaceholder")}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:border-[#1A3580] text-sm"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={rejectingBooking}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectingBooking || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingBooking
                  ? t("action.rejecting")
                  : t("bookings.rejectBooking")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | number;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#16a34a] mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#1A3580] border border-blue-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
