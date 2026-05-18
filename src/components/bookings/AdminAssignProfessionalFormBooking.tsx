import React, { useState } from 'react';
import { assignProfessionalToBooking } from '@/lib/multi-professional-api';
import { toast } from 'sonner';
import { Plus, AlertCircle } from 'lucide-react';

interface AdminAssignProfessionalFormBookingProps {
  bookingId: number;
  bookingTitle: string;
  professionals: Array<{ id: string; name: string }>;
  onAssignmentSuccess: () => void;
}

export function AdminAssignProfessionalFormBooking({
  bookingId,
  bookingTitle,
  professionals,
  onAssignmentSuccess,
}: AdminAssignProfessionalFormBookingProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfessional.trim()) {
      toast.error('Please select a professional');
      return;
    }

    if (!instructions.trim()) {
      toast.error('Please enter scope/instructions for the professional');
      return;
    }

    setLoading(true);
    try {
      console.log("=== ASSIGNING PROFESSIONAL TO BOOKING ===");
      console.log("Booking ID:", bookingId);
      console.log("Selected Professional ID:", selectedProfessional);
      console.log("Instructions:", instructions);
      
      await assignProfessionalToBooking(
        bookingId,
        selectedProfessional,
        instructions
      );

      console.log("✅ Assignment successful");
      toast.success('Professional assigned successfully');
      setSelectedProfessional('');
      setInstructions('');
      setShowForm(false);
      onAssignmentSuccess();
    } catch (error) {
      console.error('Failed to assign professional:', error);
      let message = 'Failed to assign professional';
      
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          message = 'Not authorized to assign professionals. Please check your permissions.';
        } else {
          message = error.message;
        }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271] transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Assign Professional
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">Available professionals:</p>
              <ul className="mt-1 text-xs space-y-1">
                {professionals.map((p) => (
                  <li key={p.id}>
                    {p.name} (ID: <code className="bg-white px-1">{p.id}</code>)
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-blue-200 pt-4">
            {/* Professional Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Professional
              </label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] disabled:bg-gray-100"
              >
                <option value="">-- Select a professional --</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope/Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={loading}
                placeholder="Describe the scope of work and specific instructions for this professional..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] disabled:bg-gray-100 text-sm"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {loading ? 'Assigning...' : 'Assign Professional'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
