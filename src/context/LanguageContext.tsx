"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { formatDate as formatDateWithCalendar } from "@/lib/ethiopian-calendar";
import enMessages from "@/locales/en.json";
import amMessages from "@/locales/am.json";

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
  formatDate: (
    date: Date | string,
    options?: { format?: "short" | "long"; includeTime?: boolean }
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Static message imports
const messageCache: Record<Language, Record<string, string>> = {
  en: enMessages as Record<string, string>,
  am: amMessages as Record<string, string>,
};

function resolve(messages: Record<string, string>, key: string, args?: Record<string, string | number>): string {
  const val = messages[key];
  if (!val) return key;
  if (!args) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => String(args[k] ?? `{${k}}`));
}

function loadMessages(lang: Language): Record<string, string> {
  return messageCache[lang];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("en");
  const [messages, setMessages] = useState<Record<string, string>>(
    messageCache.en
  );

  useEffect(() => {
    const stored = (localStorage.getItem("locale") as Language) || "en";
    const lang: Language = stored === "am" ? "am" : "en";
    setLang(lang);
    setMessages(loadMessages(lang));
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem("locale", lang);
    setMessages(loadMessages(lang));
  };

  const t = (key: string, args?: Record<string, string | number>): string => {
    return resolve(messages, key, args);
  };

  const formatDate = (
    date: Date | string,
    options?: { format?: "short" | "long"; includeTime?: boolean }
  ): string => {
    return formatDateWithCalendar(date, language, options);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
