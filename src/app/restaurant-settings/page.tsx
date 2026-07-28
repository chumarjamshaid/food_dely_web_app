"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useDeleteRestaurantImage,
  useRestaurantOwnerProfile,
  useUpdateRestaurantDelivery,
  useUpdateRestaurantOpenings,
  useUpdateRestaurantSettings,
  useUploadRestaurantImage,
  type RestaurantOpeningShift,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { extractApiError } from "@/lib/api/error";
import type { RestaurantOwnerProfile } from "@/lib/api/types";
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

type TabId = "details" | "delivery" | "openings" | "images";

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
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
          Loading settings...
        </div>
      }
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
        tabParam === "images" ||
        tabParam === "details"
      ) {
        setActiveTab(tabParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  if (!authChecked || ownerQuery.isLoading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading restaurant settings...
      </div>
    );
  }

  return (
    <div className="bg-white h-full w-full">
      <RestaurantManagerHeader active="Restaurant" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[28px] md:text-3xl font-medium text-black">
            Restaurant Settings
          </h1>
          <p className="text-[#424242] text-base">
            Manage your restaurant details, delivery, and opening hours
          </p>
        </div>

        {/* Tabs (Menu Management removed) */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: "details", label: "Restaurant Details" },
            { id: "delivery", label: "Delivery Settings" },
            { id: "openings", label: "Opening Hours" },
            { id: "images", label: "Images" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-6 py-3 rounded-full font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 ${activeTab === tab.id
                  ? "bg-[#CD3625] text-white"
                  : "bg-white text-black border-gray-50 hover:bg-gray-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8">
          {activeTab === "details" && <DetailsTab restaurant={restaurant} />}
          {activeTab === "delivery" && <DeliveryTab restaurant={restaurant} />}
          {activeTab === "openings" && <OpeningsTab restaurant={restaurant} />}
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
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

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
          "Failed to save settings."
        );
      },
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
          value={form.name}
          onChange={(v) => setField("name", v)}
        />
        <Field
          label="Phone *"
          type="tel"
          value={form.phone}
          onChange={(v) => setField("phone", v)}
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
          label="Website"
          type="url"
          value={form.website}
          onChange={(v) => setField("website", v)}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="Address *"
            value={form.address}
            onChange={(v) => setField("address", v)}
          />
        </div>
        <Field
          label="City *"
          value={form.city}
          onChange={(v) => setField("city", v)}
        />
        <Field
          label="Postal Code *"
          value={form.postal_code}
          onChange={(v) => setField("postal_code", v)}
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
    pickup_available: Boolean(restaurant.pickup_available),
    delivery_available: Boolean(restaurant.delivery_available),
    delivery_radius: Number(restaurant.delivery_radius ?? 0),
    delivery_fee: Number(restaurant.delivery_fee ?? 0),
    delivery_time: Number(restaurant.delivery_time ?? 0),
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
          value={form.min_amount}
          onChange={(v) => setForm((p) => ({ ...p, min_amount: v }))}
        />
        <NumberField
          label="Delivery radius (km)"
          step="1"
          value={form.delivery_radius}
          onChange={(v) => setForm((p) => ({ ...p, delivery_radius: v }))}
        />
        <NumberField
          label="Delivery fee (CHF)"
          step="0.5"
          value={form.delivery_fee}
          onChange={(v) => setForm((p) => ({ ...p, delivery_fee: v }))}
        />
        <NumberField
          label="Estimated delivery time (min)"
          step="1"
          value={form.delivery_time}
          onChange={(v) => setForm((p) => ({ ...p, delivery_time: v }))}
        />
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Pickup available"
          description="Allow customers to pick up orders at your restaurant"
          checked={form.pickup_available}
          onChange={(v) => setForm((p) => ({ ...p, pickup_available: v }))}
        />
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
      <div>
        <h2 className="text-2xl font-semibold text-black mb-1">
          Opening Hours
        </h2>
        <p className="text-sm text-gray-600">
          Add one or more shifts per day. Leaving a day empty means closed.
        </p>
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
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={s.start}
                      onChange={(e) =>
                        updateShift(idx, "start", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={s.end}
                      onChange={(e) => updateShift(idx, "end", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
                    />
                    <button
                      type="button"
                      onClick={() => removeShift(idx)}
                      className="ml-2 text-sm text-red-600 hover:underline"
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

// ===== Small helpers =====
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
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
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
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
