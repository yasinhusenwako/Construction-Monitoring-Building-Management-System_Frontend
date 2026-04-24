"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import type { Maintenance } from "@/types/models";

// Static constants moved inside component for translation support

const mapMaintenanceType = (category: string): Maintenance["type"] => {
  const lowered = category.toLowerCase();
  if (lowered.includes("hvac") || lowered.includes("air conditioning")) {
    return "HVAC";
  }
  if (lowered.includes("electrical")) return "Electrical";
  if (lowered.includes("plumbing") || lowered.includes("water")) {
    return "Plumbing";
  }
  if (lowered.includes("structural") || lowered.includes("building damage")) {
    return "Structural";
  }
  return "General";
};

const mapDivisionId = (type: Maintenance["type"]): string => {
  switch (type) {
    case "HVAC":
      return "DIV-001"; // Power Supply Division
    case "Electrical":
    case "Plumbing":
    case "Structural":
      return "DIV-003"; // Infrastructure Development & Building Maintenance
    case "General":
    default:
      return "DIV-002"; // Facility Admin
  }
};

type FormState = {
  title: string;
  description: string;
  category: string;
  priority: "" | "Critical" | "High" | "Medium" | "Routine";
  building: string;
  block: string;
  floor: string;
  roomArea: string;
  files: File[];
};

type PreviewImage = {
  file: File;
  url: string;
};

