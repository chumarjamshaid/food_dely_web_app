"use client";

import { authSelectClass, AuthField, AuthShell, FormMessage, PasswordField, PhoneField, SubmitButton } from "@/components/auth/AuthUI";
import { useRegisterCustomer } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
  password: "",
  confirmPassword: "",
};

export default function SignUp() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [countryCode, setCountryCode] = useState("+41");
  const router = useRouter();
  const registerMutation = useRegisterCustomer();

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <AuthShell
      wide
      compactDesktop
      eyebrow="Customer account"
      title="Create your FoodDely account"
      description="A few details now means faster checkout and easier order tracking later."
    >
      <form
        className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-4 lg:space-y-0"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);

          if (formData.password.length < 8) {
            setError("Use at least 8 characters for your password.");
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError("The passwords do not match.");
            return;
          }
          if (!birthDay || !birthMonth || !birthYear) {
            setError("Select your complete date of birth.");
            return;
          }
          const birthday = `${birthYear}-${birthMonth}-${birthDay}`;
          const parsedBirthday = new Date(`${birthday}T00:00:00Z`);
          if (
            Number.isNaN(parsedBirthday.getTime()) ||
            parsedBirthday.getUTCFullYear() !== Number(birthYear) ||
            parsedBirthday.getUTCMonth() + 1 !== Number(birthMonth) ||
            parsedBirthday.getUTCDate() !== Number(birthDay) ||
            parsedBirthday > new Date()
          ) {
            setError("Select a valid date of birth.");
            return;
          }
          const normalizedPhone = `${countryCode}${formData.phone.replace(/^0+/, "")}`;
          if (formData.phone.replace(/^0+/, "").length < 7 || normalizedPhone.replace(/\D/g, "").length > 15) {
            setError("Enter a valid phone number with 7 to 15 total digits.");
            return;
          }

          registerMutation.mutate(
            {
              firstname: formData.firstName.trim(),
              lastname: formData.lastName.trim(),
              birthday,
              address: formData.address.trim(),
              postal_code: formData.postalCode.trim(),
              city: formData.city.trim(),
              email: formData.email.trim(),
              phone: normalizedPhone,
              password: formData.password,
              password_confirm: formData.confirmPassword,
            },
            {
              onSuccess: () => {
                sessionStorage.setItem("auth_success_message", "Your account was created successfully. Sign in to continue.");
                router.push("/signin");
              },
              onError: (requestError: unknown) => {
                setError(extractAuthError(requestError, "We could not create your account. Check your details and try again."));
              },
            }
          );
        }}
      >
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400 lg:sr-only">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="First name" id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={update} placeholder="First name" required />
            <AuthField label="Last name" id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={update} placeholder="Last name" required />
            <AuthField label="Email address" id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={update} placeholder="you@example.com" required />
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-stone-800">Date of birth</legend>
              <div className="grid grid-cols-[0.8fr_1.35fr_1fr] gap-2">
                <label>
                  <span className="sr-only">Birth day</span>
                  <select
                    value={birthDay}
                    onChange={(event) => setBirthDay(event.target.value)}
                    className={`${authSelectClass} px-3 pr-8`}
                    autoComplete="bday-day"
                    required
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")).map((day) => (
                      <option key={day} value={day}>{Number(day)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Birth month</span>
                  <select
                    value={birthMonth}
                    onChange={(event) => setBirthMonth(event.target.value)}
                    className={`${authSelectClass} px-3 pr-8`}
                    autoComplete="bday-month"
                    required
                  >
                    <option value="">Month</option>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December",
                    ].map((month, index) => (
                      <option key={month} value={String(index + 1).padStart(2, "0")}>{month}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Birth year</span>
                  <select
                    value={birthYear}
                    onChange={(event) => setBirthYear(event.target.value)}
                    className={`${authSelectClass} px-3 pr-8`}
                    autoComplete="bday-year"
                    required
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 110 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-400 lg:hidden">Choose each part separately for faster selection on mobile.</p>
            </fieldset>
            <div className="sm:col-span-2">
              <PhoneField
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                value={formData.phone}
                onValueChange={(phone) => setFormData((current) => ({ ...current, phone }))}
                compactDesktop
              />
            </div>
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6 lg:col-span-2 lg:border-0 lg:pt-0">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400 lg:sr-only">Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Street address" id="address" name="address" autoComplete="street-address" value={formData.address} onChange={update} placeholder="Street and number" required className="sm:col-span-2" />
            <AuthField label="Postal code" id="postalCode" name="postalCode" autoComplete="postal-code" inputMode="numeric" value={formData.postalCode} onChange={update} placeholder="1201" required />
            <AuthField label="City" id="city" name="city" autoComplete="address-level2" value={formData.city} onChange={update} placeholder="Geneva" required />
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6 lg:col-span-2 lg:border-0 lg:pt-0">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400 lg:sr-only">Account security</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField label="Password" id="password" name="password" autoComplete="new-password" value={formData.password} onChange={update} placeholder="At least 8 characters" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} required />
            <PasswordField label="Confirm password" id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={update} placeholder="Repeat your password" visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} required />
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-stone-600 lg:self-center">
          <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 accent-[#c83b2b]" />
          <span>
            I agree to the <Link href="/terms" className="font-semibold text-[#b93425]">Terms</Link> and{" "}
            <Link href="/privacy" className="font-semibold text-[#b93425]">Privacy Policy</Link>.
          </span>
        </label>

        {error ? <div className="lg:col-span-2"><FormMessage>{error}</FormMessage></div> : null}
        <div>
          <SubmitButton pending={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating account…" : "Create customer account"}
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600 lg:mt-4">
        Already have an account? <Link href="/signin" className="font-bold text-[#b93425]">Sign in</Link>
      </p>
    </AuthShell>
  );
}
