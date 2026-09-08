"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  ORDER_STATUS_VALUES,
  useCancelRestaurantOrder,
  useMarkOrderCompleted,
  useMarkOrderDelivering,
  useMarkOrderPreparing,
  useMarkOrderReady,
  useRestaurantOrders,
  useRestaurantOwnerProfile,
  type RestaurantOrderListItem,
  type RestaurantOrderStatus,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { extractApiError } from "@/lib/api/error";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronDown, Mail, MapPin, Phone, SlidersHorizontal, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const STATUS_LABELS: Record<RestaurantOrderStatus, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready",
  delivering: "Delivering",
  completed: "Completed",
  can_cust: "Cancelled (customer)",
  can_rest: "Cancelled (restaurant)",
};

const STATUS_COLORS: Record<RestaurantOrderStatus, string> = {
  placed: "bg-amber-50 text-amber-700 ring-amber-200",
  preparing: "bg-orange-50 text-orange-700 ring-orange-200",
  ready: "bg-blue-50 text-blue-700 ring-blue-200",
  delivering: "bg-violet-50 text-violet-700 ring-violet-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  can_cust: "bg-red-50 text-red-700 ring-red-200",
  can_rest: "bg-red-50 text-red-700 ring-red-200",
};

function toApiDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB");
}

function customerName(order: RestaurantOrderListItem) {
  const f =
    order.customer?.firstname ??
    order.customer_firstname ??
    order.delivery_firstname ??
    "";
  const l =
    order.customer?.lastname ??
    order.customer_lastname ??
    order.delivery_lastname ??
    "";
  const full = `${f} ${l}`.trim();
  return full || "Customer";
}

