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

interface BookingReportSubmissionProps {
  assignment: BookingAssignment;
  systemUsers: Array<{ id: string; name: string }>;
  onBack: () => void;
}

export function BookingReportSubmission({
  assignment,
  systemUsers,
  onBack,
}: BookingReportSubmissionProps) {
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
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-600">
            Booking Report
          </p>
          <h2 className="text-lg font-bold text-[#0E2271] mt-0.5">
            {getProfessionalName(assignment.professionalId)}
          </h2>
        </div>
      </div>

      {/* Assignment Scope */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">
          Your Scope for This Booking:
        </p>
        <p className="text-sm text-blue-800">{assignment.instructions}</p>
      </div>

      {/* Report Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#0E2271] mb-2">
            Daily Report *
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Write what you accomplished today, any blockers, next steps, etc.
          </p>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            disabled={loading}
            placeholder="e.g., 'Completed plumbing installation in bathrooms 1-3. Fixed 2 leaks. Ready to install fixtures tomorrow.'"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] text-sm resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {reportText.length} characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Send size={14} />
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>

      {/* Reports History */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#0E2271]">
          Your Report History ({reports.length})
        </h3>

        {loadingReports ? (
          <div className="text-center py-4 text-gray-600 text-sm">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
            <MessageSquare size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm">
              No reports submitted yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
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
                  <span className="text-gray-400">•</span>
                  <span>
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </span>
                </div>

                {/* Report Text */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
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
