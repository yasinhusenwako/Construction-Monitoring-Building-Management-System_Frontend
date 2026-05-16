import React, { useState, useEffect } from 'react';
import { ProfessionalReport, getAssignmentReports } from '@/lib/multi-professional-api';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface AdminReportsDashboardProps {
  projectId: number;
  assignments: Array<{
    id: number;
    professionalId: string;
    instructions: string;
  }>;
  systemUsers: Array<{ id: string; name: string }>;
  allReports: ProfessionalReport[];
  loading: boolean;
}

export function AdminReportsDashboard({
  projectId,
  assignments,
  systemUsers,
  allReports,
  loading,
}: AdminReportsDashboardProps) {
  const getProfessionalName = (id: string) => {
    return systemUsers.find((u) => u.id === id)?.name || id;
  };

  const getAssignmentForReport = (assignmentId: number) => {
    return assignments.find((a) => a.id === assignmentId);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (allReports.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <MessageSquare size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No reports submitted yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Professionals will submit their daily progress reports here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0E2271]">
          Professional Reports ({allReports.length})
        </h3>
      </div>

      <div className="space-y-4">
        {allReports.map((report) => {
          const assignment = getAssignmentForReport(report.assignmentId);
          const professionalName = assignment
            ? getProfessionalName(assignment.professionalId)
            : 'Unknown Professional';

          return (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A3580]/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-[#1A3580]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0E2271] text-sm">
                      {professionalName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Report #{report.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scope Context */}
              {assignment && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    Assignment Scope:
                  </p>
                  <p className="text-xs text-blue-800">
                    {assignment.instructions}
                  </p>
                </div>
              )}

              {/* Report Content */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                  {report.reportText}
                </p>
              </div>

              {/* Footer: Timestamp */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <Calendar size={12} />
                <span>
                  {new Date(report.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-gray-400 mx-1">•</span>
                <span>
                  {formatDistanceToNow(new Date(report.createdAt), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
