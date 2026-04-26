"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SystemSettings {
  siteName: string;
  adminEmail: string;
  maxFileSize: string;
  sessionTimeout: string;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  autoAssign: boolean;
  requireBudget: boolean;
}

const defaultSettings: SystemSettings = {
  siteName: "INSA BuildMS",
  adminEmail: "admin@insa.gov.et",
  maxFileSize: "10",
  sessionTimeout: "8",
  enableNotifications: true,
  enableEmailAlerts: true,
  enableSMSAlerts: true,
  autoAssign: true,
  requireBudget: true,
};

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem("insa_system_settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("insa_system_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
