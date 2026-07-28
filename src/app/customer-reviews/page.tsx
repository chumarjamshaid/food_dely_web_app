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
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading reviews...
      </div>
    );
  }

  const reviews = reviewsQuery.data ?? [];
  // If the backend returned fewer than the requested limit, we've reached the end.
  const reachedEnd =
    !reviewsQuery.isFetching && reviews.length < limit;

  return (
    <div className="bg-white min-h-screen">
      <RestaurantManagerHeader active="Reviews" />

      <main className="bg-white max-w-[1400px] px-8 py-4 mx-auto pt-8 pb-16">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[28px] md:text-3xl font-medium text-black">
            Customer reviews
          </h1>
          <p className="text-[#424242] text-base">
            Recent feedback from your customers
          </p>
        </div>

        {reviewsQuery.isLoading && reviews.length === 0 && (
          <p className="py-12 text-center text-gray-500">Loading reviews…</p>
        )}

        {!reviewsQuery.isLoading && reviews.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
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
              className="bg-[#CD3625] text-white rounded-full px-8 py-3 text-sm font-semibold disabled:opacity-50"
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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-2">
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
