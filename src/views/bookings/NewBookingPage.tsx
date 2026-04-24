"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { fetchLiveBookings } from "@/lib/live-api";
import { getSpaces } from "@/lib/spaces-storage";
import { useLanguage } from "@/context/LanguageContext";
import { DatePicker } from "@/components/common/DatePicker";
import type { Booking, Space } from "@/types/models";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react";

// ─── B1: Office Space Allocation ─────────────────────────────────
// Constants migrated inside component for translation support

// ─── B2: Shared Hall Booking ──────────────────────────────────────
// Constants migrated inside component for translation support

function Toggle({
  label,
  checked,
  onChange,
  color = "green",
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  const activeClass =
    color === "green"
      ? "border-green-600 bg-green-50 text-green-800"
      : "border-[#1A3580] bg-[#EEF2FF] text-[#1A3580]";
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${checked ? activeClass : "border-border text-muted-foreground hover:border-gray-300"}`}
    >
      {checked && <CheckCircle size={11} />}
      {label}
    </button>
  );
}

export function NewBookingPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const allocationReasons = [
    t("bookings.allocationReasons.newHire"),
    t("bookings.allocationReasons.expansion"),
    t("bookings.allocationReasons.relocation"),
    t("common.other"),
  ];
  const officeTypes = [
    t("bookings.officeTypes.private"),
    t("bookings.officeTypes.openPlan"),
  ];
  const specialRequirements = [
    t("bookings.specialReqs.security"),
    t("bookings.specialReqs.dataLine"),
    t("bookings.specialReqs.accessibility"),
    t("common.other"),
  ];
  const layouts = [
    t("bookings.layouts.ushape"),
    t("bookings.layouts.theater"),
    t("bookings.layouts.classroom"),
    t("bookings.layouts.boardroom"),
  ];
  const amenities = [
    t("bookings.amenities.projector"),
    t("bookings.amenities.soundSystem"),
    t("bookings.amenities.catering"),
    t("bookings.amenities.wifi"),
    t("bookings.amenities.videoConf"),
    t("bookings.amenities.whiteboard"),
  ];

  const [bookingType, setBookingType] = useState<"B1" | "B2" | "">("");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Load spaces from storage
  useEffect(() => {
    setSpaces(getSpaces());

    // Listen for space updates
    const handleSpacesUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Space[]>;
      setSpaces(customEvent.detail);
    };

    window.addEventListener("spacesUpdated", handleSpacesUpdate);
    return () => window.removeEventListener("spacesUpdated", handleSpacesUpdate);
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchLiveBookings();
        setLiveBookings(data);
      } catch (err) {
        console.error("Failed to load live bookings for conflict check:", err);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    loadBookings();
  }, []);

  // ─── B1 form state
  const [b1Form, setB1Form] = useState({
    department: "",
    reason: "",
    otherReason: "",
    seniorStaff: "",
    supportStaff: "",
    officeType: "",
    specialReqs: [] as string[],
    otherSpecialReq: "",
    preferredLocation: "",
    notes: "",
    contactName: "",
    contactPhone: "",
  });

  // ─── B2 form state
  const [b2Form, setB2Form] = useState({
    space: "",
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    purpose: "",
    attendees: "",
    layout: "",
    amenities: [] as string[],
  });

  const updateB1 = (k: string, v: string | number | boolean | string[]) => {
    setB1Form((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const updateB2 = (k: string, v: string | number | boolean | string[]) => {
    setB2Form((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const toggleSpecialReq = (r: string) =>
    updateB1(
      "specialReqs",
      b1Form.specialReqs.includes(r)
        ? b1Form.specialReqs.filter((x) => x !== r)
        : [...b1Form.specialReqs, r],
    );
  const toggleAmenity = (a: string) =>
    updateB2(
      "amenities",
      b2Form.amenities.includes(a)
        ? b2Form.amenities.filter((x) => x !== a)
        : [...b2Form.amenities, a],
    );

  const selectedSpace = spaces.find((s) => s.id === b2Form.space);

  // Dynamic conflict check for B2 (Shared Hall Booking)
  const hasConflict =
    bookingType === "B2" &&
    liveBookings.some((b) => {
      if (b.space !== (selectedSpace?.name || b2Form.space)) return false;
      if (b.date !== b2Form.date) return false;

      // Overlap detection
      const start = b2Form.startTime;
      const end = b2Form.endTime;
      const bStart = b.startTime;
      const bEnd = b.endTime;

      return (
        (start >= bStart && start < bEnd) ||
        (end > bStart && end <= bEnd) ||
        (start <= bStart && end >= bEnd)
      );
    });

  const B1_STEPS = [
    t("bookings.step.classification"),
    t("bookings.step.officeDetails"),
    t("bookings.step.staffingReqs"),
    t("bookings.step.review"),
  ];
  const B2_STEPS = [
    t("bookings.step.classification"),
    t("bookings.step.selectSpace"),
    t("bookings.step.dateTime"),
    t("bookings.step.eventDetails"),
    t("bookings.step.review"),
  ];

  const steps =
    bookingType === "B1" ? B1_STEPS : bookingType === "B2" ? B2_STEPS : [];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0 && !bookingType) {
      errs.bookingType = t("validation.selectOne");
    }

    if (bookingType === "B1") {
      if (step === 1) {
        if (!b1Form.department.trim())
          errs.department = t("validation.required");
        if (!b1Form.reason) errs.reason = t("validation.selectOne");
        if (!b1Form.officeType) errs.officeType = t("validation.selectOne");
        if (!b1Form.contactName.trim())
          errs.contactName = t("validation.required");
        if (!b1Form.contactPhone.trim())
          errs.contactPhone = t("validation.required");
      }
      if (step === 2) {
        if (!b1Form.seniorStaff.trim())
          errs.seniorStaff = t("validation.required");
      }
    }

    if (bookingType === "B2") {
      if (step === 1 && !b2Form.space) errs.space = t("validation.selectOne");
      if (step === 2) {
        if (!b2Form.date) errs.date = t("validation.required");
        if (!b2Form.startTime) errs.startTime = t("validation.required");
        if (!b2Form.endTime) errs.endTime = t("validation.required");
        if (
          b2Form.startTime &&
          b2Form.endTime &&
          b2Form.startTime >= b2Form.endTime
        )
          errs.endTime = t("validation.endDateAfterStart");
      }
      if (step === 3) {
        if (!b2Form.title.trim()) errs.title = t("validation.required");
        if (!b2Form.purpose.trim()) errs.purpose = t("validation.required");
        if (!b2Form.attendees || parseInt(b2Form.attendees) < 1)
          errs.attendees = t("validation.required");
        if (
          selectedSpace &&
          parseInt(b2Form.attendees) > selectedSpace.capacity
        )
          errs.attendees = `${t("validation.invalidNumber")} (max: ${selectedSpace.capacity})`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validate()) return;
    if (step === 0 && bookingType) setStep(1);
    else setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const prefix = bookingType === "B1" ? "ALLOC" : "BKG";
    const id = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const storedUser = sessionStorage.getItem("insa_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const rawUserId = parsedUser?.id ?? parsedUser?.userId ?? "";
    const requesterId =
      typeof parsedUser?.userId === "number"
        ? parsedUser.userId
        : Number(String(rawUserId).replace(/[^\d]/g, "")) || 1;
    const parsedDivisionId =
      typeof parsedUser?.backendDivisionId === "number"
        ? parsedUser.backendDivisionId
        : Number(String(parsedUser?.divisionId ?? "").replace(/[^\d]/g, "")) ||
          null;
    const requestedBy = rawUserId ? String(rawUserId) : "USR-000";
    const now = new Date().toISOString();
    const finalB1Reason =
      b1Form.reason === t("common.other") ? b1Form.otherReason : b1Form.reason;
    const finalB1Reqs = b1Form.specialReqs
      .map((req) => (req === t("common.other") ? b1Form.otherSpecialReq : req))
      .filter(Boolean)
      .join(", ");
    const isOfficeAllocation = bookingType === "B1";
    const attendees = isOfficeAllocation
      ? Number(b1Form.seniorStaff || 0) + Number(b1Form.supportStaff || 0)
      : Number(b2Form.attendees || 0);
    const bookingItem: Booking = {
      id,
      title: isOfficeAllocation
        ? `${t("bookings.officeAllocation")} - ${b1Form.department || t("requests.submitted")}`
        : b2Form.title,
      space: isOfficeAllocation
        ? b1Form.preferredLocation || t("bookings.noPreference")
        : selectedSpace?.name || b2Form.space || t("bookings.noPreference"),
      type: isOfficeAllocation
        ? "Office"
        : (selectedSpace?.type as Booking["type"]) || "Conference Hall",
      status: "Submitted",
      requestedBy,
      date: isOfficeAllocation
        ? new Date().toISOString().slice(0, 10)
        : b2Form.date,
      startTime: isOfficeAllocation ? "09:00" : b2Form.startTime,
      endTime: isOfficeAllocation ? "17:00" : b2Form.endTime,
      attendees: Number.isFinite(attendees) ? attendees : 0,
      purpose: isOfficeAllocation ? finalB1Reason : b2Form.purpose,
      requirements: isOfficeAllocation
        ? finalB1Reqs
        : b2Form.amenities.join(", "),

      createdAt: now,
      updatedAt: now,
    };

    try {
      // Build structured amenities JSON to store ALL form intake data for full detail-page display
      const structuredAmenities = isOfficeAllocation
        ? JSON.stringify({
            _bookingType: "B1",
            department: b1Form.department,
            reason: finalB1Reason,
            officeType: b1Form.officeType,
            contactName: b1Form.contactName,
            contactPhone: b1Form.contactPhone,
            specialReqs: finalB1Reqs,
            notes: b1Form.notes,
            seniorStaff: b1Form.seniorStaff,
            supportStaff: b1Form.supportStaff,
            preferredLocation: b1Form.preferredLocation,
          })
        : JSON.stringify({
            _bookingType: "B2",
            title: b2Form.title,
            purpose: b2Form.purpose,
            roomLayout: b2Form.layout,
            amenities: b2Form.amenities,
            endTime: b2Form.endTime,
          });

      // Token is automatically sent via httpOnly cookie
      const response = await apiRequest<{ bookingId?: string }>(
        "/api/bookings",
        {
          method: "POST",
          body: {
            bookingId: id,
            type: isOfficeAllocation ? "OFFICE" : "HALL",
            requester: requesterId,
            dateTime: isOfficeAllocation
              ? new Date().toISOString()
              : `${b2Form.date}T${b2Form.startTime}:00`,
            capacity: Number.isFinite(attendees) ? attendees : 0,
            layout: isOfficeAllocation
              ? b1Form.preferredLocation || "Office"
              : selectedSpace?.name || b2Form.space || "Hall",
            amenities: structuredAmenities,
            divisionId: parsedDivisionId,
          },
        },
      );
      bookingItem.id = response.bookingId || id;
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        bookingType:
          error instanceof Error ? error.message : t("requests.submitFailed"),
      }));
      return;
    }

    setSubmittedId(bookingItem.id);
    setSubmitted(true);
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white/50 backdrop-blur-sm text-sm outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-green-600/20 ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-green-600"
    }`;

  if (submitted)
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0E2271] mb-2">
          {bookingType === "B1"
            ? t("bookings.allocationSubmitted")
            : t("bookings.bookingSubmitted")}
        </h2>
        <p className="text-muted-foreground mb-2">
          {bookingType === "B1"
            ? t("bookings.allocationBeingReviewed")
            : t("bookings.allocationBeingReviewed")}
        </p>
        {bookingType === "B1" && (
          <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-4">
            🏢 {t("bookings.generatedAllocationID")}:{" "}
            <strong>Space Manager</strong>
          </p>
        )}
        {bookingType === "B2" && (
          <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-4">
            🏛️ {t("bookings.generatedBookingID")}:{" "}
            <strong>Hall Officer & IT Department</strong>
          </p>
        )}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            {bookingType === "B1"
              ? t("bookings.generatedAllocationID")
              : t("bookings.generatedBookingID")}
          </p>
          <p className="font-mono text-xl font-bold text-green-700">
            {submittedId}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard/bookings")}
            className="px-5 py-2.5 rounded-lg border-2 border-green-600 text-green-700 text-sm font-semibold"
          >
            {t("bookings.viewBookings")}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ background: "#16A34A" }}
          >
            {t("nav.dashboard")}
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6 modern-form">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              {t("bookings.spaceAllocation")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">
            {!bookingType
              ? t("bookings.noBookingType")
              : bookingType === "B1"
                ? t("bookings.officeSpaceAllocation")
                : t("bookings.sharedHallBooking")}
          </h1>
        </div>
      </div>

      {/* Step Indicator */}
      {bookingType && (
        <div className="glass-card rounded-2xl p-5 shadow-modern">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-sm ${
                      i < step
                        ? "bg-green-600 border-green-600 text-white"
                        : i === step
                          ? "bg-[#F5B800] border-[#F5B800] text-gray-900 step-indicator-dot active"
                          : "bg-gray-50/80 border-gray-200 text-gray-400"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <p
                    className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${i === step ? "text-green-700 font-medium" : "text-muted-foreground"}`}
                  >
                    {s}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-12px] ${i < step ? "bg-green-600" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg relative">
        {/* ─── STEP 0: Classification ─────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.selectRequestType")}
            </h2>
            {errors.bookingType && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /> {errors.bookingType}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* B1 Card */}
              <button
                type="button"
                onClick={() => {
                  setBookingType("B1");
                  setErrors({});
                }}
                className={`modern-card text-left border-2 rounded-2xl p-5 transition-all ${
                  bookingType === "B1"
                    ? "border-green-600 bg-green-50 selected"
                    : "border-border hover:border-green-300 hover:bg-green-50/50 glass-effect"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🏢</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold bg-[#1A3580] text-white px-2 py-0.5 rounded">
                      B1
                    </span>
                    {bookingType === "B1" && (
                      <CheckCircle size={14} className="text-green-600" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-[#0E2271] text-sm">
                  {t("bookings.b1CardTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bookings.b1CardDesc")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {allocationReasons.map((r) => (
                    <span
                      key={r}
                      className="text-xs bg-[#EEF2FF] text-[#1A3580] px-2 py-0.5 rounded"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </button>

              {/* B2 Card */}
              <button
                type="button"
                onClick={() => {
                  setBookingType("B2");
                  setErrors({});
                }}
                className={`modern-card text-left border-2 rounded-2xl p-5 transition-all ${
                  bookingType === "B2"
                    ? "border-green-600 bg-green-50 selected"
                    : "border-border hover:border-green-300 hover:bg-green-50/50 glass-effect"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🏛️</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold bg-green-600 text-white px-2 py-0.5 rounded">
                      B2
                    </span>
                    {bookingType === "B2" && (
                      <CheckCircle size={14} className="text-green-600" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-[#0E2271] text-sm">
                  {t("bookings.b2CardTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bookings.b2CardDesc")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {["Conference Hall", "Training Room", "Lab"].map((r) => (
                    <span
                      key={r}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── B1 STEP 1: Office Details ──────────────── */}
        {bookingType === "B1" && step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.officeAllocationDetails")}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.requestingDeptReq")}
                </label>
                <input
                  value={b1Form.department}
                  onChange={(e) => updateB1("department", e.target.value)}
                  placeholder={t("bookings.placeholder.department")}
                  className={inputClass("department")}
                />
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.department}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.contactPersonReq")}
                </label>
                <input
                  value={b1Form.contactName}
                  onChange={(e) => updateB1("contactName", e.target.value)}
                  placeholder={t("bookings.placeholder.contactName")}
                  className={inputClass("contactName")}
                />
                {errors.contactName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.contactPhoneReq")}
              </label>
              <input
                value={b1Form.contactPhone}
                onChange={(e) => updateB1("contactPhone", e.target.value)}
                placeholder={t("bookings.placeholder.contactPhone")}
                className={inputClass("contactPhone")}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPhone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.reasonForAllocReq")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {allocationReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateB1("reason", r)}
                    className={`py-2.5 rounded-xl text-xs font-medium border-2 transition-all modern-card ${
                      b1Form.reason === r
                        ? "border-green-600 bg-green-50 text-green-800 selected"
                        : "border-border text-muted-foreground hover:border-gray-300 bg-white/50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {b1Form.reason === t("common.other") && (
                <div className="mt-3">
                  <input
                    type="text"
                    className="w-full h-10 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-[#1A3580]"
                    placeholder="Please specify other reason..."
                    value={b1Form.otherReason}
                    onChange={(e) => updateB1("otherReason", e.target.value)}
                  />
                </div>
              )}
              {errors.reason && (
                <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.officeTypePrefReq")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {officeTypes.map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => updateB1("officeType", tp)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-all modern-card ${
                      b1Form.officeType === tp
                        ? "border-green-600 bg-green-50 text-green-800 selected"
                        : "border-border text-muted-foreground hover:border-gray-300 bg-white/50"
                    }`}
                  >
                    {tp === "Private Office" ? "🚪" : "🗃️"} {tp}
                  </button>
                ))}
              </div>
              {errors.officeType && (
                <p className="text-red-500 text-xs mt-1">{errors.officeType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.preferredLocationOpt")}
              </label>
              <input
                value={b1Form.preferredLocation}
                onChange={(e) => updateB1("preferredLocation", e.target.value)}
                placeholder={t("bookings.placeholder.preferredLocation")}
                className={inputClass("preferredLocation")}
              />
            </div>
          </div>
        )}

        {/* ─── B1 STEP 2: Staffing & Requirements ─────── */}
        {bookingType === "B1" && step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.staffingDataTitle")}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.seniorStaffCount")}
                </label>
                <input
                  type="number"
                  value={b1Form.seniorStaff}
                  onChange={(e) => updateB1("seniorStaff", e.target.value)}
                  placeholder={t("bookings.placeholder.staffCount")}
                  className={inputClass("seniorStaff")}
                  min="0"
                />
                {errors.seniorStaff && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.seniorStaff}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.supportStaffCount")}
                </label>
                <input
                  type="number"
                  value={b1Form.supportStaff}
                  onChange={(e) => updateB1("supportStaff", e.target.value)}
                  placeholder={t("bookings.placeholder.staffCount")}
                  className={inputClass("supportStaff")}
                  min="0"
                />
              </div>
            </div>

            {(b1Form.seniorStaff || b1Form.supportStaff) && (
              <div className="bg-secondary/50 rounded-lg px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  {t("bookings.totalHeadcountLabel")}{" "}
                  <span className="font-semibold text-[#0E2271]">
                    {parseInt(b1Form.seniorStaff || "0") +
                      parseInt(b1Form.supportStaff || "0")}{" "}
                    {t("bookings.people")}
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.specialReqsLabel")}
              </label>
              <div className="flex flex-wrap gap-2">
                {specialRequirements.map((r) => (
                  <Toggle
                    key={r}
                    label={r}
                    checked={b1Form.specialReqs.includes(r)}
                    onChange={() => toggleSpecialReq(r)}
                  />
                ))}
              </div>
              {b1Form.specialReqs.includes(t("common.other")) && (
                <div className="mt-3">
                  <input
                    type="text"
                    className="w-full h-10 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-[#1A3580]"
                    placeholder="Please specify other requirements..."
                    value={b1Form.otherSpecialReq}
                    onChange={(e) =>
                      updateB1("otherSpecialReq", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.additionalNotesLabel")}
              </label>
              <textarea
                value={b1Form.notes}
                onChange={(e) => updateB1("notes", e.target.value)}
                rows={3}
                placeholder={t("bookings.placeholder.additionalNotes")}
                className={`${inputClass("notes")} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ─── B1 STEP 3: Review ─────────────────────── */}
        {bookingType === "B1" && step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.reviewConfirmH2")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                [t("bookings.requestTypeKey"), t("bookings.b1RequestType")],
                [
                  t("bookings.form_department") || "Department",
                  b1Form.department,
                ],
                [
                  t("form.contact"),
                  `${b1Form.contactName} · ${b1Form.contactPhone}`,
                ],
                [t("bookings.reasonKey"), b1Form.reason],
                [t("bookings.officeTypeKey"), b1Form.officeType],
                [t("bookings.seniorStaffKey"), b1Form.seniorStaff || "0"],
                [t("bookings.supportStaffKey"), b1Form.supportStaff || "0"],
                [
                  t("bookings.totalHeadcountKey"),
                  `${parseInt(b1Form.seniorStaff || "0") + parseInt(b1Form.supportStaff || "0")} ${t("bookings.people")}`,
                ],
                [
                  t("bookings.specialReqsKey"),
                  b1Form.specialReqs.join(", ") || t("bookings.noneText"),
                ],
                [
                  t("bookings.preferredLocationKey"),
                  b1Form.preferredLocation || t("bookings.noPreference"),
                ],
              ].map(([k, v]) => (
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
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
              <p className="font-medium">🏢 {t("bookings.whatHappensNext")}</p>
              <ul className="text-xs space-y-1 mt-1 text-green-700 list-disc list-inside">
                <li>{t("bookings.nextSteps.allocation.1")}</li>
                <li>{t("bookings.nextSteps.allocation.2")}</li>
                <li>{t("bookings.nextSteps.allocation.3")}</li>
                <li>{t("bookings.nextSteps.allocation.4")}</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── B2 STEP 1: Select Space ─────────────────── */}
        {bookingType === "B2" && step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.selectASpace")}
            </h2>
            {errors.space && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /> {errors.space}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() =>
                    !(space as any).available
                      ? undefined
                      : updateB2("space", space.id)
                  }
                  disabled={!(space as any).available}
                  className={`text-left border-2 rounded-2xl p-5 transition-all modern-card ${
                    !(space as any).available
                      ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50/50"
                      : b2Form.space === space.id
                        ? "border-green-500 bg-green-50 selected"
                        : "border-border hover:border-green-300 hover:bg-green-50/50 glass-effect"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${(space as any).available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      {(space as any).available
                        ? t("bookings.available_dot")
                        : t("bookings.booked_dot")}
                    </span>
                    {b2Form.space === space.id && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[#0E2271]">
                    {space.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {space.capacity}{" "}
                      {t("bookings.capacityCap")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {space.floor}
                    </span>
                    <span>{space.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── B2 STEP 2: Date & Time ──────────────────── */}
        {bookingType === "B2" && step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.step.dateTime")}
            </h2>
            {selectedSpace && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-green-800">
                  {t("bookings.selectedSpaceLabel")} {selectedSpace.name}
                </p>
                <p className="text-green-700 text-xs flex items-center gap-2 mt-1">
                  <Users size={12} /> {t("bookings.capacityDetailLabel")}{" "}
                  {selectedSpace.capacity} · {selectedSpace.floor} ·{" "}
                  {selectedSpace.type}
                </p>
              </div>
            )}
            {hasConflict && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={16} /> {t("bookings.conflictDetected")}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.dateReq")}
              </label>
              <DatePicker
                value={b2Form.date}
                onChange={(val) => updateB2("date", val)}
                placeholder={t("bookings.placeholder.date")}
                hasError={!!errors.date}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.startTimeReq")}
                </label>
                <input
                  type="time"
                  value={b2Form.startTime}
                  onChange={(e) => updateB2("startTime", e.target.value)}
                  className={inputClass("startTime")}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.endTimeReq")}
                </label>
                <input
                  type="time"
                  value={b2Form.endTime}
                  onChange={(e) => updateB2("endTime", e.target.value)}
                  className={inputClass("endTime")}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── B2 STEP 3: Event Details ─────────────────── */}
        {bookingType === "B2" && step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.step.eventDetails")}
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.eventMeetingTitle")}
              </label>
              <input
                value={b2Form.title}
                onChange={(e) => updateB2("title", e.target.value)}
                placeholder={t("bookings.placeholder.eventTitle")}
                className={inputClass("title")}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.purposeReq")}
              </label>
              <textarea
                value={b2Form.purpose}
                onChange={(e) => updateB2("purpose", e.target.value)}
                rows={3}
                placeholder={t("bookings.placeholder.purpose")}
                className={`${inputClass("purpose")} resize-none`}
              />
              {errors.purpose && (
                <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.numAttendeesReq")}
              </label>
              <input
                type="number"
                value={b2Form.attendees}
                onChange={(e) => updateB2("attendees", e.target.value)}
                placeholder={t("bookings.placeholder.attendees")}
                className={inputClass("attendees")}
              />
              {selectedSpace && b2Form.attendees && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {t("bookings.capacityUsed")}
                    </span>
                    <span
                      className={
                        parseInt(b2Form.attendees) > selectedSpace.capacity
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {b2Form.attendees}/{selectedSpace.capacity}
                      {parseInt(b2Form.attendees) > selectedSpace.capacity &&
                        ` ⚠️ ${t("bookings.overCapacity")}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${parseInt(b2Form.attendees) > selectedSpace.capacity ? "bg-red-500" : "bg-green-500"}`}
                      style={{
                        width: `${Math.min(100, (parseInt(b2Form.attendees) / selectedSpace.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {errors.attendees && (
                <p className="text-red-500 text-xs mt-1">{errors.attendees}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.roomLayoutLabel")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {layouts.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => updateB2("layout", l)}
                    className={`py-3 rounded-xl text-xs font-medium border-2 transition-all modern-card ${
                      b2Form.layout === l
                        ? "border-green-600 bg-green-50 text-green-800 selected"
                        : "border-border text-muted-foreground hover:border-gray-300 bg-white/50"
                    }`}
                  >
                    {l === "U-shape"
                      ? "⊓ "
                      : l === "Theater"
                        ? "🎭 "
                        : l === "Classroom"
                          ? "📚 "
                          : "🪑 "}
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.requiredAmenities")}
              </label>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <Toggle
                    key={a}
                    label={a}
                    checked={b2Form.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── B2 STEP 4: Review ───────────────────────── */}
        {bookingType === "B2" && step === 4 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.reviewConfirmH2")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                [t("bookings.requestTypeKey"), t("bookings.b2RequestType")],
                [t("bookings.spaceKey"), selectedSpace?.name],
                [t("form.date"), b2Form.date],
                [
                  t("bookings.timeKey"),
                  `${b2Form.startTime} – ${b2Form.endTime}`,
                ],
                [t("bookings.eventTitleKey"), b2Form.title],
                [t("bookings.attendeesKey"), b2Form.attendees],
                [
                  t("bookings.layoutKey"),
                  b2Form.layout || t("bookings.notSpecified"),
                ],
                [
                  t("bookings.amenitiesKey"),
                  b2Form.amenities.join(", ") || t("bookings.noneText"),
                ],
              ].map(([k, v]) => (
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
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
              <p className="font-medium">📅 {t("bookings.whatHappensNext")}</p>
              <ul className="text-xs space-y-1 mt-1 text-green-700 list-disc list-inside">
                <li>{t("bookings.nextSteps.booking.1")}</li>
                <li>{t("bookings.nextSteps.booking.2")}</li>
                <li>{t("bookings.nextSteps.booking.3")}</li>
                <li>{t("bookings.nextSteps.booking.4")}</li>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-green-600 text-green-700 text-sm font-semibold hover:bg-green-600 hover:text-white transition-all shadow-sm hover-lift"
          >
            <ArrowLeft size={16} /> {t("action.back")}
          </button>
        )}
        <div className="flex-1" />
        {(() => {
          const maxStep =
            bookingType === "B1"
              ? B1_STEPS.length - 1
              : bookingType === "B2"
                ? B2_STEPS.length - 1
                : 0;
          const isLast = bookingType && step === maxStep;
          const canContinue = !hasConflict || step !== 2;
          return isLast ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-premium hover-lift"
              style={{
                background: "linear-gradient(135deg, #1A4D2E, #16A34A)",
              }}
            >
              <CheckCircle size={16} /> {t("bookings.confirmAndSubmit")}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={bookingType === "B2" && !canContinue}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:hover:transform-none shadow-premium hover-lift"
              style={{
                background: "linear-gradient(135deg, #1A4D2E, #16A34A)",
              }}
            >
              {t("bookings.continueBtn")} <ChevronRight size={16} />
            </button>
          );
        })()}
      </div>
    </div>
  );
}
