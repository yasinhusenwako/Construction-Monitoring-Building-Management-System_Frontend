"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  assignProfessionalToMaintenance,
  MaintenanceAssignment,
} from "@/lib/multi-professional-api";
import { UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AdminAssignProfessionalFormMaintenanceProps {
  maintenanceId: number;
  maintenanceDivisionId?: string;
  professionals: any[];
  onAssignmentCreated: (assignment: MaintenanceAssignment) => void;
  disabled?: boolean;
}

export function AdminAssignProfessionalFormMaintenance({
  maintenanceId,
  maintenanceDivisionId,
  professionals,
  onAssignmentCreated,
  disabled = false,
}: AdminAssignProfessionalFormMaintenanceProps) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  // Normalize division IDs for comparison
  const normalizeDiv = (d?: string) => {
    if (!d) return undefined;
    if (d.startsWith("DIV-")) return d;
    const n = parseInt(d);
    return isNaN(n) ? d : `DIV-${String(n).padStart(3, "0")}`;
  };

  // Filter professionals by division if maintenance has a division
  const availableProfessionals = maintenanceDivisionId
    ? professionals.filter((p) => normalizeDiv(p.divisionId) === normalizeDiv(maintenanceDivisionId))
    : professionals;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfessionalId) {
      toast.error("Please select a professional");
      return;
    }

    if (!instructions.trim()) {
      toast.error("Please provide instructions");
      return;
    }

    setLoading(true);
    try {
      const assignment = await assignProfessionalToMaintenance(
        maintenanceId,
        selectedProfessionalId,
        instructions
      );

      toast.success("Professional assigned successfully");
      onAssignmentCreated(assignment);

      // Reset form
      setSelectedProfessionalId("");
      setInstructions("");
    } catch (error) {
      console.error("Failed to assign professional:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign professional"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          {t("maintenance.selectProfessional") || "Select Professional"}
        </label>
        <select
          value={selectedProfessionalId}
          onChange={(e) => setSelectedProfessionalId(e.target.value)}
          disabled={disabled || loading || availableProfessionals.length === 0}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#1A3580] focus:ring-2 focus:ring-[#1A3580]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {availableProfessionals.length === 0
              ? "No professionals available"
              : "Select a professional..."}
          </option>
          {availableProfessionals.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name}
              {prof.profession ? ` - ${prof.profession}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          {t("maintenance.instructions") || "Instructions"}
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={disabled || loading}
          placeholder="Provide specific instructions for this professional..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#1A3580] focus:ring-2 focus:ring-[#1A3580]/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={
          disabled ||
          loading ||
          !selectedProfessionalId ||
          !instructions.trim()
        }
        className="w-full py-3 rounded-lg text-white text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: loading ? '#7A9CC6' : '#1A3580' }}
      >
        <UserPlus size={16} />
        {loading ? "Assigning..." : "Assign Professional"}
      </button>
    </form>
  );
}
