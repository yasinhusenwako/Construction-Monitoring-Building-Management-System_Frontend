"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Clock,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  MapPin,
  Briefcase,
  Phone,
  User,
  FileText,
} from "lucide-react";
import { DatePicker } from "@/components/common/DatePicker";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveBookings, updateBooking } from "@/lib/live-api";
import { getSpaces } from "@/lib/spaces-storage";
import type { Booking, Space } from "@/types/models";

// Toggle component for multi-select options
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

export function EditBookingPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<Booking | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookingType, setBookingType] = useState<"B1" | "B2" | "">("");
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);

  // B1 (Office Allocation) form state
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

  // B2 (Hall Booking) form state
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

  // Translation constants
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

  useEffect(() => {
    setSpaces(getSpaces());
    const loadBooking = async () => {
      try {
        const bookings = await fetchLiveBookings(bookingId);
        setLiveBookings(bookings); // Store all bookings for conflict detection
        const b = bookings.find(item => item.id === bookingId);
        if (b) {
          setBooking(b);
          
          // Determine booking type
          const isOfficeAllocation = b.type === "Office";
          setBookingType(isOfficeAllocation ? "B1" : "B2");
          
          if (isOfficeAllocation) {
            // Populate B1 form
            setB1Form({
              department: b.department || "",
              reason: b.purpose || "",
              otherReason: "",
              seniorStaff: b.seniorStaff?.toString() || "",
              supportStaff: b.supportStaff?.toString() || "",
              officeType: b.officeType || "",
              specialReqs: b.requirements ? b.requirements.split(",").map(r => r.trim()) : [],
              otherSpecialReq: "",
              preferredLocation: b.space !== "N/A" ? b.space : "",
              notes: b.notes || "",
              contactName: b.contactPerson || "",
              contactPhone: b.contactPhone || "",
            });
          } else {
            // Populate B2 form
            setB2Form({
              space: b.space,
              date: b.date,
              startTime: b.startTime,
              endTime: b.endTime,
              title: b.title,
              purpose: b.purpose,
              attendees: b.attendees.toString(),
              layout: b.roomLayout || "",
              amenities: b.requirements ? b.requirements.split(",").map(r => r.trim()) : [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to load booking:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

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

  // Calculate booked dates for the selected space (for calendar highlighting)
  // Exclude the current booking being edited
  const bookedDatesForSpace = bookingType === "B2" && selectedSpace
    ? liveBookings
        .filter((b) => b.space === selectedSpace.name && b.id !== bookingId)
        .map((b) => b.date)
        .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
    : [];

  const validate = () => {
    const errs: Record<string, string> = {};
    
    if (bookingType === "B1") {
      if (step === 0) {
        if (!b1Form.department.trim()) errs.department = t("validation.required");
        if (!b1Form.reason) errs.reason = t("validation.selectOne");
        if (!b1Form.officeType) errs.officeType = t("validation.selectOne");
        if (!b1Form.contactName.trim()) errs.contactName = t("validation.required");
        if (!b1Form.contactPhone.trim()) errs.contactPhone = t("validation.required");
      }
      if (step === 1) {
        if (!b1Form.seniorStaff.trim()) errs.seniorStaff = t("validation.required");
      }
    }

    if (bookingType === "B2") {
      if (step === 0) {
        if (!b2Form.space) errs.space = t("validation.selectOne");
        if (!b2Form.date) errs.date = t("validation.required");
        if (!b2Form.startTime) errs.startTime = t("validation.required");
        if (!b2Form.endTime) errs.endTime = t("validation.required");
        if (b2Form.startTime && b2Form.endTime && b2Form.startTime >= b2Form.endTime)
          errs.endTime = t("validation.endDateAfterStart");
      }
      if (step === 1) {
        if (!b2Form.title.trim()) errs.title = t("validation.required");
        if (!b2Form.purpose.trim()) errs.purpose = t("validation.required");
        if (!b2Form.attendees || parseInt(b2Form.attendees) < 1)
          errs.attendees = t("validation.required");
        if (selectedSpace && parseInt(b2Form.attendees) > selectedSpace.capacity)
          errs.attendees = `${t("validation.invalidNumber")} (max: ${selectedSpace.capacity})`;
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
      if (bookingType === "B1") {
        // Update B1 (Office Allocation)
        const finalB1Reason = b1Form.reason === t("common.other") ? b1Form.otherReason : b1Form.reason;
        const finalB1Reqs = b1Form.specialReqs
          .map((req) => (req === t("common.other") ? b1Form.otherSpecialReq : req))
          .filter(Boolean)
          .join(", ");
        
        await updateBooking(bookingId, {
          title: `${t("bookings.officeAllocation")} - ${b1Form.department}`,
          space: b1Form.preferredLocation || t("bookings.noPreference"),
          type: "Office",
          date: booking?.date || new Date().toISOString().slice(0, 10),
          startTime: "09:00",
          endTime: "17:00",
          attendees: Number(b1Form.seniorStaff || 0) + Number(b1Form.supportStaff || 0),
          purpose: finalB1Reason,
          requirements: finalB1Reqs,
          department: b1Form.department,
          contactPerson: b1Form.contactName,
          contactPhone: b1Form.contactPhone,
          officeType: b1Form.officeType,
          seniorStaff: Number(b1Form.seniorStaff || 0),
          supportStaff: Number(b1Form.supportStaff || 0),
          notes: b1Form.notes,
        } as any);
      } else {
        // Update B2 (Hall Booking)
        await updateBooking(bookingId, {
          title: b2Form.title,
          space: selectedSpace?.name || b2Form.space,
          type: (selectedSpace?.type as Booking["type"]) || "Conference Hall",
          date: b2Form.date,
          startTime: b2Form.startTime,
          endTime: b2Form.endTime,
          attendees: Number(b2Form.attendees),
          purpose: b2Form.purpose,
          requirements: b2Form.amenities.join(", "),
          roomLayout: b2Form.layout,
        } as any);
      }
      
      router.push(`/dashboard/bookings/${bookingId}`);
    } catch (err) {
      console.error("Failed to update booking:", err);
      setErrors({ submit: "Failed to update booking" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <h2 className="text-[#0E2271] text-xl font-bold mb-2">
          {t("bookings.notFound") || "Booking Not Found"}
        </h2>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="mt-4 px-6 py-2 bg-[#1A3580] text-white rounded-lg hover:bg-[#0E2271]"
        >
          {t("bookings.backToBookings") || "Back to Bookings"}
        </button>
      </div>
    );
  }

  const isOfficeAllocation = bookingType === "B1";
  const B1_STEPS = [
    t("bookings.step.officeDetails"),
    t("bookings.step.staffingReqs"),
    t("bookings.step.review"),
  ];
  const B2_STEPS = [
    t("bookings.step.selectSpace"),
    t("bookings.step.eventDetails"),
    t("bookings.step.review"),
  ];
  const steps = bookingType === "B1" ? B1_STEPS : B2_STEPS;

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white/50 backdrop-blur-sm text-sm outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-green-600/20 ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-green-600"
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
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              {t("action.edit")} {isOfficeAllocation ? "Office Allocation" : "Hall Booking"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                isOfficeAllocation
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {isOfficeAllocation ? "🏢 B1" : "🏛️ B2"}
            </span>
          </div>
          <h1 className="text-[#0E2271]">{bookingId}</h1>
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
                      ? "bg-green-600 border-green-600 text-white"
                      : i === step
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900"
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

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg">
        {/* ─── B1 STEP 0: Office Details ──────────────── */}
        {bookingType === "B1" && step === 0 && (
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
                  <p className="text-red-500 text-xs mt-1">{errors.department}</p>
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
                  <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>
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
                <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
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

        {/* ─── B1 STEP 1: Staffing & Requirements ─────── */}
        {bookingType === "B1" && step === 1 && (
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
                  <p className="text-red-500 text-xs mt-1">{errors.seniorStaff}</p>
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
                    {parseInt(b1Form.seniorStaff || "0") + parseInt(b1Form.supportStaff || "0")}{" "}
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
                    onChange={(e) => updateB1("otherSpecialReq", e.target.value)}
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

        {/* ─── B1 STEP 2: Review ─────────────────────── */}
        {bookingType === "B1" && step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.reviewConfirmH2")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                [t("bookings.form_department") || "Department", b1Form.department],
                [t("form.contact"), `${b1Form.contactName} · ${b1Form.contactPhone}`],
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
                  <span className="text-muted-foreground flex-shrink-0">{k}</span>
                  <span className="font-medium text-[#0E2271] text-right">{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── B2 STEP 0: Select Space & Date/Time ─────────────────── */}
        {bookingType === "B2" && step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.selectASpace")} & {t("bookings.step.dateTime")}
            </h2>
            
            {errors.space && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /> {errors.space}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-2">
                {t("bookings.selectASpace")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => updateB2("space", space.id)}
                    className={`text-left border-2 rounded-2xl p-5 transition-all modern-card ${
                      b2Form.space === space.id
                        ? "border-green-500 bg-green-50 selected"
                        : "border-border hover:border-green-300 hover:bg-green-50/50 glass-effect"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                        {t("bookings.available_dot")}
                      </span>
                      {b2Form.space === space.id && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-[#0E2271]">{space.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {space.capacity} {t("bookings.capacityCap")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {space.floor}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.dateReq")}
              </label>
              <DatePicker
                value={b2Form.date}
                onChange={(val) => updateB2("date", val)}
                placeholder={t("bookings.placeholder.date")}
                hasError={!!errors.date}
                bookedDates={bookedDatesForSpace}
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
                  <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
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

        {/* ─── B2 STEP 1: Event Details ─────────────────── */}
        {bookingType === "B2" && step === 1 && (
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
                    {l === "U-shape" ? "⊓ " : l === "Theater" ? "🎭 " : l === "Classroom" ? "📚 " : "🪑 "}
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

        {/* ─── B2 STEP 2: Review ───────────────────────── */}
        {bookingType === "B2" && step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.reviewConfirmH2")}
            </h2>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 text-sm">
              {[
                [t("bookings.spaceKey"), selectedSpace?.name || b2Form.space],
                [t("form.date"), b2Form.date],
                [t("bookings.timeKey"), `${b2Form.startTime} – ${b2Form.endTime}`],
                [t("bookings.eventTitleKey"), b2Form.title],
                [t("bookings.attendeesKey"), b2Form.attendees],
                [t("bookings.layoutKey"), b2Form.layout || t("bookings.notSpecified")],
                [t("bookings.amenitiesKey"), b2Form.amenities.join(", ") || t("bookings.noneText")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground flex-shrink-0">{k}</span>
                  <span className="font-medium text-[#0E2271] text-right">{v || "—"}</span>
                </div>
              ))}
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
            onClick={() => {
              const maxStep = bookingType === "B1" ? 2 : 2;
              if (step === maxStep) {
                handleSave();
              } else {
                nextStep();
              }
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {step === (bookingType === "B1" ? 2 : 2) ? (
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
