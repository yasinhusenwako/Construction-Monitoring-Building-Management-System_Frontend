"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { mockBookings, mockUsers } from "../../data/mockData";
import type { Booking } from "../../data/mockData";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  canTransition,
  canViewItem,
  getUserFacingStatus,
  WorkflowRole,
} from "../../lib/workflow";
import { getBookingsWithStored, updateBooking } from "../../lib/storage";
import {
  addNotification,
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from "../../lib/notifications";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  LayoutGrid,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
} from "lucide-react";

export default function BookingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const role = currentUser?.role || "user";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionDone, setActionDone] = useState("");

  // Assignment state
  const [selectedAssignee, setSelectedAssignee] = useState("");

  useEffect(() => {
    const fetchBooking = () => {
      const allBookings = getBookingsWithStored(mockBookings);
      const found = allBookings.find((b) => b.id === id);
      if (found && canViewItem(role as WorkflowRole, found, currentUser?.id)) {
        setBooking(found);
      } else {
        setBooking(null);
      }
      setLoading(false);
    };

    fetchBooking();
    window.addEventListener("storage", fetchBooking);
    window.addEventListener("insa-storage", fetchBooking);
    return () => {
      window.removeEventListener("storage", fetchBooking);
      window.removeEventListener("insa-storage", fetchBooking);
    };
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

  const requester = mockUsers.find((u) => u.id === booking.requestedBy);
  const assignee = mockUsers.find((u) => u.id === booking.assignedTo);
  const supervisorUser = mockUsers.find((u) => u.id === booking.supervisorId);

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

  const handleAction = (
    nextStatus: Booking["status"],
    actorRole: string,
    message: string,
    extraUpdates?: Partial<Booking>,
  ) => {
    if (!canTransition(actorRole as WorkflowRole, booking.status, nextStatus)) {
      setActionDone(t("bookings.notAllowed") || "Transition not allowed.");
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
    updateBooking(updated);

    // Notification Logic exactly like BookingsPage
    if (extraUpdates?.supervisorId) {
      addNotification(
        createNotification({
          title: "Booking Assigned",
          message: `You have been assigned ${updated.id} for supervision.`,
          userId: extraUpdates.supervisorId,
          link: `/dashboard/bookings/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (extraUpdates?.assignedTo) {
      addNotification(
        createNotification({
          title: "Booking Task Assigned",
          message: `You have been assigned ${updated.id} to complete.`,
          userId: extraUpdates.assignedTo,
          link: `/dashboard/bookings/${updated.id}`,
          type: "warning",
        }),
      );
    }
    if (
      nextStatus === "Completed" &&
      actorRole === "professional" &&
      updated.supervisorId
    ) {
      addNotification(
        createNotification({
          title: "Booking Completed",
          message: `${updated.id} has been completed and needs review.`,
          userId: updated.supervisorId,
          link: `/dashboard/bookings/${updated.id}`,
          type: "info",
        }),
      );
    }
    if (nextStatus === "Reviewed" && actorRole === "supervisor") {
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "Booking Ready for Approval",
            message: `${updated.id} has been reviewed and needs approval.`,
            userId: id,
            link: `/dashboard/bookings/${updated.id}`,
            type: "info",
          }),
        ),
      );
    }
    if (
      (nextStatus === "Approved" ||
        nextStatus === "Rejected" ||
        nextStatus === "Closed") &&
      actorRole === "admin"
    ) {
      addNotification(
        createNotification({
          title: `Booking ${nextStatus}`,
          message: `Your booking request ${updated.id} has been ${nextStatus.toLowerCase()}.`,
          userId: updated.requestedBy,
          link: `/dashboard/bookings/${updated.id}`,
          type:
            nextStatus === "Approved"
              ? "success"
              : nextStatus === "Rejected"
                ? "error"
                : "info",
        }),
      );
    }

    setActionDone(t(message) || message);
    setTimeout(() => setActionDone(""), 3000);
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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

            <div className="h-px w-full bg-border" />

            {/* Assignment Contacts */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-[#0E2271] mb-5">
                {t("projects.team") || "Assignment & Contacts"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[#1A3580] font-bold">
                    {supervisorUser ? supervisorUser.name.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      {t("requests.supervisor") || "Supervisor"}
                    </p>
                    <p className="font-bold text-[#0E2271]">
                      {supervisorUser?.name ||
                        t("maintenance.notAssigned") ||
                        "Not Assigned"}
                    </p>
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] font-bold">
                    {assignee ? assignee.name.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      {t("requests.professional") || "Professional"}
                    </p>
                    <p className="font-bold text-[#0E2271]">
                      {assignee?.name ||
                        t("maintenance.notAssigned") ||
                        "Not Assigned"}
                    </p>
                  </div>
                </div>
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
                {booking.status === "Submitted" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Ready for initial review.
                    </p>
                    <button
                      onClick={() =>
                        handleAction("Under Review", "admin", "Started Review")
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#7C3AED" }}
                    >
                      <User size={16} /> Start Review
                    </button>
                  </div>
                )}
                {booking.status === "Under Review" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      Assign Supervisor
                    </label>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                    >
                      <option value="">Select supervisor...</option>
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
                        if (!selectedAssignee) return;
                        handleAction(
                          "Assigned to Supervisor",
                          "admin",
                          "Assigned Supervisor",
                          { supervisorId: selectedAssignee },
                        );
                      }}
                      disabled={!selectedAssignee}
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 hover:shadow-md flex items-center justify-center gap-2"
                      style={{ background: "#1A3580" }}
                    >
                      <User size={16} /> Assign
                    </button>
                  </div>
                )}
                {booking.status === "Reviewed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Supervisor has submitted their review. Final decision
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
                        onClick={() =>
                          handleAction("Rejected", "admin", "Booking Rejected")
                        }
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

          {/* Supervisor Actions */}
          {role === "supervisor" && (
            <div className="bg-gradient-to-br from-[#ffffff] to-[#fff1f1] rounded-xl border border-border p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#CC1F1A]"></div>
              <h3 className="text-sm font-bold text-[#CC1F1A] mb-5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#CC1F1A]" />
                Supervisor Actions
              </h3>

              {actionDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={16} />{" "}
                  <span className="font-medium">Applied:</span> "{actionDone}"
                </div>
              )}

              <div className="space-y-4">
                {booking.status === "Assigned to Supervisor" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Initiate process to prepare space.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "WorkOrder Created",
                          "supervisor",
                          "WorkOrder Created",
                        )
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#1A3580" }}
                    >
                      Create WorkOrder
                    </button>
                  </div>
                )}
                {booking.status === "WorkOrder Created" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#CC1F1A] mb-2 uppercase tracking-wide">
                      Assign Professional
                    </label>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all"
                    >
                      <option value="">Select professional...</option>
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
                        if (!selectedAssignee) return;
                        handleAction(
                          "Assigned to Professional",
                          "supervisor",
                          "Assigned Professional",
                          { assignedTo: selectedAssignee },
                        );
                      }}
                      disabled={!selectedAssignee}
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 hover:shadow-md flex items-center justify-center gap-2"
                      style={{ background: "#CC1F1A" }}
                    >
                      Assign Task
                    </button>
                  </div>
                )}
                {booking.status === "Completed" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3">
                      Professional indicated task is complete. Verify condition.
                    </p>
                    <button
                      onClick={() =>
                        handleAction(
                          "Reviewed",
                          "supervisor",
                          "Submitted Review",
                        )
                      }
                      className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#0891B2" }}
                    >
                      Submit Evaluation
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
                {booking.status === "Assigned to Professional" && (
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
    </div>
  );
}
