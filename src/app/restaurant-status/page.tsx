"use client";

import { useLogout, useRestaurantOwnerProfile } from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RestaurantStatusPage() {
  const router = useRouter();
  const logout = useLogout();
  const tokenPresent = typeof window !== "undefined" ? hasAuthToken() : false;
  const owner = useRestaurantOwnerProfile(tokenPresent);

  useEffect(() => {
    if (!hasAuthToken()) router.replace("/signin");
  }, [router]);

  useEffect(() => {
    if (owner.data?.validation_status === "approved" && owner.data.active) router.replace("/dashboard");
  }, [owner.data?.active, owner.data?.validation_status, router]);

  if (!tokenPresent || owner.isLoading) return <main className="min-h-screen grid place-items-center text-gray-600">Checking restaurant status…</main>;

  const restaurant = owner.data;
  const declined = restaurant?.validation_status === "declined";
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-5 py-10 text-[#251f1c]">
      <section className="mx-auto mt-12 max-w-xl rounded-[30px] border border-[#eadfd9] bg-white p-7 shadow-[0_30px_90px_rgba(66,39,29,.12)] sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#b63825]">Restaurant validation</p>
        <h1 className="mt-3 text-3xl font-black">{declined ? "Changes are required" : "Your application is pending"}</h1>
        <p className="mt-4 leading-7 text-[#756a65]">
          {declined
            ? "Your restaurant application was declined. Review the reason below and contact FoodDely support before resubmitting your information."
            : "Your restaurant account was created successfully and is waiting for FoodDely approval. Management features will become available after approval."}
        </p>
        {declined && restaurant?.validation_decline_reason ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Reason:</strong> {restaurant.validation_decline_reason}</div> : null}
        <div className="mt-7 rounded-xl bg-stone-50 p-4 text-sm"><p className="font-semibold">{restaurant?.name ?? "Restaurant"}</p><p className="mt-1 capitalize text-stone-600">Status: {restaurant?.validation_status ?? "pending"}</p></div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => owner.refetch()} className="rounded-full bg-[#c83f28] px-6 py-3 font-bold text-white">Check again</button>
          <Link href="mailto:support@fooddely.com" className="rounded-full border border-stone-300 px-6 py-3 text-center font-bold">Contact support</Link>
          <button type="button" onClick={() => { logout(); router.replace("/signin"); }} className="rounded-full px-6 py-3 font-bold text-stone-600">Sign out</button>
        </div>
      </section>
    </main>
  );
}
