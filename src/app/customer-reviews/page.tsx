"use client";
import RestaurantManagerHeader from "@/components/RestaurantManagerHeader";
import {
  useRestaurantOwnerProfile,
  useRestaurantReviews,
} from "@/lib/api";
import type { RestaurantReview } from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageSquareText, Star } from "lucide-react";

const PAGE_SIZE = 5;

export default function CustomerReviewsPage() {
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

  const [limit, setLimit] = useState(PAGE_SIZE);
  const reviewsQuery = useRestaurantReviews(limit, !!ownerQuery.data);

  if (!authChecked || ownerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] text-stone-600">
        Loading reviews...
      </div>
    );
  }

  const reviews = reviewsQuery.data ?? [];
  // If the backend returned fewer than the requested limit, we've reached the end.
  const reachedEnd =
    !reviewsQuery.isFetching && reviews.length < limit;
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + (review.stars ?? 0), 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-stone-950">
      <RestaurantManagerHeader active="Reviews" />

      <main className="mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#c83b2b]">Customer voice</p><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Customer reviews</h1><p className="mt-3 text-base text-stone-600">
            Recent feedback from your customers
          </p></div>
          <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-500"><Star size={21} fill="currentColor" /></span><div><b className="block text-2xl leading-none">{average.toFixed(1)}</b><small className="text-stone-500">Across {reviews.length} loaded review{reviews.length === 1 ? "" : "s"}</small></div></div>
        </div>

        {reviewsQuery.isLoading && reviews.length === 0 && (
          <p className="py-12 text-center text-gray-500">Loading reviews…</p>
        )}

        {!reviewsQuery.isLoading && reviews.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500"><MessageSquareText className="mx-auto mb-3 text-stone-300" size={32} />
            No reviews yet.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>

        {reviews.length > 0 && !reachedEnd && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
              disabled={reviewsQuery.isFetching}
              className="rounded-full bg-[#c83b2b] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#af3023] disabled:opacity-50"
            >
              {reviewsQuery.isFetching ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ReviewCard({ review }: { review: RestaurantReview }) {
  const stars = Math.max(0, Math.min(5, review.stars ?? 0));
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(45,32,24,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[#F5B400] text-lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>{i < stars ? "★" : "☆"}</span>
          ))}
        </div>
        <span className="text-xs text-gray-500">{review.placed}</span>
      </div>
      {review.title && (
        <h3 className="text-base font-semibold text-black">{review.title}</h3>
      )}
      <p className="text-sm text-gray-700">{review.review}</p>
      <p className="text-xs text-gray-500 mt-1">
        — {review.customer?.firstname} {review.customer?.lastname}
      </p>
    </div>
  );
}
