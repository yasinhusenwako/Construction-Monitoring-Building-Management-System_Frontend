"use client";

import { useSystemSettings } from "@/context/SystemSettingsContext";
import { useEffect } from "react";

export function DynamicMetadata() {
  const { settings } = useSystemSettings();

  useEffect(() => {
    // Update document title dynamically
    document.title = settings.siteName;
  }, [settings.siteName]);

  return null;
}
