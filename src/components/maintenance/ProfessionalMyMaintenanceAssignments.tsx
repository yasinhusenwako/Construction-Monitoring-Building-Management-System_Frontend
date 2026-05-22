import React from 'react';
import { MaintenanceAssignment } from '@/lib/multi-professional-api';
import { Wrench, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ProfessionalMyMaintenanceAssignmentsProps {
  assignments: MaintenanceAssignment[];
  maintenanceItems: Array<{ id: string; title: string; maintenanceId?: string }>;
  onSelectAssignment: (assignment: MaintenanceAssignment) => void;
}

export function ProfessionalMyMaintenanceAssignments({
  assignments,
  maintenanceItems,
  onSelectAssignment,
}: ProfessionalMyMaintenanceAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Wrench size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No assignments yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Admin will assign you to maintenance requests here
        </p>
      </div>
    );
  }

  const getMaintenanceTitle = (maintenanceId: number): string => {
    const idStr = String(maintenanceId);
    const item = maintenanceItems.find((m) => m.id === idStr);
    return item?.title || `Maintenance #${maintenanceId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700';
      case 'COMPLETED': return 'bg-teal-100 text-teal-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'NEEDS_CLARIFICATION': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0E2271] mb-4">
        My Maintenance Assignments ({assignments.length})
      </h2>

      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow cursor-pointer hover:border-[#1A3580]"
          onClick={() => onSelectAssignment(assignment)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-semibold text-[#0E2271] text-sm">
                {getMaintenanceTitle(assignment.maintenanceId)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Request ID: {assignment.maintenanceId}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${getStatusColor(
                assignment.status
              )}`}
            >
              {assignment.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Scope/Instructions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Your Scope:</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 border border-gray-200 line-clamp-2">
              {assignment.instructions}
            </p>
          </div>

          {/* Footer & Action Button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Assigned{' '}
              {formatDistanceToNow(new Date(assignment.createdAt), {
                addSuffix: true,
                locale: enUS,
              })}
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200">
              <MessageSquare size={14} className="text-[#1A3580]" />
              <span className="text-xs font-semibold text-[#1A3580]">
                Submit Report
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
