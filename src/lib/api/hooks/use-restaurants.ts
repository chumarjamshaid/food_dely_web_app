import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import type {
  RestaurantDetailResponse,
  RestaurantListItem,
  RestaurantQueryParams,
  RestaurantRegisterData,
} from "../types";

// Query keys for restaurants
export const restaurantKeys = {
  all: ["restaurants"] as const,
  lists: () => [...restaurantKeys.all, "list"] as const,
  list: (params: RestaurantQueryParams) =>
    [...restaurantKeys.lists(), params] as const,
  details: () => [...restaurantKeys.all, "detail"] as const,
  detail: (id: number) => [...restaurantKeys.details(), id] as const,
};

// Fetch restaurants list
async function fetchRestaurants(
  params?: RestaurantQueryParams,
): Promise<RestaurantListItem[]> {
  const response = await apiClient.get<RestaurantListItem[]>(
    "/api/app/restaurants/",
    {
      params: Object.fromEntries(
        Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== ""),
      ),
    },
  );
  return response.data;
}

// Fetch single restaurant detail
async function fetchRestaurantDetail(
  id: number,
): Promise<RestaurantDetailResponse> {
  const response = await apiClient.get<RestaurantDetailResponse>(
    `/api/app/restaurants/${id}/`,
  );
  return response.data;
}

/**
 * Hook to fetch list of restaurants with optional filters
 * @param params - Optional search and category filters
 */
export function useRestaurants(params?: RestaurantQueryParams) {
  return useQuery({
    queryKey: restaurantKeys.list(params || {}),
    queryFn: () => fetchRestaurants(params),
  });
}

/**
 * Complete restaurant/menu catalog used to resolve legacy cart and order
 * payloads that contain product IDs but omit their restaurant relationship.
 */
export function useRestaurantCatalog() {
  return useQuery({
    queryKey: [...restaurantKeys.all, "catalog"] as const,
    queryFn: async () => {
      const restaurants = await fetchRestaurants();
      return Promise.all(restaurants.map((restaurant) => fetchRestaurantDetail(restaurant.id)));
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch a single restaurant's details
 * @param id - Restaurant ID
 */
export function useRestaurantDetail(id: number) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => fetchRestaurantDetail(id),
    enabled: !!id, // Only fetch if id is provided
  });
}

// Register a new restaurant (multipart/form-data with a JSON `data` field)
async function registerRestaurant(
  data: RestaurantRegisterData,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  const response = await apiClient.post(
    "/api/app/restaurant/register/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

/**
 * Hook to register a new restaurant / business owner account
 */
export function useRegisterRestaurant() {
  return useMutation({
    mutationFn: registerRestaurant,
  });
}
