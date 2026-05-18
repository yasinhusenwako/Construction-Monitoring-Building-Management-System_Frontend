import React, { useState } from 'react';
import { ProjectAssignment, ProfessionalReport, markBookingReportsAsRead, deactivateBookingAssignment } from '@/lib/multi-professional-api';
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
}

export function AdminBookingAssignmentsList({
  assignments,
  systemUsers,
  allReports,
  onDeactivate,
  onViewReports,
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
      await deactivateBookingAssignment(assignmentId);
      toast.success('Professional removed from booking');
      await onDeactivate(assignmentId);
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
            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#0E2271]">
                      {getProfessionalName(assignment.professionalId)}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
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
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remove professional"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-gray-600 mb-1">Scope:</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 line-clamp-2">
                  {assignment.instructions}
                </p>
              </div>

              {/* Reports Toggle */}
              <button
                onClick={() => handleToggleReports(assignment.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Reports ({assignmentReports.length})
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Reports List */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                {assignmentReports.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">No reports submitted yet</p>
                ) : (
                  assignmentReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">Report</p>
                        <p className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                            locale: enUS,
                          })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600">{report.reportText}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
