"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Booking } from "../../types/models";
import { StatusBadge } from "../../components/common/StatusBadge";
import { WorkflowVisualizer } from "../../components/common/WorkflowVisualizer";
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
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { fetchLiveBookings, fetchLiveUsers } from "@/lib/live-api";
import { apiRequest } from "@/lib/api";
import { executeWorkflowAction } from "@/lib/workflow-actions";

export default function BookingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
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
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        // Token is automatically sent via httpOnly cookie
        const [liveBookings, liveUsers] = await Promise.all([
          fetchLiveBookings(id),
          fetchLiveUsers(),
        ]);
        setSystemUsers(liveUsers);
        const found = liveBookings.find((b) => b.id === id);

        if (
          found &&
          canViewItem(role as WorkflowRole, found, currentUser?.id)
        ) {
          setBooking(found);
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
  }, [id, role, currentUser]);

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

  const requester = systemUsers.find((u) => u.id === booking.requestedBy);
  const assignee = systemUsers.find((u) => u.id === booking.assignedTo);
  const supervisorUser = systemUsers.find((u) => u.id === booking.supervisorId);
  
  // Bookings use professionals from "OTHER" division (not maintenance divisions)
  const bookingProfessionals = systemUsers.filter(
    (u) => u.role === "professional" && u.divisionId && u.divisionId.toUpperCase() === "OTHER"
  );

  // Debug: Log delete button visibility
  console.log("=== Delete Button Debug (Booking) ===");
  console.log("Role:", role);
  console.log("Current User ID:", currentUser?.id);
  console.log("Booking Requested By:", booking.requestedBy);
  console.log("Booking Status:", booking.status);
  console.log("Is User:", role === "user");
  console.log("Is Creator:", booking.requestedBy === currentUser?.id);
  console.log("Is Submitted:", booking.status === "Submitted");
  console.log("User Can Delete:", role === "user" && booking.requestedBy === currentUser?.id && booking.status === "Submitted");
  console.log("Admin Can Delete:", role === "admin");
  console.log("Show Delete Button:", ((role === "user" && booking.requestedBy === currentUser?.id && booking.status === "Submitted") || role === "admin"));

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

    const updated = {
      ...booking,
      ...extraUpdates,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setBooking(updated);

    // Re-sync after action
    try {
      // Token is automatically sent via httpOnly cookie
      const liveBookings = await fetchLiveBookings(id);
      const found = liveBookings.find((b) => b.id === id);
      if (found) setBooking(found);
    } catch (err) {
      console.error("Failed to re-sync booking after action", err);
    }

    setActionDone(t(message) || message);
    setTimeout(() => setActionDone(""), 3000);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason");
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
      alert("Failed to reject booking: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRejectingBooking(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
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
              <StatusBadge status={booking.status} size="md" />
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {booking.type}
              </span>
            </div>
            <h1 className="text-[#0E2271]">{booking.title}</h1>
          </div>
        </div>
        
        {/* Action Buttons - Edit and Delete */}
        <div className="flex gap-2">
          {/* Edit Button - Only show if user is the creator and status is Submitted */}
          {role === "user" && 
           booking.requestedBy === currentUser?.id && 
           booking.status === "Submitted" && (
            <button
              onClick={() => router.push(`/dashboard/bookings/${booking.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A3580] text-white text-sm font-semibold hover:bg-[#0E2271] transition-all"
            >
              <FileText size={16} />
              {t("action.edit") || "Edit Request"}
            </button>
          )}
          
          {/* Delete Button - Show for creator (Submitted, Approved, Rejected, Closed) or admin (any status) */}
          {((role === "user" && 
             booking.requestedBy === currentUser?.id && 
             ["Submitted", "Approved", "Rejected", "Closed"].includes(booking.status)) ||
            role === "admin") && (
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
                  try {
                    await apiRequest(`/api/bookings/${booking.dbId}`, { method: "DELETE" });
                    alert("Booking deleted successfully");
                    router.push("/dashboard/bookings");
                  } catch (error) {
                    alert("Failed to delete booking: " + (error instanceof Error ? error.message : "Unknown error"));
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all"
            >
              <Trash2 size={16} />
              {t("action.delete") || "Delete"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0E2271] mb-6">
              {t("projects.workflowProgress") || "Workflow Progress"}
            </h3>
            <WorkflowVisualizer currentStatus={booking.status} module="booking" />
          </div>
        </div>

        {/* Rejection Reason Alert - Show if booking is rejected */}
        {booking.status === "Rejected" && booking.rejectionReason && (
          <div className="lg:col-span-3">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ThumbsDown size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-2">
                    Booking Rejected
                  </h3>
                  <p className="text-sm text-red-800 font-medium mb-1">
                    Reason for rejection:
                  </p>
                  <p className="text-sm text-red-700 bg-white/50 rounded-lg p-3 border border-red-200">
                    {booking.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 space-y-5">
          {/* Main Details Mega Card */}
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Description / Purpose */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-[#0E2271] mb-3">
                {t("bookings.purpose") || "Booking Purpose"}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {booking.purpose}
              </p>

              {booking.requirements && (
                <div className="mt-4 pt-4 border-t border-border border-dashed">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t("bookings.requirements") || "Requirements"}
                  </p>
                  <p className="text-sm text-foreground">
                    {booking.requirements}
                  </p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-border" />

            {/* Details */}
            <div className="p-6 bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5">
                {t("bookings.ticketDetails") || "Booking Details"}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                {[
                  {
                    icon: <LayoutGrid size={16} />,
                    label: t("bookings.spaceKey") || "Space",
                    value: booking.space,
                  },
                  {
                    icon: <Calendar size={16} />,
                    label: t("bookings.date") || "Date",
                    value: booking.date,
                  },
                  {
                    icon: <Clock size={16} />,
                    label: t("bookings.startTime") || "Start Time",
                    value: booking.startTime,
                  },
                  {
                    icon: <Clock size={16} />,
                    label: t("bookings.endTime") || "End Time",
                    value: booking.endTime,
                  },
                  {
                    icon: <Users size={16} />,
                    label: t("dashboard.attendees") || "Attendees",
                    value: booking.attendees.toString(),
                  },
                  {
                    icon: <User size={16} />,
                    label: t("maintenance.reportedBy_label") || "Requested By",
                    value: requester?.name || booking.requestedBy,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-700 mt-0.5 flex-shrink-0 bg-green-50 p-1.5 rounded-md border border-green-100">
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

          </div>
        </div>

        {/* Right Panel - Action Panel */}
        <div className="space-y-5">
          {/* Admin Actions */}
          {role === "admin" && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#f4f7fc] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0E2271]"></div>
              <h3 className="text-sm font-bold text-[#0E2271] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                {t("maintenance.adminActions_label") || "Admin Actions"}
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {(booking.status === "Submitted" ||
                  booking.status === "Under Review") && (
                  <div className="space-y-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    {booking.status === "Submitted" && (
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
                              "Started Review",
                            )
                          }
                          className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ background: "#7C3AED" }}
                        >
                          <User size={16} /> Start Review Process
                        </button>
                      </div>
                    )}

                    {booking.status === "Under Review" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {t("requests.selectProfessional") ||
                              "Select Professional"}
                          </label>
                          <select
                            value={selectedAssignee}
                            onChange={(e) =>
                              setSelectedAssignee(e.target.value)
                            }
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-secondary/20 outline-none focus:border-[#1A3580]"
                          >
                            <option value="">
                              {t("common.select") || "Select"}
                            </option>
                            {bookingProfessionals.map((pr) => (
                              <option key={pr.id} value={pr.id}>
                                {pr.name}
                              </option>
                            ))}
                          </select>
                          {bookingProfessionals.length === 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              No Project/Booking professionals found (Division: Other).
                            </p>
                          )}
                        </div>

                        <button
                          disabled={!selectedAssignee || busy}
                          onClick={() => {
                            setBusy(true);
                            handleAction(
                              "Assigned to Professionals",
                              "admin",
                              "Assigned to Professionals",
                              {
                                assignedTo: selectedAssignee,
                              },
                            ).finally(() => setBusy(false));
                          }}
                          className="w-full py-2 rounded-lg text-white text-xs font-semibold bg-[#1A3580] hover:bg-[#0E2271] transition-all disabled:opacity-40"
                        >
                          {t("requests.assignToProfessional") || "Assign to Professional"}
                        </button>
                      </>
                    )}
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
                        className="py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ background: "#16A34A" }}
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
                      className="w-full py-2 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                    >
                      Close Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Actions */}
          {role === "professional" && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#fff7ed] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#EA580C]"></div>
              <h3 className="text-sm font-bold text-[#EA580C] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#EA580C]" />
                Professional Tasks
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {booking.status === "Assigned to Professionals" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <button
                      onClick={() =>
                        handleAction(
                          "In Progress",
                          "professional",
                          "Started Work",
                        )
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}
                    >
                      Start Work
                    </button>
                  </div>
                )}
                {booking.status === "In Progress" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <button
                      onClick={() =>
                        handleAction(
                          "Completed",
                          "professional",
                          "Task Completed",
                        )
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#16A34A" }}
                    >
                      Complete Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#0E2271] mb-4">
              Reject Booking
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this booking. This will be sent to the requester.
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
                disabled={rejectingBooking}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectingBooking || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingBooking ? "Rejecting..." : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
