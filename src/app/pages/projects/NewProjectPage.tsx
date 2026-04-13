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
import { useLanguage } from "../../context/LanguageContext";

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
  const { t } = useLanguage();

  const steps = [
    t("projects.step.classification"),
    t("projects.step.generalInfo"),
    t("projects.step.designScope"),
    t("projects.step.documents"),
    t("projects.step.review"),
  ];

  const classifications = [
    {
      code: "A1",
      label: t("projects.classification.A1.label"),
      desc: t("projects.classification.A1.desc"),
      icon: "🏗️",
      color: "#0E2271",
    },
    {
      code: "A2",
      label: t("projects.classification.A2.label"),
      desc: t("projects.classification.A2.desc"),
      icon: "🔨",
      color: "#1A3580",
    },
    {
      code: "A3",
      label: t("projects.classification.A3.label"),
      desc: t("projects.classification.A3.desc"),
      icon: "🛋️",
      color: "#7C3AED",
    },
    {
      code: "A4",
      label: t("projects.classification.A4.label"),
      desc: t("projects.classification.A4.desc"),
      icon: "🌳",
      color: "#16A34A",
    },
    {
      code: "A5",
      label: t("projects.classification.A5.label"),
      desc: t("projects.classification.A5.desc"),
      icon: "🧮",
      color: "#EA580C",
    },
    {
      code: "A6",
      label: t("projects.classification.A6.label"),
      desc: t("projects.classification.A6.desc"),
      icon: "👷",
      color: "#CC1F1A",
    },
  ];

  const siteConditions = [
    t("projects.siteCondition.vacant"),
    t("projects.siteCondition.occupied"),
    t("projects.siteCondition.partiallyDemolished"),
    t("projects.siteCondition.constrained"),
    t("common.other"),
  ];

  const buildingTypes = [
    t("projects.buildingType.residential"),
    t("projects.buildingType.office"),
    t("projects.buildingType.lab"),
    t("projects.buildingType.dataCenter"),
    t("projects.buildingType.mixed"),
    t("projects.buildingType.other"),
  ];

  const designDisciplines = [
    t("projects.scope.conceptDesign"),
    "Schematic Design",
    t("projects.scope.detailedDesign"),
    "MEP (Mechanical, Electrical, Plumbing)",
    "Site Grading & Drainage",
    t("common.other"),
  ];

  const interventionTypes = [
    t("projects.intervention.functional"),
    t("projects.intervention.structural"),
    t("projects.intervention.modernization"),
    t("projects.intervention.restoration"),
    t("common.other"),
  ];

  const a2DesignScopes = [
    t("projects.discipline.architectural"),
    t("projects.discipline.structural"),
    t("projects.discipline.hvac"),
    t("common.other"),
  ];

  const a2Deliverables = [
    t("projects.deliverable.3dVisualization"),
    t("projects.deliverable.costEstimates"),
    t("projects.deliverable.specifications"),
    t("projects.deliverable.tenderDocs"),
    t("projects.deliverable.permits"),
    t("common.other"),
  ];

  const spaceTypes = [
    t("projects.buildingType.office"),
    "Showroom",
    t("projects.buildingType.lab"),
    "Hall",
    "Hospital",
    "Recreational",
    t("common.other"),
  ];

  const a3Deliverables = [
    "Furniture Layout",
    "Lighting & Electrical Layout",
    "Materials & Finishes",
    "Reflected Ceiling Plan",
    t("projects.deliverable.3dVisualization"),
    t("common.other"),
  ];

  const projectContexts = [
    "Building Surrounding",
    "Park / Green Space",
    "Urban Plaza / Streetscape",
    t("common.other"),
  ];

  const a4Deliverables = [
    "Hardscape Plan",
    "Planting Plan",
    "Lighting Layout",
    "Irrigation & Drainage",
    t("projects.deliverable.3dVisualization"),
    t("common.other"),
  ];

  const boqPurposes = [
    t("projects.boq.newTender"),
    t("projects.boq.variation"),
    t("projects.boq.asBuiltAudit"),
    t("projects.boq.checkMaterial"),
    t("common.other"),
  ];

  const supervisionTypes = [
    t("projects.supervision.fullTime"),
    t("projects.supervision.periodic"),
    t("projects.supervision.qualityAudit"),
    t("common.other"),
  ];

  const locations = ["Site 1", "Site 2", "Site 3", "Site 4", t("common.other")];
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

  const updateScope = (
    k: keyof DynamicScope,
    v: string | number | boolean | File | string[],
  ) => {
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
      if (!form.classification) errs.classification = t("validation.selectOne");
    }
    if (step === 1) {
      if (isExistingRequestMode) {
        if (!form.existingProjectId.trim())
          errs.existingProjectId = t("validation.required");
      } else {
        if (!form.title.trim()) errs.title = t("validation.required");
        if (!form.location) errs.location = t("validation.selectOne");
        if (form.location === t("common.other") && !form.otherLocation.trim())
          errs.otherLocation = t("validation.required");
        if (!form.block) errs.block = t("validation.selectOne");
        if (!form.floor) errs.floor = t("validation.selectOne");
        if (!form.department.trim()) errs.department = t("validation.required");
        if (!form.contactPerson.trim())
          errs.contactPerson = t("validation.required");
        if (!form.contactPhone.trim())
          errs.contactPhone = t("validation.required");
        if (!form.siteCondition) errs.siteCondition = t("validation.selectOne");
        if (
          form.siteCondition === t("common.other") &&
          !form.otherSiteCondition.trim()
        )
          errs.otherSiteCondition = t("validation.required");
        if (!form.functionalDescription.trim())
          errs.functionalDescription = t("validation.required");
        if (!form.budget || Number(form.budget) <= 0)
          errs.budget = t("validation.positiveNumber");
        if (!form.startDate) errs.startDate = t("validation.required");
        if (!form.endDate) errs.endDate = t("validation.required");
        if (form.startDate && form.endDate && form.startDate >= form.endDate)
          errs.endDate = t("validation.endDateAfterStart");
      }
    }
    if (step === 2) {
      const cls = form.classification;
      if (cls === "A1") {
        if (!form.scope.buildingType)
          errs.buildingType = t("validation.selectOne");
        if (
          form.scope.buildingType === t("common.other") &&
          !form.scope.otherBuildingType.trim()
        )
          errs.buildingType = t("validation.required");
        if (
          form.scope.disciplines.includes(t("common.other")) &&
          !form.scope.otherDiscipline.trim()
        )
          errs.disciplines = t("validation.required");
      }
      if (cls === "A2") {
        if (
          form.scope.interventionType.includes(t("common.other")) &&
          !form.scope.otherInterventionType.trim()
        )
          errs.interventionType = t("validation.required");
        if (
          form.scope.a2DesignScope.includes(t("common.other")) &&
          !form.scope.otherA2DesignScope.trim()
        )
          errs.a2DesignScope = t("validation.required");
        if (
          form.scope.a2Deliverables.includes(t("common.other")) &&
          !form.scope.otherA2Deliverable.trim()
        )
          errs.a2Deliverables = t("validation.required");
      }
      if (cls === "A3") {
        if (!form.scope.spaceType) errs.spaceType = t("validation.selectOne");
        if (
          form.scope.spaceType === t("common.other") &&
          !form.scope.otherSpaceType.trim()
        )
          errs.spaceType = t("validation.required");
        if (
          form.scope.a3Deliverables.includes(t("common.other")) &&
          !form.scope.otherA3Deliverable.trim()
        )
          errs.a3Deliverables = t("validation.required");
      }
      if (cls === "A4") {
        if (!form.scope.projectContext)
          errs.projectContext = t("validation.selectOne");
        if (
          form.scope.projectContext === t("common.other") &&
          !form.scope.otherProjectContext.trim()
        )
          errs.projectContext = t("validation.required");
        if (
          form.scope.a4Deliverables.includes(t("common.other")) &&
          !form.scope.otherA4Deliverable.trim()
        )
          errs.a4Deliverables = t("validation.required");
      }
      if (cls === "A5" && !form.scope.boqPurpose)
        errs.boqPurpose = t("validation.selectOne");
      if (
        cls === "A5" &&
        form.scope.boqPurpose === t("common.other") &&
        !form.scope.otherBoqPurpose.trim()
      )
        errs.boqPurpose = t("validation.required");
      if (cls === "A6" && form.scope.supervisionTypes.length === 0)
        errs.supervisionTypes = t("validation.selectOne");
      if (
        cls === "A6" &&
        form.scope.supervisionTypes.includes(t("common.other")) &&
        !form.scope.otherSupervisionType.trim()
      )
        errs.supervisionTypes = t("validation.required");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validate()) return;
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
        form.location === t("common.other")
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
              supervisionTypes: form.scope.supervisionTypes.map((t_item) =>
                t_item === t("common.other")
                  ? form.scope.otherSupervisionType
                  : t_item,
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
              form.siteCondition === t("common.other")
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
                form.scope.buildingType === t("projects.buildingType.other")
                  ? form.scope.otherBuildingType
                  : form.scope.buildingType,
              disciplines: form.scope.disciplines.map((d) =>
                d === t("common.other") ? form.scope.otherDiscipline : d,
              ),
              interventionType: form.scope.interventionType.map((t_item) =>
                t_item === t("common.other")
                  ? form.scope.otherInterventionType
                  : t_item,
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
                t_item === t("common.other")
                  ? form.scope.otherSupervisionType
                  : t_item,
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
        department: isExistingMode
          ? "Linked Existing Project"
          : form.department,
        contactPerson: isExistingMode
          ? "Linked Existing Project"
          : form.contactPerson,
        contactPhone: isExistingMode ? "N/A" : form.contactPhone,
        siteCondition: isExistingMode
          ? "Linked Existing Project"
          : form.siteCondition === t("common.other")
            ? form.otherSiteCondition
            : form.siteCondition,
        scope: requestBody.scope,
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
          {t("requests.submitted")}!
        </h2>
        <p className="text-muted-foreground mb-2">
          {t("bookings.allocationBeingReviewed")}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {t("config.autoAssignTech")}:{" "}
          <span className="font-semibold text-[#1A3580]">
            {getAssignmentInfo()}
          </span>
        </p>
        <div className="bg-[#EEF2FF] border border-[#1A3580]/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            {t("bookings.generatedAllocationID")}
          </p>
          <p className="font-mono text-xl font-bold text-[#1A3580]">
            {submittedId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("common.saveForTracking")}
          </p>
        </div>
        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 mb-5">
          <span className="font-semibold">{t("requests.adminNote")}:</span>{" "}
          {t("projects.boq.checkMaterial")}
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
          onClick={() => router.push("/dashboard/projects")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A3580]" />
            <span className="text-xs font-semibold text-[#1A3580] uppercase tracking-wider">
              {t("config.streamA")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">{t("nav.projects")}</h1>
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
                {t("projects.step.classification")}
              </h2>
              <p className="text-muted-foreground text-xs mb-4">
                {t("projects.classification.A1.desc")}
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
                  🔀 {t("config.autoAssignTech")}:{" "}
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
                {t("projects.step.generalInfo")}
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
                    {t("form.projectTitle")} *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder={t("form.projectTitle")}
                    className={inputClass("title")}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2271] mb-1">
                      {t("form.location_site")} *
                    </label>
                    <select
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className={inputClass("location")}
                    >
                      <option value="">{t("validation.selectOne")}</option>
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
                    {t("form.siteCondition")} *
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
                      {t("form.estimatedBudget")}
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
                    {t("projects.step.designScope")}
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
                    {t("projects.step.designScope")}
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
                    {t("projects.buildingType.other")} *
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
              {t("projects.step.documents")}
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
              {t("projects.step.review")}
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
                ? ([
                    ["Request Mode", "Existing Project"],
                    ["Project ID", form.existingProjectId],
                    ["Classification", form.classification],
                    form.classification === "A5"
                      ? [
                          "BOQ Purpose",
                          form.scope.boqPurpose === "Other"
                            ? form.scope.otherBoqPurpose
                            : form.scope.boqPurpose,
                        ]
                      : null,
                    form.classification === "A6"
                      ? [
                          "Supervision Types",
                          form.scope.supervisionTypes
                            .map((t) =>
                              t === "Other"
                                ? form.scope.otherSupervisionType
                                : t,
                            )
                            .join(", "),
                        ]
                      : null,
                    ["Auto-Assign To", getAssignmentInfo()],
                    ["Documents", `${form.files.length} file(s) attached`],
                  ].filter(Boolean) as [string, string][])
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
            <ArrowLeft size={16} /> {t("common.back")}
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
            {loading ? t("common.submitting") : t("bookings.confirmAndSubmit")}
          </button>
        )}
      </div>
    </div>
  );
}
