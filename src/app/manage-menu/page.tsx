"use client";
import MenuItemEditModal from "@/components/MenuItemEditModal";
import NowasteItemEditModal from "@/components/NowasteItemEditModal";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useDeleteFood,
  useFoods,
  useMenuItems,
  useNowasteItems,
  useRestaurantOwnerProfile,
} from "@/lib/api";
import type { MenuItem, NowasteItem } from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { extractApiError } from "@/lib/api/error";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SelectedCategory = "nowaste" | "all" | number;

export default function ManageMenu() {
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

  const foodsQuery = useFoods(!!ownerQuery.data);
  const menuItemsQuery = useMenuItems(!!ownerQuery.data);
  const nowasteQuery = useNowasteItems(!!ownerQuery.data);
  const deleteFood = useDeleteFood();

  const [selected, setSelected] = useState<SelectedCategory>("all");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNowaste, setEditingNowaste] = useState<NowasteItem | null>(null);
  const [nowasteModalOpen, setNowasteModalOpen] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const foods = foodsQuery.data ?? [];
  const itemsData = menuItemsQuery.data;

  const filtered = useMemo(() => {
    const list = itemsData ?? [];
    if (selected === "all") return list;
    if (selected === "nowaste") return [];
    return list.filter((m) => m.food?.id === selected);
  }, [itemsData, selected]);

  const items = itemsData ?? [];

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setModalOpen(true);
  }

  function openNewNowaste() {
    setEditingNowaste(null);
    setNowasteModalOpen(true);
  }

  function openEditNowaste(item: NowasteItem) {
    setEditingNowaste(item);
    setNowasteModalOpen(true);
  }

  async function removeFoodCategory(id: number, name: string) {
    if (!confirm(`Delete menu category "${name}"? Menu items in this category may need reassignment.`)) return;
    setCategoryError("");
    try {
      await deleteFood.mutateAsync(id);
      if (selected === id) setSelected("all");
    } catch (requestError) {
      setCategoryError(extractApiError(requestError, "Food category could not be removed."));
    }
  }

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] text-stone-600">
        Loading menu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Menu" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Menu studio</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Manage menu</h1>
            <p className="mt-3 text-base text-stone-600">
              Create and edit your menu items, food types and options
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {selected === "nowaste" ? (
              <button
                onClick={openNewNowaste}
                className="w-full whitespace-nowrap rounded-full bg-[#c83b2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#af3023] sm:w-auto"
              >
                + New nowaste item
              </button>
            ) : (
              <button
                onClick={openNew}
                className="w-full whitespace-nowrap rounded-full bg-[#c83b2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#af3023] sm:w-auto"
              >
                + New menu item
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
          <CategoryPill
            active={selected === "nowaste"}
            onClick={() => setSelected("nowaste")}
            tone="nowaste"
          >
            Nowaste Items
          </CategoryPill>
          <CategoryPill
            active={selected === "all"}
            onClick={() => setSelected("all")}
          >
            All
          </CategoryPill>
          {foods.map((f) => (
            <div key={f.id} className={`flex shrink-0 items-center rounded-full border transition-colors ${selected === f.id ? "border-[#CD3625] bg-[#CD3625] text-white" : "border-gray-300 bg-white text-black"}`}>
              <button
                type="button"
                onClick={() => setSelected(f.id)}
                className="px-5 py-2 text-sm font-medium"
              >
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => removeFoodCategory(f.id, f.name)}
                disabled={deleteFood.isPending}
                aria-label={`Delete ${f.name}`}
                className={`mr-2 grid size-6 place-items-center rounded-full text-xs font-bold disabled:opacity-50 ${selected === f.id ? "hover:bg-white/15" : "text-red-600 hover:bg-red-50"}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {categoryError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{categoryError}</div>}

        {/* Nowaste section */}
        {selected === "nowaste" && (
          <NowasteSection
            isLoading={nowasteQuery.isLoading}
            items={nowasteQuery.data ?? []}
            onEdit={openEditNowaste}
          />
        )}

        {/* List */}
        {selected !== "nowaste" && (
          <>
            {menuItemsQuery.isLoading && (
              <p className="py-12 text-center text-gray-500">
                Loading menu items…
              </p>
            )}
            {!menuItemsQuery.isLoading && filtered.length === 0 && (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">
                {items.length === 0
                  ? "No menu items yet. Click “+ New menu item” to add your first one."
                  : "No items in this food type."}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit(item)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <MenuItemEditModal
        item={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <NowasteItemEditModal
        item={editingNowaste}
        open={nowasteModalOpen}
        onClose={() => setNowasteModalOpen(false)}
      />
    </div>
  );
}

function NowasteSection({
  isLoading,
  items,
  onEdit,
}: {
  isLoading: boolean;
  items: NowasteItem[];
  onEdit: (n: NowasteItem) => void;
}) {
  if (isLoading) {
    return (
      <p className="py-12 text-center text-gray-500">Loading nowaste items…</p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">
        No nowaste items yet. Click “+ New nowaste item” to create your first
        package.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((n) => (
        <NowasteCard key={n.id} item={n} onEdit={() => onEdit(n)} />
      ))}
    </div>
  );
}

function NowasteCard({
  item,
  onEdit,
}: {
  item: NowasteItem;
  onEdit: () => void;
}) {
  const priceNum =
    typeof item.price === "number" ? item.price : parseFloat(String(item.price));
  const linkedCount = item.nowaste_items_menu_item?.length ?? 0;
  const customCount = item.nowaste_items_custom?.length ?? 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_14px_40px_rgba(45,32,24,0.05)] transition hover:-translate-y-1">
      <div className="bg-[#1F8F4E]/10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1F8F4E] uppercase tracking-wide">
          Nowaste
        </span>
        {!item.active && (
          <span className="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded">
            Inactive
          </span>
        )}
      </div>
      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-black">{item.name}</h3>
          <span className="text-[#CD3625] font-semibold">
            {Number.isFinite(priceNum) ? priceNum.toFixed(2) : item.price} CHF
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {item.description || "—"}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {item.amount_available ?? 0} available
          {linkedCount > 0 ? ` · ${linkedCount} menu item${linkedCount === 1 ? "" : "s"}` : ""}
          {customCount > 0 ? ` · ${customCount} custom` : ""}
        </p>
        <div className="mt-auto flex justify-end">
          <button
            onClick={onEdit}
            className="border border-gray-300 rounded-full px-4 py-1.5 text-sm text-black hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "nowaste";
}) {
  const base =
    "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors";
  if (active) {
    return (
      <button
        onClick={onClick}
        className={`${base} bg-[#CD3625] text-white border-[#CD3625]`}
      >
        {children}
      </button>
    );
  }
  if (tone === "nowaste") {
    return (
      <button
        onClick={onClick}
        className={`${base} bg-[#1F8F4E]/10 text-[#1F8F4E] border-[#1F8F4E]`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`${base} bg-white text-black border-gray-300`}
    >
      {children}
    </button>
  );
}

function MenuItemCard({
  item,
  onEdit,
}: {
  item: MenuItem;
  onEdit: () => void;
}) {
  const priceNum =
    typeof item.price === "number" ? item.price : parseFloat(String(item.price));
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_14px_40px_rgba(45,32,24,0.05)] transition hover:-translate-y-1">
      <div className="aspect-[4/3] bg-gray-100 relative">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        {!item.active && (
          <span className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">
            Inactive
          </span>
        )}
        {item.popular && (
          <span className="absolute top-2 right-2 bg-[#CD3625] text-white text-xs px-2 py-1 rounded">
            Popular
          </span>
        )}
      </div>
      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-black">{item.name}</h3>
          <span className="text-[#CD3625] font-semibold">
            {Number.isFinite(priceNum) ? priceNum.toFixed(2) : item.price} CHF
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {item.description || "—"}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {item.food?.name ?? "No food type"}
          {item.options?.length
            ? ` · ${item.options.length} option group${item.options.length === 1 ? "" : "s"}`
            : ""}
        </p>
        <div className="mt-auto flex justify-end">
          <button
            onClick={onEdit}
            className="border border-gray-300 rounded-full px-4 py-1.5 text-sm text-black hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
