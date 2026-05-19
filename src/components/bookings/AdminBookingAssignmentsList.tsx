import React, { useState } from 'react';
import { ProjectAssignment, ProfessionalReport, markBookingReportsAsRead } from '@/lib/multi-professional-api';
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Clock, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdminBookingAssignmentsListProps {
  assignments: ProjectAssignment[];
  systemUsers: Array<{ id: string; name: string }>;
  allReports: ProfessionalReport[];
  onDeactivate: (assignmentId: number) => Promise<void>;
  onViewReports: (assignmentId: number) => void;
  onClarify?: (assignmentId: number) => Promise<void>;
  onApprove?: (assignmentId: number) => Promise<void>;
  onReject?: (assignmentId: number) => Promise<void>;
}

export function AdminBookingAssignmentsList({
  assignments,
  systemUsers,
  allReports,
  onDeactivate,
  onViewReports,
  onClarify,
  onApprove,
  onReject,
}: AdminBookingAssignmentsListProps) {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  if (assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <MessageSquare size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No professionals assigned yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Use the form above to assign professionals
        </p>
      </div>
    );
  }

  const getProfessionalName = (id: string) => {
    const normalizedId = /^\d+$/.test(id) ? `USR-${id.padStart(3, '0')}` : id;
    return systemUsers.find((u) => u.id === normalizedId || u.id === id || u.email === id)?.name || id;
  };

  const getUnreadCount = (assignmentId: number) => {
    return allReports.filter((r) => r.assignmentId === assignmentId && !r.viewed).length;
  };

  const handleToggleReports = async (assignmentId: number) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId(null);
    } else {
      setExpandedAssignmentId(assignmentId);
      const unreadCount = getUnreadCount(assignmentId);
      if (unreadCount > 0) {
        try {
          await markBookingReportsAsRead(assignmentId);
          onViewReports(assignmentId);
        } catch (error) {
          console.error("Failed to mark reports as read:", error);
        }
      }
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this professional from the booking?')) {
      return;
    }
    setDeleting(assignmentId);
    try {
      await onDeactivate(assignmentId);
      toast.success('Professional removed from booking');
    } catch (error) {
      console.error('Failed to deactivate assignment:', error);
      toast.error('Failed to remove professional');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold text-[#0E2271] uppercase tracking-wider mb-3 flex items-center gap-2">
        <UserIcon size={12} />
        Assigned Professionals ({assignments.length})
      </h3>

      {assignments.map((assignment) => {
        const unreadCount = getUnreadCount(assignment.id);
        const assignmentReports = allReports.filter(r => r.assignmentId === assignment.id);
        const isExpanded = expandedAssignmentId === assignment.id;

        return (
          <div
            key={assignment.id}
            className="border border-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
          >
            {/* Main Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#0E2271]">
                      {getProfessionalName(assignment.professionalId)}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    Assigned{' '}
                    {formatDistanceToNow(new Date(assignment.createdAt), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(assignment.id)}
                  disabled={deleting === assignment.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove professional from booking"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Status & Quick Actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    assignment.status === 'NEEDS_CLARIFICATION'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : assignment.status === 'COMPLETED'
                      ? 'bg-teal-100 text-teal-700 border border-teal-200'
                      : assignment.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : assignment.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {assignment.status.replace(/_/g, ' ')}
                  </span>

                  {assignment.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1.5 ml-1">
                      {onApprove && (
                        <button
                          onClick={() => onApprove(assignment.id)}
                          className="text-[10px] font-bold text-green-700 hover:bg-green-100 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {onReject && (
                        <button
                          onClick={() => onReject(assignment.id)}
                          className="text-[10px] font-bold text-red-700 hover:bg-red-100 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {onClarify && (
                        <button
                          onClick={() => onClarify(assignment.id)}
                          className="text-[10px] font-bold text-[#1A3580] hover:bg-blue-100 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                        >
                          <MessageSquare size={10} /> Ask Clarification
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground italic">
                  {assignmentReports.length} total reports
                </div>
              </div>

              {/* Scope / Instructions */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Scope / Instructions:
                </p>
                <p className="text-xs text-foreground bg-secondary/30 rounded-lg p-3 border border-border/50">
                  {assignment.instructions}
                </p>
              </div>

              {/* View Reports Toggle */}
              <button
                onClick={() => handleToggleReports(assignment.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isExpanded
                    ? 'bg-[#1A3580] text-white'
                    : 'bg-secondary/50 text-[#1A3580] hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  View Reports
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Expanded Reports */}
            {isExpanded && (
              <div className="bg-secondary/20 border-t border-border animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 space-y-3">
                  {assignmentReports.length === 0 ? (
                    <p className="text-[10px] text-center text-muted-foreground py-2 italic">
                      No reports submitted yet.
                    </p>
                  ) : (
                    assignmentReports.map((report) => (
                      <div key={report.id} className="bg-white rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-dashed border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1A3580]/10 flex items-center justify-center">
                              <UserIcon size={12} className="text-[#1A3580]" />
                            </div>
                            <span className="text-xs font-bold text-[#0E2271]">
                              Report #{report.id}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-1">
                          {report.reportText}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
