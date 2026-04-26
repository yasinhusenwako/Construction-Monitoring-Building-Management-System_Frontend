"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface PreventiveSchedule {
  id: string;
  system: string;
  frequency: "Monthly" | "Quarterly" | "Semi-annually" | "Annually";
  lastDone: string;
  nextDue: string;
  status: "Scheduled" | "Due Soon" | "Due Today" | "Overdue";
  assignee: string;
}

interface PreventiveContextType {
  schedules: PreventiveSchedule[];
  addSchedule: (schedule: Omit<PreventiveSchedule, "id" | "status" | "nextDue">) => void;
  updateSchedule: (id: string, updates: Partial<PreventiveSchedule>) => void;
  deleteSchedule: (id: string) => void;
}

const PreventiveContext = createContext<PreventiveContextType | undefined>(undefined);

const STATIC_SCHEDULES: PreventiveSchedule[] = [
  {
    id: "PM-001",
    system: "HVAC – Floor 1 & 2",
    frequency: "Quarterly",
    lastDone: "2026-01-15",
    nextDue: "2026-04-15",
    status: "Due Soon",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-002",
    system: "HVAC – Floor 3 & 4",
    frequency: "Quarterly",
    lastDone: "2025-12-10",
    nextDue: "2026-03-10",
    status: "Overdue",
    assignee: "Dawit Tadesse",
  },
  {
    id: "PM-003",
    system: "Elevator A1 – Tower A",
    frequency: "Semi-annually",
    lastDone: "2025-10-06",
    nextDue: "2026-04-06",
    status: "Due Soon",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-004",
    system: "Generator – HQ Block A",
    frequency: "Monthly",
    lastDone: "2026-02-28",
    nextDue: "2026-03-31",
    status: "Due Today",
    assignee: "Dawit Tadesse",
  },
  {
    id: "PM-005",
    system: "Fire Suppression System",
    frequency: "Semi-annually",
    lastDone: "2025-09-20",
    nextDue: "2026-03-20",
    status: "Overdue",
    assignee: "Tekle Haile",
  },
  {
    id: "PM-006",
    system: "UPS & Power Systems",
    frequency: "Quarterly",
    lastDone: "2026-01-05",
    nextDue: "2026-04-05",
    status: "Scheduled",
    assignee: "Dawit Tadesse",
  },
];

export function PreventiveProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<PreventiveSchedule[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("insa_preventive_schedules");
    if (stored) {
      setSchedules(JSON.parse(stored));
    } else {
      setSchedules(STATIC_SCHEDULES);
    }
  }, []);

  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem("insa_preventive_schedules", JSON.stringify(schedules));
    }
  }, [schedules]);

  const calculateNextDue = (lastDone: string, frequency: string) => {
    const date = new Date(lastDone);
    if (frequency === "Monthly") date.setMonth(date.getMonth() + 1);
    else if (frequency === "Quarterly") date.setMonth(date.getMonth() + 3);
    else if (frequency === "Semi-annually") date.setMonth(date.getMonth() + 6);
    else if (frequency === "Annually") date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().slice(0, 10);
  };

  const calculateStatus = (nextDue: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(nextDue);
    const diff = (dueDate.getTime() - new Date(today).getTime()) / (1000 * 3600 * 24);

    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due Today";
    if (diff <= 7) return "Due Soon";
    return "Scheduled";
  };

  const addSchedule = (data: Omit<PreventiveSchedule, "id" | "status" | "nextDue">) => {
    const nextDue = calculateNextDue(data.lastDone, data.frequency);
    const status = calculateStatus(nextDue);
    const newSchedule: PreventiveSchedule = {
      ...data,
      id: `PM-${String(schedules.length + 1).padStart(3, "0")}`,
      nextDue,
      status,
    };
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const updateSchedule = (id: string, updates: Partial<PreventiveSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          if (updates.lastDone || updates.frequency) {
            updated.nextDue = calculateNextDue(updated.lastDone, updated.frequency);
            updated.status = calculateStatus(updated.nextDue);
          }
          return updated;
        }
        return s;
      }),
    );
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <PreventiveContext.Provider value={{ schedules, addSchedule, updateSchedule, deleteSchedule }}>
      {children}
    </PreventiveContext.Provider>
  );
}

export function usePreventive() {
  const context = useContext(PreventiveContext);
  if (context === undefined) {
    throw new Error("usePreventive must be used within a PreventiveProvider");
  }
  return context;
}
