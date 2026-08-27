"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarDays, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

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
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as typeof status)}
                    >
                      <SelectTrigger className="w-full px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {ORDER_STATUS_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

                const dateStr = order.placed || order.created_at || order.date;
                const displayDate = dateStr
                  ? new Date(dateStr).toLocaleDateString("en-GB")
                  : "—";

                return (
                  <tr
                    key={order.id}
                    className="border-b border-stone-100 bg-white transition last:border-b-0 hover:bg-[#fdfbf8]"
                  >
                    <td className="px-6 py-4 font-medium">#{order.id}</td>
                    <td className="px-6 py-4 font-medium">{displayDate}</td>
                    <td className="px-6 py-4 font-medium">
                      {customerName(order)}
                    </td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[s] ?? "bg-stone-100 text-stone-600 ring-stone-200"}`}>{STATUS_LABELS[s] ?? order.status}</span></td>
                    <td className="px-6 py-4 font-medium">
                      {orderTotal(order)} CHF
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <button className="grid size-9 place-items-center rounded-full border border-stone-200 transition hover:bg-stone-50"><MoreHorizontal size={18} /></button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content
                            sideOffset={4}
                            align="end"
                            className="z-50 flex min-w-[210px] flex-col rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
                          >
                            {canPrepare && (
                              <button
                                onClick={() => { setActionError(""); prepareMut.mutate(order.id, { onError: showActionError }); }}
                                className="rounded-xl px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                              >
                                Mark as Preparing
                              </button>
                            )}
                            {canReady && (
                              <button
                                onClick={() => { setActionError(""); readyMut.mutate(order.id, { onError: showActionError }); }}
                                className="rounded-xl px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                              >
                                Mark as Ready
                              </button>
                            )}
                            {canDeliver && (
                              <button
                                onClick={() => { setActionError(""); deliverMut.mutate(order.id, { onError: showActionError }); }}
                                className="rounded-xl px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                              >
                                Mark as Delivering
                              </button>
                            )}
                            {canComplete && (
                              <button
                                onClick={() => { setActionError(""); completeMut.mutate(order.id, { onError: showActionError }); }}
                                className="rounded-xl px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                              >
                                Mark as Completed
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setCancelTarget(order.id)}
                                className="rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Cancel order
                              </button>
                            )}
                            {!canPrepare &&
                              !canReady &&
                              !canDeliver &&
                              !canComplete &&
                              !canCancel && (
                                <span className="px-3 py-2 text-sm text-gray-400">
                                  No actions available
                                </span>
                              )}
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </td>
                  </tr>
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
