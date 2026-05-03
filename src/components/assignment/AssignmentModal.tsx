"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, Building2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchAdminProfessionals,
  fetchDivisions,
  fetchDivisionProfessionals,
  adminAssignProfessional,
  adminAssignRequest,
  type Professional,
  type Division,
} from "@/lib/live-api";

type RequestModule = "PROJECT" | "BOOKING" | "MAINTENANCE";
type AssignmentType = "professional" | "division";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  requestTitle: string;
  module: RequestModule;
  assignmentType: AssignmentType;
  currentDivisionId?: string; // For supervisor assigning within their division
}

export function AssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  requestId,
  requestTitle,
  module,
  assignmentType,
  currentDivisionId,
}: AssignmentModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For professional assignment
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [instructions, setInstructions] = useState("");
  
  // For division assignment
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [priority, setPriority] = useState("Medium");

  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (assignmentType === "professional") {
          // Fetch professionals
          let profs: Professional[];
          if (currentDivisionId) {
            // Supervisor assigning within their division
            profs = await fetchDivisionProfessionals(currentDivisionId);
          } else {
            // Admin assigning projects/bookings (divisionId=0)
            profs = await fetchAdminProfessionals();
          }
          setProfessionals(profs);
        } else {
          // Fetch divisions for maintenance assignment
          const allDivisions = await fetchDivisions();
          // Filter out division 0 (Administration) for maintenance
          const maintenanceDivisions = allDivisions.filter(d => d.id !== 0);
          setDivisions(maintenanceDivisions);
        }
      } catch (err) {
        console.error("Failed to fetch assignment data:", err);
        setError("Failed to load assignment options. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, assignmentType, currentDivisionId]);

  const handleAssign = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (assignmentType === "professional") {
        if (!selectedProfessional) {
          setError("Please select a professional");
          setLoading(false);
          return;
        }
        
        await adminAssignProfessional({
          module,
          businessId: requestId,
          professionalId: selectedProfessional,
          instructions,
        });
      } else {
        if (!selectedDivision) {
          setError("Please select a division");
          setLoading(false);
          return;
        }
        
        await adminAssignRequest({
          module,
          businessId: requestId,
          divisionId: selectedDivision,
          priority,
        });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Assignment failed:", err);
      setError(err.message || "Failed to assign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,34,113,0.35)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-br from-[#5B21B6] to-[#7C3AED]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                {assignmentType === "professional" ? (
                  <UserCheck size={16} className="text-white" />
                ) : (
                  <Building2 size={16} className="text-white" />
                )}
              </div>
              <div>
                <h2 className="text-white text-sm font-bold">
                  {assignmentType === "professional"
                    ? "Assign to Professional"
                    : "Assign to Division"}
                </h2>
                <p className="text-white/60 text-xs truncate max-w-64">
                  {requestTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading && !error ? (
            <div className="py-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-3">Loading...</p>
            </div>
          ) : assignmentType === "professional" ? (
            <>
              {/* Professional Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                  Select Professional
                </label>
                {professionals.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-secondary/30 rounded-lg">
                    No professionals available
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {professionals.map((prof) => (
                      <button
                        key={prof.email}
                        type="button"
                        onClick={() => setSelectedProfessional(prof.email)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                          selectedProfessional === prof.email
                            ? "border-[#7C3AED] bg-purple-50"
                            : "border-border hover:border-purple-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E2271] to-[#1A3580] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {prof.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0E2271]">
                            {prof.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {prof.profession || prof.department}
                          </p>
                        </div>
                        {selectedProfessional === prof.email && (
                          <div className="w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
                  Instructions (Optional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Add any special instructions or notes..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#7C3AED] resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Division Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                  Select Division
                </label>
                {divisions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-secondary/30 rounded-lg">
                    No divisions available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {divisions.map((div) => (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setSelectedDivision(String(div.id))}
                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                          selectedDivision === String(div.id)
                            ? "border-[#7C3AED] bg-purple-50"
                            : "border-border hover:border-purple-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0E2271] to-[#1A3580] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {div.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0E2271]">
                            {div.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {div.description}
                          </p>
                        </div>
                        {selectedDivision === String(div.id) && (
                          <div className="w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0 mt-1">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Low", "Medium", "High", "Critical"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                        priority === p
                          ? p === "Critical"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : p === "High"
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : p === "Medium"
                                ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                : "border-gray-400 bg-gray-100 text-gray-700"
                          : "border-border text-muted-foreground hover:border-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/30">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={
              loading ||
              (assignmentType === "professional"
                ? !selectedProfessional
                : !selectedDivision)
            }
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all bg-gradient-to-br from-[#5B21B6] to-[#7C3AED]"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
