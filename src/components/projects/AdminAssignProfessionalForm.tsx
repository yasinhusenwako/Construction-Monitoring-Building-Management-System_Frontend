import React, { useState } from 'react';
import { assignProfessionalToProject } from '@/lib/multi-professional-api';
import { toast } from 'sonner';
import { Plus, AlertCircle } from 'lucide-react';

interface AdminAssignProfessionalFormProps {
  projectId: number;
  projectTitle: string;
  professionals: Array<{ id: string; name: string }>;
  onAssignmentSuccess: () => void;
}

export function AdminAssignProfessionalForm({
  projectId,
  projectTitle,
  professionals,
  onAssignmentSuccess,
}: AdminAssignProfessionalFormProps) {
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
      console.log("=== ASSIGNING PROFESSIONAL ===");
      console.log("Project ID:", projectId);
      console.log("Selected Professional ID:", selectedProfessional);
      console.log("Instructions:", instructions);
      
      await assignProfessionalToProject(
        projectId,
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
          Assign Another Professional
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
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Assign Professional to {projectTitle}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Multiple professionals can work on the same project with different scopes
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Professional Selection */}
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                Select Professional *
              </label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] text-sm"
              >
                <option value="">Choose a professional...</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructions/Scope */}
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                Scope / Instructions *
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={loading}
                placeholder="What specific work should this professional do? (e.g., 'Complete electrical wiring on floors 1-3, ensure safety compliance')"
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3580] text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {instructions.length} characters
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedProfessional('');
                  setInstructions('');
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {loading ? 'Assigning...' : 'Assign Professional'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
