"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
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
    location: "",
    otherLocation: "",
    block: "",
    floor: "",
    roomArea: "",
  });

  const locations = [
    "Wolo Sefer",
    "Operation",
    "Store",
    "Gofa",
    "Sululta",
    t("common.other"),
  ];

  const blocks = ["A1", "A2", "B", "C", "D", "F", t("common.other")];

  const floors = [
    "B1",
    "B2",
    "B3",
    "G",
    "Floor 1",
    "Floor 2",
    "Floor 3",
    "Floor 4",
    "Floor 5",
    "Floor 6",
    "Floor 7",
    "Floor 8",
    "Floor 9",
    "Floor 10",
    "Floor 11",
    "Floor 12",
    "Floor 13",
    "Floor 14",
    "Floor 15",
    "Floor 16",
    t("common.other"),
  ];

  const categories = [
    { value: "Electrical Issue", label: t("maintenance.category.electrical"), icon: "⚡" },
    { value: "Plumbing Issue", label: t("maintenance.category.plumbing"), icon: "🚰" },
    { value: "HVAC / Air Conditioning", label: t("maintenance.category.hvac"), icon: "❄️" },
    { value: "Elevator / Lift Issue", label: t("maintenance.category.elevator"), icon: "🛗" },
    { value: "Generator / UPS Issue", label: t("maintenance.category.generator"), icon: "🔌" },
    { value: "Cleaning Request", label: t("maintenance.category.cleaning"), icon: "🧹" },
    { value: "Gardening / Landscaping", label: t("maintenance.category.gardening"), icon: "🌿" },
    { value: "Furniture / Carpentry", label: t("maintenance.category.furniture"), icon: "🪑" },
    { value: "Building Damage / Structural", label: t("maintenance.category.structural"), icon: "🏗️" },
    { value: "Water / Sewerage Issue", label: t("maintenance.category.sewerage"), icon: "💧" },
    { value: "Other", label: t("maintenance.category.other"), icon: "📋" },
  ];

  const priorityOptions = [
    { 
      value: "Critical", 
      label: t("maintenance.priority.critical"),
      desc: t("maintenance.priority.critical.desc"),
      color: "border-red-500 bg-red-50 text-red-700",
      icon: "🚨"
    },
    { 
      value: "High", 
      label: t("maintenance.priority.high"),
      desc: t("maintenance.priority.high.desc"),
      color: "border-orange-500 bg-orange-50 text-orange-700",
      icon: "⚠️"
    },
    { 
      value: "Medium", 
      label: t("maintenance.priority.medium"),
      desc: t("maintenance.priority.medium.desc"),
      color: "border-yellow-500 bg-yellow-50 text-yellow-700",
      icon: "📌"
    },
    { 
      value: "Low", 
      label: t("maintenance.priority.routine") || "Low",
      desc: t("maintenance.priority.routine.desc"),
      color: "border-green-500 bg-green-50 text-green-700",
      icon: "✅"
    },
  ];

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        const items = await fetchLiveMaintenance(maintenanceId);
        const m = items.find(item => item.id === maintenanceId);
        if (m) {
          setMaintenance(m);
          
          // Parse location: format is "Location / Block / Floor / Room"
          const parts = (m.location || "").split("/").map(p => p.trim());
          const mainLocation = parts[0] || "";
          
          setForm({
            title: m.title,
            description: m.description,
            category: m.type,
            priority: m.priority,
            location: locations.includes(mainLocation) ? mainLocation : (mainLocation ? t("common.other") : ""),
            otherLocation: !locations.includes(mainLocation) ? mainLocation : "",
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
  }, [maintenanceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.title.trim()) errs.title = t("validation.required");
      if (!form.description.trim()) errs.description = t("validation.required");
    }
    if (step === 1) {
      if (!form.category) errs.category = t("validation.selectOne");
      if (!form.priority) errs.priority = t("validation.selectOne");
    }
    if (step === 2) {
      if (!form.location) errs.location = t("validation.selectOne");
      if (form.location === t("common.other") && !form.otherLocation.trim()) {
        errs.otherLocation = t("validation.required");
      }
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
      const actualLocation = form.location === t("common.other") ? form.otherLocation : form.location;
      const locParts = [actualLocation, form.block, form.floor, form.roomArea].filter(Boolean);
      const fullLocation = locParts.length > 0 ? locParts.join(" / ") : "N/A";

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        location: fullLocation,
      };
      
      await updateMaintenance(maintenanceId, payload as any);
      router.push(`/dashboard/maintenance/${maintenanceId}`);
    } catch (err) {
      console.error("Failed to update maintenance:", err);
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

  if (!maintenance) {
    return (
      <div className="text-center py-20">
        <h2 className="text-[#0E2271] text-xl font-bold mb-2">
          {t("maintenance.notFound") || "Maintenance Request Not Found"}
        </h2>
        <button
          onClick={() => router.push("/dashboard/maintenance")}
          className="mt-4 px-6 py-2 bg-[#CC1F1A] text-white rounded-lg hover:bg-[#A31814]"
        >
          {t("maintenance.backToMaintenance") || "Back to Maintenance"}
        </button>
      </div>
    );
  }

  const steps = [
    t("maintenance.step.basicInfo"),
    t("maintenance.step.categoryPriority"),
    t("maintenance.step.location"),
    t("maintenance.step.review"),
  ];

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

      {/* Step Indicator */}
      <div className="glass-card rounded-2xl p-5 shadow-modern">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-sm ${
                    i < step
                      ? "bg-[#CC1F1A] border-[#CC1F1A] text-white"
                      : i === step
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900"
                        : "bg-gray-50/80 border-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <p
                  className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${i === step ? "text-[#CC1F1A] font-medium" : "text-muted-foreground"}`}
                >
                  {s}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-12px] ${i < step ? "bg-[#CC1F1A]" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg">
        {/* STEP 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.basicInfo")}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("maintenance.requestTitle")} *
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={t("maintenance.placeholder.title")}
                className={inputClass("title")}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("maintenance.problemDesc")} *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t("maintenance.placeholder.description")}
                className={`${inputClass("description")} min-h-[120px] resize-none`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>
        )}

        {/* STEP 1: Category & Priority */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.categoryPriority")}
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-3">
                {t("form.category")} *
              </label>
              {errors.category && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">
                  <AlertCircle size={14} /> {errors.category}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => update("category", cat.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all modern-card ${
                      form.category === cat.value
                        ? "border-[#CC1F1A] bg-red-50 selected"
                        : "border-border hover:border-red-300 hover:bg-red-50/50 glass-effect"
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <p className="text-xs font-semibold text-[#0E2271]">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-3">
                {t("form.priority")} *
              </label>
              {errors.priority && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">
                  <AlertCircle size={14} /> {errors.priority}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {priorityOptions.map(pri => (
                  <button
                    key={pri.value}
                    type="button"
                    onClick={() => update("priority", pri.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all modern-card ${
                      form.priority === pri.value
                        ? pri.color + " selected"
                        : "border-border hover:bg-gray-50 glass-effect"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{pri.icon}</span>
                      <p className="font-bold text-sm">{pri.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{pri.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.location")}
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("form.location")} *
              </label>
              <select
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className={inputClass("location")}
              >
                <option value="">Select Location</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {form.location === t("common.other") && (
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Specify Other Location *
                </label>
                <input
                  value={form.otherLocation}
                  onChange={(e) => update("otherLocation", e.target.value)}
                  placeholder="Enter location name"
                  className={inputClass("otherLocation")}
                />
                {errors.otherLocation && <p className="text-red-500 text-xs mt-1">{errors.otherLocation}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Block / Wing
                </label>
                <select
                  value={form.block}
                  onChange={(e) => update("block", e.target.value)}
                  className={inputClass("block")}
                >
                  <option value="">Select Block</option>
                  {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Floor
                </label>
                <select
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  className={inputClass("floor")}
                >
                  <option value="">Select Floor</option>
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Room / Area
              </label>
              <input
                value={form.roomArea}
                onChange={(e) => update("roomArea", e.target.value)}
                placeholder="e.g. Office 101, Lab 3, Conference Room A"
                className={inputClass("roomArea")}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-medium mb-1">📍 Location Preview:</p>
              <p className="text-xs">
                {[
                  form.location === t("common.other") ? form.otherLocation : form.location,
                  form.block,
                  form.floor,
                  form.roomArea
                ].filter(Boolean).join(" / ") || "No location specified"}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.review")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {t("maintenance.requestTitle")}
                  </p>
                  <p className="font-semibold text-[#0E2271]">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {t("form.category")}
                  </p>
                  <p className="font-semibold text-[#0E2271]">
                    {categories.find(c => c.value === form.category)?.icon} {form.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {t("form.priority")}
                  </p>
                  <p className="font-semibold text-[#0E2271]">
                    {priorityOptions.find(p => p.value === form.priority)?.icon} {form.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Location
                  </p>
                  <p className="font-semibold text-[#0E2271]">
                    {[
                      form.location === t("common.other") ? form.otherLocation : form.location,
                      form.block,
                      form.floor,
                      form.roomArea
                    ].filter(Boolean).join(" / ")}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                  {t("maintenance.problemDesc")}
                </p>
                <p className="text-gray-700 leading-relaxed">{form.description}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ {t("maintenance.reviewNote") || "Please Review"}</p>
              <p className="text-xs">
                {t("maintenance.reviewNote.desc") || "Please review all information before saving. You can edit this request again later if needed."}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} /> {errors.submit}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-border flex justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
            className="px-6 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            {step === 0 ? t("action.cancel") : t("common.back")}
          </button>
          <button
            onClick={() => step === 3 ? handleSave() : nextStep()}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#CC1F1A] hover:bg-[#A31814] hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {step === 3 ? (
                  <>
                    <CheckCircle size={16} /> {t("action.saveChanges") || "Save Changes"}
                  </>
                ) : (
                  <>
                    {t("common.next")} <ChevronRight size={18} />
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
