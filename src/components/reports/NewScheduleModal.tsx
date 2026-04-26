import React, { useState, useEffect } from "react";
import { X, Wrench, Calendar, Users, Clock, Plus, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { usePreventive, PreventiveSchedule } from "@/context/PreventiveContext";

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionals: Array<{ id: string; name: string }>;
  initialData?: PreventiveSchedule | null;
}

export function NewScheduleModal({ isOpen, onClose, professionals, initialData }: NewScheduleModalProps) {
  const { t } = useLanguage();
  const { addSchedule, updateSchedule } = usePreventive();
  
  const [formData, setFormData] = useState({
    system: "",
    frequency: "Quarterly" as "Monthly" | "Quarterly" | "Semi-annually" | "Annually",
    lastDone: new Date().toISOString().slice(0, 10),
    assignee: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        system: initialData.system,
        frequency: initialData.frequency,
        lastDone: initialData.lastDone,
        assignee: initialData.assignee,
      });
    } else {
      setFormData({
        system: "",
        frequency: "Quarterly",
        lastDone: new Date().toISOString().slice(0, 10),
        assignee: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      updateSchedule(initialData.id, formData);
    } else {
      addSchedule(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#0E2271] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {initialData ? t("reports.editSchedule") : t("reports.generateNewSchedule")}
              </h2>
              <p className="text-white/60 text-xs uppercase tracking-wider font-semibold">
                {t("reports.preventiveMaintenance")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
              <Wrench size={14} /> {t("reports.systemEquipment")}
            </label>
            <input
              required
              type="text"
              placeholder="e.g. HVAC - Floor 5, Generator B"
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-[#1A3580] focus:border-[#1A3580] outline-none transition-all"
              value={formData.system}
              onChange={(e) => setFormData({ ...formData, system: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                <Clock size={14} /> {t("reports.frequency")}
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-[#1A3580] focus:border-[#1A3580] outline-none transition-all bg-white"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-annually">Semi-annually</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
                <Calendar size={14} /> {t("reports.lastDone")}
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-[#1A3580] focus:border-[#1A3580] outline-none transition-all"
                value={formData.lastDone}
                onChange={(e) => setFormData({ ...formData, lastDone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0E2271] flex items-center gap-2">
              <Users size={14} /> {t("reports.assignTo")}
            </label>
            <select
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-[#1A3580] focus:border-[#1A3580] outline-none transition-all bg-white"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
            >
              <option value="">Select Professional</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-all font-semibold text-foreground"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1A3580] hover:bg-[#0E2271] text-white transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {initialData ? <Save size={18} /> : <Plus size={18} />}
              {initialData ? t("common.save") : t("reports.generate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
