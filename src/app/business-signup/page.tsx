"use client";

import { AuthField, AuthShell, FormMessage, PasswordField, PhoneField, preventImplicitFormSubmit, SubmitButton } from "@/components/auth/AuthUI";
import { useAddressAutocomplete, useRegisterRestaurant } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import { isValidPhoneNumber } from "libphonenumber-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, LoaderCircle, MapPin } from "lucide-react";

const initialForm = {
  businessName: "",
  ownerFirstName: "",
  ownerLastName: "",
  email: "",
  phone: "",
  address: "",
  addressPlaceId: "",
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
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const router = useRouter();
  const registerMutation = useRegisterRestaurant();
  const addressQuery = useAddressAutocomplete(formData.address);

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
      ...(event.target.name === "address" ? { addressPlaceId: "" } : {}),
    }));
    if (event.target.name === "address") setAddressSuggestionsOpen(true);
  };

  return (
    <AuthShell
      wide
      compactDesktop
      eyebrow="Restaurant partner"
      title="Create your FoodDely partner account"
      description="Add your restaurant and owner details to begin the FoodDely approval process."
      sideTitle="Put your restaurant in front of hungry local customers."
      sideCopy="Manage your menu, orders, promotions, and customer feedback from one focused workspace."
    >
      <form
        className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-4 lg:space-y-0"
        onKeyDown={preventImplicitFormSubmit}
        onSubmit={(event) => {
          event.preventDefault();
          if (registerMutation.isPending) return;
          setError(null);
          setSuccess(null);

          if (!/^\d+$/.test(formData.zipCode)) {
            setError("Postal code must contain numbers only.");
            return;
          }
          if (!formData.addressPlaceId) {
            setError("Select the restaurant address from the suggestions.");
            setAddressSuggestionsOpen(true);
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
          if (!isValidPhoneNumber(normalizedPhone)) {
            setError("Enter a valid phone number for the selected country.");
            return;
          }

          registerMutation.mutate(
            {
              name: formData.businessName.trim(),
              firstname: formData.ownerFirstName.trim(),
              lastname: formData.ownerLastName.trim(),
              address: formData.address.trim(),
              address_place_id: formData.addressPlaceId,
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
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400 lg:sr-only">Restaurant and owner details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Restaurant name" id="businessName" name="businessName" autoComplete="organization" value={formData.businessName} onChange={update} placeholder="Your restaurant name" required className="sm:col-span-2" />
            <AuthField label="First name" id="ownerFirstName" name="ownerFirstName" autoComplete="given-name" value={formData.ownerFirstName} onChange={update} placeholder="First name" required />
            <AuthField label="Last name" id="ownerLastName" name="ownerLastName" autoComplete="family-name" value={formData.ownerLastName} onChange={update} placeholder="Last name" required />
            <AuthField label="Business email" id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={update} placeholder="restaurant@example.com" required className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <PhoneField
                label="Business phone"
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
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-400 lg:sr-only">Business address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <label htmlFor="address" className="mb-2 block text-sm font-semibold text-stone-800">Street address</label>
              <div className="flex h-12 items-center rounded-xl border border-stone-200 bg-white px-4 shadow-sm transition focus-within:border-[#c83b2b] focus-within:ring-4 focus-within:ring-[#c83b2b]/10">
                <MapPin size={18} className="mr-2 shrink-0 text-[#c83b2b]" aria-hidden="true" />
                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={update}
                  onFocus={() => setAddressSuggestionsOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setAddressSuggestionsOpen(false);
                  }}
                  placeholder="Start typing the restaurant address"
                  autoComplete="street-address"
                  required
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-stone-400"
                />
                {addressQuery.isFetching && <LoaderCircle size={17} className="animate-spin text-[#c83b2b]" aria-label="Loading address suggestions" />}
              </div>
              {addressSuggestionsOpen && formData.address.trim().length >= 3 && (
                <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">
                  {(addressQuery.data ?? []).length > 0 ? (addressQuery.data ?? []).map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => {
                        setFormData((current) => ({
                          ...current,
                          address: suggestion.description,
                          addressPlaceId: suggestion.place_id,
                        }));
                        setAddressSuggestionsOpen(false);
                        setError(null);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[#fff1ed]"
                    >
                      <MapPin size={17} className="mt-0.5 shrink-0 text-[#c83b2b]" aria-hidden="true" />
                      <span className="flex-1 leading-5">{suggestion.description}</span>
                      {formData.addressPlaceId === suggestion.place_id && <Check size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />}
                    </button>
                  )) : !addressQuery.isFetching ? (
                    <p className="px-3 py-4 text-sm text-stone-500">No matching addresses found.</p>
                  ) : null}
                </div>
              )}
            </div>
            <AuthField label="Postal code" id="zipCode" name="zipCode" autoComplete="postal-code" inputMode="numeric" value={formData.zipCode} onChange={update} placeholder="1201" required />
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
            I agree to the <Link href="/terms" className="font-semibold text-[#b93425]">Partner Terms</Link> and{" "}
            <Link href="/privacy" className="font-semibold text-[#b93425]">Privacy Policy</Link>.
          </span>
        </label>

        {error ? <div className="lg:col-span-2"><FormMessage>{error}</FormMessage></div> : null}
        {success ? <div className="lg:col-span-2"><FormMessage kind="success">{success}</FormMessage></div> : null}
        <div>
          <SubmitButton pending={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating partner account…" : "Create partner account"}
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600 lg:mt-4">
        Already registered? <Link href="/signin" className="font-bold text-[#b93425]">Sign in</Link>
      </p>
    </AuthShell>
  );
}
