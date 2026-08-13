"use client";

import { useLanguage, type Language } from "./LanguageProvider";

export default function LanguageSwitch({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const { language, setLanguage } = useLanguage();
  const isLight = theme === "light";
  return (
    <div
      role="group"
      aria-label={language === "en" ? "Choose language" : "Choisir la langue"}
      className={`flex items-center rounded-full p-0.5 text-[11px] font-bold backdrop-blur sm:p-1 sm:text-xs ${
        isLight
          ? "border border-stone-200 bg-white/95 shadow-lg shadow-stone-900/10"
          : "border border-white/20 bg-black/15"
      }`}
    >
      {(["en", "fr"] as Language[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          aria-pressed={language === option}
          className={`rounded-full px-2 py-1.5 transition sm:px-3 ${
            language === option
              ? isLight
                ? "bg-[#c83b2b] text-white shadow-sm"
                : "bg-white text-stone-950 shadow-sm"
              : isLight
                ? "text-stone-500 hover:bg-stone-100 hover:text-stone-950"
                : "text-stone-300 hover:text-white"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
