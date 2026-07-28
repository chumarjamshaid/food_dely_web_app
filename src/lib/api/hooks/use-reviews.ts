import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface RestaurantReview {
  id: number;
  placed: string;
  stars: number;
  title: string;
  review: string;
  customer: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

export const reviewsKeys = {
  all: ["restaurant-reviews"] as const,
  list: (limit: number) => ["restaurant-reviews", limit] as const,
};

export function useRestaurantReviews(limit: number, enabled = true) {
  return useQuery({
    queryKey: reviewsKeys.list(limit),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantReview[]>(
        "/api/app/restaurant/reviews/",
        { params: { limit } },
      );
      return r.data;
    },
    enabled: enabled && limit > 0,
  });
}
