"use client";

import { useState } from "react";
import {
  CheckCircle,
  Save,
  Plus,
  X,
  Bell,
  Settings,
  Shield,
  Tag,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const defaultStatuses = {
  project: [
    "Submitted",
    "Under Review",
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professional",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",
    "Rejected",
    "Closed",
  ],
  booking: [
    "Submitted",
    "Under Review",
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professional",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",
    "Rejected",
    "Closed",
  ],
  maintenance: [
    "Submitted",
    "Under Review",
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professional",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",
    "Rejected",
    "Closed",
  ],
};

const defaultPriorities = [
  { label: "Critical", color: "#CC1F1A", sla: "2 hours" },
  { label: "High", color: "#EA580C", sla: "8 hours" },
  { label: "Medium", color: "#F5B800", sla: "24 hours" },
  { label: "Low", color: "#6B7280", sla: "72 hours" },
];

const defaultTemplates = [
  {
    id: "T1",
    name: "Project Submitted",
    trigger: "On project submission",
    channels: ["Email", "In-App"],
    active: true,
  },
  {
    id: "T2",
    name: "Project Approved",
    trigger: "On project approval",
    channels: ["Email", "SMS", "In-App"],
    active: true,
  },
  {
    id: "T3",
    name: "Project Rejected",
    trigger: "On project rejection",
    channels: ["Email", "In-App"],
    active: true,
  },
  {
    id: "T4",
    name: "Booking Approved",
    trigger: "On booking approval",
    channels: ["Email", "In-App"],
    active: true,
  },
  {
    id: "T5",
    name: "Maintenance Assigned",
    trigger: "When ticket is assigned",
    channels: ["SMS", "In-App"],
    active: true,
  },
  {
    id: "T6",
    name: "Maintenance Resolved",
    trigger: "When repair is complete",
    channels: ["Email", "In-App"],
    active: false,
  },
];

export function ConfigPage() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState("");
  const [activeTab, setActiveTab] = useState("statuses");
  const [templates, setTemplates] = useState(defaultTemplates);
  const [priorities] = useState(defaultPriorities);

  const [systemSettings, setSystemSettings] = useState({
    siteName: "INSA BuildMS",
    adminEmail: "admin@insa.gov.et",
    maxFileSize: "10",
    sessionTimeout: "8",
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    autoAssign: false,
    requireBudget: true,
  });

  const handleSave = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(""), 3000);
  };

  const tabs = [
    {
      key: "statuses",
      label: t("config.statusManagement"),
      icon: <Tag size={14} />,
    },
    {
      key: "priorities",
      label: t("config.priorityLevels"),
      icon: <Shield size={14} />,
    },
    {
      key: "notifications",
      label: t("config.notificationTemplates"),
      icon: <Bell size={14} />,
    },
    {
      key: "system",
      label: t("config.systemSettings"),
      icon: <Settings size={14} />,
    },
  ];

  const streamLabel = (stream: string) => {
    if (stream === "project") return t("config.streamA");
    if (stream === "booking") return t("config.streamB");
    return t("config.streamC");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[#0E2271]">{t("config.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("config.manageSettings")}
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {saved} {t("config.savedSuccess")}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-white shadow text-[#1A3580]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Status Management */}
      {activeTab === "statuses" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(defaultStatuses).map(([stream, statuses]) => (
            <div
              key={stream}
              className="bg-white rounded-xl border border-border p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0E2271] capitalize">
                  {streamLabel(stream)}
                </h3>
              </div>
              <div className="space-y-2">
                {statuses.map((status, i) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5"
                  >
                    <div className="w-5 h-5 rounded bg-[#1A3580]/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#1A3580]">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-sm font-medium flex-1">{status}</span>
                    <ChevronIcon />
                  </div>
                ))}
                <button className="w-full py-2 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs hover:border-[#1A3580] hover:text-[#1A3580] transition-colors flex items-center justify-center gap-1">
                  <Plus size={12} /> {t("config.addStatus")}
                </button>
              </div>
              <button
                onClick={() => handleSave(`${stream} status`)}
                className="w-full mt-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ background: "#1A3580" }}
              >
                {t("config.saveChanges")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Priority Levels */}
      {activeTab === "priorities" && (
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-[#0E2271] mb-4">
            {t("config.priorityLevelConfig")}
          </h3>
          <div className="space-y-3">
            {priorities.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-4 bg-secondary/50 rounded-xl px-5 py-4"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: p.color }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("config.slaTarget")} {p.sla}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block">
                      {t("config.slaTarget")}
                    </label>
                    <input
                      defaultValue={p.sla}
                      className="w-24 px-2 py-1 text-xs rounded border border-border bg-white outline-none focus:border-[#1A3580]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block">
                      {t("config.colorLabel")}
                    </label>
                    <input
                      type="color"
                      defaultValue={p.color}
                      className="w-10 h-7 rounded border border-border cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleSave("Priority")}
            className="mt-4 flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: "#1A3580" }}
          >
            <Save size={14} /> {t("config.savePrioritySettings")}
          </button>
        </div>
      )}

      {/* Notification Templates */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-[#0E2271]">
              {t("config.notificationTemplates")}
            </h3>
            <button className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline">
              <Plus size={12} /> {t("config.addTemplate")}
            </button>
          </div>
          <div className="divide-y divide-border">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    {tmpl.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tmpl.trigger}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {tmpl.channels.map((ch) => (
                      <span
                        key={ch}
                        className="text-xs bg-[#EEF2FF] text-[#1A3580] px-2 py-0.5 rounded font-medium"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${tmpl.active ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {tmpl.active ? t("users.active") : t("users.inactive")}
                    </span>
                    <button
                      onClick={() =>
                        setTemplates((prev) =>
                          prev.map((tmp) =>
                            tmp.id === tmpl.id
                              ? { ...tmp, active: !tmp.active }
                              : tmp,
                          ),
                        )
                      }
                      className={`w-10 h-5 rounded-full transition-all ${tmpl.active ? "bg-[#1A3580]" : "bg-gray-200"}`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-all mx-0.5 ${tmpl.active ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                  <button className="text-xs text-[#1A3580] hover:underline">
                    {t("action.edit")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border bg-secondary/30">
            <button
              onClick={() => handleSave("Notification template")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: "#1A3580" }}
            >
              <Save size={14} /> {t("config.saveAllTemplates")}
            </button>
          </div>
        </div>
      )}

      {/* System Settings */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* General */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-[#0E2271] mb-4">
              {t("config.generalSettings")}
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "siteName",
                  label: t("config.systemName"),
                  type: "text",
                },
                {
                  key: "adminEmail",
                  label: t("config.adminEmail"),
                  type: "email",
                },
                {
                  key: "maxFileSize",
                  label: t("config.maxFileSize"),
                  type: "number",
                },
                {
                  key: "sessionTimeout",
                  label: t("config.sessionTimeout"),
                  type: "number",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(systemSettings as any)[field.key]}
                    onChange={(e) =>
                      setSystemSettings((s) => ({
                        ...s,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSave("General")}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: "#1A3580" }}
            >
              <Save size={14} /> {t("config.saveGeneralSettings")}
            </button>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-[#0E2271] mb-4">
              {t("config.featureToggles")}
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: "enableNotifications",
                  label: t("config.enableInAppNotif"),
                  desc: t("config.showNotifBellDesc"),
                },
                {
                  key: "enableEmailAlerts",
                  label: t("config.enableEmailAlerts"),
                  desc: t("config.sendEmailStatusDesc"),
                },
                {
                  key: "enableSMSAlerts",
                  label: t("config.enableSMSAlerts"),
                  desc: t("config.sendSMSCriticalDesc"),
                },
                {
                  key: "autoAssign",
                  label: t("config.autoAssignTech"),
                  desc: t("config.autoAssignDesc"),
                },
                {
                  key: "requireBudget",
                  label: t("config.requireBudgetProj"),
                  desc: t("config.requireBudgetDesc"),
                },
              ].map((toggle) => (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {toggle.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {toggle.desc}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSystemSettings((s) => ({
                        ...s,
                        [toggle.key]: !(s as any)[toggle.key],
                      }))
                    }
                    className={`w-11 h-6 rounded-full transition-all flex-shrink-0 ${(systemSettings as any)[toggle.key] ? "bg-[#1A3580]" : "bg-gray-200"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-1 ${(systemSettings as any)[toggle.key] ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSave("Feature toggle")}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: "#1A3580" }}
            >
              <Save size={14} /> {t("config.saveFeatureSettings")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-muted-foreground"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
