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
import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";
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
  cancel_customer: "Cancelled (customer)",
  cancel_restaurant: "Cancelled (restaurant)",
};

const STATUS_COLORS: Record<RestaurantOrderStatus, string> = {
  placed: "text-[#F8B602]",
  preparing: "text-[#F97252]",
  ready: "text-[#1F8F4E]",
  delivering: "text-[#1F8F4E]",
  completed: "text-[#1F8F4E]",
  cancel_customer: "text-[#F93535]",
  cancel_restaurant: "text-[#F93535]",
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

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading orders...
      </div>
    );
  }

  const submitCancel = () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) return;
    cancelMut.mutate(
      { orderId: cancelTarget, reason },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason("");
        },
      }
    );
  };

  return (
    <div className="bg-white">
      <RestaurantManagerHeader active="Orders" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 w-full gap-4">
          <h2 className="text-[24px] md:text-[32px] font-semibold text-black">
            Order List
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Popover.Root>
              <Popover.Trigger asChild>
                <div className="flex items-center bg-[#FFF] rounded-full px-8 py-3 shadow border border-[#F5E3D8] text-[#F97252] text-lg font-medium gap-4 cursor-pointer">
                  {formatDate(selectedDate)}
                  <Image
                    src="/images/calendar.png"
                    alt="Calendar"
                    width={24}
                    height={24}
                  />
                </div>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={8}
                  align="end"
                  className="z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-md"
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
                <button className="flex items-center bg-[#FFF] rounded-full px-8 py-3 shadow border border-[#F5E3D8] text-[#F97252] text-lg font-medium gap-2">
                  Filter
                  <Image
                    src="/images/filter.png"
                    alt="Filter"
                    width={24}
                    height={24}
                  />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={8}
                  align="end"
                  className="z-50 bg-white border border-gray-200 rounded-lg p-6 shadow-md w-[320px]"
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

        {/* Table */}
        <div className="rounded-2xl bg-[#FAFAFA] shadow-lg overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[#E5E5E5] text-[#7B7B7B] text-lg font-medium">
                <th className="px-6 py-4 font-medium rounded-tl-2xl">
                  Order ID
                </th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium rounded-tr-2xl">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-[#232323] text-lg">
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
                    className="bg-white border-b border-[#F0F0F0] last:border-b-0"
                  >
                    <td className="px-6 py-4 font-medium">#{order.id}</td>
                    <td className="px-6 py-4 font-medium">{displayDate}</td>
                    <td className="px-6 py-4 font-medium">
                      {customerName(order)}
                    </td>
                    <td
                      className={`px-6 py-4 font-medium ${STATUS_COLORS[s] ?? "text-[#7B7B7B]"
                        }`}
                    >
                      {STATUS_LABELS[s] ?? order.status}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {orderTotal(order)} CHF
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <button className="flex items-center justify-center w-8 h-8">
                            <svg
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="5" r="2" fill="#232323" />
                              <circle cx="12" cy="12" r="2" fill="#232323" />
                              <circle cx="12" cy="19" r="2" fill="#232323" />
                            </svg>
                          </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content
                            sideOffset={4}
                            align="end"
                            className="z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-md min-w-[200px] flex flex-col"
                          >
                            {canPrepare && (
                              <button
                                onClick={() => prepareMut.mutate(order.id)}
                                className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                Mark as Preparing
                              </button>
                            )}
                            {canReady && (
                              <button
                                onClick={() => readyMut.mutate(order.id)}
                                className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                Mark as Ready
                              </button>
                            )}
                            {canDeliver && (
                              <button
                                onClick={() => deliverMut.mutate(order.id)}
                                className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                Mark as Delivering
                              </button>
                            )}
                            {canComplete && (
                              <button
                                onClick={() => completeMut.mutate(order.id)}
                                className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                Mark as Completed
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setCancelTarget(order.id)}
                                className="text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-[#F93535]"
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
          </table>
        </div>
      </main>

      {/* Cancel reason modal */}
      {cancelTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-black mb-3">
              Cancel order #{cancelTarget}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason. This will be shared with the customer.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CD3625]"
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
                className="px-4 py-2 rounded-full bg-[#CD3625] text-white text-sm disabled:opacity-50"
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
