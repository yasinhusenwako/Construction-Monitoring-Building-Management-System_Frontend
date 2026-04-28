"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WorkflowStatus = {
  id: string;
  label: string;
  order: number;
};

export type StatusWorkflows = {
  project: WorkflowStatus[];
  booking: WorkflowStatus[];
  maintenance: WorkflowStatus[];
};

export type SystemSettings = {
  siteName: string;
  adminEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  autoAssign: boolean;
  requireBudget: boolean;
  statusWorkflows: StatusWorkflows;
};

const defaultSettings: SystemSettings = {
  siteName: "INSA CSBMS",
  adminEmail: "admin@insa.gov.et",
  maxFileSize: 10,
  sessionTimeout: 8,
  enableNotifications: true,
  enableEmailAlerts: true,
  enableSMSAlerts: false,
  autoAssign: false,
  requireBudget: true,
  statusWorkflows: {
    project: [
      { id: "submitted", label: "Submitted", order: 1 },
      { id: "under_review", label: "Under Review", order: 2 },
      { id: "assigned_to_director", label: "Assigned to Division Director", order: 3 },
      { id: "workorder_created", label: "WorkOrder Created", order: 4 },
      { id: "assigned_to_professionals", label: "Assigned to Professionals", order: 5 },
      { id: "in_progress", label: "In Progress", order: 6 },
      { id: "completed", label: "Completed", order: 7 },
      { id: "reviewed", label: "Reviewed", order: 8 },
      { id: "approved", label: "Approved", order: 9 },
      { id: "rejected", label: "Rejected", order: 10 },
      { id: "closed", label: "Closed", order: 11 },
    ],
    booking: [
      { id: "submitted", label: "Submitted", order: 1 },
      { id: "under_review", label: "Under Review", order: 2 },
      { id: "assigned_to_director", label: "Assigned to Division Director", order: 3 },
      { id: "workorder_created", label: "WorkOrder Created", order: 4 },
      { id: "assigned_to_professionals", label: "Assigned to Professionals", order: 5 },
      { id: "in_progress", label: "In Progress", order: 6 },
      { id: "completed", label: "Completed", order: 7 },
      { id: "reviewed", label: "Reviewed", order: 8 },
      { id: "approved", label: "Approved", order: 9 },
      { id: "rejected", label: "Rejected", order: 10 },
      { id: "closed", label: "Closed", order: 11 },
    ],
    maintenance: [
      { id: "submitted", label: "Submitted", order: 1 },
      { id: "under_review", label: "Under Review", order: 2 },
      { id: "assigned_to_supervisor", label: "Assigned to Supervisor", order: 3 },
      { id: "workorder_created", label: "WorkOrder Created", order: 4 },
      { id: "assigned_to_professionals", label: "Assigned to Professionals", order: 5 },
      { id: "in_progress", label: "In Progress", order: 6 },
      { id: "completed", label: "Completed", order: 7 },
      { id: "reviewed", label: "Reviewed", order: 8 },
      { id: "approved", label: "Approved", order: 9 },
      { id: "rejected", label: "Rejected", order: 10 },
      { id: "closed", label: "Closed", order: 11 },
    ],
  },
};

type SystemSettingsContextType = {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  refreshSettings: () => void;
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    refreshSettings();
  }, []);

  const refreshSettings = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('systemSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({
            ...defaultSettings,
            ...parsed,
            maxFileSize: Number(parsed.maxFileSize) || defaultSettings.maxFileSize,
            sessionTimeout: Number(parsed.sessionTimeout) || defaultSettings.sessionTimeout,
          });
        } catch (e) {
          console.error('Failed to parse system settings:', e);
          setSettings(defaultSettings);
        }
      }
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemSettings', JSON.stringify(updated));
    }
  };

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}
