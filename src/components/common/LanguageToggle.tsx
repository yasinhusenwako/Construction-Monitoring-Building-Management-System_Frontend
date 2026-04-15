"use client";

import { Languages } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "am" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary dark:hover:bg-secondary transition-colors group"
      title={language === "en" ? "Switch to Amharic" : "ወደ እንግሊዝኛ ቀይር"}
    >
      <Languages
        size={16}
        className="text-primary dark:text-primary group-hover:text-primary/80"
      />
      <span className="text-sm font-medium text-foreground group-hover:text-foreground/80">
        {language === "en" ? "EN" : "አማ"}
      </span>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {language === "en" ? "|" : "|"}
      </span>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {language === "en" ? "አማ" : "EN"}
      </span>
    </button>
  );
}
