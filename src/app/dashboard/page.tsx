"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useRestaurantOrders,
  useRestaurantOwnerProfile,
  useRestaurantSales,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const tokenPresent = typeof window !== "undefined" ? hasAuthToken() : false;

  // Redirect unauthenticated users to /signin.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasAuthToken()) {
      router.replace("/signin");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const ownerQuery = useRestaurantOwnerProfile(tokenPresent);

  // If GET /api/app/restaurant/ returns 404, the user is authenticated but not
  // a restaurant owner — push them back to the customer home.
  useEffect(() => {
    const err = ownerQuery.error as { response?: { status?: number } } | null;
    if (err?.response?.status === 404) {
      router.replace("/");
    }
  }, [ownerQuery.error, router]);

  const today = todayISO();
  const salesQuery = useRestaurantSales(today, today, !!ownerQuery.data);
  const pendingOrdersQuery = useRestaurantOrders(
    { date: today, status: "placed" },
    !!ownerQuery.data
  );

  const restaurant = ownerQuery.data;

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading dashboard...
      </div>
    );
  }


  const todaySales = salesQuery.data?.total_sales;
  const pendingOrdersCount = pendingOrdersQuery.data?.length ?? 0;
  const address = restaurant
    ? [restaurant.address, restaurant.postal_code, restaurant.city]
      .filter(Boolean)
      .join(", ")
    : "";

  return (
    <div className="bg-white h-full w-full">
      <RestaurantManagerHeader active="Dashboard" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-[28px] md:text-3xl font-medium text-black">
              {restaurant?.name ?? "—"}
            </h1>
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="flex items-center rounded-full px-6 py-3 shadow-sm text-[#F97252] text-base font-normal gap-4">
                {address || "No address on file"}
                <Image
                  src="/images/rightarrow.png"
                  alt="arrow"
                  width={22}
                  height={15}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-stretch">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium text-black mb-4">
              Restaurant ranking
            </h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8 flex flex-col items-center text-center gap-2 h-full flex-1">
              <span className="text-5xl font-bold text-black">
                {restaurant?.ranking ?? "—"}
              </span>
              <span className="text-base text-[#424242]">
                Current ranking
              </span>
              <span className="text-[#F97252] text-base">Rank +</span>
              <Link
                href="/ranking"
                className="mt-4 bg-[#CD3625] text-white rounded-full px-6 py-3 text-base font-semibold"
              >
                Boost your rank
              </Link>
            </div>
          </div>

          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium text-black mb-4">Orders</h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8 flex flex-col items-center text-center gap-2 h-full flex-1">
              <span className="text-5xl font-bold text-black">
                {pendingOrdersQuery.isLoading ? "…" : pendingOrdersCount}
              </span>
              <span className="text-base text-[#424242]">
                New orders today
              </span>
              <Link
                href="/order-list"
                className="mt-4 bg-[#CD3625] text-white rounded-full px-6 py-3 text-base font-semibold"
              >
                Manage orders
              </Link>
            </div>
          </div>

          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium text-black mb-4">&nbsp;</h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8 flex flex-col items-center text-center gap-2 h-full flex-1">
              <span className="text-2xl font-semibold text-black">
                Opening hours
              </span>
              <span className="text-base text-[#424242]">
                Manage your weekly schedule
              </span>
              <Link
                href="/restaurant-settings?tab=openings"
                className="mt-4 border border-[#CD3625] text-[#CD3625] rounded-full px-6 py-3 text-base font-semibold bg-white"
              >
                Edit hours
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium text-black mb-4">Today sales</h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8 flex flex-col items-center text-center gap-2 h-full flex-1">
              <span className="text-3xl font-bold text-black">
                {salesQuery.isLoading
                  ? "…"
                  : `${todaySales ?? "0"} CHF`}
              </span>
              <span className="text-base text-[#424242]">
                {salesQuery.data?.date_from ?? today}
              </span>
              <Link
                href="/sales"
                className="mt-4 border border-[#CD3625] text-[#CD3625] rounded-full px-6 py-3 text-base font-semibold bg-white"
              >
                More Information
              </Link>
            </div>
          </div>

          <div className="h-full flex flex-col">
            <h2 className="text-xl font-medium text-black mb-4">Settings</h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-8 flex flex-col items-center text-center gap-2 h-full flex-1">
              <span className="text-2xl font-semibold text-black">
                Restaurant
              </span>
              <span className="text-base text-[#424242]">
                Details, delivery and openings
              </span>
              <Link
                href="/restaurant-settings"
                className="mt-4 border border-[#F97252] text-[#F97252] rounded-full px-6 py-3 text-base font-semibold bg-white"
              >
                Open settings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
