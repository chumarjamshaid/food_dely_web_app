"use client";

import { AuthField, AuthShell, FormMessage, PasswordField, PhoneField, SubmitButton } from "@/components/auth/AuthUI";
import { useRegisterRestaurant } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const initialForm = {
  businessName: "",
  ownerFirstName: "",
  ownerLastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zipCode: "",
  password: "",
  confirmPassword: "",
};

export default function BusinessSignUp() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+41");
  const router = useRouter();
  const registerMutation = useRegisterRestaurant();

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <AuthShell
      wide
      eyebrow="Restaurant partner"
      title="Grow with FoodDely"
      description="Tell us about your restaurant. We’ll create your partner profile and guide you through approval."
      sideTitle="Put your restaurant in front of hungry local customers."
      sideCopy="Manage your menu, orders, promotions, and customer feedback from one focused workspace."
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          if (!/^\d+$/.test(formData.zipCode)) {
            setError("Postal code must contain numbers only.");
            return;
          }
          if (formData.password.length < 8) {
            setError("Use at least 8 characters for your password.");
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError("The passwords do not match.");
            return;
          }
          const normalizedPhone = `${countryCode}${formData.phone.replace(/^0+/, "")}`;
          if (formData.phone.replace(/^0+/, "").length < 7 || normalizedPhone.replace(/\D/g, "").length > 15) {
            setError("Enter a valid phone number with 7 to 15 total digits.");
            return;
          }

          registerMutation.mutate(
            {
              name: formData.businessName.trim(),
              firstname: formData.ownerFirstName.trim(),
              lastname: formData.ownerLastName.trim(),
              address: formData.address.trim(),
              city: formData.city.trim(),
              postal_code: formData.zipCode.trim(),
              email: formData.email.trim(),
              phone: normalizedPhone,
              password: formData.password,
              password_confirm: formData.confirmPassword,
            },
            {
              onSuccess: () => {
                setSuccess("Partner account created. Taking you to sign in…");
                sessionStorage.setItem(
                  "auth_success_message",
                  "Your partner account was created. You can sign in after it has been approved.",
                );
                setTimeout(() => router.push("/signin"), 800);
              },
              onError: (requestError: unknown) => {
                setError(extractAuthError(requestError, "We could not create the partner account. Please try again."));
              },
            }
          );
        }}
      >
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400">Restaurant</h2>
          <AuthField label="Restaurant name" id="businessName" name="businessName" autoComplete="organization" value={formData.businessName} onChange={update} placeholder="Your restaurant name" required />
        </section>

        <section className="border-t border-stone-100 pt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400">Account owner</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="First name" id="ownerFirstName" name="ownerFirstName" autoComplete="given-name" value={formData.ownerFirstName} onChange={update} placeholder="First name" required />
            <AuthField label="Last name" id="ownerLastName" name="ownerLastName" autoComplete="family-name" value={formData.ownerLastName} onChange={update} placeholder="Last name" required />
            <AuthField label="Business email" id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={update} placeholder="restaurant@example.com" required />
            <PhoneField
              label="Business phone"
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              value={formData.phone}
              onValueChange={(phone) => setFormData((current) => ({ ...current, phone }))}
            />
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400">Business address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Street address" id="address" name="address" autoComplete="street-address" value={formData.address} onChange={update} placeholder="Street and number" required className="sm:col-span-2" />
            <AuthField label="Postal code" id="zipCode" name="zipCode" autoComplete="postal-code" inputMode="numeric" value={formData.zipCode} onChange={update} placeholder="1201" required />
            <AuthField label="City" id="city" name="city" autoComplete="address-level2" value={formData.city} onChange={update} placeholder="Geneva" required />
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400">Security</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField label="Password" id="password" name="password" autoComplete="new-password" value={formData.password} onChange={update} placeholder="At least 8 characters" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} required />
            <PasswordField label="Confirm password" id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={update} placeholder="Repeat your password" visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} required />
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-stone-600">
          <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 accent-[#c83b2b]" />
          <span>
            I agree to the <Link href="/terms" className="font-semibold text-[#b93425]">Partner Terms</Link> and{" "}
            <Link href="/privacy" className="font-semibold text-[#b93425]">Privacy Policy</Link>.
          </span>
        </label>

        {error ? <FormMessage>{error}</FormMessage> : null}
        {success ? <FormMessage kind="success">{success}</FormMessage> : null}
        <SubmitButton pending={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating partner account…" : "Create partner account"}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Already registered? <Link href="/signin" className="font-bold text-[#b93425]">Sign in</Link>
      </p>
    </AuthShell>
  );
}
