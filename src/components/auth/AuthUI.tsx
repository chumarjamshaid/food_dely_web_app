"use client";

import { ArrowLeft, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import Link from "next/link";
import { useEffect, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";

export const authInputClass =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-[15px] text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#c83b2b] focus:ring-4 focus:ring-[#c83b2b]/10 disabled:cursor-not-allowed disabled:bg-stone-100";

export const authSelectClass = `${authInputClass} auth-select appearance-none pr-9`;

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  wide = false,
  sideTitle = "Good food starts with a simple hello.",
  sideCopy = "Create an account, save your favorites, and keep every order in one place.",
  compactDesktop = false,
}: Readonly<{
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  wide?: boolean;
  sideTitle?: string;
  sideCopy?: string;
  compactDesktop?: boolean;
}>) {
  return (
    <main className={`min-h-screen bg-[#f7f3ed] text-stone-950 lg:grid ${compactDesktop ? "lg:grid-cols-[minmax(330px,.72fr)_minmax(700px,1.28fr)]" : "lg:grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.1fr)]"}`}>
      <section className="relative hidden min-h-screen overflow-hidden bg-[#171310] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0">
          <div className="auth-orb-one absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#c83b2b]/35 blur-3xl motion-reduce:animate-none" />
          <div className="auth-orb-two absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#f0a35a]/20 blur-3xl motion-reduce:animate-none" />
          <div className="auth-grid absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px] motion-reduce:animate-none" />
          <span className="auth-dot auth-dot-one absolute left-[14%] top-[22%] h-2.5 w-2.5 rounded-full bg-[#ff8a7d] shadow-[0_0_18px_4px_rgba(255,138,125,.35)] motion-reduce:animate-none" />
          <span className="auth-dot auth-dot-two absolute right-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#f7c27f] shadow-[0_0_16px_3px_rgba(247,194,127,.3)] motion-reduce:animate-none" />
          <span className="auth-dot auth-dot-three absolute bottom-[24%] left-[22%] h-2 w-2 rounded-full bg-white/80 shadow-[0_0_14px_3px_rgba(255,255,255,.2)] motion-reduce:animate-none" />
          <span className="auth-dot auth-dot-four absolute bottom-[18%] right-[24%] h-3 w-3 rounded-full border border-[#ff8a7d]/70 motion-reduce:animate-none" />
          <span className="auth-ring absolute right-[9%] top-[38%] h-28 w-28 rounded-full border border-white/10 motion-reduce:animate-none" />
          <span className="auth-ring-delayed absolute bottom-[8%] left-[7%] h-16 w-16 rounded-2xl border border-[#ff8a7d]/15 motion-reduce:animate-none" />
        </div>

        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-stone-300 transition hover:text-white">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to FoodDely
        </Link>

        <div className="auth-copy relative z-10 max-w-lg motion-reduce:animate-none">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.24em] text-[#ef7869]">FoodDely</p>
          <h2 className="max-w-md text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
            {sideTitle}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-stone-300">{sideCopy}</p>
          <div className="mt-10 grid gap-4 text-sm text-stone-200">
            {["Secure account access", "Faster checkout", "Orders and favorites in one place"].map((item) => (
              <div key={item} className="group flex items-center gap-3 transition duration-300 hover:translate-x-1">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#ef7869] transition duration-300 group-hover:bg-[#c83b2b] group-hover:text-white">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-stone-400">
          <ShieldCheck size={18} aria-hidden="true" />
          Your information is protected.
        </div>
      </section>

      <section className={`flex min-h-screen items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-12 ${compactDesktop ? "lg:items-start lg:py-6" : "lg:items-center lg:py-14"}`}>
        <div className="pointer-events-none fixed -right-24 top-1/4 h-64 w-64 rounded-full bg-[#c83b2b]/[0.04] blur-3xl lg:hidden" />
        <div className={`w-full ${wide ? (compactDesktop ? "max-w-4xl" : "max-w-3xl") : "max-w-lg"}`}>
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="font-serif text-2xl font-black tracking-tight">
              <span className="text-[#c83b2b]">FOOD</span>DELY
            </Link>
            <Link href="/" className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-700" aria-label="Back to home">
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
          </div>

          <header className={compactDesktop ? "mb-5" : "mb-7"}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c83b2b]">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-stone-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-stone-600 sm:text-base">{description}</p>
          </header>

          <div className={`rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(38,28,20,0.08)] sm:rounded-3xl ${compactDesktop ? "sm:p-6" : "sm:p-8"}`}>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthField({
  label,
  hint,
  className = "",
  ...props
}: Readonly<InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-stone-800">
        {label}
        {hint ? <span className="font-normal text-stone-400">{hint}</span> : null}
      </span>
      <input {...props} className={authInputClass} />
    </label>
  );
}

export function PhoneField({
  countryCode,
  onCountryCodeChange,
  value,
  onValueChange,
  label = "Phone number",
  compactDesktop = false,
}: Readonly<{
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  compactDesktop?: boolean;
}>) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("CH");
  const [countryNamesReady, setCountryNamesReady] = useState(false);
  useEffect(() => setCountryNamesReady(true), []);
  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return getCountries()
      .map((country) => ({
        country,
        name: displayNames.of(country) || country,
        callingCode: `+${getCountryCallingCode(country)}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const selectedCountryInfo = countries.find((item) => item.country === selectedCountry);
  const maxLocalDigits = 15 - countryCode.replace(/\D/g, "").length;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-stone-800">{label}</legend>
      <div className={`grid gap-3 ${compactDesktop ? "lg:grid-cols-[minmax(300px,1fr)_minmax(260px,1fr)] lg:items-end" : ""}`}>
        <label className="min-w-0">
          <span className={`mb-2 block text-xs font-medium text-stone-500 ${compactDesktop ? "lg:sr-only" : ""}`}>Country or region</span>
          <select
            value={selectedCountry}
            onChange={(event) => {
              const nextCountry = event.target.value as CountryCode;
              const nextCode = `+${getCountryCallingCode(nextCountry)}`;
              const nextLimit = 15 - nextCode.replace(/\D/g, "").length;
              setSelectedCountry(nextCountry);
              onCountryCodeChange(nextCode);
              onValueChange(value.slice(0, nextLimit));
            }}
            className={`${authSelectClass} px-4 pr-10`}
            aria-label="Country code"
          >
            {!countryNamesReady ? <option value="CH">Switzerland (+41)</option> : countries.map((country) => (
              <option key={country.country} value={country.country}>
                {country.name} ({country.callingCode})
              </option>
            ))}
          </select>
          <span className={`mt-2 block text-xs leading-5 text-stone-500 ${compactDesktop ? "lg:hidden" : ""}`}>
            Selected: <strong className="font-semibold text-stone-700">{selectedCountryInfo?.name} ({countryCode})</strong>
          </span>
        </label>
        <label className="min-w-0">
          <span className={`mb-2 block text-xs font-medium text-stone-500 ${compactDesktop ? "lg:sr-only" : ""}`}>Phone number without country code</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]*"
            maxLength={maxLocalDigits}
            value={value}
            onKeyDown={(event) => {
              if (event.ctrlKey || event.metaKey || event.altKey) return;
              const allowedKeys = [
                "Backspace",
                "Delete",
                "Tab",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
              ];
              if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) return;
              event.preventDefault();
            }}
            onChange={(event) => {
              const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, maxLocalDigits);
              onValueChange(digitsOnly);
            }}
            onPaste={(event) => {
              event.preventDefault();
              const digitsOnly = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, maxLocalDigits);
              onValueChange(digitsOnly);
            }}
            placeholder="79 123 45 67"
            className={authInputClass}
            aria-describedby="phone-limit"
            required
          />
        </label>
      </div>
      <p id="phone-limit" className={`mt-2 text-xs leading-5 text-stone-400 ${compactDesktop ? "lg:hidden" : ""}`}>
        Digits only · up to {maxLocalDigits} digits after {countryCode}
      </p>
    </fieldset>
  );
}

export function PasswordField({
  label,
  visible,
  onToggle,
  ...props
}: Readonly<InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  visible: boolean;
  onToggle: () => void;
}>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-800">{label}</span>
      <span className="relative block">
        <input {...props} type={visible ? "text" : "password"} className={`${authInputClass} pr-12`} />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-stone-400 transition hover:text-stone-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export function FormMessage({ children, kind = "error" }: Readonly<{ children: ReactNode; kind?: "error" | "success" }>) {
  const classes =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-5 ${classes}`}>
      {children}
    </div>
  );
}

export function SubmitButton({ children, pending }: Readonly<{ children: ReactNode; pending: boolean }>) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-xl bg-[#c83b2b] px-5 text-[15px] font-bold text-white shadow-[0_10px_25px_rgba(200,59,43,0.22)] transition hover:bg-[#af3023] focus:outline-none focus:ring-4 focus:ring-[#c83b2b]/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function preventImplicitFormSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
  const target = event.target as HTMLElement;
  if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
  event.preventDefault();
}
