"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useRestaurantOwnerProfile,
  useRestaurantSales,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading sales...
      </div>
    );
  }

  const data = salesQuery.data;

  return (
    <div className="bg-white h-full w-full">
      <RestaurantManagerHeader active="Sales" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[28px] md:text-3xl font-medium text-black">
            Sales
          </h1>
          <p className="text-[#424242] text-base">
            Daily sales for the selected period
          </p>
        </div>

        {/* Date range pickers */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">
          <DateField
            label="From"
            date={from}
            onChange={(d) => d && setFrom(d)}
          />
          <DateField label="To" date={to} onChange={(d) => d && setTo(d)} />
        </div>

        {!validRange && (
          <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            &quot;From&quot; date must be on or before &quot;To&quot; date.
          </div>
        )}

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8">
            <p className="text-sm text-[#7B7B7B] mb-2">Total sales</p>
            <p className="text-4xl font-bold text-black">
              {salesQuery.isLoading
                ? "…"
                : `${data?.total_sales ?? "0"} CHF`}
            </p>
            <p className="text-sm text-[#7B7B7B] mt-2">
              {data
                ? `${data.date_from} → ${data.date_to}`
                : `${fromStr} → ${toStr}`}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8">
            <p className="text-sm text-[#7B7B7B] mb-2">Increase rate</p>
            <p
              className={`text-4xl font-bold ${data && parseFloat(data.increase_rate) < 0
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
            <p className="text-sm text-[#7B7B7B] mt-2">
              Compared to previous period
            </p>
          </div>
        </div>

        {/* Daily sales table */}
        <div className="rounded-2xl bg-[#FAFAFA] shadow-lg overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[#E5E5E5] text-[#7B7B7B] text-lg font-medium">
                <th className="px-6 py-4 font-medium rounded-tl-2xl">Date</th>
                <th className="px-6 py-4 font-medium rounded-tr-2xl">
                  Sales (CHF)
                </th>
              </tr>
            </thead>
            <tbody className="text-[#232323] text-lg">
              {salesQuery.isLoading && (
                <tr>
                  <td
                    colSpan={2}
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
                      colSpan={2}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No sales in the selected range.
                    </td>
                  </tr>
                )}
              {data?.sales_items?.map((item) => (
                <tr
                  key={item.date}
                  className="bg-white border-b border-[#F0F0F0] last:border-b-0"
                >
                  <td className="px-6 py-4 font-medium">{item.date}</td>
                  <td className="px-6 py-4 font-medium">{item.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="flex items-center bg-white rounded-full px-6 py-3 shadow border border-[#F5E3D8] text-[#F97252] text-base font-medium gap-4 cursor-pointer">
            {formatDisplay(date)}
            <Image
              src="/images/calendar.png"
              alt="Calendar"
              width={22}
              height={22}
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-md"
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
