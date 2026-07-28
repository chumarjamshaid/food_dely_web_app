"use client";
import {
  useCreateFood,
  useCreateMenuItem,
  useCreateMenuItemOption,
  useCreateMenuItemOptionItem,
  useDeleteMenuItem,
  useDeleteMenuItemOption,
  useDeleteMenuItemOptionItem,
  useFoods,
  useMenuItems,
  useUpdateMenuItem,
  useUpdateMenuItemOption,
  useUpdateMenuItemOptionItem,
  useUploadMenuItemImage,
} from "@/lib/api";
import type {
  MenuItem,
  MenuItemOption,
  MenuItemOptionItem,
} from "@/lib/api";
import { extractApiError } from "@/lib/api/error";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface Props {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

function toNumber(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default function MenuItemEditModal({ item, open, onClose }: Props) {
  const isEditing = !!item;

  const foodsQuery = useFoods(open);
  // Subscribe to the live menu-items cache so option group/item changes
  // (which invalidate that cache) re-render this modal immediately instead
  // of staying stuck on the prop snapshot until the modal is reopened.
  const menuItemsQuery = useMenuItems(open && !!item?.id);
  const liveItem =
    (item && menuItemsQuery.data?.find((m) => m.id === item.id)) || item;
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const uploadImage = useUploadMenuItemImage();
  const createFood = useCreateFood();

  // Local form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [popular, setPopular] = useState(false);
  const [foodId, setFoodId] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline "new food type" toggle
  const [showNewFood, setShowNewFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodDescription, setNewFoodDescription] = useState("");

  // Reset on open / item change
  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setPrice(item?.price != null ? String(item.price) : "");
    setActive(item?.active ?? true);
    setPopular(!!item?.popular);
    setFoodId(item?.food?.id ?? "");
    setImageFile(null);
    setImagePreview(item?.image ?? "");
    setErrorMsg(null);
    setShowNewFood(false);
    setNewFoodName("");
    setNewFoodDescription("");
  }, [open, item]);

  const foods = foodsQuery.data ?? [];
  const busy =
    createMenuItem.isPending ||
    updateMenuItem.isPending ||
    uploadImage.isPending;

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview((ev.target?.result as string) ?? "");
    reader.readAsDataURL(f);
  }

  async function handleCreateFood() {
    if (!newFoodName.trim()) return;
    try {
      const food = await createFood.mutateAsync({
        name: newFoodName.trim(),
        description: newFoodDescription.trim(),
      });
      setFoodId(food.id);
      setShowNewFood(false);
      setNewFoodName("");
      setNewFoodDescription("");
    } catch (err) {
      setErrorMsg(extractError(err, "Could not create food type."));
    }
  }

  async function handleSave() {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }
    if (foodId === "") {
      setErrorMsg("Please pick a food type.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: toNumber(price),
      active,
      popular,
      food: foodId as number,
      allergies: [] as number[],
    };
    try {
      let saved: MenuItem;
      if (isEditing && item) {
        saved = await updateMenuItem.mutateAsync({ id: item.id, data: payload });
      } else {
        saved = await createMenuItem.mutateAsync(payload);
      }
      if (imageFile && saved?.id) {
        await uploadImage.mutateAsync({ id: saved.id, file: imageFile });
      }
      onClose();
    } catch (err) {
      setErrorMsg(extractError(err, "Could not save menu item."));
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteMenuItem.mutateAsync(item.id);
      onClose();
    } catch (err) {
      setErrorMsg(extractError(err, "Could not delete menu item."));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black">
            {isEditing ? "Edit menu item" : "New menu item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded text-sm">
              {errorMsg}
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-gray-400 text-xs">No image</span>
                )}
              </div>
              <label className="cursor-pointer border border-gray-300 rounded-full px-4 py-2 text-sm text-black bg-white hover:bg-gray-50">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickImage}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded after the item is saved.
            </p>
          </div>

          {/* Name + Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
              />
            </Field>
            <Field label="Price (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black resize-y"
            />
          </Field>

          {/* Food type */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Food type
            </label>
            <div className="flex gap-2">
              <select
                value={foodId === "" ? "" : String(foodId)}
                onChange={(e) =>
                  setFoodId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black bg-white"
                disabled={foodsQuery.isLoading}
              >
                <option value="">
                  {foodsQuery.isLoading ? "Loading…" : "Select a food type"}
                </option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewFood((v) => !v)}
                className="border border-[#CD3625] text-[#CD3625] rounded-lg px-3 py-2 text-sm whitespace-nowrap"
              >
                {showNewFood ? "Cancel" : "+ New"}
              </button>
            </div>

            {showNewFood && (
              <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                <input
                  type="text"
                  placeholder="Food type name"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newFoodDescription}
                  onChange={(e) => setNewFoodDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateFood}
                  disabled={!newFoodName.trim() || createFood.isPending}
                  className="bg-[#CD3625] text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                >
                  {createFood.isPending ? "Creating…" : "Create food type"}
                </button>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-black text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 accent-[#CD3625]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-black text-sm">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="w-4 h-4 accent-[#CD3625]"
              />
              Popular
            </label>
          </div>

          {/* Options (only when editing — needs an existing menu item id) */}
          {isEditing && liveItem && <OptionsManager item={liveItem} />}
          {!isEditing && (
            <p className="text-xs text-gray-500">
              Save the item first to manage its custom options.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMenuItem.isPending}
                className="border border-red-500 text-red-600 rounded-full px-5 py-2 text-sm disabled:opacity-50"
              >
                {deleteMenuItem.isPending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 rounded-full px-5 py-2 text-sm text-black"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="bg-[#CD3625] text-white rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Saving…" : isEditing ? "Save changes" : "Create item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
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

// ----------------------------------------------------------------------------
// OptionsManager: nested CRUD for option groups + option items
// ----------------------------------------------------------------------------

function OptionsManager({ item }: { item: MenuItem }) {
  const options = useMemo(() => item.options ?? [], [item.options]);
  const createOption = useCreateMenuItemOption();
  const updateOption = useUpdateMenuItemOption();
  const deleteOption = useDeleteMenuItemOption();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [multiple, setMultiple] = useState(false);
  const [required, setRequired] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    await createOption.mutateAsync({
      menuItemId: item.id,
      data: { name: name.trim(), multiple, required },
    });
    setName("");
    setMultiple(false);
    setRequired(false);
    setCreating(false);
  }

  async function handleDelete(optionId: number) {
    if (!confirm("Delete this option group and all its items?")) return;
    await deleteOption.mutateAsync({ menuItemId: item.id, optionId });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-xl">
        <h3 className="text-base font-semibold text-black">Options</h3>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="bg-[#CD3625] text-white rounded px-3 py-1.5 text-sm"
        >
          {creating ? "Cancel" : "Create"}
        </button>
      </div>

      {creating && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white space-y-2">
          <input
            type="text"
            placeholder="Option group name (e.g. Choose your size)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
          />
          <div className="flex gap-6 text-sm text-black">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={multiple}
                onChange={(e) => setMultiple(e.target.checked)}
                className="w-4 h-4 accent-[#CD3625]"
              />
              Multiple
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 accent-[#CD3625]"
              />
              Required
            </label>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || createOption.isPending}
            className="bg-[#CD3625] text-white rounded px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {createOption.isPending ? "Creating…" : "Confirm"}
          </button>
        </div>
      )}

      {options.length === 0 && !creating && (
        <p className="px-4 py-6 text-center text-gray-500 text-sm">
          No option groups yet.
        </p>
      )}

      <div className="divide-y divide-gray-200">
        {options.map((opt) => (
          <OptionGroupRow
            key={opt.id}
            menuItemId={item.id}
            option={opt}
            onDelete={() => handleDelete(opt.id)}
            onUpdate={(data) =>
              updateOption.mutateAsync({
                menuItemId: item.id,
                optionId: opt.id,
                data,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function OptionGroupRow({
  menuItemId,
  option,
  onDelete,
  onUpdate,
}: {
  menuItemId: number;
  option: MenuItemOption;
  onDelete: () => void;
  onUpdate: (data: {
    name: string;
    multiple: boolean;
    required: boolean;
  }) => Promise<MenuItemOption>;
}) {
  const items = option.items ?? option.option_items ?? [];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [multiple, setMultiple] = useState(option.multiple);
  const [required, setRequired] = useState(option.required);

  const createItem = useCreateMenuItemOptionItem();
  const updateItem = useUpdateMenuItemOptionItem();
  const deleteItem = useDeleteMenuItemOptionItem();

  const [creatingItem, setCreatingItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  async function saveGroup() {
    await onUpdate({
      name: name.trim(),
      multiple,
      required,
    });
    setEditing(false);
  }

  async function handleCreateItem() {
    if (!itemName.trim()) return;
    await createItem.mutateAsync({
      menuItemId,
      optionId: option.id,
      data: {
        name: itemName.trim(),
        description: itemDesc.trim(),
        price: toNumber(itemPrice),
        allergies: [],
      },
    });
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setCreatingItem(false);
  }

  async function handleDeleteItem(itemId: number) {
    if (!confirm("Delete this option item?")) return;
    await deleteItem.mutateAsync({
      menuItemId,
      optionId: option.id,
      itemId,
    });
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
            />
            <div className="flex gap-4 text-xs text-black">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={multiple}
                  onChange={(e) => setMultiple(e.target.checked)}
                  className="w-4 h-4 accent-[#CD3625]"
                />
                Multiple
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-4 h-4 accent-[#CD3625]"
                />
                Required
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="text-black font-medium text-sm">{option.name}</div>
            <div className="text-xs text-gray-500">
              {option.multiple ? "Multiple" : "Single"} ·{" "}
              {option.required ? "Required" : "Optional"}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveGroup}
                className="bg-[#CD3625] text-white rounded px-3 py-1 text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(option.name);
                  setMultiple(option.multiple);
                  setRequired(option.required);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-xs text-black"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border border-gray-300 rounded px-3 py-1 text-xs text-black"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="border border-red-500 text-red-600 rounded px-3 py-1 text-xs"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <ul className="mt-3 ml-2 space-y-1">
        {items.map((it) => (
          <OptionItemRow
            key={it.id}
            data={it}
            onUpdate={(payload) =>
              updateItem.mutateAsync({
                menuItemId,
                optionId: option.id,
                itemId: it.id,
                data: payload,
              })
            }
            onDelete={() => handleDeleteItem(it.id)}
          />
        ))}
      </ul>

      {creatingItem ? (
        <div className="mt-3 p-3 rounded border border-gray-200 bg-white space-y-2">
          <input
            type="text"
            placeholder="Item name (e.g. Large)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={itemDesc}
            onChange={(e) => setItemDesc(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Extra price (CHF)"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateItem}
              disabled={!itemName.trim() || createItem.isPending}
              className="bg-[#CD3625] text-white rounded px-3 py-1 text-xs disabled:opacity-50"
            >
              {createItem.isPending ? "Adding…" : "Add item"}
            </button>
            <button
              type="button"
              onClick={() => setCreatingItem(false)}
              className="border border-gray-300 rounded px-3 py-1 text-xs text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreatingItem(true)}
          className="mt-2 text-xs text-[#CD3625]"
        >
          + Create an option item
        </button>
      )}
    </div>
  );
}

function OptionItemRow({
  data,
  onUpdate,
  onDelete,
}: {
  data: MenuItemOptionItem;
  onUpdate: (payload: {
    name: string;
    description: string;
    price: number;
    allergies: number[];
  }) => Promise<MenuItemOptionItem>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);
  const [price, setPrice] = useState(String(data.price ?? ""));

  async function save() {
    await onUpdate({
      name: name.trim(),
      description: description.trim(),
      price: toNumber(price),
      allergies: [],
    });
    setEditing(false);
  }

  const priceNum = typeof data.price === "number" ? data.price : parseFloat(String(data.price));
  const priceLabel =
    Number.isFinite(priceNum) && priceNum > 0
      ? ` (+${priceNum.toFixed(2)} CHF)`
      : "";

  if (editing) {
    return (
      <li className="flex items-start gap-2 py-2">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-xs"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-xs"
          />
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Extra price"
            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={save}
            className="bg-[#CD3625] text-white rounded px-2 py-1 text-[10px]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(data.name);
              setDescription(data.description);
              setPrice(String(data.price ?? ""));
            }}
            className="border border-gray-300 rounded px-2 py-1 text-[10px] text-black"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between text-sm text-black py-1">
      <span>
        {data.name}
        <span className="text-[#CD3625]">{priceLabel}</span>
      </span>
      <span className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="edit"
          className="text-gray-500 hover:text-black"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="delete"
          className="text-red-500 hover:text-red-700"
        >
          🗑
        </button>
      </span>
    </li>
  );
}

function extractError(err: unknown, fallback: string): string {
  return extractApiError(err, fallback);
}
