"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";
import { ProfessionalChips } from "@/components/common/ProfessionalChips";
import { useProfessionalsAsOptions, useProfessionalsById } from "@/hooks/use-professionals";

interface AssignProfessionalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (professionalIds: string[], instructions: string) => Promise<void>;
  currentlyAssigned?: string[];
  divisionId?: string;
  title?: string;
  requireInstructions?: boolean;
}

export function AssignProfessionalsDialog({
  isOpen,
  onClose,
  onAssign,
  currentlyAssigned = [],
  divisionId,
  title = "Assign Professionals",
  requireInstructions = true,
}: AssignProfessionalsDialogProps) {
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(currentlyAssigned);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { options, isLoading } = useProfessionalsAsOptions(divisionId);
  const { professionals: selectedProfessionalsData } = useProfessionalsById(selectedProfessionals);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedProfessionals.length === 0) {
      setError("Please select at least one professional");
      return;
    }

    if (requireInstructions && !instructions.trim()) {
      setError("Please provide instructions");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedProfessionals, instructions);
      onClose();
      // Reset form
      setSelectedProfessionals([]);
      setInstructions("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign professionals");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProfessional = (id: string) => {
    setSelectedProfessionals((prev) => prev.filter((p) => p !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Multi-Select Dropdown */}
          <div>
            <MultiSelectDropdown
              label="Select Professionals"
              options={options}
              selected={selectedProfessionals}
              onChange={setSelectedProfessionals}
              placeholder={isLoading ? "Loading professionals..." : "Select one or more professionals..."}
              disabled={isLoading || isSubmitting}
              searchable
            />
            {divisionId && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing professionals from division: {divisionId}
              </p>
            )}
          </div>

          {/* Selected Professionals Preview */}
          {selectedProfessionalsData.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selected Professionals ({selectedProfessionalsData.length})
              </label>
              <ProfessionalChips
                professionals={selectedProfessionalsData}
                onRemove={handleRemoveProfessional}
                editable={!isSubmitting}
                size="md"
              />
            </div>
          )}

          {/* Instructions */}
          {requireInstructions && (
            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Instructions <span className="text-destructive">*</span>
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Provide detailed instructions for the assigned professionals..."
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={isSubmitting}
                required={requireInstructions}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These instructions will be visible to all assigned professionals
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Multiple Professional Assignment</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All selected professionals will receive notifications</li>
              <li>Any assigned professional can update the task status</li>
              <li>All professionals will have access to task details and costs</li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || selectedProfessionals.length === 0}
          >
            {isSubmitting ? "Assigning..." : `Assign ${selectedProfessionals.length > 0 ? `(${selectedProfessionals.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
