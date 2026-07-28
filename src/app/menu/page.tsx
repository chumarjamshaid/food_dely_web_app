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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-lg mt-4">Redirecting...</p>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading...</p>
        </div>
      </div>
    }>
      <MenuRedirect />
    </Suspense>
  );
}
