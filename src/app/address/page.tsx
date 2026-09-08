"use client";

import {
  useAddresses,
  useAuth,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import LanguageSwitch from "@/components/LanguageSwitch";
import {
  ArrowLeft,
  Check,
  Home,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type AddressForm = {
  address: string;
  postal_code: string;
  city: string;
  default: boolean;
};

const emptyForm: AddressForm = {
  address: "",
  postal_code: "",
  city: "",
  default: false,
};

export default function AddressPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data: addresses,
    isLoading,
    error,
    refetch,
  } = useAddresses(isAuthenticated);
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const updateAddress = useUpdateAddress();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const updateField = <K extends keyof AddressForm>(
    field: K,
    value: AddressForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const payload = {
      address: form.address.trim(),
      postal_code: form.postal_code.trim(),
      city: form.city.trim(),
      default: addresses?.length ? form.default : true,
    };

    if (!payload.address || !payload.postal_code || !payload.city) {
      setFormError("Complete the street address, postal code, and city.");
      return;
    }

    createAddress.mutate(payload, {
      onSuccess: () => {
        setForm(emptyForm);
        setShowForm(false);
        setSuccessMessage("Address saved successfully.");
      },
      onError: (mutationError) => {
        setFormError(
          extractAuthError(
            mutationError,
            "We could not save this address. Check the details and try again.",
          ),
        );
      },
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setFormError("");
    setSuccessMessage("");
    deleteAddress.mutate(id, {
      onSuccess: () => {
        setDeletingId(null);
        setSuccessMessage("Address removed.");
      },
      onError: (mutationError) => {
        setDeletingId(null);
        setFormError(
          extractAuthError(
            mutationError,
            "This address could not be removed. Keep at least one delivery address.",
          ),
        );
      },
    });
  };

  const makeDefault = (id: number) => {
    setFormError("");
    updateAddress.mutate({ id, data: { default: true } }, {
      onSuccess: () => setSuccessMessage("Default delivery address updated."),
      onError: e => setFormError(extractAuthError(e, "The default address could not be updated.")),
    });
  };

  if (authLoading) {
    return <AddressLoading label="Checking your account…" />;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#fbfaf8] px-5 py-12 text-[#211d1b]">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
          <section className="w-full rounded-[28px] border border-[#eadfd9] bg-white p-8 text-center shadow-[0_24px_70px_rgba(62,39,30,0.08)] sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83f28]">
              <MapPin size={28} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your saved addresses</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#756a65]">
              Sign in to securely save delivery addresses and use them at checkout.
            </p>
            <Link
              href="/signin?next=/address"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#c83f28] px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ac321f] hover:shadow-lg"
            >
              Sign in to continue
            </Link>
            <Link
              href="/partners"
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#ded4cf] px-6 font-semibold transition hover:bg-[#faf7f5]"
            >
              Browse restaurants
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#211d1b]">
      <header className="border-b border-[#eee4df] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/partners"
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[#625852] transition hover:bg-[#f7f1ee] hover:text-[#c83f28]"
          >
            <ArrowLeft size={18} />
            Restaurants
          </Link>
          <Link href="/" className="text-xl font-black tracking-tight">
            <span className="text-[#c83f28]">FOOD</span>DELY
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="hidden rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[#f7f1ee] sm:block">
              Profile
            </Link>
            <LanguageSwitch theme="light" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff0eb] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#b43824]">
              <ShieldCheck size={15} />
              Secure address book
            </div>
            <h1 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Delivery addresses
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#756a65] sm:text-base">
              Save the places you order to most. Your default address is selected
              automatically when you browse restaurants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setFormError("");
              setSuccessMessage("");
              setForm((current) => ({
                ...current,
                default: !addresses?.length,
              }));
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c83f28] px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ac321f] hover:shadow-lg"
          >
            <Plus size={19} />
            Add new address
          </button>
        </div>

        {(formError || successMessage) && (
          <div
            role="status"
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              formError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {formError || successMessage}
          </div>
        )}

        {showForm && (
          <section className="mt-7 rounded-[24px] border border-[#eadfd9] bg-white p-5 shadow-[0_18px_50px_rgba(62,39,30,0.07)] sm:p-7">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Add a delivery address</h2>
                <p className="mt-1 text-sm text-[#7b706b]">
                  Use the complete street name and building number.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close address form"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
                className="rounded-lg p-2 text-[#786d67] transition hover:bg-[#f7f1ee]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-[1.6fr_0.6fr_1fr]">
                <AddressField
                  label="Street and number"
                  value={form.address}
                  placeholder="24 Avenue du Lac"
                  autoComplete="street-address"
                  onChange={(value) => updateField("address", value)}
                />
                <AddressField
                  label="Postal code"
                  value={form.postal_code}
                  placeholder="1007"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  onChange={(value) =>
                    updateField("postal_code", value.replace(/[^\dA-Za-z -]/g, ""))
                  }
                />
                <AddressField
                  label="City"
                  value={form.city}
                  placeholder="Lausanne"
                  autoComplete="address-level2"
                  onChange={(value) => updateField("city", value)}
                />
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#eee6e2] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#4f4743]">
                  <input
                    type="checkbox"
                    checked={!addresses?.length || form.default}
                    disabled={!addresses?.length}
                    onChange={(event) => updateField("default", event.target.checked)}
                    className="h-4 w-4 accent-[#c83f28]"
                  />
                  Use as my default delivery address
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="min-h-11 rounded-xl border border-[#ded4cf] px-5 font-semibold transition hover:bg-[#faf7f5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAddress.isPending}
                    className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#c83f28] px-5 font-semibold text-white transition hover:bg-[#ac321f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createAddress.isPending && (
                      <LoaderCircle className="animate-spin" size={18} />
                    )}
                    {createAddress.isPending ? "Saving…" : "Save address"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-[22px] bg-[#eee8e4]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-100 bg-white p-8 text-center">
              <p className="font-semibold text-red-700">
                We could not load your saved addresses.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 rounded-xl bg-[#211d1b] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : addresses?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={`group relative overflow-hidden rounded-[22px] border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(62,39,30,0.08)] ${
                    address.default
                      ? "border-[#e8a899] ring-1 ring-[#f7d3ca]"
                      : "border-[#eadfd9]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        address.default
                          ? "bg-[#c83f28] text-white"
                          : "bg-[#f7f1ee] text-[#5f5550]"
                      }`}
                    >
                      <Home size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">
                          {address.default ? "Default address" : "Saved address"}
                        </h2>
                        {address.default && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0eb] px-2 py-1 text-[11px] font-bold text-[#b43824]">
                            <Check size={12} />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-3 break-words font-medium text-[#332d2a]">
                        {address.address}
                      </p>
                      <p className="mt-1 text-sm text-[#7a6f69]">
                        {address.postal_code} {address.city}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-between border-t border-[#f0e9e5] pt-4">
                    {!address.default ? <button type="button" disabled={updateAddress.isPending} onClick={()=>makeDefault(address.id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b43824] transition hover:bg-[#fff0eb]">Set as default</button> : <span />}
                    <button
                      type="button"
                      disabled={deleteAddress.isPending || addresses.length === 1}
                      onClick={() => handleDelete(address.id)}
                      title={
                        addresses.length === 1
                          ? "Add another address before removing this one"
                          : "Remove address"
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#756a65] transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === address.id ? (
                        <LoaderCircle className="animate-spin" size={17} />
                      ) : (
                        <Trash2 size={17} />
                      )}
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-[#d9cac3] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83f28]">
                <MapPin size={27} />
              </div>
              <h2 className="mt-5 text-xl font-bold">No saved addresses yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756a65]">
                Add your first delivery address to make restaurant browsing and
                checkout faster.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...emptyForm, default: true });
                  setShowForm(true);
                }}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c83f28] px-5 font-semibold text-white"
              >
                <Plus size={18} />
                Add an address
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AddressField({
  label,
  value,
  placeholder,
  autoComplete,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: "text" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#4f4743]">
        {label}
      </span>
      <input
        required
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-[#dcd1cc] bg-white px-4 text-[#211d1b] outline-none transition placeholder:text-[#aaa09b] focus:border-[#c83f28] focus:ring-4 focus:ring-[#c83f28]/10"
      />
    </label>
  );
}

function AddressLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf8]">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#6e635e]">
        <LoaderCircle className="animate-spin text-[#c83f28]" size={22} />
        {label}
      </div>
    </main>
  );
}
