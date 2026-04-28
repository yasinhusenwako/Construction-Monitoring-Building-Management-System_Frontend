"use client";

import { useSystemSettings } from "@/context/SystemSettingsContext";
import { Mail } from "lucide-react";

export function AdminContact() {
  const { settings } = useSystemSettings();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Mail size={12} />
      <span>Support: </span>
      <a 
        href={`mailto:${settings.adminEmail}`}
        className="text-primary hover:underline"
      >
        {settings.adminEmail}
      </a>
    </div>
  );
}
