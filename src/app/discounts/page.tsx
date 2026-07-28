"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useCreateDiscount,
  useDeleteDiscount,
  useDisableDiscount,
  useDiscounts,
  useEnableDiscount,
  useMenuItems,
  useRestaurantOwnerProfile,
  useUpdateDiscount,
} from "@/lib/api";
import type {
  DiscountPayload,
  MenuItem,
  RestaurantDiscount,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DiscountsPage() {
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

  const discountsQuery = useDiscounts(!!ownerQuery.data);
  const menuItemsQuery = useMenuItems(!!ownerQuery.data);

  const enableDiscount = useEnableDiscount();
  const disableDiscount = useDisableDiscount();
  const deleteDiscount = useDeleteDiscount();

  const [editing, setEditing] = useState<RestaurantDiscount | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading discounts...
      </div>
    );
  }

  const discounts = discountsQuery.data ?? [];
  const menuItems = menuItemsQuery.data ?? [];

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(d: RestaurantDiscount) {
    setEditing(d);
    setModalOpen(true);
  }

  async function toggle(d: RestaurantDiscount) {
    if (d.active) {
      await disableDiscount.mutateAsync(d.id);
    } else {
      await enableDiscount.mutateAsync(d.id);
    }
  }

  async function remove(d: RestaurantDiscount) {
    if (!confirm(`Delete discount "${d.name}"?`)) return;
    await deleteDiscount.mutateAsync(d.id);
  }

  return (
    <div className="bg-white min-h-screen">
      <RestaurantManagerHeader active="Discounts" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] md:text-3xl font-medium text-black">
              Discounts
            </h1>
            <p className="text-[#424242] text-base">
              Create promotional offers for selected menu items
            </p>
          </div>
          <button
            onClick={openNew}
            className="bg-[#CD3625] text-white rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap"
          >
            + New discount
          </button>
        </div>

        {discountsQuery.isLoading && (
          <p className="py-12 text-center text-gray-500">Loading discounts…</p>
        )}

        {!discountsQuery.isLoading && discounts.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No discounts yet. Click “+ New discount” to create your first one.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {discounts.map((d) => (
            <DiscountCard
              key={d.id}
              discount={d}
              onEdit={() => openEdit(d)}
              onToggle={() => toggle(d)}
              onDelete={() => remove(d)}
              busy={
                enableDiscount.isPending ||
                disableDiscount.isPending ||
                deleteDiscount.isPending
              }
            />
          ))}
        </div>
      </main>

      <DiscountEditModal
        open={modalOpen}
        discount={editing}
        menuItems={menuItems}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function DiscountCard({
  discount,
  onEdit,
  onToggle,
  onDelete,
  busy,
}: {
  discount: RestaurantDiscount;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-black">{discount.name}</h3>
          <p className="text-sm text-gray-600">{discount.description || "—"}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            discount.active
              ? "bg-[#1F8F4E]/10 text-[#1F8F4E]"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {discount.active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap text-sm text-black">
        {discount.price_reduction_percentage != null && (
          <span className="bg-[#FFF1EC] text-[#CD3625] rounded px-2 py-1">
            -{discount.price_reduction_percentage}%
          </span>
        )}
        {discount.price_reduction_amount != null && (
          <span className="bg-[#FFF1EC] text-[#CD3625] rounded px-2 py-1">
            -{discount.price_reduction_amount} CHF
          </span>
        )}
        {discount.price_reduction_min != null && (
          <span className="bg-gray-100 text-gray-700 rounded px-2 py-1">
            min order: {discount.price_reduction_min} CHF
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {discount.menu_items.length} menu item
        {discount.menu_items.length === 1 ? "" : "s"}:{" "}
        {discount.menu_items
          .slice(0, 3)
          .map((m) => m.name)
          .join(", ")}
        {discount.menu_items.length > 3 && " …"}
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onEdit}
          className="border border-gray-300 rounded-full px-4 py-1.5 text-sm text-black"
        >
          Edit
        </button>
        <button
          onClick={onToggle}
          disabled={busy}
          className={`rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
            discount.active
              ? "border border-[#CD3625] text-[#CD3625]"
              : "bg-[#CD3625] text-white"
          }`}
        >
          {discount.active ? "Disable" : "Enable"}
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto border border-red-500 text-red-600 rounded-full px-4 py-1.5 text-sm disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function DiscountEditModal({
  open,
  discount,
  menuItems,
  onClose,
}: {
  open: boolean;
  discount: RestaurantDiscount | null;
  menuItems: MenuItem[];
  onClose: () => void;
}) {
  const create = useCreateDiscount();
  const update = useUpdateDiscount();

  const isEditing = !!discount;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reductionType, setReductionType] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [reductionValue, setReductionValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(discount?.name ?? "");
    setDescription(discount?.description ?? "");
    if (discount?.price_reduction_amount != null) {
      setReductionType("amount");
      setReductionValue(String(discount.price_reduction_amount));
    } else {
      setReductionType("percentage");
      setReductionValue(
        discount?.price_reduction_percentage != null
          ? String(discount.price_reduction_percentage)
          : "",
      );
    }
    setMinOrder(
      discount?.price_reduction_min != null
        ? String(discount.price_reduction_min)
        : "",
    );
    setSelected(discount?.menu_items.map((m) => m.id) ?? []);
    setError(null);
  }, [open, discount]);

  const toggleItem = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const busy = create.isPending || update.isPending;

  async function save() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const value = parseFloat(reductionValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Reduction value must be greater than 0.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one menu item.");
      return;
    }
    const minOrderNum = minOrder.trim() === "" ? null : parseFloat(minOrder);
    const payload: DiscountPayload = {
      name: name.trim(),
      description: description.trim(),
      price_reduction_percentage: reductionType === "percentage" ? value : null,
      price_reduction_amount: reductionType === "amount" ? value : null,
      price_reduction_min:
        minOrderNum != null && Number.isFinite(minOrderNum) ? minOrderNum : null,
      menu_items: selected,
    };
    try {
      if (isEditing && discount) {
        await update.mutateAsync({ id: discount.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const e = err as {
        response?: { data?: { code?: string; detail?: string } };
      };
      setError(
        e?.response?.data?.code ||
          e?.response?.data?.detail ||
          "Could not save discount.",
      );
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black">
            {isEditing ? "Edit discount" : "New discount"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <FieldRow label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
            />
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black resize-y"
            />
          </FieldRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Reduction type">
              <select
                value={reductionType}
                onChange={(e) =>
                  setReductionType(e.target.value as "percentage" | "amount")
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Flat amount (CHF)</option>
              </select>
            </FieldRow>
            <FieldRow
              label={
                reductionType === "percentage" ? "Percentage" : "Amount (CHF)"
              }
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={reductionValue}
                onChange={(e) => setReductionValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
              />
            </FieldRow>
          </div>

          <FieldRow label="Minimum order amount (CHF, optional)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
            />
          </FieldRow>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Menu items ({selected.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {menuItems.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  No menu items yet. Create some on the Menu page first.
                </p>
              )}
              {menuItems.map((m) => {
                const checked = selected.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(m.id)}
                        className="w-4 h-4 accent-[#CD3625]"
                      />
                      <span className="text-sm text-black">{m.name}</span>
                      {m.food?.name && (
                        <span className="text-xs text-gray-500">
                          · {m.food.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#CD3625]">
                      {typeof m.price === "number"
                        ? m.price.toFixed(2)
                        : m.price}{" "}
                      CHF
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 rounded-full px-5 py-2 text-sm text-black"
          >
            Close
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="bg-[#CD3625] text-white rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : isEditing ? "Save changes" : "Create discount"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
