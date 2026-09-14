"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useCreateRestaurantClosing,
  useAddressAutocomplete,
  useDeleteRestaurantClosing,
  useDeleteRestaurantImage,
  useRestaurantClosings,
  useRestaurantOwnerProfile,
  useSetRestaurantManualClosed,
  useToggleRestaurantClosing,
  useUpdateRestaurantDelivery,
  useUpdateRestaurantOpenings,
  useUpdateRestaurantSettings,
  useUploadRestaurantImage,
  type RestaurantOpeningShift,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { extractApiError } from "@/lib/api/error";
import type { RestaurantOwnerProfile } from "@/lib/api/types";
import { Check, LoaderCircle, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

type TabId = "details" | "delivery" | "openings" | "availability" | "images";

// Backend stores times as HH:MM:SS; <input type="time"> uses HH:MM.
function trimSeconds(t: string) {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}
function addSeconds(t: string) {
  return t?.length === 5 ? `${t}:00` : t;
}

export default function RestaurantSettingsPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner label="Loading settings…" fullScreen />}
    >
      <RestaurantSettingsContent />
    </Suspense>
  );
}

function RestaurantSettingsContent() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const tokenPresent = typeof window !== "undefined" ? hasAuthToken() : false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasAuthToken()) {
      router.replace("/signin");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const ownerQuery = useRestaurantOwnerProfile(tokenPresent);
  useEffect(() => {
    const err = ownerQuery.error as { response?: { status?: number } } | null;
    if (err?.response?.status === 404) router.replace("/");
  }, [ownerQuery.error, router]);

  const restaurant = ownerQuery.data;
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabId =
    tabParam === "delivery" ||
    tabParam === "openings" ||
    tabParam === "availability" ||
    tabParam === "images" ||
    tabParam === "details"
      ? tabParam
      : "details";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      if (
        tabParam === "delivery" ||
        tabParam === "openings" ||
        tabParam === "availability" ||
        tabParam === "images" ||
        tabParam === "details"
      ) {
        setActiveTab(tabParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  if (!authChecked || ownerQuery.isLoading || !restaurant) {
    return <LoadingSpinner label="Loading restaurant settings…" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Restaurant" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Restaurant profile</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Restaurant settings</h1>
          <p className="mt-1 text-base text-stone-600">
            Manage your restaurant details, delivery, and opening hours
          </p>
        </div>

        {/* Tabs (Menu Management removed) */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
          {[
            { id: "details", label: "Restaurant Details" },
            { id: "delivery", label: "Delivery Settings" },
            { id: "openings", label: "Opening Hours" },
            { id: "availability", label: "Closures" },
            { id: "images", label: "Images" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeTab === tab.id
                  ? "bg-[#c83b2b] text-white shadow-sm"
                  : "text-stone-600 hover:bg-[#f7f3ed]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(45,32,24,0.06)] sm:p-8">
          {activeTab === "details" && <DetailsTab restaurant={restaurant} />}
          {activeTab === "delivery" && <DeliveryTab restaurant={restaurant} />}
          {activeTab === "openings" && <OpeningsTab restaurant={restaurant} />}
          {activeTab === "availability" && <AvailabilityTab restaurant={restaurant} />}
          {activeTab === "images" && <ImagesTab restaurant={restaurant} />}
        </div>
      </main>
    </div>
  );
}

// ===== Details Tab =====
function DetailsTab({ restaurant }: { restaurant: RestaurantOwnerProfile }) {
  const mutation = useUpdateRestaurantSettings();
  const [form, setForm] = useState({
    name: restaurant.name ?? "",
    description: restaurant.description ?? "",
    phone: restaurant.phone ?? "",
    website: restaurant.website ?? "",
    address: restaurant.address ?? "",
    postal_code: restaurant.postal_code ?? "",
    city: restaurant.city ?? "",
    address_place_id: "",
    meat_origin: restaurant.meat_origin ?? "",
    fish_origin: restaurant.fish_origin ?? "",
  });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const addressQuery = useAddressAutocomplete(form.address);

  const setField = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (form.description.length > 200) {
      setError("Description must be 200 characters or fewer.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      address: form.address.trim(),
      postal_code: form.postal_code.trim(),
      city: form.city.trim(),
      ...(form.address_place_id ? { address_place_id: form.address_place_id } : {}),
      meat_origin: form.meat_origin.trim(),
      fish_origin: form.fish_origin.trim(),
    };
    mutation.mutate(payload, {
      onSuccess: () => setSuccess(true),
      onError: (err: unknown) => setError(extractApiError(err, "Failed to save settings.")),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-black mb-6">
        Restaurant Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Restaurant Name *"
          required
          value={form.name}
          onChange={(v) => setField("name", v)}
          placeholder="Chez Maria"
        />
        <Field
          label="Phone *"
          type="tel"
          required
          value={form.phone}
          onChange={(v) => setField("phone", v)}
          placeholder="+41 44 123 45 67"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={restaurant.owner_email ?? ""}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Contact support to change your account email.
          </p>
        </div>
        <Field
          label="Website *"
          type="url"
          required
          value={form.website}
          onChange={(v) => setField("website", v)}
          placeholder="https://example-restaurant.ch"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Brasserie restaurant in the city centre..."
            rows={3}
            maxLength={200}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/200</p>
        </div>
        <div className="md:col-span-2">
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address *
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 px-4 focus-within:ring-2 focus-within:ring-[#CD3625]">
              <MapPin size={17} className="mr-2 shrink-0 text-[#CD3625]" />
              <input
                required
                value={form.address}
                onChange={(event) => {
                  setField("address", event.target.value);
                  setField("address_place_id", "");
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSuggestionsOpen(false);
                }}
                placeholder="Bahnhofstrasse 10, 8001 Zurich"
                autoComplete="street-address"
                className="h-12 min-w-0 flex-1 outline-none"
              />
              {addressQuery.isLoading && <LoaderCircle size={17} className="animate-spin text-[#CD3625]" />}
            </div>
            {suggestionsOpen && form.address.trim().length >= 3 && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">
                {(addressQuery.data ?? []).length > 0 ? (addressQuery.data ?? []).map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        address: suggestion.description,
                        address_place_id: suggestion.place_id,
                      }));
                      setSuggestionsOpen(false);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[#fff1ed]"
                  >
                    <MapPin size={17} className="mt-0.5 shrink-0 text-[#c83b2b]" />
                    <span className="flex-1 leading-5">{suggestion.description}</span>
                    {form.address_place_id === suggestion.place_id && <Check size={16} className="mt-0.5 text-emerald-600" />}
                  </button>
                )) : !addressQuery.isLoading ? (
                  <p className="px-3 py-4 text-sm text-stone-500">No matching addresses found.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <Field
          label="City *"
          required
          value={form.city}
          onChange={(v) => setField("city", v)}
          placeholder="Zurich"
        />
        <Field
          label="Postal Code *"
          required
          value={form.postal_code}
          onChange={(v) => setField("postal_code", v)}
          placeholder="8001"
        />
        <Field
          label="Meat origin"
          value={form.meat_origin}
          onChange={(v) => setField("meat_origin", v)}
          placeholder="Switzerland, France"
        />
        <Field
          label="Fish origin"
          value={form.fish_origin}
          onChange={(v) => setField("fish_origin", v)}
          placeholder="Norway, Switzerland"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-2 rounded-lg text-sm">
          Settings saved.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-[#CD3625] text-white rounded-full px-6 py-3 text-base font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ===== Delivery Tab =====
function DeliveryTab({ restaurant }: { restaurant: RestaurantOwnerProfile }) {
  const mutation = useUpdateRestaurantDelivery();
  const [form, setForm] = useState({
    min_amount: Number(restaurant.min_amount ?? 0),
    delivery_available: Boolean(restaurant.delivery_available),
    delivery_radius: Number(restaurant.delivery_radius ?? 0),
    delivery_fee: Number(restaurant.delivery_fee ?? 0),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    mutation.mutate(form, {
      onSuccess: () => setSuccess(true),
      onError: (err: unknown) => {
        const e = err as {
          response?: { data?: { message?: string; error?: string; detail?: string } };
        };
        setError(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to save delivery settings."
        );
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-black mb-6">
        Delivery Settings
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumberField
          label="Minimum order amount (CHF)"
          step="0.5"
          placeholder="25.00"
          value={form.min_amount}
          onChange={(v) => setForm((p) => ({ ...p, min_amount: v }))}
        />
        <NumberField
          label="Delivery radius (km)"
          step="1"
          placeholder="5"
          value={form.delivery_radius}
          onChange={(v) => setForm((p) => ({ ...p, delivery_radius: v }))}
        />
        <NumberField
          label="Delivery fee (CHF)"
          step="0.5"
          placeholder="4.50"
          value={form.delivery_fee}
          onChange={(v) => setForm((p) => ({ ...p, delivery_fee: v }))}
        />
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Delivery available"
          description="Offer delivery to customers within your radius"
          checked={form.delivery_available}
          onChange={(v) => setForm((p) => ({ ...p, delivery_available: v }))}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-2 rounded-lg text-sm">
          Delivery settings saved.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-[#CD3625] text-white rounded-full px-6 py-3 text-base font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ===== Openings Tab =====
function OpeningsTab({ restaurant }: { restaurant: RestaurantOwnerProfile }) {
  const mutation = useUpdateRestaurantOpenings();
  const initialShifts = useMemo<RestaurantOpeningShift[]>(
    () =>
      (restaurant.openings ?? []).map((s) => ({
        day: s.day.toLowerCase(),
        start: trimSeconds(s.start),
        end: trimSeconds(s.end),
      })),
    [restaurant.openings]
  );
  const [shifts, setShifts] = useState<RestaurantOpeningShift[]>(initialShifts);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addShift = (day: string) =>
    setShifts((p) => [...p, { day, start: "09:00", end: "17:00" }]);

  const removeShift = (idx: number) =>
    setShifts((p) => p.filter((_, i) => i !== idx));

  const updateShift = (
    idx: number,
    field: keyof RestaurantOpeningShift,
    value: string
  ) => setShifts((p) => p.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  const setAlwaysOpen = () => {
    setShifts(
      DAYS.map((day) => ({
        day: day.key,
        start: "00:00",
        end: "23:59",
      }))
    );
    setError(null);
    setSuccess(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    for (const s of shifts) {
      if (s.start >= s.end) {
        setError(`Each shift's end time must be after its start time (${s.day}).`);
        return;
      }
    }

    const payload = shifts.map((s) => ({
      day: s.day.toLowerCase(),
      start: addSeconds(s.start),
      end: addSeconds(s.end),
    }));

    mutation.mutate(payload, {
      onSuccess: () => setSuccess(true),
      onError: (err: unknown) => {
        const e = err as {
          response?: { data?: { message?: string; error?: string; detail?: string } };
        };
        setError(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to save openings."
        );
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-semibold text-black">
            Opening Hours
          </h2>
          <p className="text-sm text-gray-600">
            Add one or more shifts per day. Leaving a day empty means closed.
          </p>
        </div>
        <button
          type="button"
          onClick={setAlwaysOpen}
          className="shrink-0 rounded-full border border-[#CD3625]/25 bg-[#fff3ef] px-5 py-2.5 text-sm font-bold text-[#b63825] transition hover:-translate-y-0.5 hover:border-[#CD3625] hover:bg-[#ffe9e2]"
        >
          Set open 24/7
        </button>
      </div>

      <div className="space-y-6">
        {DAYS.map((day) => {
          const dayShifts = shifts
            .map((s, idx) => ({ s, idx }))
            .filter(({ s }) => s.day.toLowerCase() === day.key);

          return (
            <div
              key={day.key}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{day.label}</span>
                <button
                  type="button"
                  onClick={() => addShift(day.key)}
                  className="text-sm text-[#CD3625] font-medium"
                >
                  + Add shift
                </button>
              </div>
              {dayShifts.length === 0 && (
                <p className="text-sm text-gray-400">Closed</p>
              )}
              <div className="space-y-2">
                {dayShifts.map(({ s, idx }) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex"
                  >
                    <input
                      type="time"
                      value={s.start}
                      onChange={(e) =>
                        updateShift(idx, "start", e.target.value)
                      }
                      className="min-w-0 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CD3625] sm:w-auto"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={s.end}
                      onChange={(e) => updateShift(idx, "end", e.target.value)}
                      className="min-w-0 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CD3625] sm:w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => removeShift(idx)}
                      className="col-span-3 justify-self-end text-sm text-red-600 hover:underline sm:col-span-1 sm:ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-2 rounded-lg text-sm">
          Opening hours saved.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-[#CD3625] text-white rounded-full px-6 py-3 text-base font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save openings"}
        </button>
      </div>
    </form>
  );
}

// ===== Availability / planned closures =====
function AvailabilityTab({ restaurant }: { restaurant: RestaurantOwnerProfile }) {
  const closings = useRestaurantClosings(true);
  const manual = useSetRestaurantManualClosed();
  const create = useCreateRestaurantClosing();
  const remove = useDeleteRestaurantClosing();
  const toggle = useToggleRestaurantClosing();
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!startAt || !endAt || startAt >= endAt) {
      setError("Choose an end date and time after the start date and time.");
      return;
    }
    create.mutate(
      { title: title.trim(), start_at: startAt, end_at: endAt, enabled: true },
      {
        onSuccess: () => { setTitle(""); setStartAt(""); setEndAt(""); },
        onError: (requestError) => setError(extractApiError(requestError, "The planned closure could not be created.")),
      },
    );
  };

  const statusLabel = (restaurant.availability_status ?? "inactive").replaceAll("_", " ");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-black">Restaurant availability</h2>
        <p className="mt-1 text-sm text-gray-600">Current status: <span className="font-semibold capitalize">{statusLabel}</span></p>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">Manual closure</p><p className="text-sm text-gray-600">Immediately stop or resume accepting orders. Closing can be blocked while orders are in progress.</p></div>
          <button
            type="button"
            disabled={manual.isPending}
            onClick={() => manual.mutate(!restaurant.manually_closed, { onError: (requestError) => setError(extractApiError(requestError, "Availability could not be changed.")) })}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${restaurant.manually_closed ? "bg-green-600" : "bg-[#CD3625]"}`}
          >
            {restaurant.manually_closed ? "Reopen restaurant" : "Close restaurant"}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold">Plan a closure</h3>
        <p className="mt-1 text-sm text-gray-600">Times use the backend&apos;s Europe/Zurich timezone.</p>
        <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-gray-200 p-4 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">Title<input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="Summer holiday" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          <label className="text-sm font-medium">Starts<input type="datetime-local" required value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          <label className="text-sm font-medium">Ends<input type="datetime-local" required value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
          <button disabled={create.isPending} className="rounded-full bg-[#CD3625] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2 md:justify-self-end">{create.isPending ? "Creating…" : "Add planned closure"}</button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-xl font-semibold">Planned closures</h3>
        {closings.isLoading ? <p className="text-gray-500">Loading closures…</p> : null}
        {!closings.isLoading && (closings.data?.length ?? 0) === 0 ? <p className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">No planned closures.</p> : null}
        <div className="space-y-3">
          {closings.data?.map((closing) => (
            <div key={closing.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">{closing.title || "Planned closure"}</p><p className="text-sm text-gray-600">{closing.start_at} to {closing.end_at}</p>{closing.is_currently_active && <p className="mt-1 text-xs font-semibold text-red-700">Currently active</p>}</div>
              <div className="flex gap-2"><button type="button" onClick={() => toggle.mutate({ id: closing.id, enabled: !closing.enabled })} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">{closing.enabled ? "Disable" : "Enable"}</button><button type="button" onClick={() => remove.mutate(closing.id)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Delete</button></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ===== Small helpers =====
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        required={required}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min={0}
        value={Number.isFinite(value) ? value : 0}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-[#CD3625] focus:ring-[#CD3625]"
      />
    </div>
  );
}

// ===== Images Tab =====
function ImagesTab({ restaurant }: { restaurant: RestaurantOwnerProfile }) {
  const uploadMut = useUploadRestaurantImage();
  const deleteMut = useDeleteRestaurantImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const images = restaurant.images ?? [];

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMut.mutateAsync(file);
    } catch (er) {
      setErr(extractApiError(er, "Upload failed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    setErr("");
    if (!confirm("Delete this image?")) return;
    try {
      await deleteMut.mutateAsync(id);
    } catch (er) {
      setErr(extractApiError(er, "Delete failed"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-black">
            Restaurant images
          </h3>
          <p className="text-sm text-gray-600">
            Showcase your restaurant — these images appear on your storefront.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePick}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
            className="bg-[#CD3625] text-white rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {uploadMut.isPending ? "Uploading…" : "+ Upload image"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
          No images yet. Click “+ Upload image” to add your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group"
            >
              <Image
                src={img.image}
                alt={`Restaurant image ${img.id}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deleteMut.isPending}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
