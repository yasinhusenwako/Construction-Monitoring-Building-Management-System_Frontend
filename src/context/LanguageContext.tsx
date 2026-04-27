/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Translation context for multi-language support
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import en from "@/locales/en.json";
import am from "@/locales/am.json";

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  am: am as Record<string, string>,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("insa-buildms-language");
    if (stored === "am" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("insa-buildms-language", language);
      // Update HTML lang attribute for accessibility
      document.documentElement.lang = language === "am" ? "am" : "en";
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, args?: Record<string, string | number>): string => {
    let str = translations[language][key] || key;
    if (args) {
      Object.entries(args).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
