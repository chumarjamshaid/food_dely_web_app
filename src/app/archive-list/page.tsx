"use client";

import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useRestaurantOrders,
  useRestaurantOwnerProfile,
  type RestaurantOrderListItem,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ARCHIVE_STATUSES = ["completed", "can_cust", "can_rest"] as const;

function orderDate(order: RestaurantOrderListItem) {
  return order.placed || order.created_at || order.date || "";
}

function orderTotal(order: RestaurantOrderListItem) {
  const value = order.total_price ?? order.price ?? 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function customerName(order: RestaurantOrderListItem) {
  return (
    [order.customer?.firstname, order.customer?.lastname].filter(Boolean).join(" ") ||
    [order.delivery_firstname, order.delivery_lastname].filter(Boolean).join(" ") ||
    "Guest customer"
  );
}

function statusLabel(status: string) {
  return status
    .replace("can_cust", "Cancelled by customer")
    .replace("can_rest", "Cancelled by restaurant")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function ArchiveListPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const tokenPresent = typeof window !== "undefined" ? hasAuthToken() : false;

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace("/signin");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const ownerQuery = useRestaurantOwnerProfile(tokenPresent);
  useEffect(() => {
    const error = ownerQuery.error as { response?: { status?: number } } | null;
    if (error?.response?.status === 404) router.replace("/");
  }, [ownerQuery.error, router]);

  const enabled = Boolean(ownerQuery.data);
  const completedQuery = useRestaurantOrders({ status: "completed" }, enabled);
  const customerCancelledQuery = useRestaurantOrders({ status: "can_cust" }, enabled);
  const restaurantCancelledQuery = useRestaurantOrders({ status: "can_rest" }, enabled);

  const queries = [completedQuery, customerCancelledQuery, restaurantCancelledQuery];
  const isLoading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error;
  const orders = useMemo(() => {
    const unique = new Map<number, RestaurantOrderListItem>();
    for (const list of [
      completedQuery.data,
      customerCancelledQuery.data,
      restaurantCancelledQuery.data,
    ]) {
      for (const order of list ?? []) unique.set(order.id, order);
    }
    return [...unique.values()].sort(
      (left, right) => new Date(orderDate(right)).getTime() - new Date(orderDate(left)).getTime(),
    );
  }, [completedQuery.data, customerCancelledQuery.data, restaurantCancelledQuery.data]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesDate = !date || orderDate(order).slice(0, 10) === date;
      const matchesSearch =
        !term ||
        String(order.id).includes(term) ||
        customerName(order).toLowerCase().includes(term) ||
        String(order.delivery_address ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [date, orders, search, status]);

  function exportCsv() {
    const header = ["Order ID", "Date", "Customer", "Status", "Total (CHF)"];
    const rows = filteredOrders.map((order) => [
      order.id,
      orderDate(order),
      customerName(order),
      statusLabel(order.status),
      orderTotal(order).toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fooddely-order-archive-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!authChecked || ownerQuery.isLoading) {
    return <LoadingSpinner label="Loading archive…" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      <RestaurantManagerHeader active="Orders" />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-medium text-black">Order archive</h1>
            <p className="mt-1 text-gray-600">Completed and cancelled restaurant orders.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/order-list" className="rounded-full border border-[#CD3625] px-5 py-2.5 text-sm font-semibold text-[#CD3625]">
              Active orders
            </Link>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredOrders.length === 0}
              className="rounded-full bg-[#CD3625] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order, customer or address" className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-normal">
              <option value="all">All archived orders</option>
              {ARCHIVE_STATUSES.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-normal" />
          </label>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load archived orders. Please try again.</div> : null}
        {isLoading ? <LoadingSpinner label="Loading archived orders…" className="py-12" /> : null}
        {!isLoading && !error && filteredOrders.length === 0 ? <div className="rounded-2xl border border-gray-200 px-6 py-12 text-center text-gray-500">No archived orders match these filters.</div> : null}

        {filteredOrders.length > 0 ? (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)}
            </div>
            <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Total</th></tr></thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-100">
                      <td className="px-5 py-4 font-semibold">#{order.id}</td>
                      <td className="whitespace-nowrap px-5 py-4">{formatDate(orderDate(order))}</td>
                      <td className="px-5 py-4">{customerName(order)}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">{orderTotal(order).toFixed(2)} CHF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const cancelled = status.startsWith("cancel");
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cancelled ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{statusLabel(status)}</span>;
}

function OrderCard({ order }: { order: RestaurantOrderListItem }) {
  return (
    <article className="rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Order #{order.id}</p><p className="mt-1 text-sm text-gray-500">{formatDate(orderDate(order))}</p></div><StatusBadge status={order.status} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">Customer</p><p className="font-medium">{customerName(order)}</p></div><div className="text-right"><p className="text-gray-500">Total</p><p className="font-semibold">{orderTotal(order).toFixed(2)} CHF</p></div></div>
    </article>
  );
}
