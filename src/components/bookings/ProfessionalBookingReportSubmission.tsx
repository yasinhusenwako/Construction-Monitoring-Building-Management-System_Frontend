import React, { useState, useEffect } from 'react';
import {
  submitBookingReport,
  getMyBookingAssignmentReports,
  BookingAssignment,
  ProfessionalReport,
} from '@/lib/multi-professional-api';
import { toast } from 'sonner';
import { Send, MessageSquare, Calendar, User, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ProfessionalBookingReportSubmissionProps {
  assignment: BookingAssignment;
  systemUsers: Array<{ id: string; name: string }>;
  onBack: () => void;
}

export function ProfessionalBookingReportSubmission({
  assignment,
  systemUsers,
  onBack,
}: ProfessionalBookingReportSubmissionProps) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    loadReports();
  }, [assignment.id]);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getMyBookingAssignmentReports(assignment.id);
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
      await submitBookingReport(assignment.id, reportText);
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

  const getProfessionalName = (id: string) => {
    return systemUsers.find((u) => u.id === id)?.name || id;
  };

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
            Booking Assignment - Report
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Submit progress updates for your assigned scope
          </p>
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
            placeholder="Describe your progress, completed tasks, or any updates related to your assigned scope..."
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
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </p>
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
