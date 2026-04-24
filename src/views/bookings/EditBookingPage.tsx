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
} from "lucide-react";
import { DatePicker } from "@/components/common/DatePicker";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveBookings, updateBooking } from "@/lib/live-api";
import { getSpaces } from "@/lib/spaces-storage";
import type { Booking, Space } from "@/types/models";

export function EditBookingPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<Booking | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);

  const [form, setForm] = useState({
    space: "",
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    purpose: "",
    attendees: 0,
    requirements: "",
    type: "" as Booking["type"],
  });

  useEffect(() => {
    setSpaces(getSpaces());
    const loadBooking = async () => {
      try {
        const bookings = await fetchLiveBookings(bookingId);
        const b = bookings.find(item => item.id === bookingId);
        if (b) {
          setBooking(b);
          setForm({
            space: b.space,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            title: b.title,
            purpose: b.purpose,
            attendees: b.attendees,
            requirements: b.requirements,
            type: b.type,
          });
        }
      } catch (err) {
        console.error("Failed to load booking:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

  const update = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.title.trim()) errs.title = t("validation.required");
      if (!form.date) errs.date = t("validation.required");
      if (!form.startTime) errs.startTime = t("validation.required");
      if (!form.endTime) errs.endTime = t("validation.required");
      if (form.attendees <= 0) errs.attendees = t("validation.positiveNumber");
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
      await updateBooking(bookingId, form as any);
      router.push(`/dashboard/bookings`);
    } catch (err) {
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
              {t("action.edit")} Booking
            </span>
          </div>
          <h1 className="text-[#0E2271]">{bookingId}</h1>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-modern-lg">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.step.eventDetails")}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("form.title")}
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputClass("title")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("form.date")}
                </label>
                <DatePicker
                  value={form.date}
                  onChange={(v) => update("date", v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.attendees")}
                </label>
                <input
                  type="number"
                  value={form.attendees}
                  onChange={(e) => update("attendees", Number(e.target.value))}
                  className={inputClass("attendees")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.startTime")}
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className={inputClass("startTime")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  {t("bookings.endTime")}
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                  className={inputClass("endTime")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.purpose")}
              </label>
              <textarea
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                className={`${inputClass("purpose")} min-h-[80px] resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                {t("bookings.requirements")}
              </label>
              <input
                value={form.requirements}
                onChange={(e) => update("requirements", e.target.value)}
                className={inputClass("requirements")}
                placeholder="e.g. Projector, Catering, Wifi"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-[#0E2271] border-b border-border pb-3">
              {t("bookings.step.review")}
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
               <div>
                 <p className="text-muted-foreground mb-1">{t("form.title")}</p>
                 <p className="font-semibold text-[#0E2271]">{form.title}</p>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">{t("bookings.space")}</p>
                 <p className="font-semibold text-[#0E2271]">{form.space}</p>
               </div>
               <div className="col-span-2">
                 <p className="text-muted-foreground mb-1">{t("bookings.purpose")}</p>
                 <p className="text-gray-700">{form.purpose}</p>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">{t("form.date")}</p>
                 <div className="flex items-center gap-2 font-semibold text-[#0E2271]">
                   <CalendarIcon size={14} /> {form.date}
                 </div>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">{t("bookings.attendees")}</p>
                 <div className="flex items-center gap-2 font-semibold text-[#0E2271]">
                   <Users size={14} /> {form.attendees}
                 </div>
               </div>
               <div>
                 <p className="text-muted-foreground mb-1">Time Range</p>
                 <div className="flex items-center gap-2 font-semibold text-[#0E2271]">
                   <Clock size={14} /> {form.startTime} - {form.endTime}
                 </div>
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
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 hover:shadow-lg transition-all"
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
