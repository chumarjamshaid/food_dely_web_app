"use client";
import { extractApiError } from "@/lib/api/error";
import {
  useCreateNowasteCustom,
  useCreateNowasteItem,
  useCreateNowasteMenuItemLink,
  useDeleteNowasteCustom,
  useDeleteNowasteItem,
  useDeleteNowasteMenuItemLink,
  useMenuItems,
  useNowasteItem,
  useUpdateNowasteCustom,
  useUpdateNowasteItem,
  useUpdateNowasteMenuItemLink,
} from "@/lib/api";
import type {
  MenuItem,
  NowasteCustomItem,
  NowasteCustomPayload,
  NowasteItem,
  NowasteItemCreatePayload,
  NowasteItemUpdatePayload,
  NowasteMenuItemLink,
  NowasteMenuItemLinkPayload,
} from "@/lib/api";
import { useEffect, useState } from "react";

interface Props {
  item: NowasteItem | null;
  open: boolean;
  onClose: () => void;
}

function extractError(err: unknown): string {
  return extractApiError(err);
}

export default function NowasteItemEditModal({ item, open, onClose }: Props) {
  const isEdit = !!item;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [amountAvailable, setAmountAvailable] = useState("0");
  const [active, setActive] = useState(true);
  const [err, setErr] = useState("");

  // Re-fetch the full item (so nested arrays are fresh) when editing
  const detailQuery = useNowasteItem(item?.id ?? null, open && isEdit);
  const fresh = detailQuery.data ?? item;

  useEffect(() => {
    if (!open) return;
    setErr("");
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setPrice(String(item.price));
      setAmountAvailable(String(item.amount_available ?? 0));
      setActive(item.active);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setAmountAvailable("0");
      setActive(true);
    }
  }, [item, open]);

  const createMut = useCreateNowasteItem();
  const updateMut = useUpdateNowasteItem();
  const deleteMut = useDeleteNowasteItem();

  async function handleSave() {
    setErr("");
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setErr("Price must be a valid number");
      return;
    }
    const amountNum = parseInt(amountAvailable || "0", 10);
    try {
      if (isEdit && item) {
        const payload: NowasteItemUpdatePayload = {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          active,
          amount_available: Number.isFinite(amountNum) ? amountNum : 0,
          allergies: [],
        };
        await updateMut.mutateAsync({ id: item.id, data: payload });
        onClose();
      } else {
        const payload: NowasteItemCreatePayload = {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          amount_available: Number.isFinite(amountNum) ? amountNum : 0,
          allergies: [],
        };
        await createMut.mutateAsync(payload);
        onClose();
      }
    } catch (e) {
      setErr(extractError(e));
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm("Delete this nowaste item?")) return;
    setErr("");
    try {
      await deleteMut.mutateAsync(item.id);
      onClose();
    } catch (e) {
      setErr(extractError(e));
    }
  }

  if (!open) return null;

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-black">
            {isEdit ? "Edit nowaste item" : "New nowaste item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {err && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Surprise Basket"
              />
            </Field>
            <Field label="Package price (CHF) *">
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="9.90"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Daily unsold products"
              />
            </Field>
            <Field label="Amount available">
              <input
                type="number"
                min="0"
                step="1"
                value={amountAvailable}
                onChange={(e) => setAmountAvailable(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active (visible to customers)
            </label>
          )}

          {/* Contents — only available after the nowaste item exists */}
          {isEdit && fresh ? (
            <>
              <div className="border-t border-gray-200 pt-5">
                <LinkedMenuItemsSection nowasteItem={fresh} />
              </div>
              <div className="border-t border-gray-200 pt-5">
                <CustomItemsSection nowasteItem={fresh} />
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500">
              Save the nowaste item first, then add linked menu items and
              custom contents.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="text-red-600 hover:underline text-sm disabled:opacity-50"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border border-gray-300 rounded-full px-5 py-2 text-sm text-black"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#CD3625] text-white rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
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
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

// ---------- Linked menu items ----------

function LinkedMenuItemsSection({ nowasteItem }: { nowasteItem: NowasteItem }) {
  const menuItemsQuery = useMenuItems(true);
  const createLink = useCreateNowasteMenuItemLink();

  const [selectedId, setSelectedId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [err, setErr] = useState("");

  const links = nowasteItem.nowaste_items_menu_item ?? [];
  const allMenuItems: MenuItem[] = menuItemsQuery.data ?? [];
  const linkedIds = new Set(links.map((l) => l.menu_item?.id));
  const available = allMenuItems.filter((m) => !linkedIds.has(m.id));

  async function add() {
    setErr("");
    const id = parseInt(selectedId, 10);
    const qty = parseInt(quantity || "1", 10);
    if (!Number.isFinite(id)) {
      setErr("Pick a menu item");
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      setErr("Quantity must be at least 1");
      return;
    }
    const payload: NowasteMenuItemLinkPayload = { menu_item: id, quantity: qty };
    try {
      await createLink.mutateAsync({ nowasteId: nowasteItem.id, data: payload });
      setSelectedId("");
      setQuantity("1");
    } catch (e) {
      setErr(extractError(e));
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-black mb-2">
        Linked menu items
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Add existing menu items that are included in this nowaste package.
      </p>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs text-red-700 mb-3">
          {err}
        </div>
      )}

      {links.length > 0 && (
        <div className="space-y-2 mb-3">
          {links.map((link) => (
            <LinkRow
              key={link.id}
              nowasteId={nowasteItem.id}
              link={link}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 bg-gray-50 rounded-lg p-3">
        <div className="flex-1 min-w-[180px]">
          <span className="block text-xs font-medium text-gray-700 mb-1">
            Menu item
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-11 w-full appearance-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— pick one —</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <span className="block text-xs font-medium text-gray-700 mb-1">
            Qty
          </span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <button
          onClick={add}
          disabled={createLink.isPending || !selectedId}
          className="h-11 rounded-full bg-[#CD3625] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {createLink.isPending ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

function LinkRow({
  nowasteId,
  link,
}: {
  nowasteId: number;
  link: NowasteMenuItemLink;
}) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(link.quantity));
  const [err, setErr] = useState("");

  const updateMut = useUpdateNowasteMenuItemLink();
  const deleteMut = useDeleteNowasteMenuItemLink();

  async function save() {
    setErr("");
    const qty = parseInt(quantity || "1", 10);
    if (!Number.isFinite(qty) || qty < 1) {
      setErr("Quantity must be at least 1");
      return;
    }
    try {
      await updateMut.mutateAsync({
        nowasteId,
        linkId: link.id,
        data: { menu_item: link.menu_item.id, quantity: qty },
      });
      setEditing(false);
    } catch (e) {
      setErr(extractError(e));
    }
  }

  async function remove() {
    if (!confirm("Remove this menu item from the package?")) return;
    setErr("");
    try {
      await deleteMut.mutateAsync({ nowasteId, linkId: link.id });
    } catch (e) {
      setErr(extractError(e));
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 bg-white">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">
          {link.menu_item?.name ?? "Menu item"}
        </p>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
      {editing ? (
        <>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={save}
            disabled={updateMut.isPending}
            className="text-[#CD3625] text-sm font-semibold disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setQuantity(String(link.quantity));
            }}
            className="text-gray-500 text-sm"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-600">x{link.quantity}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-gray-700 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={remove}
            disabled={deleteMut.isPending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Custom items ----------

function CustomItemsSection({ nowasteItem }: { nowasteItem: NowasteItem }) {
  const createMut = useCreateNowasteCustom();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [err, setErr] = useState("");

  const customs = nowasteItem.nowaste_items_custom ?? [];

  async function add() {
    setErr("");
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    const qty = parseInt(quantity || "1", 10);
    const payload: NowasteCustomPayload = {
      name: name.trim(),
      description: description.trim(),
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
    };
    try {
      await createMut.mutateAsync({ nowasteId: nowasteItem.id, data: payload });
      setName("");
      setDescription("");
      setQuantity("1");
    } catch (e) {
      setErr(extractError(e));
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-black mb-2">Custom items</h3>
      <p className="text-xs text-gray-500 mb-3">
        Free-text contents that are not in the regular menu (e.g. croissants,
        pastries).
      </p>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs text-red-700 mb-3">
          {err}
        </div>
      )}

      {customs.length > 0 && (
        <div className="space-y-2 mb-3">
          {customs.map((c) => (
            <CustomRow key={c.id} nowasteId={nowasteItem.id} custom={c} />
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Croissant)"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 w-24 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            placeholder="Qty"
          />
          <button
            onClick={add}
            disabled={createMut.isPending}
            className="ml-auto h-11 rounded-full bg-[#CD3625] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {createMut.isPending ? "Adding…" : "Add custom item"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomRow({
  nowasteId,
  custom,
}: {
  nowasteId: number;
  custom: NowasteCustomItem;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(custom.name);
  const [description, setDescription] = useState(custom.description);
  const [quantity, setQuantity] = useState(String(custom.quantity));
  const [err, setErr] = useState("");

  const updateMut = useUpdateNowasteCustom();
  const deleteMut = useDeleteNowasteCustom();

  async function save() {
    setErr("");
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    const qty = parseInt(quantity || "1", 10);
    try {
      await updateMut.mutateAsync({
        nowasteId,
        customId: custom.id,
        data: {
          name: name.trim(),
          description: description.trim(),
          quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        },
      });
      setEditing(false);
    } catch (e) {
      setErr(extractError(e));
    }
  }

  async function remove() {
    if (!confirm("Remove this custom item?")) return;
    setErr("");
    try {
      await deleteMut.mutateAsync({ nowasteId, customId: custom.id });
    } catch (e) {
      setErr(extractError(e));
    }
  }

  if (editing) {
    return (
      <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Name"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Description"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 w-24 rounded-lg border border-gray-300 px-3 text-sm"
          />
          {err && <span className="text-xs text-red-600">{err}</span>}
          <button
            onClick={save}
            disabled={updateMut.isPending}
            className="ml-auto text-[#CD3625] text-sm font-semibold disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(custom.name);
              setDescription(custom.description);
              setQuantity(String(custom.quantity));
            }}
            className="text-gray-500 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 bg-white">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{custom.name}</p>
        {custom.description && (
          <p className="text-xs text-gray-500 truncate">{custom.description}</p>
        )}
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
      <span className="text-sm text-gray-600">x{custom.quantity}</span>
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-gray-700 hover:underline"
      >
        Edit
      </button>
      <button
        onClick={remove}
        disabled={deleteMut.isPending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
