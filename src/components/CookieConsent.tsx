"use client";

import { Cookie, Settings2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

const CONSENT_KEY = "fooddely_cookie_consent_v1";

type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  savedAt: string;
};

export default function CookieConsent() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(CONSENT_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (allowAnalytics: boolean) => {
    const choice: ConsentChoice = {
      necessary: true,
      analytics: allowAnalytics,
      savedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
    } catch {
      // The preference still applies for this page view when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent("fooddely-consent-change", { detail: choice }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-4xl rounded-[24px] border border-stone-200 bg-white p-5 text-stone-950 shadow-[0_24px_80px_rgba(36,27,24,0.24)] sm:inset-x-6 sm:bottom-6 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0eb] text-[#c83b2b]">
          <Cookie size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="cookie-consent-title" className="text-lg font-black tracking-[-0.02em]">
                {fr ? "Votre vie privée compte" : "Your privacy matters"}
              </h2>
              <p id="cookie-consent-description" className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
                {fr
                  ? "Nous utilisons le stockage nécessaire au fonctionnement de FoodDely. Avec votre accord, nous pouvons aussi utiliser des données d’analyse pour améliorer l’expérience."
                  : "We use necessary storage to keep FoodDely working. With your permission, we may also use analytics data to improve the experience."}
                {" "}
                <Link href="/privacy" className="font-bold text-[#b63825] underline underline-offset-2 hover:text-[#8f2d20]">
                  {fr ? "Politique de confidentialité" : "Privacy policy"}
                </Link>
              </p>
            </div>
            <button type="button" onClick={() => saveConsent(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label={fr ? "Refuser les cookies facultatifs" : "Reject optional cookies"}>
              <X size={18} />
            </button>
          </div>

          {showPreferences && (
            <div className="mt-4 grid gap-2 rounded-2xl bg-[#f8f5f2] p-3 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
                <span><strong>{fr ? "Nécessaires" : "Necessary"}</strong><span className="ml-2 text-xs text-stone-500">{fr ? "Toujours actifs" : "Always active"}</span></span>
                <span className="h-5 w-9 rounded-full bg-emerald-500 p-0.5" aria-hidden="true"><span className="ml-auto block h-4 w-4 rounded-full bg-white" /></span>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
                <strong>{fr ? "Analyse" : "Analytics"}</strong>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-4 w-4 accent-[#c83b2b]" />
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowPreferences((current) => !current)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-stone-600 transition hover:bg-stone-100">
              <Settings2 size={16} /> {showPreferences ? (fr ? "Masquer" : "Hide preferences") : (fr ? "Préférences" : "Preferences")}
            </button>
            <button type="button" onClick={() => saveConsent(showPreferences ? analytics : false)} className="min-h-10 rounded-xl border border-stone-200 px-4 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
              {showPreferences ? (fr ? "Enregistrer" : "Save preferences") : (fr ? "Refuser les facultatifs" : "Reject optional")}
            </button>
            <button type="button" onClick={() => saveConsent(true)} className="min-h-10 rounded-xl bg-[#c83b2b] px-5 text-sm font-bold text-white transition hover:bg-[#aa3022]">
              {fr ? "Tout accepter" : "Accept all"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
