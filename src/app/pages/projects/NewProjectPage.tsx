"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Upload,
  X,
  FileText,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { DatePicker } from "../../components/common/DatePicker";
import { apiRequest } from "../../lib/api";
import { addProject } from "../../lib/storage";
import type { Project } from "../../data/mockData";
import {
  addNotifications,
  createNotification,
  getUserIdsByRole,
} from "../../lib/notifications";

const steps = [
  "Classification",
  "General Info",
  "Design Scope",
  "Documents",
  "Review & Submit",
];

const classifications = [
  {
    code: "A1",
    label: "New Building Construction",
    desc: "Greenfield or new structure from ground up",
    icon: "🏗️",
    color: "#0E2271",
  },
  {
    code: "A2",
    label: "Building Renovation & Expansion",
    desc: "Structural modifications, change of use, facade works",
    icon: "🔨",
    color: "#1A3580",
  },
  {
    code: "A3",
    label: "Interior Architecture & Fit-out",
    desc: "Office, lab, hall, hospital interior design",
    icon: "🛋️",
    color: "#7C3AED",
  },
  {
    code: "A4",
    label: "Landscape Architecture & Exterior Works",
    desc: "Parks, plazas, streetscapes, outdoor areas",
    icon: "🌳",
    color: "#16A34A",
  },
  {
    code: "A5",
    label: "Quantity Surveying & Cost Estimation (BOQ)",
    desc: "BOQ for tender, work valuation, cost estimation",
    icon: "🧮",
    color: "#EA580C",
  },
  {
    code: "A6",
    label: "Consolidated Supervision & Site Monitoring",
    desc: "Civil, architectural, MEP supervision services",
    icon: "👷",
    color: "#CC1F1A",
  },
];

const siteConditions = [
  "Vacant / Greenfield",
  "Existing Structure (Occupied)",
  "Existing Structure (Vacant)",
  "Other",
];

// A1 dynamic fields
const buildingTypes = [
  "Residential",
  "Office / Commercial",
  "Institutional / Educational",
  "Industrial / Warehouse",
  "Other",
];
const designDisciplines = [
  "Conceptual Design",
  "Schematic Design",
  "Detailed Design",
  "MEP (Mechanical, Electrical, Plumbing)",
  "Site Grading & Drainage",
  "Other",
];

// A2 dynamic fields
const interventionTypes = [
  "Change of Use",
  "Structural Modification",
  "Facade Renovation",
  "Floor Area Expansion",
  "Other",
];
const a2DesignScopes = ["Architectural", "Structural", "MEP", "Other"];
const a2Deliverables = [
  "Existing & Proposed Floor Plans",
  "Elevations & Sections",
  "3D Renderings",
  "Construction Details",
  "Demolition Plans",
  "Other",
];

// A3 dynamic fields
const spaceTypes = [
  "Office",
  "Showroom",
  "Laboratory",
  "Hall",
  "Hospital",
  "Recreational",
  "Other",
];
const a3Deliverables = [
  "Furniture Layout",
  "Lighting & Electrical Layout",
  "Materials & Finishes",
  "Reflected Ceiling Plan",
  "3D Renderings",
  "Other",
];

// A4 dynamic fields
const projectContexts = [
  "Building Surrounding",
  "Park / Green Space",
  "Urban Plaza / Streetscape",
  "Other",
];
const a4Deliverables = [
  "Hardscape Plan",
  "Planting Plan",
  "Lighting Layout",
  "Irrigation & Drainage",
  "3D Visualizations",
  "Other",
];

// A5 dynamic fields
const boqPurposes = [
  "Preliminary Estimate",
  "BOQ for Tender",
  "Work Valuation",
  "Final Account",
  "Other",
];

const locations = ["Site 1", "Site 2", "Site 3", "Site 4", "Other"];
const blocks = ["Block A", "Block B", "Block C", "Block D", "Block E"];
const floors = [
  "B2",
  "B1",
  "G",
  "Floor 1",
  "Floor 2",
  "Floor 3",
  "Floor 4",
  "Floor 5",
];

// A6 dynamic fields
const supervisionTypes = [
  "Civil / Structural Supervision",
  "Architectural, Interior / Fit-out & Finishing Supervision",
  "MEP Supervision",
  "Other",
];

