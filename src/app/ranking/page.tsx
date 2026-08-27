"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useApplyRestaurantRanking,
  useRestaurantOwnerProfile,
  useRestaurantRanking,
  useRestaurantRankingPreview,
} from "@/lib/api";
import { extractApiError } from "@/lib/api/error";
import { hasAuthToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Sparkles, TrendingUp } from "lucide-react";

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
  const [charge, setCharge] = useState<number>(0);
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rankingQuery = useRestaurantRanking(!!ownerQuery.data);
  const previewQuery = useRestaurantRankingPreview(charge, !!ownerQuery.data);
  const applyRanking = useApplyRestaurantRanking();

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] text-stone-600">
        Loading ranking...
      </div>
    );
  }

  const restaurant = ownerQuery.data;
  const data = rankingQuery.data;
  const preview = previewQuery.data;
  const oldRank = preview?.current_rank ?? data?.current_rank;
  const newRank = preview?.estimated_rank;
  const improvement = preview?.positions_change ?? null;
  const minCost = Number(data?.min_cost ?? 0);
  const maxCost = Number(data?.max_cost ?? 5);
  const step = Number(data?.step ?? 0.1);

  function apply() {
    setMessage("");
    setError("");
    applyRanking.mutate(
      {
        ranking_cost_per_order: charge.toFixed(2),
        ...(charge > 0
          ? { terms_accepted: agreed, terms_version: data?.terms_version }
          : {}),
      },
      {
        onSuccess: () => setMessage(charge > 0 ? "Rank+ has been enabled." : "Rank+ has been disabled."),
        onError: (requestError) => setError(extractApiError(requestError, "Rank+ could not be updated.")),
      },
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Ranking" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Marketplace visibility</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Move closer to the top with Rank+</h1>
          <p className="mt-3 leading-7 text-stone-600">Choose an additional charge per completed order. We&apos;ll preview your estimated position before you apply it.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl bg-stone-950 p-6 text-white shadow-[0_20px_60px_rgba(45,32,24,0.15)] sm:p-9">
            <div className="flex items-start justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Sparkles size={14} /> Rank+</span><h2 className="mt-5 text-2xl font-semibold">Set your growth budget</h2><p className="mt-2 text-sm text-stone-400">Extra charge applied to each completed order.</p></div><div className="rounded-2xl bg-[#c83b2b] px-4 py-3 text-right"><span className="block text-xs text-white/70">Selected</span><b className="text-xl">+{charge.toFixed(2)} CHF</b></div></div>
            <div className="mt-12">
              <input type="range" min={minCost} max={maxCost} step={step} value={charge} onChange={(e) => setCharge(parseFloat(e.target.value))} className="w-full accent-[#c83b2b]" />
              <div className="mt-3 flex justify-between text-xs text-stone-400"><span>{minCost.toFixed(2)} CHF</span><span>{maxCost.toFixed(2)} CHF</span></div>
            </div>
            <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
              <div><span className="text-xs text-stone-400">Current rank</span><b className="mt-1 block text-3xl">{typeof oldRank === "number" ? `#${oldRank}` : "—"}</b></div><ArrowRight className="text-stone-500" /><div><span className="text-xs text-stone-400">Estimated rank</span><b className="mt-1 block text-3xl text-[#ef8b7c]">{previewQuery.isLoading ? "…" : typeof newRank === "number" ? `#${newRank}` : "—"}</b></div>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)] sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Your restaurant</p>
            <h2 className="mt-2 text-2xl font-semibold">Review and apply</h2>
            <div className="mt-6 rounded-2xl bg-[#f7f3ed] p-5"><b className="block">{restaurant?.name ?? "—"}</b><span className="mt-2 flex items-start gap-2 text-sm leading-6 text-stone-500"><MapPin size={16} className="mt-1 shrink-0" />{[restaurant?.address, restaurant?.postal_code, restaurant?.city].filter(Boolean).join(", ") || "No address on file"}</span></div>

          {improvement !== null && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${improvement > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : improvement < 0
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-stone-200 bg-stone-50 text-stone-600"
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

          {previewQuery.isError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Couldn&apos;t compute the new rank. Try a different value.
            </div>
          )}

          {charge > 0 && <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-[#c83b2b]"
            />
            <span className="text-sm leading-6 text-stone-700">
              I agree to the Rank+ terms and conditions.
            </span>
          </label>}

          {message && <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="button"
            onClick={apply}
            disabled={(charge > 0 && !agreed) || applyRanking.isPending || !data}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c83b2b] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#af3023] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applyRanking.isPending ? "Saving…" : charge > 0 ? `Apply Rank+ (+${charge.toFixed(2)} CHF)` : "Disable Rank+"}<TrendingUp size={17} />
          </button>
          {data?.terms_version && charge > 0 && <p className="mt-3 text-center text-xs text-stone-400">Terms version: {data.terms_version}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
