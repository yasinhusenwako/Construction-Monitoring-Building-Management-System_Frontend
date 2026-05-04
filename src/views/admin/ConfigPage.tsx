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
  Edit2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { useSystemSettings, WorkflowStatus } from '@/context/SystemSettingsContext';

const defaultStatuses = {
  project: [
    "Submitted",
    "Under Review",
    "Assigned to Supervisor",
    "WorkOrder Created",
    "Assigned to Professionals",
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
    "Assigned to Professionals",
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
    "Assigned to Professionals",
    "In Progress",
    "Completed",
    "Reviewed",
    "Approved",
    "Rejected",
    "Closed",
  ],
};

type StreamType = 'project' | 'booking' | 'maintenance';

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

type SystemSettings = {
  siteName: string;
  adminEmail: string;
  maxFileSize: string;
  sessionTimeout: string;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  autoAssign: boolean;
  requireBudget: boolean;
};

export function ConfigPage() {
  const { t } = useLanguage();
  const { settings: systemSettings, updateSettings } = useSystemSettings();
  const [saved, setSaved] = useState("");
  const [activeTab, setActiveTab] = useState("statuses");
  const [templates, setTemplates] = useState(defaultTemplates);
  const [priorities] = useState(defaultPriorities);
  
  // Status workflow editing states
  const [editingStatus, setEditingStatus] = useState<{ stream: StreamType; statusId: string } | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [addingToStream, setAddingToStream] = useState<StreamType | null>(null);
  const [newStatusLabel, setNewStatusLabel] = useState("");

  // Notification template states
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    trigger: "",
    channels: [] as string[],
    active: true,
  });

  const handleSave = (section: string) => {
    // Settings are already saved via updateSettings
    setSaved(section);
    setTimeout(() => setSaved(""), 3000);
    
    // console.log('✅ Settings saved and applied:', systemSettings);
  };

  const handleSettingChange = (key: string, value: string) => {
    updateSettings({
      [key]: key === 'maxFileSize' || key === 'sessionTimeout' ? Number(value) : value,
    });
  };

  // Status workflow management functions
  const handleAddStatus = (stream: StreamType) => {
    if (!newStatusLabel.trim()) return;
    
    const currentStatuses = systemSettings.statusWorkflows[stream];
    const maxOrder = Math.max(...currentStatuses.map(s => s.order), 0);
    const newId = newStatusLabel.toLowerCase().replace(/\s+/g, '_');
    
    const newStatus: WorkflowStatus = {
      id: newId,
      label: newStatusLabel.trim(),
      order: maxOrder + 1,
    };
    
    updateSettings({
      statusWorkflows: {
        ...systemSettings.statusWorkflows,
        [stream]: [...currentStatuses, newStatus],
      },
    });
    
    setNewStatusLabel("");
    setAddingToStream(null);
  };

  const handleEditStatus = (stream: StreamType, statusId: string, newLabel: string) => {
    const currentStatuses = systemSettings.statusWorkflows[stream];
    const updatedStatuses = currentStatuses.map(status =>
      status.id === statusId ? { ...status, label: newLabel } : status
    );
    
    updateSettings({
      statusWorkflows: {
        ...systemSettings.statusWorkflows,
        [stream]: updatedStatuses,
      },
    });
    
    setEditingStatus(null);
    setEditingLabel("");
  };

  const handleDeleteStatus = (stream: StreamType, statusId: string) => {
    const currentStatuses = systemSettings.statusWorkflows[stream];
    const updatedStatuses = currentStatuses
      .filter(status => status.id !== statusId)
      .map((status, index) => ({ ...status, order: index + 1 }));
    
    updateSettings({
      statusWorkflows: {
        ...systemSettings.statusWorkflows,
        [stream]: updatedStatuses,
      },
    });
  };

  const handleMoveStatus = (stream: StreamType, statusId: string, direction: 'up' | 'down') => {
    const currentStatuses = [...systemSettings.statusWorkflows[stream]].sort((a, b) => a.order - b.order);
    const currentIndex = currentStatuses.findIndex(s => s.id === statusId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === currentStatuses.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [currentStatuses[currentIndex], currentStatuses[newIndex]] = 
      [currentStatuses[newIndex], currentStatuses[currentIndex]];
    
    const reorderedStatuses = currentStatuses.map((status, index) => ({
      ...status,
      order: index + 1,
    }));
    
    updateSettings({
      statusWorkflows: {
        ...systemSettings.statusWorkflows,
        [stream]: reorderedStatuses,
      },
    });
  };

  // Notification template management functions
  const handleAddTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.trigger.trim()) return;
    
    const templateId = `T${templates.length + 1}`;
    const template = {
      id: templateId,
      name: newTemplate.name.trim(),
      trigger: newTemplate.trigger.trim(),
      channels: newTemplate.channels.length > 0 ? newTemplate.channels : ["In-App"],
      active: newTemplate.active,
    };
    
    setTemplates([...templates, template]);
    setNewTemplate({ name: "", trigger: "", channels: [], active: true });
    setShowAddTemplateModal(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const toggleChannel = (channel: string) => {
    setNewTemplate(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
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

  const streamDisplayName = (stream: StreamType) => {
    if (stream === "project") return "Stream A: Projects";
    if (stream === "booking") return "Stream B: Space Allocation";
    return "Stream C: Maintenance";
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
          {(Object.keys(systemSettings.statusWorkflows) as StreamType[]).map((stream) => {
            const statuses = [...systemSettings.statusWorkflows[stream]].sort((a, b) => a.order - b.order);
            
            return (
              <div
                key={stream}
                className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#0E2271] dark:text-blue-300 capitalize">
                    {streamDisplayName(stream)}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {statuses.length} statuses
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {statuses.map((status, i) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-2 bg-secondary/50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 group hover:bg-secondary dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Drag Handle */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveStatus(stream, status.id, 'up')}
                          disabled={i === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg width="12" height="6" viewBox="0 0 12 6" fill="currentColor">
                            <path d="M6 0L0 6h12L6 0z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveStatus(stream, status.id, 'down')}
                          disabled={i === statuses.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg width="12" height="6" viewBox="0 0 12 6" fill="currentColor">
                            <path d="M6 6L0 0h12L6 6z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Order Number */}
                      <div className="w-5 h-5 rounded bg-[#1A3580]/10 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#1A3580] dark:text-blue-300">
                          {i + 1}
                        </span>
                      </div>
                      
                      {/* Status Label - Editable */}
                      {editingStatus?.stream === stream && editingStatus?.statusId === status.id ? (
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditStatus(stream, status.id, editingLabel);
                            } else if (e.key === 'Escape') {
                              setEditingStatus(null);
                              setEditingLabel("");
                            }
                          }}
                          className="flex-1 text-sm font-medium px-2 py-1 border border-[#1A3580] rounded focus:outline-none focus:ring-2 focus:ring-[#1A3580]"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium flex-1 text-foreground dark:text-gray-200">
                          {status.label}
                        </span>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingStatus?.stream === stream && editingStatus?.statusId === status.id ? (
                          <>
                            <button
                              onClick={() => handleEditStatus(stream, status.id, editingLabel)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Save"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStatus(null);
                                setEditingLabel("");
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingStatus({ stream, statusId: status.id });
                                setEditingLabel(status.label);
                              }}
                              className="p-1 text-[#1A3580] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete status "${status.label}"?`)) {
                                  handleDeleteStatus(stream, status.id);
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      
                      <ChevronIcon />
                    </div>
                  ))}
                  
                  {/* Add New Status */}
                  {addingToStream === stream ? (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2.5 border-2 border-[#1A3580]">
                      <input
                        type="text"
                        value={newStatusLabel}
                        onChange={(e) => setNewStatusLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddStatus(stream);
                          } else if (e.key === 'Escape') {
                            setAddingToStream(null);
                            setNewStatusLabel("");
                          }
                        }}
                        placeholder="Enter status name..."
                        className="flex-1 text-sm font-medium px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#1A3580] bg-white dark:bg-gray-800"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddStatus(stream)}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        title="Add"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setAddingToStream(null);
                          setNewStatusLabel("");
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToStream(stream)}
                      className="w-full py-2 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs hover:border-[#1A3580] hover:text-[#1A3580] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> {t("config.addStatus")}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => handleSave(`${stream} workflow`)}
                  className="w-full mt-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580] hover:bg-[#0E2271] dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  {t("config.saveChanges")}
                </button>
              </div>
            );
          })}
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
                  <p className="font-semibold text-foreground">
                    {t(`maintenance.priority.${p.label.toLowerCase()}`)}
                  </p>
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
            className="mt-4 flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580]"
          >
            <Save size={14} /> {t("config.savePrioritySettings")}
          </button>
        </div>
      )}

      {/* Notification Templates */}
      {activeTab === "notifications" && (
        <>
          {/* Add Template Modal */}
          {showAddTemplateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-[#0E2271] dark:text-blue-300">
                    {t("config.addTemplate")}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddTemplateModal(false);
                      setNewTemplate({ name: "", trigger: "", channels: [], active: true });
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., Task Assigned"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3580] dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Trigger Event */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Trigger Event *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.trigger}
                      onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value })}
                      placeholder="e.g., When task is assigned to professional"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3580] dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notification Channels *
                    </label>
                    <div className="space-y-2">
                      {["Email", "SMS", "In-App"].map((channel) => (
                        <label
                          key={channel}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newTemplate.channels.includes(channel)}
                            onChange={() => toggleChannel(channel)}
                            className="w-4 h-4 text-[#1A3580] border-gray-300 rounded focus:ring-[#1A3580]"
                          />
                          <span className="text-sm text-foreground">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Active by default
                    </label>
                    <button
                      onClick={() => setNewTemplate({ ...newTemplate, active: !newTemplate.active })}
                      className={`w-10 h-5 rounded-full transition-all ${newTemplate.active ? "bg-[#1A3580]" : "bg-gray-200"}`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-all mx-0.5 ${newTemplate.active ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => {
                      setShowAddTemplateModal(false);
                      setNewTemplate({ name: "", trigger: "", channels: [], active: true });
                    }}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTemplate}
                    disabled={!newTemplate.name.trim() || !newTemplate.trigger.trim()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#1A3580] hover:bg-[#0E2271] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Template
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-[#0E2271] dark:text-blue-300">
                {t("config.notificationTemplates")}
              </h3>
              <button
                onClick={() => setShowAddTemplateModal(true)}
                className="flex items-center gap-1 text-xs text-[#1A3580] dark:text-blue-400 hover:underline"
              >
                <Plus size={12} /> {t("config.addTemplate")}
              </button>
            </div>
            <div className="divide-y divide-border">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="px-5 py-4 flex items-center gap-4 group hover:bg-secondary/30 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground dark:text-gray-200">
                      {tmpl.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tmpl.trigger}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      {tmpl.channels.map((ch) => (
                        <span
                          key={ch}
                          className="text-xs bg-[#EEF2FF] dark:bg-blue-900/30 text-[#1A3580] dark:text-blue-300 px-2 py-0.5 rounded font-medium"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${tmpl.active ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
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
                        className={`w-10 h-5 rounded-full transition-all ${tmpl.active ? "bg-[#1A3580] dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-600"}`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-all mx-0.5 ${tmpl.active ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete template "${tmpl.name}"?`)) {
                          handleDeleteTemplate(tmpl.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-opacity"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-secondary/30 dark:bg-gray-700/30">
              <button
                onClick={() => handleSave("Notification template")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580] hover:bg-[#0E2271] dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Save size={14} /> {t("config.saveAllTemplates")}
              </button>
            </div>
          </div>
        </>
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
                    onChange={(e) => handleSettingChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSave("General")}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580]"
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
                      updateSettings({
                        [toggle.key]: !(systemSettings as any)[toggle.key],
                      })
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
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580]"
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