function orderTotal(order: RestaurantOrderListItem): string {
  const v = order.total_price ?? order.price;
  if (v == null) return "—";
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function orderItems(order: RestaurantOrderListItem) {
  return order.items ?? order.order_items ?? [];
}

function itemName(item: NonNullable<RestaurantOrderListItem["items"]>[number]) {
  return item.menu_item?.name ?? item.menu_item_name ?? item.name ?? "Menu item";
}

function itemOptions(item: NonNullable<RestaurantOrderListItem["items"]>[number]) {
  return item.options ?? item.selected_options ?? [];
}

export default function OrderListPage() {
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

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<"all" | RestaurantOrderStatus>("all");
  const [displayAll, setDisplayAll] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const ordersQuery = useRestaurantOrders(
    {
      date: toApiDate(selectedDate),
      status: status === "all" ? undefined : status,
    },
    !!ownerQuery.data
  );

  const prepareMut = useMarkOrderPreparing();
  const readyMut = useMarkOrderReady();
  const deliverMut = useMarkOrderDelivering();
  const completeMut = useMarkOrderCompleted();
  const cancelMut = useCancelRestaurantOrder();

  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState("");

  const orders = useMemo(() => {
    const list = ordersQuery.data ?? [];
    return displayAll
      ? list
      : list.filter((order) => (order.status || "").toLowerCase() !== "completed");
  }, [displayAll, ordersQuery.data]);

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] text-stone-600">
        Loading orders...
      </div>
    );
  }

  const submitCancel = () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) return;
    setActionError("");
    cancelMut.mutate(
      { orderId: cancelTarget, reason },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason("");
        },
        onError: (requestError) => setActionError(extractApiError(requestError, "Order could not be cancelled.")),
      }
    );
  };
  const showActionError = (requestError: unknown) =>
    setActionError(extractApiError(requestError, "Order status could not be updated."));

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Orders" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        {/* Top Bar */}
        <div className="mb-8 flex w-full flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Operations</p><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Orders</h1><p className="mt-3 text-stone-600">Review and move every order through its journey.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex min-w-44 cursor-pointer items-center justify-between gap-4 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-stone-300">
                  {formatDate(selectedDate)}
                  <CalendarDays size={18} className="text-[#c83b2b]" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={8}
                  align="end"
                  className="z-50 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl"
                >
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) =>
                      setSelectedDate((date as Date) || new Date())
                    }
                    inline
                  />
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-stone-300">
                  <SlidersHorizontal size={17} className="text-[#c83b2b]" /> Filter
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={8}
                  align="end"
                  className="z-50 w-[320px] rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as typeof status)}
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700"
                    >
                      <option value="all">All active statuses</option>
                      {ORDER_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={displayAll}
                      onChange={(e) => setDisplayAll(e.target.checked)}
                      className="h-4 w-4 accent-[#c83b2b]"
                    />
                    Display all, including completed orders
                  </label>
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {actionError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(45,32,24,0.06)]"><div className="border-b border-stone-100 px-6 py-5"><h2 className="text-lg font-semibold">Order activity</h2><p className="mt-1 text-sm text-stone-500">{orders.length} order{orders.length === 1 ? "" : "s"} for the selected filters</p></div><div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[#faf8f5] text-xs font-bold uppercase tracking-wider text-stone-500">
                <th className="px-6 py-4 font-semibold">
                  Order ID
                </th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-stone-800">
              {ordersQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!ordersQuery.isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders for the selected filters.
                  </td>
                </tr>
              )}
              {orders.map((order) => {
                const s = (order.status || "").toLowerCase() as RestaurantOrderStatus;
                const canPrepare = s === "placed";
                const canReady = s === "preparing";
                const canDeliver = s === "preparing";
                const canComplete = s === "ready" || s === "delivering";
                const canCancel = s === "placed" || s === "preparing";
                const expanded = expandedOrders.includes(order.id);
                const items = orderItems(order);

                const dateStr = order.placed || order.created_at || order.date;
                const displayDate = dateStr
                  ? new Date(dateStr).toLocaleDateString("en-GB")
                  : "—";

                return (
                  <Fragment key={order.id}>
                    <tr
                      className="border-b border-stone-100 bg-white transition hover:bg-[#fdfbf8]"
                    >
                      <td className="px-6 py-4 font-medium">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrders((prev) =>
                              prev.includes(order.id)
                                ? prev.filter((id) => id !== order.id)
                                : [...prev, order.id],
                            )
                          }
                          className="inline-flex items-center gap-2 text-left font-semibold text-stone-950"
                        >
                          <ChevronDown size={16} className={`transition ${expanded ? "rotate-180" : ""}`} />
                          #{order.id}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium">{displayDate}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-stone-500">
                          <p className="flex items-center gap-2 text-sm font-semibold text-stone-900"><User size={14} />{customerName(order)}</p>
                          {order.delivery_phone && <p className="flex items-center gap-2"><Phone size={13} />{order.delivery_phone}</p>}
                          {order.delivery_email && <p className="flex items-center gap-2"><Mail size={13} />{order.delivery_email}</p>}
                          {[order.delivery_address, order.delivery_postal_code, order.delivery_city].filter(Boolean).length > 0 && (
                            <p className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0" />{[order.delivery_address, order.delivery_postal_code, order.delivery_city].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[s] ?? "bg-stone-100 text-stone-600 ring-stone-200"}`}>{STATUS_LABELS[s] ?? order.status}</span></td>
                      <td className="px-6 py-4 font-medium">
                        {orderTotal(order)} CHF
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex min-w-[360px] flex-wrap gap-2">
                          {canPrepare && <button onClick={() => { setActionError(""); prepareMut.mutate(order.id, { onError: showActionError }); }} className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">Preparing</button>}
                          {canReady && <button onClick={() => { setActionError(""); readyMut.mutate(order.id, { onError: showActionError }); }} className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">Ready</button>}
                          {canDeliver && <button onClick={() => { setActionError(""); deliverMut.mutate(order.id, { onError: showActionError }); }} className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">Delivering</button>}
                          {canComplete && <button onClick={() => { setActionError(""); completeMut.mutate(order.id, { onError: showActionError }); }} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Completed</button>}
                          {canCancel && <button onClick={() => setCancelTarget(order.id)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Cancel</button>}
                          {!canPrepare && !canReady && !canDeliver && !canComplete && !canCancel && <span className="text-xs text-gray-400">No actions available</span>}
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-stone-100 bg-[#faf8f5]">
                        <td colSpan={6} className="px-6 py-5">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <h3 className="text-sm font-bold text-stone-950">Order contents</h3>
                            {items.length === 0 ? (
                              <p className="mt-3 text-sm text-stone-500">No item details were returned for this order.</p>
                            ) : (
                              <div className="mt-3 divide-y divide-stone-100">
                                {items.map((item, idx) => {
                                  const options = itemOptions(item);
                                  return (
                                    <div key={item.id ?? idx} className="py-3 first:pt-0 last:pb-0">
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <p className="font-semibold text-stone-900">{item.quantity ?? 1}x {itemName(item)}</p>
                                          {options.length > 0 && (
                                            <ul className="mt-1 space-y-1 text-xs text-stone-500">
                                              {options.map((option, optionIdx) => (
                                                <li key={option.id ?? optionIdx}>
                                                  {option.option_name ? `${option.option_name}: ` : ""}{option.item_name ?? option.name ?? "Selected option"}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        {(item.total_price ?? item.price) != null && (
                                          <span className="text-sm font-semibold text-[#c83b2b]">{String(item.total_price ?? item.price)} CHF</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </main>

      {/* Cancel reason modal */}
      {cancelTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="mb-3 text-xl font-semibold text-stone-950">
              Cancel order #{cancelTarget}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason. This will be shared with the customer.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c83b2b]"
              placeholder="Reason for cancellation"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setCancelTarget(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 rounded-full border border-gray-300 text-sm"
              >
                Back
              </button>
              <button
                onClick={submitCancel}
                disabled={!cancelReason.trim() || cancelMut.isPending}
                className="rounded-full bg-[#c83b2b] px-4 py-2 text-sm text-white transition hover:bg-[#af3023] disabled:opacity-50"
              >
                {cancelMut.isPending ? "Cancelling..." : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
