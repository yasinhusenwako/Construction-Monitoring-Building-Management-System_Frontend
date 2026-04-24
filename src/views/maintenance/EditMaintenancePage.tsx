"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveMaintenance, updateMaintenance } from "@/lib/live-api";
import type { Maintenance } from "@/types/models";

export function EditMaintenancePage({ maintenanceId }: { maintenanceId: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "" as Maintenance["priority"],
    building: "",
    block: "",
    floor: "",
    roomArea: "",
  });

  const categories = [
    { value: "Electrical Issue", label: t("maintenance.category.electrical") },
    { value: "Plumbing Issue", label: t("maintenance.category.plumbing") },
    { value: "HVAC / Air Conditioning", label: t("maintenance.category.hvac") },
    { value: "Elevator / Lift Issue", label: t("maintenance.category.elevator") },
    { value: "Generator / UPS Issue", label: t("maintenance.category.generator") },
    { value: "Cleaning Request", label: t("maintenance.category.cleaning") },
    { value: "Gardening / Landscaping", label: t("maintenance.category.gardening") },
    { value: "Furniture / Carpentry", label: t("maintenance.category.furniture") },
    { value: "Building Damage / Structural", label: t("maintenance.category.structural") },
    { value: "Water / Sewerage Issue", label: t("maintenance.category.sewerage") },
    { value: "Other", label: t("maintenance.category.other") },
  ];

  const priorityOptions = [
    { value: "Critical", label: t("maintenance.priority.critical") },
    { value: "High", label: t("maintenance.priority.high") },
    { value: "Medium", label: t("maintenance.priority.medium") },
    { value: "Low", label: t("maintenance.priority.routine") || "Low" },
  ];

  const buildings = ["Building A", "Building B", "Building C", "Building D", "Other"];
  const floors = ["Basement", "Ground", "Floor 1", "Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6", "Other"];

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        const items = await fetchLiveMaintenance(maintenanceId);
        const m = items.find(item => item.id === maintenanceId);
        if (m) {
          setMaintenance(m);
          
          // Try to parse location back into fields
          // Logic from NewMaintenancePage: join(" / ")
          const parts = (m.location || "").split(" / ").map(p => p.trim());
          
          setForm({
            title: m.title,
            description: m.description,
            category: m.type,
            priority: m.priority,
            building: parts[0] || "",
            block: parts[1] || "",
            floor: parts[2] || "",
            roomArea: parts[3] || "",
          });
        }
      } catch (err) {
        console.error("Failed to load maintenance:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMaintenance();
  }, [maintenanceId]);

  const update = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.title.trim()) errs.title = t("validation.required");
      if (!form.description.trim()) errs.description = t("validation.required");
      if (!form.category) errs.category = t("validation.selectOne");
      if (!form.priority) errs.priority = t("validation.selectOne");
      if (!form.building) errs.building = t("validation.selectOne");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validate()) setStep(s => s + 1);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const locParts = [];
      if (form.building) locParts.push(form.building);
      if (form.block) locParts.push(form.block);
      if (form.floor) locParts.push(form.floor);
      if (form.roomArea) locParts.push(form.roomArea);
      const fullLocation = locParts.length > 0 ? locParts.join(" / ") : "N/A";

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        location: fullLocation,
      };
      
      await updateMaintenance(maintenanceId, payload as any);
      router.push(`/dashboard/maintenance`);
    } catch (err) {
      setErrors({ submit: "Failed to update maintenance request" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#CC1F1A] mb-4" size={40} />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white/50 backdrop-blur-sm text-sm outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-[#CC1F1A]/20 ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-[#CC1F1A]"
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 modern-form">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#CC1F1A]" />
            <span className="text-xs font-semibold text-[#CC1F1A] uppercase tracking-wider">
              {t("action.edit")} Maintenance
            </span>
          </div>
          <h1 className="text-[#0E2271]">{maintenanceId}</h1>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.basicInfo")}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("maintenance.requestTitle")}
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputClass("title")}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("form.category")}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputClass("category")}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("form.priority")}
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value)}
                  className={inputClass("priority")}
                >
                  <option value="">Select Priority</option>
                  {priorityOptions.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Building</label>
                <select
                  value={form.building}
                  onChange={(e) => update("building", e.target.value)}
                  className={inputClass("building")}
                >
                  <option value="">Select Building</option>
                  {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Block / Wing</label>
                <input
                  value={form.block}
                  onChange={(e) => update("block", e.target.value)}
                  className={inputClass("block")}
                  placeholder="e.g. Block B"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Floor</label>
                <select
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  className={inputClass("floor")}
                >
                  <option value="">Select Floor</option>
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Room / Area</label>
                <input
                  value={form.roomArea}
                  onChange={(e) => update("roomArea", e.target.value)}
                  className={inputClass("roomArea")}
                  placeholder="e.g. Office 101"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("maintenance.problemDesc")}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className={`${inputClass("description")} min-h-[120px] resize-none`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.review")}
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
               <div>
                 <p className="text-muted-foreground mb-1">{t("maintenance.requestTitle")}</p>
                 <p className="font-semibold text-[#0E2271]">{form.title}</p>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">{t("form.category")}</p>
                 <p className="font-semibold text-[#0E2271]">{form.category}</p>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">{t("form.priority")}</p>
                 <p className="font-semibold text-[#0E2271]">{form.priority}</p>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">Location</p>
                 <p className="font-semibold text-[#0E2271]">
                   {[form.building, form.block, form.floor, form.roomArea].filter(Boolean).join(" / ")}
                 </p>
               </div>
               <div className="col-span-2">
                 <p className="text-muted-foreground mb-1">{t("maintenance.problemDesc")}</p>
                 <p className="text-gray-700">{form.description}</p>
               </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border flex justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
            className="px-6 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            {step === 0 ? t("action.cancel") : t("common.back")}
          </button>
          <button
            onClick={() => step === 1 ? handleSave() : nextStep()}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#CC1F1A] hover:bg-[#A31814] hover:shadow-lg transition-all"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {step === 1 ? t("action.saveChanges") || "Save Changes" : t("common.next")}
                {step === 0 && <ChevronRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
