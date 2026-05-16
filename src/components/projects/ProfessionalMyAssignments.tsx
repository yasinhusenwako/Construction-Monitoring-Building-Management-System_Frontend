import React from 'react';
import { ProjectAssignment } from '@/lib/multi-professional-api';
import { Briefcase, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ProfessionalMyAssignmentsProps {
  assignments: ProjectAssignment[];
  projects: Array<{ id: string; title: string; projectId: string }>;
  onSelectAssignment: (assignment: ProjectAssignment) => void;
}

export function ProfessionalMyAssignments({
  assignments,
  projects,
  onSelectAssignment,
}: ProfessionalMyAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Briefcase size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No assignments yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Admin will assign you to projects here
        </p>
      </div>
    );
  }

  const getProjectTitle = (projectId: number): string => {
    // Find the project in the projects list
    const projectIdStr = String(projectId);
    const project = projects.find((p) => p.id === projectIdStr);
    return project?.title || `Project #${projectId}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0E2271] mb-4">
        My Assigned Projects ({assignments.length})
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
                {getProjectTitle(assignment.projectId)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Project ID: {assignment.projectId}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap ml-2">
              Active
            </span>
          </div>

          {/* Scope/Instructions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Your Scope:
            </p>
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A3580] text-white hover:bg-[#0E2271] transition-colors text-xs font-medium">
              <MessageSquare size={12} />
              Submit Report
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
