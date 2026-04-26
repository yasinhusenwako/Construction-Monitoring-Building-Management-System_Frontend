"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { DatePicker } from "@/components/common/DatePicker";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveProjects, updateProject } from "@/lib/live-api";
import { formatClassificationForStorage, getClassificationCode } from "@/lib/classification-utils";
import type { Project } from "@/types/models";

interface DynamicScope {
  buildingType: string;
  otherBuildingType: string;
  floorArea: string;
  disciplines: string[];
  otherDiscipline: string;
  interventionType: string[];
  otherInterventionType: string;
  a2DesignScope: string[];
  otherA2DesignScope: string;
  a2Deliverables: string[];
  otherA2Deliverable: string;
  spaceType: string;
  otherSpaceType: string;
  userCapacity: string;
  a3Deliverables: string[];
  otherA3Deliverable: string;
  projectContext: string;
  otherProjectContext: string;
  siteArea: string;
  a4Deliverables: string[];
  otherA4Deliverable: string;
  boqPurpose: string;
  otherBoqPurpose: string;
  linkedProjectId: string;
  supervisionTypes: string[];
  otherSupervisionType: string;
}

const defaultScope: DynamicScope = {
  buildingType: "",
  otherBuildingType: "",
  floorArea: "",
  disciplines: [],
  otherDiscipline: "",
  interventionType: [],
  otherInterventionType: "",
  a2DesignScope: [],
  otherA2DesignScope: "",
  a2Deliverables: [],
  otherA2Deliverable: "",
  spaceType: "",
  otherSpaceType: "",
  userCapacity: "",
  a3Deliverables: [],
  otherA3Deliverable: "",
  projectContext: "",
  otherProjectContext: "",
  siteArea: "",
  a4Deliverables: [],
  otherA4Deliverable: "",
  boqPurpose: "",
  otherBoqPurpose: "",
  linkedProjectId: "",
  supervisionTypes: [],
  otherSupervisionType: "",
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
        checked
          ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
          : "border-border text-muted-foreground hover:border-gray-300"
      }`}
    >
      {checked && <CheckCircle size={12} />}
      {label}
    </button>
  );
}

export function EditProjectPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [project, setProject] = useState<Project | null>(null);

  const [form, setForm] = useState({
    classification: "",
    title: "",
    location: "",
    otherLocation: "",
    block: "",
    floor: "",
    department: "",
    contactPerson: "",
    contactPhone: "",
    siteCondition: "",
    otherSiteCondition: "",
    functionalDescription: "",
    budget: "",
    startDate: "",
    endDate: "",
    scope: defaultScope,
  });

  const classifications = [
    { code: "A1", label: t("projects.classification.A1.label"), color: "#0E2271", icon: "🏗️" },
    { code: "A2", label: t("projects.classification.A2.label"), color: "#1A3580", icon: "🔨" },
    { code: "A3", label: t("projects.classification.A3.label"), color: "#7C3AED", icon: "🛋️" },
    { code: "A4", label: t("projects.classification.A4.label"), color: "#16A34A", icon: "🌳" },
    { code: "A5", label: t("projects.classification.A5.label"), color: "#EA580C", icon: "🧮" },
    { code: "A6", label: t("projects.classification.A6.label"), color: "#CC1F1A", icon: "👷" },
  ];

  const buildingTypes = [
    t("projects.buildingType.residential"), t("projects.buildingType.office"),
    t("projects.buildingType.lab"), t("projects.buildingType.dataCenter"),
    t("projects.buildingType.mixed"), t("projects.buildingType.other")
  ];

  const designDisciplines = [
    t("projects.scope.conceptDesign"), "Schematic Design",
    t("projects.scope.detailedDesign"), "MEP (Mechanical, Electrical, Plumbing)",
    "Site Grading & Drainage", t("common.other")
  ];

  const interventionTypes = [
    t("projects.intervention.functional"), t("projects.intervention.structural"),
    t("projects.intervention.modernization"), t("projects.intervention.restoration"),
    t("common.other")
  ];

  const a2DesignScopes = [
    t("projects.discipline.architectural"), t("projects.discipline.structural"),
    t("projects.discipline.hvac"), t("common.other")
  ];

  const a2Deliverables = [
    t("projects.deliverable.3dVisualization"), t("projects.deliverable.costEstimates"),
    t("projects.deliverable.specifications"), t("projects.deliverable.tenderDocs"),
    t("projects.deliverable.permits"), t("common.other")
  ];

  const spaceTypes = [
    t("projects.buildingType.office"), "Showroom", t("projects.buildingType.lab"),
    "Hall", "Hospital", "Recreational", t("common.other")
  ];

  const a3Deliverables = [
    "Furniture Layout", "Lighting & Electrical Layout", "Materials & Finishes",
    "Reflected Ceiling Plan", t("projects.deliverable.3dVisualization"), t("common.other")
  ];

  const projectContexts = [
    "Building Surrounding", "Park / Green Space", "Urban Plaza / Streetscape", t("common.other")
  ];

  const a4Deliverables = [
    "Hardscape Plan", "Planting Plan", "Lighting Layout", "Irrigation & Drainage",
    t("projects.deliverable.3dVisualization"), t("common.other")
  ];

  const boqPurposes = [
    t("projects.boq.newTender"), t("projects.boq.variation"),
    t("projects.boq.asBuiltAudit"), t("projects.boq.checkMaterial"), t("common.other")
  ];

  const supervisionTypes = [
    t("projects.supervision.fullTime"), t("projects.supervision.periodic"),
    t("projects.supervision.qualityAudit"), t("common.other")
  ];

  const locations = useMemo(() => ["Wolo Sefer", "Operation", "Store", "Gofa", "Sululta", t("common.other")], [t]);
  const blocks = useMemo(() => ["A1", "A2", "B", "C", "D", "F", t("common.other")], [t]);
  const floors = useMemo(() => ["B3", "B2", "B1", "G", "Floor 1", "Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6", "Floor 7", "Floor 8", "Floor 9", "Floor 10", "Floor 11", "Floor 12", "Floor 13", "Floor 14", "Floor 15", "Floor 16", t("common.other")], [t]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projects = await fetchLiveProjects(projectId);
        const p = projects.find(item => item.id === projectId);
        if (p) {
          setProject(p);
          
          const locParts = (p.location || "").split(",").map(s => s.trim());
          
          // Extract just the code from classification for form editing
          const classificationCode = getClassificationCode(p.classification) || "A1";
          
          setForm({
            classification: classificationCode,
            title: p.title,
            location: locations.includes(locParts[0]) ? locParts[0] : (locParts[0] ? "Other" : ""),
            otherLocation: !locations.includes(locParts[0]) ? locParts[0] : "",
            block: locParts[1] || "",
            floor: locParts[2] || "",
            department: p.department || "",
            contactPerson: p.contactPerson || "",
            contactPhone: p.contactPhone || "",
            siteCondition: p.siteCondition || "",
            otherSiteCondition: "",
            functionalDescription: p.description || "",
            budget: String(p.budget),
            startDate: p.startDate,
            endDate: p.endDate,
            scope: (p.scope as DynamicScope) || defaultScope,
          });
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const updateScope = (k: string, v: any) => {
    setForm(f => ({ ...f, scope: { ...f.scope, [k]: v } }));
  };

  const toggleArray = (arr: any[], item: any) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const steps = [
    t("projects.step.classification"),
    t("projects.step.generalInfo"),
    t("projects.step.designScope"),
    t("projects.step.review"),
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.classification) errs.classification = t("validation.required");
    }
    if (step === 1) {
      if (!form.title.trim()) errs.title = t("validation.required");
      if (!form.department.trim()) errs.department = t("validation.required");
      if (!form.startDate) errs.startDate = t("validation.required");
      if (!form.endDate) errs.endDate = t("validation.required");
      if (form.budget && Number(form.budget) <= 0) errs.budget = t("validation.positiveNumber");
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
      const actualLocation = form.location === "Other" ? form.otherLocation : form.location;
      const locString = [actualLocation, form.block, form.floor].filter(Boolean).join(", ");
      
      // Format classification for storage
      const formattedClassification = formatClassificationForStorage(form.classification);
      
      const payload = {
        ...form,
        id: projectId,
        classification: formattedClassification,
        location: locString,
        budget: Number(form.budget),
        description: form.functionalDescription,
        phone: form.contactPhone,
        siteCondition:
          form.siteCondition === t("common.other")
            ? form.otherSiteCondition
            : form.siteCondition,
         priority: (project as any)?.priority || "Medium",
        status: project?.status || "Submitted",
        divisionId: project?.divisionId,
        createdBy: project?.requestedBy ? Number(project.requestedBy.split("-")[1]) : undefined,
        requestMode: (form.classification === "A5" || form.classification === "A6") && form.otherLocation.includes("Existing Project") ? "existing" : "new",
        scope: {
          ...form.scope,
          buildingType:
            form.scope.buildingType === t("projects.buildingType.other")
              ? form.scope.otherBuildingType
              : form.scope.buildingType,
          disciplines: form.scope.disciplines.map((d) =>
            d === t("common.other") ? form.scope.otherDiscipline : d,
          ),
          interventionType: form.scope.interventionType.map((t_item) =>
            t_item === t("common.other") ? form.scope.otherInterventionType : t_item,
          ),
          a2DesignScope: form.scope.a2DesignScope.map((s) =>
            s === t("common.other") ? form.scope.otherA2DesignScope : s,
          ),
          a2Deliverables: form.scope.a2Deliverables.map((d) =>
            d === t("common.other") ? form.scope.otherA2Deliverable : d,
          ),
          spaceType:
            form.scope.spaceType === t("common.other")
              ? form.scope.otherSpaceType
              : form.scope.spaceType,
          a3Deliverables: form.scope.a3Deliverables.map((d) =>
            d === t("common.other") ? form.scope.otherA3Deliverable : d,
          ),
          projectContext:
            form.scope.projectContext === t("common.other")
              ? form.scope.otherProjectContext
              : form.scope.projectContext,
          a4Deliverables: form.scope.a4Deliverables.map((d) =>
            d === t("common.other") ? form.scope.otherA4Deliverable : d,
          ),
          boqPurpose:
            form.scope.boqPurpose === t("common.other")
              ? form.scope.otherBoqPurpose
              : form.scope.boqPurpose,
          supervisionTypes: form.scope.supervisionTypes.map((t_item) =>
            t_item === t("common.other") ? form.scope.otherSupervisionType : t_item,
          ),
        },
      };
      
      await updateProject(projectId, payload as any);
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      console.error("Error updating project:", err);
      setErrors({ submit: err.message || "Failed to update project" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classifications.find(c => c.code === form.classification);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#1A3580] mb-4" size={40} />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white/50 backdrop-blur-sm text-sm outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-[#1A3580]/20 ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-[#1A3580]"
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
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A3580]" />
            <span className="text-xs font-semibold text-[#1A3580] uppercase tracking-wider">
              {t("action.edit")} Project
            </span>
          </div>
          <h1 className="text-[#0E2271]">{projectId}</h1>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg">
        {/* Step Indicator */}
        <div className="flex items-center mb-8 pb-6 border-b border-border">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i <= step ? "bg-[#1A3580] border-[#1A3580] text-white" : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${i === step ? "text-[#1A3580] font-bold" : "text-muted-foreground"}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? "bg-[#1A3580]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 0: Classification */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271]">{t("projects.step.classification")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {classifications.map(cls => (
                <button
                  key={cls.code}
                  onClick={() => update("classification", cls.code)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.classification === cls.code ? "border-[#1A3580] bg-[#EEF2FF]" : "border-border hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{cls.icon}</span>
                  <p className="font-bold text-sm text-[#0E2271]">{cls.code}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{cls.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271]">{t("projects.step.generalInfo")}</h2>
            
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">{t("form.title")} *</label>
              <input value={form.title} onChange={e => update("title", e.target.value)} className={inputClass("title")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Location</label>
                <select value={form.location} onChange={e => update("location", e.target.value)} className={inputClass("location")}>
                  <option value="">Select</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Block</label>
                <select value={form.block} onChange={e => update("block", e.target.value)} className={inputClass("block")}>
                  <option value="">Select</option>
                  {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Floor</label>
                <select value={form.floor} onChange={e => update("floor", e.target.value)} className={inputClass("floor")}>
                  <option value="">Select</option>
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {form.location === "Other" && (
              <input value={form.otherLocation} onChange={e => update("otherLocation", e.target.value)} placeholder="Specify other location" className={inputClass("otherLocation")} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Department *</label>
                <input value={form.department} onChange={e => update("department", e.target.value)} className={inputClass("department")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Budget (ETB)</label>
                <input type="number" value={form.budget} onChange={e => update("budget", e.target.value)} className={inputClass("budget")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Contact Person</label>
                <input value={form.contactPerson} onChange={e => update("contactPerson", e.target.value)} className={inputClass("contactPerson")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">Contact Phone</label>
                <input value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} className={inputClass("contactPhone")} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">Functional Description</label>
              <textarea value={form.functionalDescription} onChange={e => update("functionalDescription", e.target.value)} className={`${inputClass("functionalDescription")} min-h-[80px]`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">{t("form.startDate")}</label>
                <DatePicker value={form.startDate} onChange={v => update("startDate", v)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">{t("form.endDate")}</label>
                <DatePicker value={form.endDate} onChange={v => update("endDate", v)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Design Scope */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white" style={{ background: selectedClass?.color }}>{form.classification}</span>
              <h2 className="text-[#0E2271]">{t("projects.step.designScope")}</h2>
            </div>

            {form.classification === "A1" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Building Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {buildingTypes.map(t => (
                      <button key={t} type="button" onClick={() => updateScope("buildingType", t)} className={`py-2 px-3 rounded-lg text-xs border ${form.scope.buildingType === t ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-border"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">Floor Area (sq.m)</label>
                  <input value={form.scope.floorArea} onChange={e => updateScope("floorArea", e.target.value)} className={inputClass("floorArea")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Disciplines</label>
                  <div className="flex flex-wrap gap-2">
                    {designDisciplines.map(d => (
                      <Toggle key={d} label={d} checked={form.scope.disciplines.includes(d)} onChange={() => updateScope("disciplines", toggleArray(form.scope.disciplines, d))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.classification === "A2" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Intervention Type</label>
                  <div className="flex flex-wrap gap-2">
                    {interventionTypes.map(t => (
                      <Toggle key={t} label={t} checked={form.scope.interventionType.includes(t)} onChange={() => updateScope("interventionType", toggleArray(form.scope.interventionType, t))} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Design Scope</label>
                  <div className="flex flex-wrap gap-2">
                    {a2DesignScopes.map(s => (
                      <Toggle key={s} label={s} checked={form.scope.a2DesignScope.includes(s)} onChange={() => updateScope("a2DesignScope", toggleArray(form.scope.a2DesignScope, s))} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Deliverables</label>
                  <div className="flex flex-wrap gap-2">
                    {a2Deliverables.map(d => (
                      <Toggle key={d} label={d} checked={form.scope.a2Deliverables.includes(d)} onChange={() => updateScope("a2Deliverables", toggleArray(form.scope.a2Deliverables, d))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.classification === "A3" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Space Type</label>
                  <select value={form.scope.spaceType} onChange={e => updateScope("spaceType", e.target.value)} className={inputClass("spaceType")}>
                    <option value="">Select</option>
                    {spaceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">User Capacity</label>
                  <input type="number" value={form.scope.userCapacity} onChange={e => updateScope("userCapacity", e.target.value)} className={inputClass("userCapacity")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Deliverables</label>
                  <div className="flex flex-wrap gap-2">
                    {a3Deliverables.map(d => (
                      <Toggle key={d} label={d} checked={form.scope.a3Deliverables.includes(d)} onChange={() => updateScope("a3Deliverables", toggleArray(form.scope.a3Deliverables, d))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.classification === "A4" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Project Context</label>
                  <select value={form.scope.projectContext} onChange={e => updateScope("projectContext", e.target.value)} className={inputClass("projectContext")}>
                    <option value="">Select</option>
                    {projectContexts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">Site Area (sq.m)</label>
                  <input type="number" value={form.scope.siteArea} onChange={e => updateScope("siteArea", e.target.value)} className={inputClass("siteArea")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Deliverables</label>
                  <div className="flex flex-wrap gap-2">
                    {a4Deliverables.map(d => (
                      <Toggle key={d} label={d} checked={form.scope.a4Deliverables.includes(d)} onChange={() => updateScope("a4Deliverables", toggleArray(form.scope.a4Deliverables, d))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.classification === "A5" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">BOQ Purpose</label>
                  <div className="grid grid-cols-2 gap-2">
                    {boqPurposes.map(p => (
                      <button key={p} type="button" onClick={() => updateScope("boqPurpose", p)} className={`py-2 px-3 rounded-lg text-xs border ${form.scope.boqPurpose === p ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-border"}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.classification === "A6" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">Supervision Types</label>
                  <div className="space-y-2">
                    {supervisionTypes.map(t => (
                      <Toggle key={t} label={t} checked={form.scope.supervisionTypes.includes(t)} onChange={() => updateScope("supervisionTypes", toggleArray(form.scope.supervisionTypes, t))} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271]">{t("projects.step.review")}</h2>
            <div className="bg-secondary/30 rounded-xl p-4 space-y-2 text-sm">
              <p><strong>Classification:</strong> {form.classification}</p>
              <p><strong>Title:</strong> {form.title}</p>
              <p><strong>Location:</strong> {[form.location === "Other" ? form.otherLocation : form.location, form.block, form.floor].filter(Boolean).join(", ")}</p>
              <p><strong>Department:</strong> {form.department}</p>
              <p><strong>Budget:</strong> ETB {Number(form.budget).toLocaleString()}</p>
              <p><strong>Timeline:</strong> {form.startDate} to {form.endDate}</p>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
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
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#1A3580] hover:shadow-lg transition-all"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {step === 3 ? t("action.saveChanges") || "Save Changes" : t("common.next")}
                {step < 3 && <ChevronRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
