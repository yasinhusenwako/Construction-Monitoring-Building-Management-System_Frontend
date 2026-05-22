import React, { useState, useEffect } from 'react';
import {
  submitMaintenanceReport,
  getMyMaintenanceAssignmentReports,
  startMaintenanceAssignment,
  completeMaintenanceAssignment,
  MaintenanceAssignment,
  ProfessionalReport,
} from '@/lib/multi-professional-api';
import { toast } from 'sonner';
import {
  Send,
  MessageSquare,
  Calendar,
  User,
  ArrowLeft,
  Clock,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ProfessionalMaintenanceReportSubmissionProps {
  assignment: MaintenanceAssignment;
  systemUsers: Array<{ id: string; name: string }>;
  onBack: () => void;
  onAssignmentUpdated: (assignment: MaintenanceAssignment) => void;
}

export function ProfessionalMaintenanceReportSubmission({
  assignment,
  systemUsers,
  onBack,
  onAssignmentUpdated,
}: ProfessionalMaintenanceReportSubmissionProps) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [currentAssignment, setCurrentAssignment] = useState(assignment);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [assignment.id]);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getMyMaintenanceAssignmentReports(assignment.id);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast.error('Please write a report');
      return;
    }
    setLoading(true);
    try {
      await submitMaintenanceReport(assignment.id, reportText);
      toast.success('Report submitted successfully');
      setReportText('');
      await loadReports();
    } catch (error) {
      console.error('Failed to submit report:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startMaintenanceAssignment(assignment.id);
      const updated = { ...currentAssignment, status: 'IN_PROGRESS' };
      setCurrentAssignment(updated);
      onAssignmentUpdated(updated);
      toast.success('Assignment marked as started');
    } catch (error) {
      toast.error('Failed to start assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeMaintenanceAssignment(assignment.id);
      const updated = { ...currentAssignment, status: 'COMPLETED' };
      setCurrentAssignment(updated);
      onAssignmentUpdated(updated);
      toast.success('Assignment marked as completed');
    } catch (error) {
      toast.error('Failed to complete assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const getProfessionalName = (id: string) => {
    return systemUsers.find((u) => u.id === id)?.name || id;
  };

  const statusLabel = currentAssignment.status.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="Back to assignments"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-[#0E2271]">
            Maintenance Assignment — Report
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Submit progress updates for your assigned scope
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-lg px-4 py-3 flex items-center justify-between ${
          currentAssignment.status === 'NEEDS_CLARIFICATION'
            ? 'bg-amber-50 border border-amber-200'
            : currentAssignment.status === 'COMPLETED'
            ? 'bg-teal-50 border border-teal-200'
            : currentAssignment.status === 'APPROVED'
            ? 'bg-green-50 border border-green-200'
            : currentAssignment.status === 'REJECTED'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        <span className="text-sm font-semibold text-gray-800">
          Status: {statusLabel}
        </span>

        {/* Action Buttons by status */}
        <div className="flex gap-2">
          {currentAssignment.status === 'ACTIVE' && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A3580] text-white text-xs font-bold hover:bg-[#0E2271] disabled:opacity-50 transition-colors"
            >
              <PlayCircle size={14} />
              {actionLoading ? 'Starting...' : 'Announce I Started'}
            </button>
          )}
          {currentAssignment.status === 'IN_PROGRESS' && (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle size={14} />
              {actionLoading ? 'Completing...' : 'Mark as Completed'}
            </button>
          )}
          {currentAssignment.status === 'NEEDS_CLARIFICATION' && (
            <span className="text-xs text-amber-700 font-medium">
              Admin requested clarification — submit a report below
            </span>
          )}
        </div>
      </div>

      {/* Scope Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">Your Scope:</p>
        <p className="text-sm text-blue-800">{assignment.instructions}</p>
      </div>

      {/* Report Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MessageSquare size={16} className="inline mr-2" />
            Progress Report
          </label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            disabled={loading}
            placeholder="Describe your progress, completed tasks, parts used, or any updates related to your assigned scope..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] disabled:bg-gray-100 text-sm"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !reportText.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Send size={16} />
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      {/* Previous Reports */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar size={16} />
          Your Reports ({reports.length})
        </h3>

        {loadingReports ? (
          <div className="text-center py-4 text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
            <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No reports submitted yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Submit your first progress report above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-700">
                      {getProfessionalName(report.createdBy)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {report.reportText}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
