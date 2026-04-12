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
import { apiRequest } from "../../lib/api";
import { addMaintenance } from "../../lib/storage";
import type { Maintenance } from "../../data/mockData";
import {
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from "../../lib/notifications";

const steps = [
  "Basic Information",
  "Category & Priority",
  "Location Details",
  "Attachments",
  "Review",
];

const categories = [
  "Electrical Issue",
  "Plumbing Issue",
  "HVAC / Air Conditioning",
  "Elevator / Lift Issue",
  "Generator / UPS Issue",
  "Cleaning Request",
  "Gardening / Landscaping",
  "Furniture / Carpentry",
  "Building Damage / Structural",
  "Water / Sewerage Issue",
  "Other",
];

const priorityOptions = [
  {
    value: "Critical",
    label: "Critical",
    desc: "Risk to life/property",
    border: "border-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  {
    value: "Medium",
    label: "Medium",
    desc: "Affects operations",
    border: "border-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  {
    value: "Routine",
    label: "Routine",
    desc: "Planned / non-urgent",
    border: "border-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
] as const;

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

type FormState = {
  title: string;
  description: string;
  category: string;
  priority: "" | "Critical" | "Medium" | "Routine";
  building: string;
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
        return "Only image files are allowed";
      }
      if (f.size > 10 * 1024 * 1024) {
        return "Each file must be 10MB or smaller";
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
      if (!form.title.trim()) nextErrors.title = "Request title is required";
      if (!form.description.trim()) {
        nextErrors.description = "Problem description is required";
      }
    }

    if (step === 1) {
      if (!form.category) nextErrors.category = "Category is required";
      if (!form.priority) nextErrors.priority = "Priority is required";
    }

    if (step === 2) {
      if (
        !form.building.trim() &&
        !form.floor.trim() &&
        !form.roomArea.trim()
      ) {
        nextErrors.location = "At least one location field is required";
      }
    }

    if (step === 3 && form.files.length === 0) {
      nextErrors.files = "Please attach at least one image";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validate()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const token = sessionStorage.getItem("insa_token");
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
          token: token ?? undefined,
          body: {
            maintenanceId: generatedId,
            title: form.title,
            category: form.category,
            priority: (form.priority === "Routine" || !form.priority ? "Low" : form.priority) as "Low" | "Medium" | "High" | "Critical",
            description: form.description,
            location: [form.building, form.floor, form.roomArea]
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
      const location = [form.building, form.floor, form.roomArea]
        .filter((x) => x && x.trim())
        .join(" / ");

      const maintenanceItem: Maintenance = {
        id: maintenanceId,
        title: form.title,
        description: form.description,
        type: mapMaintenanceType(form.category),
        subType: form.category,
        status: "Submitted",
        priority: (form.priority === "Routine" || !form.priority ? "Low" : form.priority) as Extract<Maintenance["priority"], string>,
        requestedBy,
        location: location || "Not specified",
        floor: form.floor || "N/A",
        createdAt: now,
        updatedAt: now,
        notes: "Submitted by user",
        attachments: form.files.map((f) => f.name),
        timeline: [
          {
            id: `EVT-${Date.now()}`,
            action: "Submitted",
            actor: requestedBy,
            timestamp: now,
            note: "Request submitted",
          },
        ],
      };

      addMaintenance(maintenanceItem);
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "New Maintenance Request",
            message: `New maintenance request ${maintenanceId} requires review.`,
            userId: id,
            link: `/dashboard/maintenance/${maintenanceId}`,
            type: "info",
          }),
        ),
      );
      setSubmittedId(maintenanceId);
      setSubmitted(true);
    } catch (error) {
      setErrors((e) => ({
        ...e,
        submit:
          error instanceof Error
            ? error.message
            : "Failed to submit maintenance request",
      }));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-border bg-input-background focus:border-[#cc1F1A]"
    }`;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0E2271] mb-2">
          Maintenance Request Submitted
        </h2>
        <p className="text-muted-foreground mb-4">
          Your request has been submitted and sent to Admin for review.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Maintenance ID</p>
          <p className="font-mono text-xl font-bold text-[#CC1F1A]">
            {submittedId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Initial Status: Submitted
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard/maintenance")}
            className="px-5 py-2.5 rounded-lg border-2 border-[#CC1F1A] text-[#CC1F1A] text-sm font-semibold"
          >
            View Requests
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold bg-[#CC1F1A]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
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
              Maintenance & Repairs
            </span>
          </div>
          <h1 className="text-[#0E2271]">Submit Maintenance Request</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step
                      ? "bg-[#CC1F1A] border-[#CC1F1A] text-white"
                      : i === step
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900"
                        : "bg-gray-50 border-gray-200 text-gray-400"
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

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        {errors.submit && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {errors.submit}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              Basic Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Request Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Short summary"
                className={inputClass("title")}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Problem Description *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Detailed explanation of the issue"
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
              Category & Priority
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass("category")}
                aria-label="Category"
                title="Category"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                Priority Level *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update("priority", p.value)}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${
                      form.priority === p.value
                        ? `${p.border} ${p.bg}`
                        : "border-border hover:border-gray-300"
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
              Location Details
            </h2>
            <p className="text-xs text-muted-foreground">
              At least one location field is required.
            </p>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Building / Block
              </label>
              <input
                value={form.building}
                onChange={(e) => update("building", e.target.value)}
                placeholder="e.g. Block A"
                className={inputClass("building")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Floor
                </label>
                <input
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  placeholder="e.g. Floor 2"
                  className={inputClass("floor")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Room / Area
                </label>
                <input
                  value={form.roomArea}
                  onChange={(e) => update("roomArea", e.target.value)}
                  placeholder="e.g. Room 204"
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
              Attachments
            </h2>
            <p className="text-muted-foreground text-sm">
              Upload images as supporting evidence.
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
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-[#CC1F1A] bg-red-50"
                  : "border-border hover:border-[#CC1F1A]/50 hover:bg-secondary/50"
              }`}
              onClick={() => document.getElementById("mnt-upload")?.click()}
            >
              <Upload
                size={32}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm font-medium">Drag & drop images here</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG, WEBP · Max 10MB each
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
              Review
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                ["Request Title", form.title],
                ["Category", form.category],
                ["Priority", form.priority],
                [
                  "Location",
                  [form.building, form.floor, form.roomArea]
                    .filter(Boolean)
                    .join(" / ") || "—",
                ],
                ["Attachments", `${form.files.length} image(s)`],
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
                Problem Description
              </p>
              <p className="text-sm bg-secondary/30 rounded-lg p-3">
                {form.description}
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
              After submission this request is sent to Admin for review.
              Internal routing (division/supervisor/professionals) is managed by
              Admin and not visible to user.
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-2.5 rounded-lg border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            ← Back
          </button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all bg-gradient-to-br from-[#7A0E0E] to-[#CC1F1A]"
          >
            Continue <ChevronRight size={14} className="inline-block ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all bg-gradient-to-br from-[#7A0E0E] to-[#CC1F1A]"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        )}
      </div>
    </div>
  );
}
