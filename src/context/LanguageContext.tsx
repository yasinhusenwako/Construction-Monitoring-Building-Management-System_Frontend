"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Flat JSON message store
const messageCache: Record<Language, Record<string, string>> = {
  en: {},
  am: {},
};

function resolve(messages: Record<string, string>, key: string, args?: Record<string, string | number>): string {
  const val = messages[key];
  if (!val) return key;
  if (!args) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => String(args[k] ?? `{${k}}`));
}

async function loadMessages(lang: Language): Promise<Record<string, string>> {
  if (Object.keys(messageCache[lang]).length > 0) return messageCache[lang];
  const mod = await import(`../locales/${lang}.json`);
  messageCache[lang] = mod.default as Record<string, string>;
  return messageCache[lang];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("en");
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = (localStorage.getItem("locale") as Language) || "en";
    const lang: Language = stored === "am" ? "am" : "en";
    setLang(lang);
    loadMessages(lang).then(setMessages);
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem("locale", lang);
    loadMessages(lang).then(setMessages);
  };

  const t = (key: string, args?: Record<string, string | number>): string => {
    return resolve(messages, key, args);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
