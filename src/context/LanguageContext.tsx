/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Translation context for multi-language support with next-intl
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const currentLocale = useLocale() as Language;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    if (!mounted) return;
    
    // Get the current path without locale
    const pathWithoutLocale = pathname.replace(/^\/(en|am)/, '');
    
    // Navigate to the same path with new locale
    router.push(`/${lang}${pathWithoutLocale || '/'}`);
  };

  // Dummy t function for backward compatibility
  // Components should use useTranslations from next-intl instead
  const t = (key: string, args?: Record<string, string | number>): string => {
    console.warn('Using legacy t() function. Please migrate to useTranslations from next-intl');
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language: currentLocale, setLanguage, t }}>
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