interface DynamicScope {
  // A1
  buildingType: string;
  otherBuildingType: string;
  floorArea: string;
  disciplines: string[];
  otherDiscipline: string;
  // A2
  interventionType: string[];
  otherInterventionType: string;
  a2DesignScope: string[];
  otherA2DesignScope: string;
  a2Deliverables: string[];
  otherA2Deliverable: string;
  // A3
  spaceType: string;
  otherSpaceType: string;
  userCapacity: string;
  a3Deliverables: string[];
  otherA3Deliverable: string;
  // A4
  projectContext: string;
  otherProjectContext: string;
  siteArea: string;
  a4Deliverables: string[];
  otherA4Deliverable: string;
  // A5
  boqPurpose: string;
  otherBoqPurpose: string;
  linkedProjectId: string;
  // A6
  supervisionTypes: string[];
  otherSupervisionType: string;
}

interface FormData {
  classification: string;
  requestMode: "new" | "existing";
  existingProjectId: string;
  title: string;
  location: string;
  otherLocation: string;
  block: string;
  floor: string;
  department: string;
  contactPerson: string;
  contactPhone: string;
  siteCondition: string;
  otherSiteCondition: string;
  functionalDescription: string;
  budget: string;
  startDate: string;
  endDate: string;
  priority: string;
  scope: DynamicScope;
  files: File[];
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

export function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    classification: "",
    requestMode: "new",
    existingProjectId: "",
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
    priority: "Medium",
    scope: defaultScope,
    files: [],
  });

  const update = (k: keyof FormData, v: string | number | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const updateScope = (k: keyof DynamicScope, v: string | number | boolean | File | string[]) => {
    setForm((f) => ({ ...f, scope: { ...f.scope, [k]: v } }));
    setErrors((e) => ({
      ...e,
      buildingType: "",
      disciplines: "",
      interventionType: "",
      a2DesignScope: "",
      a2Deliverables: "",
      spaceType: "",
      a3Deliverables: "",
      projectContext: "",
      a4Deliverables: "",
      boqPurpose: "",
      supervisionTypes: "",
    }));
  };

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const isExistingRequestMode =
    (form.classification === "A5" || form.classification === "A6") &&
    form.requestMode === "existing";

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.classification)
        errs.classification = "Please select a project classification";
    }
    if (step === 1) {
      if (isExistingRequestMode) {
        if (!form.existingProjectId.trim())
          errs.existingProjectId = "Project ID is required";
      } else {
        if (!form.title.trim()) errs.title = "Project title is required";
        if (!form.location) errs.location = "Location is required";
        if (form.location === "Other" && !form.otherLocation.trim())
          errs.otherLocation = "Please specify the location";
        if (!form.block) errs.block = "Block is required";
        if (!form.floor) errs.floor = "Floor is required";
        if (!form.department.trim())
          errs.department = "Requesting department is required";
        if (!form.contactPerson.trim())
          errs.contactPerson = "Contact person is required";
        if (!form.contactPhone.trim())
          errs.contactPhone = "Contact phone is required";
        if (!form.siteCondition)
          errs.siteCondition = "Current site condition is required";
        if (form.siteCondition === "Other" && !form.otherSiteCondition.trim())
          errs.otherSiteCondition = "Please specify the site condition";
        if (!form.functionalDescription.trim())
          errs.functionalDescription = "Functional description is required";
        if (!form.budget || Number(form.budget) <= 0)
          errs.budget = "Budget must be greater than 0";
        if (!form.startDate) errs.startDate = "Start date is required";
        if (!form.endDate) errs.endDate = "End date is required";
        if (form.startDate && form.endDate && form.startDate >= form.endDate)
          errs.endDate = "End date must be after start date";
      }
    }
    if (step === 2 && !isExistingRequestMode) {
      const cls = form.classification;
      if (cls === "A1") {
        if (!form.scope.buildingType)
          errs.buildingType = "Building type is required";
        if (
          form.scope.buildingType === "Other" &&
          !form.scope.otherBuildingType.trim()
        )
          errs.buildingType = "Please specify the building type";
        if (
          form.scope.disciplines.includes("Other") &&
          !form.scope.otherDiscipline.trim()
        )
          errs.disciplines = "Please specify the other design discipline";
      }
      if (cls === "A2") {
        if (
          form.scope.interventionType.includes("Other") &&
          !form.scope.otherInterventionType.trim()
        )
          errs.interventionType = "Please specify the other intervention type";
        if (
          form.scope.a2DesignScope.includes("Other") &&
          !form.scope.otherA2DesignScope.trim()
        )
          errs.a2DesignScope = "Please specify the other design scope";
        if (
          form.scope.a2Deliverables.includes("Other") &&
          !form.scope.otherA2Deliverable.trim()
        )
          errs.a2Deliverables = "Please specify the other deliverable";
      }
      if (cls === "A3") {
        if (!form.scope.spaceType) errs.spaceType = "Space type is required";
        if (
          form.scope.spaceType === "Other" &&
          !form.scope.otherSpaceType.trim()
        )
          errs.spaceType = "Please specify the space type";
        if (
          form.scope.a3Deliverables.includes("Other") &&
          !form.scope.otherA3Deliverable.trim()
        )
          errs.a3Deliverables = "Please specify the other deliverable";
      }
      if (cls === "A4") {
        if (!form.scope.projectContext)
          errs.projectContext = "Project context is required";
        if (
          form.scope.projectContext === "Other" &&
          !form.scope.otherProjectContext.trim()
        )
          errs.projectContext = "Please specify the project context";
        if (
          form.scope.a4Deliverables.includes("Other") &&
          !form.scope.otherA4Deliverable.trim()
        )
          errs.a4Deliverables = "Please specify the other deliverable";
      }
      if (cls === "A5" && !form.scope.boqPurpose)
        errs.boqPurpose = "BOQ purpose is required";
      if (
        cls === "A5" &&
        form.scope.boqPurpose === "Other" &&
        !form.scope.otherBoqPurpose.trim()
      )
        errs.boqPurpose = "Please specify the BOQ purpose";
      if (cls === "A6" && form.scope.supervisionTypes.length === 0)
        errs.supervisionTypes = "At least one supervision type required";
      if (
        cls === "A6" &&
        form.scope.supervisionTypes.includes("Other") &&
        !form.scope.otherSupervisionType.trim()
      )
        errs.supervisionTypes = "Please specify the other supervision type";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validate()) return;
    if (step === 1 && isExistingRequestMode) {
      setStep(4);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const newFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.size < 10 * 1024 * 1024,
    );
    setForm((f) => ({
      ...f,
      files: [...f.files, ...newFiles],
    }));
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm((f) => ({
        ...f,
        files: [...f.files, ...Array.from(e.target.files!)],
      }));
    }
  };
  const removeFile = (i: number) =>
    setForm((f) => ({
      ...f,
      files: f.files.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async () => {
    setLoading(true);
    const year = new Date().getFullYear();
    const id = `PRJ-${year}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const token = sessionStorage.getItem("insa_token");
    const budgetValue = Number(form.budget);
    const storedUser = sessionStorage.getItem("insa_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const divisionId = parsedUser?.divisionId
      ? Number(parsedUser.divisionId)
      : 1;
    const rawUserId = parsedUser?.id ?? parsedUser?.userId ?? "";
    const requestedBy = rawUserId ? String(rawUserId) : "USR-000";

    try {
      const locString =
        form.location === "Other"
          ? `${form.otherLocation}, ${form.block}, ${form.floor}`
          : `${form.location}, ${form.block}, ${form.floor}`;

      const isExistingMode =
        (form.classification === "A5" || form.classification === "A6") &&
        form.requestMode === "existing";

      const requestBody = isExistingMode
        ? {
            projectId: id,
            title: `${form.classification} request for ${form.existingProjectId}`,
            location: "Linked Existing Project",
            department: "Linked Existing Project",
            contactPerson: "Linked Existing Project",
            phone: "N/A",
            siteCondition: "Linked Existing Project",
            description: `Request linked to existing project ${form.existingProjectId}`,
            budget: 1,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            classification: form.classification,
            priority: form.priority,
            status: "Submitted",
            divisionId,
            scope: {
              ...form.scope,
              linkedProjectId: form.existingProjectId,
              supervisionTypes: form.scope.supervisionTypes.map((t) =>
                t === "Other" ? form.scope.otherSupervisionType : t,
              ),
            },
            linkedProjectId: form.existingProjectId,
            requestMode: "existing",
          }
        : {
            projectId: id,
            title: form.title,
            location: locString,
            department: form.department,
            contactPerson: form.contactPerson,
            phone: form.contactPhone,
            siteCondition:
              form.siteCondition === "Other"
                ? form.otherSiteCondition
                : form.siteCondition,
            description: form.functionalDescription,
            budget: budgetValue,
            startDate: form.startDate,
            endDate: form.endDate,
            classification: form.classification,
            priority: form.priority,
            status: "Submitted",
            divisionId,
            requestMode: "new",
            // Attach processed scope data
            scope: {
              ...form.scope,
              buildingType:
                form.scope.buildingType === "Other"
                  ? form.scope.otherBuildingType
                  : form.scope.buildingType,
              disciplines: form.scope.disciplines.map((d) =>
                d === "Other" ? form.scope.otherDiscipline : d,
              ),
              interventionType: form.scope.interventionType.map((t) =>
                t === "Other" ? form.scope.otherInterventionType : t,
              ),
              a2DesignScope: form.scope.a2DesignScope.map((s) =>
                s === "Other" ? form.scope.otherA2DesignScope : s,
              ),
              a2Deliverables: form.scope.a2Deliverables.map((d) =>
                d === "Other" ? form.scope.otherA2Deliverable : d,
              ),
              spaceType:
                form.scope.spaceType === "Other"
                  ? form.scope.otherSpaceType
                  : form.scope.spaceType,
              a3Deliverables: form.scope.a3Deliverables.map((d) =>
                d === "Other" ? form.scope.otherA3Deliverable : d,
              ),
              projectContext:
                form.scope.projectContext === "Other"
                  ? form.scope.otherProjectContext
                  : form.scope.projectContext,
              a4Deliverables: form.scope.a4Deliverables.map((d) =>
                d === "Other" ? form.scope.otherA4Deliverable : d,
              ),
              boqPurpose:
                form.scope.boqPurpose === "Other"
                  ? form.scope.otherBoqPurpose
                  : form.scope.boqPurpose,
              supervisionTypes: form.scope.supervisionTypes.map((t) =>
                t === "Other" ? form.scope.otherSupervisionType : t,
              ),
            },
          };

      const created = await apiRequest<{ projectId: string }>("/api/projects", {
        method: "POST",
        token: token ?? undefined,
        body: requestBody,
      });
      const projectId = created.projectId || id;
      const now = new Date().toISOString();
      const title = isExistingMode
        ? `${form.classification} request for ${form.existingProjectId}`
        : form.title;
      const description = isExistingMode
        ? `Request linked to existing project ${form.existingProjectId}`
        : form.functionalDescription;
      const projectItem: Project = {
        id: projectId,
        title,
        description,
        category: form.classification,
        classification: form.classification,
        status: "Submitted",
        priority: form.priority as Project["priority"],
        requestedBy,
        location: isExistingMode ? "Linked Existing Project" : locString,
        budget: Number.isFinite(budgetValue) ? budgetValue : 0,
        startDate: isExistingMode
          ? new Date().toISOString().slice(0, 10)
          : form.startDate,
        endDate: isExistingMode
          ? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
          : form.endDate,
        createdAt: now,
        updatedAt: now,
        documents: form.files.map((f) => f.name),
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

      addProject(projectItem);
      const adminIds = getUserIdsByRole("admin");
      addNotifications(
        adminIds.map((id) =>
          createNotification({
            title: "New Project Request",
            message: `New project request ${projectId} requires review.`,
            userId: id,
            link: `/dashboard/projects/${projectId}`,
            type: "info",
          }),
        ),
      );
      setSubmittedId(projectId);
      setSubmitted(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error
            ? error.message
            : "Failed to submit project request",
      }));
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classifications.find(
    (c) => c.code === form.classification,
  );
  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-border bg-input-background focus:border-[#1A3580]"
    }`;

  // Auto-assignment info
  const getAssignmentInfo = () => {
    const map: Record<string, string> = {
      A1: "Structural Engineer & Lead Architect",
      A2: "Interior / Renovation Specialist",
      A3: "Interior / Renovation Specialist",
      A4: "Landscape Architect",
      A5: "Quantity Surveyor",
      A6: "Site Supervision Team",
    };
    return map[form.classification] || "—";
  };

  if (submitted)
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0E2271] mb-2">
          Project Request Submitted!
        </h2>
        <p className="text-muted-foreground mb-2">
          Your request has been classified and routed to the appropriate team.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-assigned to:{" "}
          <span className="font-semibold text-[#1A3580]">
            {getAssignmentInfo()}
          </span>
        </p>
        <div className="bg-[#EEF2FF] border border-[#1A3580]/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            Generated Project ID
          </p>
          <p className="font-mono text-xl font-bold text-[#1A3580]">
            {submittedId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Save this ID for tracking
          </p>
        </div>
        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 mb-5">
          <span className="font-semibold">Note:</span> If this is a BOQ request
          (A5), ensure your linked project is approved before processing.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="px-5 py-2.5 rounded-lg border-2 border-[#1A3580] text-[#1A3580] text-sm font-semibold hover:bg-secondary"
          >
            View All Projects
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ background: "#1A3580" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/projects")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A3580]" />
            <span className="text-xs font-semibold text-[#1A3580] uppercase tracking-wider">
              Projects & Design
            </span>
          </div>
          <h1 className="text-[#0E2271]">New Project Request</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step
                      ? "bg-[#1A3580] border-[#1A3580] text-white"
                      : i === step
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <p
                  className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${i === step ? "text-[#1A3580] font-medium" : "text-muted-foreground"}`}
                >
                  {s}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-12px] ${i < step ? "bg-[#1A3580]" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Body */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        {errors.submit && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {errors.submit}
          </div>
        )}
        {/* STEP 0: Classification */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#0E2271] border-b border-border pb-3 mb-1">
                Select Project Classification
              </h2>
              <p className="text-muted-foreground text-xs mb-4">
                This determines the dynamic form fields and the team it will be
                routed to.
              </p>
            </div>
            {errors.classification && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                {errors.classification}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classifications.map((cls) => (
                <button
                  key={cls.code}
                  type="button"
                  onClick={() => update("classification", cls.code)}
                  className={`text-left border-2 rounded-xl p-4 transition-all ${
                    form.classification === cls.code
                      ? "border-[#1A3580] bg-[#EEF2FF]"
                      : "border-border hover:border-[#1A3580]/40 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{cls.icon}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white"
                        style={{ background: cls.color }}
                      >
                        {cls.code}
                      </span>
                      {form.classification === cls.code && (
                        <CheckCircle size={14} className="text-[#1A3580]" />
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-[#0E2271]">
                    {cls.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cls.desc}
                  </p>
                </button>
              ))}
            </div>

            {form.classification && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
                <p className="font-medium text-[#1A3580]">
                  🔀 Auto-routing to:{" "}
                  <span className="font-bold">{getAssignmentInfo()}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white"
                style={{
                  background: selectedClass?.color || "#1A3580",
                }}
              >
                {form.classification}
              </span>
              <h2 className="text-[#0E2271] border-b border-border pb-0 flex-1">
                General Project Data
              </h2>
            </div>

            {(form.classification === "A5" || form.classification === "A6") && (
              <div className="space-y-3 border border-border rounded-xl p-4 bg-secondary/20">
                <p className="text-sm font-medium text-[#0E2271]">
                  Request Mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update("requestMode", "new")}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                      form.requestMode === "new"
                        ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
                        : "border-border text-muted-foreground hover:border-gray-300"
                    }`}
                  >
                    New Project Request
                    <p className="text-xs mt-1 font-normal text-inherit/80">
                      Fill General Project Data and Design Scope.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => update("requestMode", "existing")}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                      form.requestMode === "existing"
                        ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
                        : "border-border text-muted-foreground hover:border-gray-300"
                    }`}
                  >
                    Existing Project
                    <p className="text-xs mt-1 font-normal text-inherit/80">
                      Submit request directly using existing Project ID.
                    </p>
                  </button>
                </div>
                {isExistingRequestMode && (
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Existing Project ID *
                    </label>
                    <input
                      value={form.existingProjectId}
                      onChange={(e) =>
                        update("existingProjectId", e.target.value)
                      }
                      placeholder="e.g. PRJ-2024-001"
                      className={inputClass("existingProjectId")}
                    />
                    {errors.existingProjectId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.existingProjectId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      This mode skips full project creation and submits a
                      request linked to the provided Project ID.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isExistingRequestMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Project Title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Headquarters Block B Renovation"
                    className={inputClass("title")}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Location *
                    </label>
                    <select
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className={inputClass("location")}
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.location}
                      </p>
                    )}
                    {form.location === "Other" && (
                      <div className="mt-2">
                        <input
                          value={form.otherLocation}
                          onChange={(e) =>
                            update("otherLocation", e.target.value)
                          }
                          placeholder="Specify location"
                          className={inputClass("otherLocation")}
                        />
                        {errors.otherLocation && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.otherLocation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Block *
                    </label>
                    <select
                      value={form.block}
                      onChange={(e) => update("block", e.target.value)}
                      className={inputClass("block")}
                    >
                      <option value="">Select Block</option>
                      {blocks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {errors.block && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.block}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Floor *
                    </label>
                    <select
                      value={form.floor}
                      onChange={(e) => update("floor", e.target.value)}
                      className={inputClass("floor")}
                    >
                      <option value="">Select Floor</option>
                      {floors.map((fl) => (
                        <option key={fl} value={fl}>
                          {fl}
                        </option>
                      ))}
                    </select>
                    {errors.floor && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.floor}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Requesting Department *
                  </label>
                  <input
                    value={form.department}
                    onChange={(e) => update("department", e.target.value)}
                    placeholder="e.g. Network Operations"
                    className={inputClass("department")}
                  />
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Contact Person *
                    </label>
                    <input
                      value={form.contactPerson}
                      onChange={(e) => update("contactPerson", e.target.value)}
                      placeholder="Full name"
                      className={inputClass("contactPerson")}
                    />
                    {errors.contactPerson && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPerson}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Contact Phone *
                    </label>
                    <input
                      value={form.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      placeholder="+251 911 000 000"
                      className={inputClass("contactPhone")}
                    />
                    {errors.contactPhone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Current Site Condition *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {siteConditions.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => update("siteCondition", cond)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                          form.siteCondition === cond
                            ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {form.siteCondition === cond && "✓ "}
                        {cond}
                      </button>
                    ))}
                  </div>
                  {form.siteCondition === "Other" && (
                    <div className="mt-2">
                      <input
                        value={form.otherSiteCondition}
                        onChange={(e) =>
                          update("otherSiteCondition", e.target.value)
                        }
                        placeholder="Specify current site condition"
                        className={inputClass("otherSiteCondition")}
                      />
                      {errors.otherSiteCondition && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.otherSiteCondition}
                        </p>
                      )}
                    </div>
                  )}
                  {errors.siteCondition && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.siteCondition}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Functional Description *
                  </label>
                  <textarea
                    value={form.functionalDescription}
                    onChange={(e) =>
                      update("functionalDescription", e.target.value)
                    }
                    rows={3}
                    placeholder="Detailed explanation of the intended use, objectives, and expected outcomes of this project..."
                    className={`${inputClass("functionalDescription")} resize-none`}
                  />
                  {errors.functionalDescription && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.functionalDescription}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Total Project Budget (ETB)
                    </label>
                    <input
                      type="number"
                      value={form.budget}
                      onChange={(e) => update("budget", e.target.value)}
                      placeholder="e.g. 5000000"
                      className={inputClass("budget")}
                    />
                    {errors.budget && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.budget}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Desired Start Date *
                    </label>
                    <DatePicker
                      value={form.startDate}
                      onChange={(val) => {
                        update("startDate", val);
                      }}
                      placeholder="Select start date"
                      hasError={!!errors.startDate}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Desired Completion Date *
                    </label>
                    <DatePicker
                      value={form.endDate}
                      onChange={(val) => {
                        update("endDate", val);
                      }}
                      placeholder="Select completion date"
                      hasError={!!errors.endDate}
                      minDate={form.startDate || undefined}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Dynamic Design Scope */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white"
                style={{
                  background: selectedClass?.color || "#1A3580",
                }}
              >
                {form.classification}
              </span>
              <h2 className="text-[#0E2271]">
                Design Scope – {selectedClass?.label}
              </h2>
            </div>

            {/* A1 */}
            {form.classification === "A1" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Building Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {buildingTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateScope("buildingType", t)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                          form.scope.buildingType === t
                            ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.scope.buildingType === "Other" && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherBuildingType}
                        onChange={(e) =>
                          updateScope("otherBuildingType", e.target.value)
                        }
                        placeholder="Specify building type"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                    </div>
                  )}
                  {errors.buildingType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.buildingType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Total Estimated Floor Area (sq.m)
                  </label>
                  <input
                    value={form.scope.floorArea}
                    onChange={(e) => updateScope("floorArea", e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Required Design Disciplines
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {designDisciplines.map((d) => (
                      <Toggle
                        key={d}
                        label={d}
                        checked={form.scope.disciplines.includes(d)}
                        onChange={() =>
                          updateScope(
                            "disciplines",
                            toggleArray(form.scope.disciplines, d),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.disciplines.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherDiscipline}
                        onChange={(e) =>
                          updateScope("otherDiscipline", e.target.value)
                        }
                        placeholder="Specify other design discipline"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.disciplines && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.disciplines}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A2 */}
            {form.classification === "A2" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Type of Intervention
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interventionTypes.map((t) => (
                      <Toggle
                        key={t}
                        label={t}
                        checked={form.scope.interventionType.includes(t)}
                        onChange={() =>
                          updateScope(
                            "interventionType",
                            toggleArray(form.scope.interventionType, t),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.interventionType.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherInterventionType}
                        onChange={(e) =>
                          updateScope("otherInterventionType", e.target.value)
                        }
                        placeholder="Specify other intervention type"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.interventionType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.interventionType}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Design Scope
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {a2DesignScopes.map((s) => (
                      <Toggle
                        key={s}
                        label={s}
                        checked={form.scope.a2DesignScope.includes(s)}
                        onChange={() =>
                          updateScope(
                            "a2DesignScope",
                            toggleArray(form.scope.a2DesignScope, s),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.a2DesignScope.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherA2DesignScope}
                        onChange={(e) =>
                          updateScope("otherA2DesignScope", e.target.value)
                        }
                        placeholder="Specify other design scope"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.a2DesignScope && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.a2DesignScope}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Required Deliverables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {a2Deliverables.map((d) => (
                      <Toggle
                        key={d}
                        label={d}
                        checked={form.scope.a2Deliverables.includes(d)}
                        onChange={() =>
                          updateScope(
                            "a2Deliverables",
                            toggleArray(form.scope.a2Deliverables, d),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.a2Deliverables.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherA2Deliverable}
                        onChange={(e) =>
                          updateScope("otherA2Deliverable", e.target.value)
                        }
                        placeholder="Specify other deliverable"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.a2Deliverables && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.a2Deliverables}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A3 */}
            {form.classification === "A3" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Space Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {spaceTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateScope("spaceType", t)}
                        className={`py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                          form.scope.spaceType === t
                            ? "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.scope.spaceType === "Other" && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherSpaceType}
                        onChange={(e) =>
                          updateScope("otherSpaceType", e.target.value)
                        }
                        placeholder="Specify space type"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                    </div>
                  )}
                  {errors.spaceType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.spaceType}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    User Capacity
                  </label>
                  <input
                    type="number"
                    value={form.scope.userCapacity}
                    onChange={(e) =>
                      updateScope("userCapacity", e.target.value)
                    }
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Required Deliverables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {a3Deliverables.map((d) => (
                      <Toggle
                        key={d}
                        label={d}
                        checked={form.scope.a3Deliverables.includes(d)}
                        onChange={() =>
                          updateScope(
                            "a3Deliverables",
                            toggleArray(form.scope.a3Deliverables, d),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.a3Deliverables.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherA3Deliverable}
                        onChange={(e) =>
                          updateScope("otherA3Deliverable", e.target.value)
                        }
                        placeholder="Specify other deliverable"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.a3Deliverables && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.a3Deliverables}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A4 */}
            {form.classification === "A4" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Project Context *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {projectContexts.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateScope("projectContext", c)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                          form.scope.projectContext === c
                            ? "border-green-600 bg-green-50 text-green-800"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {form.scope.projectContext === "Other" && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherProjectContext}
                        onChange={(e) =>
                          updateScope("otherProjectContext", e.target.value)
                        }
                        placeholder="Specify project context"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                    </div>
                  )}
                  {errors.projectContext && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.projectContext}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-1">
                    Site Area (sq.m)
                  </label>
                  <input
                    type="number"
                    value={form.scope.siteArea}
                    onChange={(e) => updateScope("siteArea", e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Required Deliverables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {a4Deliverables.map((d) => (
                      <Toggle
                        key={d}
                        label={d}
                        checked={form.scope.a4Deliverables.includes(d)}
                        onChange={() =>
                          updateScope(
                            "a4Deliverables",
                            toggleArray(form.scope.a4Deliverables, d),
                          )
                        }
                      />
                    ))}
                  </div>
                  {form.scope.a4Deliverables.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherA4Deliverable}
                        onChange={(e) =>
                          updateScope("otherA4Deliverable", e.target.value)
                        }
                        placeholder="Specify other deliverable"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                      />
                      {errors.a4Deliverables && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.a4Deliverables}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A5 */}
            {form.classification === "A5" && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  ⚠️ BOQ requests must be linked to an approved project. Ensure
                  the project has been approved before submitting.
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Purpose *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {boqPurposes.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateScope("boqPurpose", p)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                          form.scope.boqPurpose === p
                            ? "border-[#EA580C] bg-orange-50 text-[#EA580C]"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {errors.boqPurpose && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.boqPurpose}
                    </p>
                  )}
                </div>
                {form.scope.boqPurpose === "Other" && (
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      Specify Purpose *
                    </label>
                    <input
                      value={form.scope.otherBoqPurpose}
                      onChange={(e) =>
                        updateScope("otherBoqPurpose", e.target.value)
                      }
                      placeholder="Enter BOQ purpose"
                      className={inputClass("boqPurpose")}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload drawings and specifications in the next step
                  (Documents).
                </p>
              </div>
            )}

            {/* A6 */}
            {form.classification === "A6" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0E2271] mb-2">
                    Select Supervision Types (multiple allowed) *
                  </label>
                  <div className="space-y-2">
                    {supervisionTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          updateScope(
                            "supervisionTypes",
                            toggleArray(form.scope.supervisionTypes, t),
                          )
                        }
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all text-left ${
                          form.scope.supervisionTypes.includes(t)
                            ? "border-[#CC1F1A] bg-red-50 text-[#CC1F1A]"
                            : "border-border text-foreground hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            form.scope.supervisionTypes.includes(t)
                              ? "border-[#CC1F1A] bg-[#CC1F1A]"
                              : "border-gray-300"
                          }`}
                        >
                          {form.scope.supervisionTypes.includes(t) && (
                            <CheckCircle size={12} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{t}</span>
                      </button>
                    ))}
                  </div>
                  {form.scope.supervisionTypes.includes("Other") && (
                    <div className="mt-2">
                      <input
                        value={form.scope.otherSupervisionType}
                        onChange={(e) =>
                          updateScope("otherSupervisionType", e.target.value)
                        }
                        placeholder="Specify other supervision type"
                        className={inputClass("supervisionTypes")}
                      />
                    </div>
                  )}
                  {errors.supervisionTypes && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.supervisionTypes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              Supporting Documents
            </h2>
            <p className="text-muted-foreground text-sm">
              Upload relevant documents, plans, or images. Max 10MB per file.
              {form.classification === "A1" &&
                " Suggested: feasibility studies, site surveys, design briefs."}
              {form.classification === "A5" &&
                " Required: drawings and specifications for BOQ preparation."}
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-[#1A3580] bg-blue-50"
                  : "border-border hover:border-[#1A3580]/50 hover:bg-secondary/50"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload
                size={32}
                className="mx-auto text-muted-foreground mb-3"
              />
              <p className="text-sm font-medium text-foreground">
                Drag & drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse · PDF, DOC, XLSX, PNG, JPG · Max 10MB
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {form.files.length > 0 && (
              <div className="space-y-2">
                {form.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3"
                  >
                    <FileText
                      size={16}
                      className="text-[#1A3580] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {form.files.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-2">
                {form.classification === "A5"
                  ? "⚠️ Please upload drawings/specifications"
                  : "No files uploaded (optional)"}
              </p>
            )}
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              Review & Submit
            </h2>

            {/* Classification banner */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: (selectedClass?.color || "#1A3580") + "10",
                border: `1px solid ${selectedClass?.color || "#1A3580"}30`,
              }}
            >
              <span className="text-2xl">{selectedClass?.icon}</span>
              <div>
                <span
                  className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded"
                  style={{ background: selectedClass?.color }}
                >
                  {form.classification}
                </span>
                <p className="text-sm font-semibold text-[#0E2271] mt-0.5">
                  {selectedClass?.label}
                </p>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {(isExistingRequestMode
                ? [
                    ["Request Mode", "Existing Project"],
                    ["Project ID", form.existingProjectId],
                    ["Classification", form.classification],
                    ["Auto-Assign To", getAssignmentInfo()],
                    ["Documents", `${form.files.length} file(s) attached`],
                  ]
                : [
                    ["Request Mode", "New Project"],
                    ["Title", form.title],
                    ["Location", form.location],
                    ["Department", form.department],
                    ["Contact", `${form.contactPerson} · ${form.contactPhone}`],
                    ["Site Condition", form.siteCondition],
                    ["Priority", form.priority],
                    [
                      "Budget",
                      form.budget
                        ? `ETB ${parseInt(form.budget).toLocaleString()}`
                        : "Not specified",
                    ],
                    ["Timeline", `${form.startDate} → ${form.endDate}`],
                    ["Auto-Assign To", getAssignmentInfo()],
                    ["Documents", `${form.files.length} file(s) attached`],
                  ]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground flex-shrink-0">
                    {k}
                  </span>
                  <span className="font-medium text-[#0E2271] text-right">
                    {v || "—"}
                  </span>
                </div>
              ))}
            </div>

            {form.functionalDescription && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Functional Description
                </p>
                <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3">
                  {form.functionalDescription}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-[#1A3580]">
              <p className="font-medium">📋 What happens next?</p>
              <ul className="text-xs space-y-1 mt-1 text-blue-700 list-disc list-inside">
                <li>A unique Project ID will be generated automatically</li>
                <li>
                  Request will be routed to:{" "}
                  <strong>{getAssignmentInfo()}</strong>
                </li>
                <li>Admin will review within 3-5 business days</li>
                <li>You'll receive notifications on every status change</li>
                {form.classification === "A5" && (
                  <li>BOQ linked project will be verified before processing</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#1A3580] text-[#1A3580] text-sm font-semibold hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #0E2271, #1A3580)",
            }}
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #0E2271, #1A3580)",
            }}
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <CheckCircle size={16} />
            )}
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        )}
      </div>
    </div>
  );
}
