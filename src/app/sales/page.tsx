"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useRestaurantOwnerProfile,
  useRestaurantSales,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import * as Popover from "@radix-ui/react-popover";
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Receipt, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function toApiDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(d: Date) {
  return d.toLocaleDateString("en-GB");
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function SalesPage() {
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

  const [from, setFrom] = useState<Date>(startOfMonth());
  const [to, setTo] = useState<Date>(new Date());

  const fromStr = toApiDate(from);
  const toStr = toApiDate(to);
  const validRange = from <= to;

  const salesQuery = useRestaurantSales(
    fromStr,
    toStr,
    !!ownerQuery.data && validRange
  );

  if (!authChecked || ownerQuery.isLoading) {
    return <LoadingSpinner label="Loading sales…" fullScreen />;
  }

  const data = salesQuery.data;

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Sales" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Performance</p><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Sales overview</h1><p className="mt-3 text-stone-600">Track earnings and compare daily performance.</p></div>

        {/* Date range pickers */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <DateField
            label="From"
            date={from}
            onChange={(d) => d && setFrom(d)}
          />
          <DateField label="To" date={to} onChange={(d) => d && setTo(d)} />
        </div></div>

        {!validRange && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            &quot;From&quot; date must be on or before &quot;To&quot; date.
          </div>
        )}

        {/* Totals */}
        <div className="mb-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-[#c83b2b] p-6 text-white shadow-[0_18px_50px_rgba(45,32,24,0.09)]">
            <div className="mb-7 flex items-center justify-between"><p className="text-sm text-white/75">Total sales</p><CircleDollarSign size={21} /></div>
            <p className="text-3xl font-semibold tracking-tight">
              {salesQuery.isLoading
                ? "…"
                : `${data?.total_sales ?? "0"} CHF`}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {data
                ? `${data.date_from} → ${data.date_to}`
                : `${fromStr} → ${toStr}`}
            </p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)]">
            <div className="mb-7 flex items-center justify-between"><p className="text-sm text-stone-500">Service fees</p><span className="grid size-10 place-items-center rounded-xl bg-[#f7f3ed] text-[#c83b2b]"><Receipt size={19} /></span></div>
            <p className="text-3xl font-semibold tracking-tight">{salesQuery.isLoading ? "…" : `${data?.total_service_fees ?? "0"} CHF`}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)]">
            <div className="mb-7 flex items-center justify-between"><p className="text-sm text-stone-500">Net income</p><span className="grid size-10 place-items-center rounded-xl bg-[#f7f3ed] text-[#c83b2b]"><WalletCards size={19} /></span></div>
            <p className="text-3xl font-semibold tracking-tight">{salesQuery.isLoading ? "…" : `${data?.net_income ?? "0"} CHF`}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)]">
            <div className="mb-7 flex items-center justify-between"><p className="text-sm text-stone-500">Increase rate</p>{data && parseFloat(data.increase_rate) < 0 ? <ArrowDownRight className="text-red-500" /> : <ArrowUpRight className="text-emerald-600" />}</div>
            <p
              className={`text-3xl font-semibold tracking-tight ${data && parseFloat(data.increase_rate) < 0
                  ? "text-[#F93535]"
                  : "text-[#1F8F4E]"
                }`}
            >
              {salesQuery.isLoading
                ? "…"
                : data
                  ? `${data.increase_rate}%`
                  : "—"}
            </p>
            <p className="mt-2 text-xs text-stone-500">
              First vs. last day
            </p>
          </div>
        </div>

        {/* Daily sales table */}
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(45,32,24,0.06)]">
          <div className="border-b border-stone-100 px-6 py-5"><h2 className="text-lg font-semibold">Daily breakdown</h2><p className="mt-1 text-sm text-stone-500">Sales and net income by day</p></div><div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[#faf8f5] text-xs font-bold uppercase tracking-wider text-stone-500">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">
                  Sales (CHF)
                </th>
                <th className="px-6 py-4 font-semibold">Net (CHF)</th>
              </tr>
            </thead>
            <tbody className="text-sm text-stone-800">
              {salesQuery.isLoading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading sales...
                  </td>
                </tr>
              )}
              {!salesQuery.isLoading &&
                (data?.sales_items?.length ?? 0) === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No sales in the selected range.
                    </td>
                  </tr>
                )}
              {data?.sales_items?.map((item) => (
                <tr
                  key={item.date}
                  className="border-b border-stone-100 bg-white transition last:border-b-0 hover:bg-[#fdfbf8]"
                >
                  <td className="px-6 py-4 font-medium">{item.date}</td><td className="px-6 py-4">{item.sales}</td><td className="px-6 py-4 font-semibold text-emerald-700">{item.net}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </main>
    </div>
  );
}

function DateField({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date;
  onChange: (d: Date | null) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</label>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="flex min-w-40 cursor-pointer items-center justify-between gap-4 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-300">
            {formatDisplay(date)}
            <CalendarDays size={18} className="text-[#c83b2b]" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="z-50 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl"
          >
            <DatePicker
              selected={date}
              onChange={(d) => onChange(d as Date | null)}
              inline
            />
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
