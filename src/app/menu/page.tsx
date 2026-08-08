"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function MenuRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get("id");

  useEffect(() => {
    if (restaurantId) {
      // Redirect to the new route structure
      router.replace(`/partners/${restaurantId}`);
    } else {
      // If no ID, redirect to partners list
      router.replace("/partners");
    }
  }, [restaurantId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]">
      <div className="rounded-2xl border border-[#e9dfda] bg-white px-8 py-7 text-center shadow-[0_18px_45px_rgba(55,35,27,0.08)]">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-3 border-[#CD3625] border-t-transparent" />
        <p className="mt-4 text-sm font-bold text-[#6d625c]">Opening the restaurant menu…</p>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]">
        <div className="text-center">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-3 border-[#CD3625] border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-[#6d625c]">Loading menu…</p>
        </div>
      </div>
    }>
      <MenuRedirect />
    </Suspense>
  );
}
