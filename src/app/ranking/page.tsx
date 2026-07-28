"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useRestaurantOwnerProfile,
  useRestaurantRanking,
} from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RankingPage() {
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

  // Slider 0 — 5 CHF, step 0.10
  const [charge, setCharge] = useState<number>(0.1);
  const [agreed, setAgreed] = useState(true);

  const rankingQuery = useRestaurantRanking(charge, !!ownerQuery.data);

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading ranking...
      </div>
    );
  }

  const restaurant = ownerQuery.data;
  const data = rankingQuery.data;
  const oldRank = data?.old_rank ?? restaurant?.ranking;
  const newRank = data?.new_rank;
  const improvement =
    typeof oldRank === "number" && typeof newRank === "number"
      ? oldRank - newRank
      : null;

  return (
    <div className="bg-white">
      <RestaurantManagerHeader active="Ranking" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[28px] md:text-3xl font-medium text-black">
            Ranking
          </h1>
          <p className="text-[#424242] text-base">
            Boost your visibility with Rank+. Pick an additional charge per
            order to see how it would change your rank.
          </p>
        </div>

        {/* Rank+ slider card */}
        <div className="rounded-2xl p-12 mb-10 max-w-2xl mx-auto bg-gradient-to-br from-[#F98443] to-[#F84775] flex flex-col gap-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <span className="text-white text-[28px] font-medium">Rank +</span>
            <span className="text-white text-lg font-normal">
              Extra charge per order
            </span>
          </div>

          <div className="flex items-center justify-between text-white">
            <span className="text-base">+0.00 CHF</span>
            <span className="bg-white text-[#F97252] rounded-full px-6 py-2 text-lg font-semibold">
              +{charge.toFixed(2)} CHF
            </span>
            <span className="text-base">+5.00 CHF</span>
          </div>

          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={charge}
            onChange={(e) => setCharge(parseFloat(e.target.value))}
            className="w-full accent-white"
          />
        </div>

        {/* Ranking calculator */}
        <div className="max-w-2xl mx-auto w-full">
          <h2 className="text-[24px] md:text-[32px] font-bold text-black mb-8">
            New ranking calculator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
            <div className="col-span-2">
              <label className="block text-lg font-normal text-black mb-3">
                Restaurant
              </label>
              <div className="flex items-center rounded-full px-6 py-3 shadow-sm text-[#F97252] text-base font-normal gap-4">
                {restaurant?.name ?? "—"}
              </div>
              <span className="text-[#8F8F8F] text-sm mt-2 block pl-2">
                {[
                  restaurant?.address,
                  restaurant?.postal_code,
                  restaurant?.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address on file"}
              </span>
            </div>
            <div className="flex flex-col items-center md:items-end justify-center mt-2">
              <label className="block text-lg font-normal text-black mb-3 md:text-right w-full">
                Your new rank
              </label>
              <span className="bg-[#CD3625] text-white rounded-full px-10 py-3 text-xl font-semibold">
                {rankingQuery.isLoading
                  ? "…"
                  : typeof newRank === "number"
                    ? `#${newRank}`
                    : "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
            <div className="col-span-2">
              <label className="block text-lg font-normal text-black mb-3">
                Your current rank
              </label>
              <div className="flex items-center rounded-full px-6 py-3 shadow-sm text-[#F97252] text-base font-normal gap-4">
                Without additional charge
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end justify-center mt-2">
              <span className="bg-[#CD3625] text-white rounded-full px-10 py-3 text-xl font-semibold mt-8 md:mt-0">
                {typeof oldRank === "number" ? `#${oldRank}` : "—"}
              </span>
            </div>
          </div>

          {improvement !== null && (
            <div
              className={`mb-6 px-4 py-3 rounded-lg text-sm ${improvement > 0
                  ? "bg-green-500/10 border border-green-500 text-green-700"
                  : improvement < 0
                    ? "bg-red-500/10 border border-red-500 text-red-700"
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                }`}
            >
              {improvement > 0
                ? `Adding +${charge.toFixed(2)} CHF moves you up ${improvement} place${improvement === 1 ? "" : "s"
                }.`
                : improvement < 0
                  ? `Adding +${charge.toFixed(2)} CHF would drop you ${Math.abs(
                    improvement
                  )} place${Math.abs(improvement) === 1 ? "" : "s"}.`
                  : `Adding +${charge.toFixed(2)} CHF wouldn't change your rank.`}
            </div>
          )}

          {rankingQuery.isError && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-500/10 border border-red-500 text-red-700">
              Couldn&apos;t compute the new rank. Try a different value.
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pl-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-[#CD3625]"
            />
            <span className="text-base text-black">
              I agree to the Rank+ terms and conditions.
            </span>
          </div>

          <button
            disabled={!agreed}
            className="mt-6 bg-[#CD3625] text-white rounded-full px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            title="Activation endpoint not yet documented"
          >
            Apply Rank+ (+{charge.toFixed(2)} CHF)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Note: the activation endpoint is not yet documented in the API; this
            preview is read-only.
          </p>
        </div>
      </main>
    </div>
  );
}
