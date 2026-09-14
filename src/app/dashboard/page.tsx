"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useRestaurantOrders,
  useRestaurantOwnerProfile,
  useRestaurantRanking,
  useRestaurantSales,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { ArrowUpRight, Clock3, MapPin, ReceiptText, Settings2, Sparkles, TrendingUp } from "lucide-react";
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
  const rankingQuery = useRestaurantRanking(!!ownerQuery.data);

  const restaurant = ownerQuery.data;

  if (!authChecked || ownerQuery.isLoading) {
    return <LoadingSpinner label="Loading dashboard…" fullScreen />;
  }


  const todaySales = salesQuery.data?.total_sales;
  const pendingOrdersCount = pendingOrdersQuery.data?.length ?? 0;
  const address = restaurant
    ? [restaurant.address, restaurant.postal_code, restaurant.city]
      .filter(Boolean)
      .join(", ")
    : "";

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Dashboard" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Restaurant overview</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Good to see you, {restaurant?.name ?? "Partner"}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><MapPin size={16} />{address || "No address on file"}</p>
          </div>
          <p className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm">Today · {today}</p>
        </section>

        <section className="mb-6 grid gap-5 md:grid-cols-3">
          {[
            { label: "New orders", value: pendingOrdersQuery.isLoading ? "…" : pendingOrdersCount, note: "Waiting for your response", href: "/order-list", icon: ReceiptText },
            { label: "Today's sales", value: salesQuery.isLoading ? "…" : `${todaySales ?? "0"} CHF`, note: "Revenue recorded today", href: "/sales", icon: TrendingUp },
            { label: "Restaurant rank", value: rankingQuery.data?.current_rank ?? "—", note: "Your current marketplace position", href: "/ranking", icon: Sparkles },
          ].map(({ label, value, note, href, icon: Icon }, index) => (
            <Link key={label} href={href} className={`group rounded-3xl border p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)] transition hover:-translate-y-1 ${index === 0 ? "border-[#c83b2b] bg-[#c83b2b] text-white" : "border-stone-200 bg-white"}`}>
              <div className="mb-8 flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${index === 0 ? "bg-white/15" : "bg-[#f7f3ed] text-[#c83b2b]"}`}><Icon size={21} /></span><ArrowUpRight size={20} className={index === 0 ? "text-white/70" : "text-stone-400 transition group-hover:text-[#c83b2b]"} /></div>
              <p className={`text-sm font-medium ${index === 0 ? "text-white/75" : "text-stone-500"}`}>{label}</p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.04em]">{value}</p>
              <p className={`mt-3 text-sm ${index === 0 ? "text-white/75" : "text-stone-500"}`}>{note}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Quick actions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Run your restaurant</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/order-list" className="flex items-center gap-4 rounded-2xl bg-[#f7f3ed] p-4 transition hover:bg-[#efe7dd]"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#c83b2b]"><ReceiptText size={19} /></span><span><b className="block text-sm">Manage orders</b><small className="text-stone-500">Prepare and update statuses</small></span></Link>
              <Link href="/restaurant-settings?tab=openings" className="flex items-center gap-4 rounded-2xl bg-[#f7f3ed] p-4 transition hover:bg-[#efe7dd]"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#c83b2b]"><Clock3 size={19} /></span><span><b className="block text-sm">Opening hours</b><small className="text-stone-500">Update your weekly schedule</small></span></Link>
              <Link href="/ranking" className="flex items-center gap-4 rounded-2xl bg-[#f7f3ed] p-4 transition hover:bg-[#efe7dd]"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#c83b2b]"><Sparkles size={19} /></span><span><b className="block text-sm">Rank+</b><small className="text-stone-500">Improve marketplace visibility</small></span></Link>
              <Link href="/restaurant-settings" className="flex items-center gap-4 rounded-2xl bg-[#f7f3ed] p-4 transition hover:bg-[#efe7dd]"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#c83b2b]"><Settings2 size={19} /></span><span><b className="block text-sm">Restaurant settings</b><small className="text-stone-500">Details, delivery and profile</small></span></Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-stone-950 p-7 text-white shadow-[0_18px_50px_rgba(45,32,24,0.12)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ef8b7c]">Rank+</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Be seen before the rush begins.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">Preview a boosted position and choose the commission that fits your growth plan.</p>
            <Link href="/ranking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Explore ranking <ArrowUpRight size={17} /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