export function NewMaintenancePage() {
  const router = useRouter();
  const { t } = useLanguage();

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

  const steps = [
    t("maintenance.step.basicInfo"),
    t("maintenance.step.categoryPriority"),
    t("maintenance.step.location"),
    t("maintenance.step.attachments"),
    t("maintenance.step.review"),
  ];

  const categories = [
    { value: "Electrical Issue", label: t("maintenance.category.electrical") },
    { value: "Plumbing Issue", label: t("maintenance.category.plumbing") },
    { value: "HVAC / Air Conditioning", label: t("maintenance.category.hvac") },
    {
      value: "Elevator / Lift Issue",
      label: t("maintenance.category.elevator"),
    },
    {
      value: "Generator / UPS Issue",
      label: t("maintenance.category.generator"),
    },
    { value: "Cleaning Request", label: t("maintenance.category.cleaning") },
    {
      value: "Gardening / Landscaping",
      label: t("maintenance.category.gardening"),
    },
    {
      value: "Furniture / Carpentry",
      label: t("maintenance.category.furniture"),
    },
    {
      value: "Building Damage / Structural",
      label: t("maintenance.category.structural"),
    },
    {
      value: "Water / Sewerage Issue",
      label: t("maintenance.category.sewerage"),
    },
    { value: "Other", label: t("maintenance.category.other") },
  ];

  const priorityOptions = [
    {
      value: "Critical",
      label: t("maintenance.priority.critical"),
      desc: t("maintenance.priority.critical.desc"),
      border: "border-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
    },
    {
      value: "High",
      label: t("maintenance.priority.high"),
      desc: t("maintenance.priority.high.desc"),
      border: "border-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      value: "Medium",
      label: t("maintenance.priority.medium"),
      desc: t("maintenance.priority.medium.desc"),
      border: "border-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    },
    {
      value: "Routine",
      label: t("maintenance.priority.routine"),
      desc: t("maintenance.priority.routine.desc"),
      border: "border-gray-400",
      bg: "bg-gray-50",
      text: "text-gray-700",
    },
  ];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<PreviewImage[]>([]);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "",
    priority: "",
    building: "",
    block: "",
    floor: "",
    roomArea: "",
    files: [],
  });

  useEffect(() => {
    const nextPreviews = form.files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [form.files]);

  const update = (k: keyof FormState, v: FormState[keyof FormState]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "", files: "" }));
  };

  const validateFiles = (files: File[]) => {
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        return t("maintenance.imageOnlyExc");
      }
      if (f.size > 10 * 1024 * 1024) {
        return t("maintenance.maxFileSizeExc");
      }
    }
    return "";
  };

  const addFiles = (incoming: File[]) => {
    const fileErr = validateFiles(incoming);
    if (fileErr) {
      setErrors((e) => ({ ...e, files: fileErr }));
      return;
    }
    setForm((f) => ({ ...f, files: [...f.files, ...incoming] }));
    setErrors((e) => ({ ...e, files: "" }));
  };

  const removeFile = (index: number) => {
    setForm((f) => ({
      ...f,
      files: f.files.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.title.trim()) nextErrors.title = t("validation.required");
      if (!form.description.trim()) {
        nextErrors.description = t("validation.required");
      }
    }

    if (step === 1) {
      if (!form.category) nextErrors.category = t("validation.selectOne");
      if (!form.priority) nextErrors.priority = t("validation.selectOne");
    }

    if (step === 2) {
      if (
        !form.building.trim() &&
        !form.block.trim() &&
        !form.floor.trim() &&
        !form.roomArea.trim()
      ) {
        nextErrors.location = t("maintenance.atLeastOneLocation");
      }
    }

    // Attachments are optional — users proceed without images

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validate()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const storedUser = sessionStorage.getItem("insa_user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    const rawUserId = parsed?.id ?? parsed?.userId ?? "";
    const createdBy = rawUserId
      ? Number(String(rawUserId).replace("USR-", ""))
      : null;
    const requestedBy = rawUserId ? String(rawUserId) : "USR-000";

    const generatedId = `MNT-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    try {
      const created = await apiRequest<{ maintenanceId: string }>(
        "/api/maintenance",
        {
          method: "POST",
          body: {
            maintenanceId: generatedId,
            title: form.title,
            category: form.category,
            priority: (form.priority === "Routine" || !form.priority
              ? "Low"
              : form.priority) as "Low" | "Medium" | "High" | "Critical",
            description: form.description,
            location: [form.building, form.block, form.floor, form.roomArea]
              .filter((x) => x && x.trim())
              .join(" / "),
            building: form.building,
            floor: form.floor,
            roomArea: form.roomArea,
            attachments: form.files.map((f) => f.name),
            createdBy,
            status: "Submitted",
          },
        },
      );

      const maintenanceId = created.maintenanceId || generatedId;
      const now = new Date().toISOString();
      const location = [form.building, form.block, form.floor, form.roomArea]
        .filter((x) => x && x.trim())
        .join(" / ");

      const maintenanceType = mapMaintenanceType(form.category);
      const divisionId = mapDivisionId(maintenanceType);

      const maintenanceItem: Maintenance = {
        id: maintenanceId,
        title: form.title,
        description: form.description,
        type: maintenanceType,
        divisionId,
        subType: form.category,
        status: "Submitted",
        priority: (form.priority === "Routine" || !form.priority
          ? "Low"
          : form.priority) as Extract<Maintenance["priority"], string>,
        requestedBy,
        location: location || t("bookings.notSpecified"),
        floor: form.floor || t("bookings.notSpecified"),

        createdAt: now,
        updatedAt: now,
        building: form.building,
        roomArea: form.roomArea,
        notes: t("requests.submitted"),
        attachments: form.files.map((f) => f.name),
        timeline: [
          {
            id: `EVT-${Date.now()}`,
            action: "Submitted",
            actor: requestedBy,
            timestamp: now,
            note: t("requests.submitted"),
          },
        ],
      };

      setSubmittedId(maintenanceId);
      setSubmitted(true);
    } catch (error) {
      setErrors((e) => ({
        ...e,
        submit: error instanceof Error ? error.message : t("message.error"),
      }));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white/50 backdrop-blur-sm text-sm outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-[#CC1F1A]/20 ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-[#CC1F1A]"
    }`;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0E2271] mb-2">
          {t("maintenance.submitSuccess")}
        </h2>
        <p className="text-muted-foreground mb-4">
          {t("maintenance.submitSuccessDesc")}
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            {t("maintenance.idLabel")}
          </p>
          <p className="font-mono text-xl font-bold text-[#CC1F1A]">
            {submittedId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("form.status")}: {t("requests.submitted")}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard/maintenance")}
            className="px-5 py-2.5 rounded-lg border-2 border-[#CC1F1A] text-[#CC1F1A] text-sm font-semibold"
          >
            {t("maintenance.viewRequests")}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold bg-[#CC1F1A]"
          >
            {t("maintenance.goToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 modern-form">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/maintenance")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          aria-label="Back to maintenance list"
          title="Back to maintenance list"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#CC1F1A]" />
            <span className="text-xs font-semibold text-[#CC1F1A] uppercase tracking-wider">
              {t("module.maintenance")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">{t("maintenance.newRequest")}</h1>
        </div>
      </div>

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
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900 step-indicator-dot active"
                        : "bg-gray-50/80 border-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <p
                  className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${
                    i === step
                      ? "text-[#CC1F1A] font-medium"
                      : "text-muted-foreground"
                  }`}
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

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative">
        {errors.submit && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {errors.submit}
          </div>
        )}

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
                placeholder={t("maintenance.placeholder.shortSummary")}
                className={inputClass("title")}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("maintenance.problemDesc")} *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t("maintenance.placeholder.detailedExplanation")}
                className={`${inputClass("description")} resize-none`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.categoryPriority")}
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("form.category")} *
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass("category")}
                aria-label="Category"
                title="Category"
              >
                <option value="">
                  {t("maintenance.placeholder.selectCategory")}
                </option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("form.priority")} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update("priority", p.value)}
                    className={`modern-card border-2 rounded-2xl p-4 text-left transition-all ${
                      form.priority === p.value
                        ? `${p.border} ${p.bg} selected`
                        : "border-border hover:border-gray-300 glass-effect"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${form.priority === p.value ? p.text : "text-foreground"}`}
                    >
                      {p.label}
                    </p>
                    <p
                      className={`text-xs ${form.priority === p.value ? p.text : "text-muted-foreground"}`}
                    >
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>
              {errors.priority && (
                <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.location")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("maintenance.atLeastOneLocation")}
            </p>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("form.location")}
              </label>
              <select
                value={form.building}
                onChange={(e) => update("building", e.target.value)}
                className={inputClass("building")}
                aria-label="Location"
                title="Location"
              >
                <option value="">
                  {t("maintenance.placeholder.building")}
                </option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("users.floor_label") || "Floor"}
                </label>
                <select
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  className={inputClass("floor")}
                  aria-label="Floor"
                  title="Floor"
                >
                  <option value="">{t("maintenance.placeholder.floor")}</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.spaceKey")}
                </label>
                <input
                  value={form.roomArea}
                  onChange={(e) => update("roomArea", e.target.value)}
                  placeholder={t("maintenance.placeholder.room")}
                  className={inputClass("roomArea")}
                />
              </div>
            </div>
            {errors.location && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> {errors.location}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.attachments")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({t("bookings.preferredLocationOpt").split("(")[1]}
              </span>
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("maintenance.imageEvidence")}
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(Array.from(e.dataTransfer.files));
              }}
              className={`file-drop-zone border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                dragOver
                  ? "drag-over"
                  : "border-border hover:border-[#CC1F1A]/50 hover:bg-secondary/50 bg-white/40 backdrop-blur-sm"
              }`}
              onClick={() => document.getElementById("mnt-upload")?.click()}
            >
              <Upload
                size={32}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm font-medium">
                {t("maintenance.dragDropImages")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("maintenance.fileTypes")}
              </p>
              <input
                id="mnt-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
                className="hidden"
                aria-label="Upload attachment images"
                title="Upload attachment images"
              />
            </div>

            {errors.files && (
              <p className="text-red-500 text-xs mt-1">{errors.files}</p>
            )}

            {form.files.length > 0 && (
              <div className="space-y-2">
                {form.files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5"
                  >
                    <FileText size={16} className="text-[#CC1F1A]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-red-500"
                      aria-label={`Remove ${file.name}`}
                      title={`Remove ${file.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previews.map((p, idx) => (
                  <Image
                    key={`${p.file.name}-${idx}`}
                    src={p.url}
                    alt={p.file.name}
                    width={240}
                    height={96}
                    unoptimized
                    className="w-full h-24 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("maintenance.step.review")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                [t("maintenance.requestTitle"), form.title],
                [t("form.category"), form.category],
                [t("form.priority"), form.priority],
                [
                  t("form.location"),
                  [form.building, form.block, form.floor, form.roomArea]
                    .filter(Boolean)
                    .join(" / ") || "—",
                ],
                [
                  t("form.attachments"),
                  `${form.files.length} ${t("maintenance.imagesCount")}`,
                ],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4">
                  <span className="text-muted-foreground flex-shrink-0">
                    {k}
                  </span>
                  <span className="font-medium text-[#0E2271] text-right">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                {t("maintenance.problemDesc")}
              </p>
              <p className="text-sm bg-secondary/30 rounded-lg p-3">
                {form.description}
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
              {t("maintenance.whatHappensNext")}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-3 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary hover-lift"
          >
            ← {t("action.back")}
          </button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-8 py-3 rounded-xl text-white text-sm font-semibold transition-all bg-gradient-to-br from-[#7A0E0E] to-[#CC1F1A] shadow-premium hover-lift"
          >
            {t("action.next")}{" "}
            <ChevronRight size={16} className="inline-block ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:hover:transform-none transition-all bg-gradient-to-br from-[#7A0E0E] to-[#CC1F1A] shadow-premium hover-lift"
          >
            {loading ? t("message.loading") : t("action.submit")}
          </button>
        )}
      </div>
    </div>
  );
}
