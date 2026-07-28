import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { RestaurantCategoryResponse } from '../types';

// Query keys for categories
export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  restaurantCategories: () => [...categoryKeys.all, 'restaurant'] as const,
};

// Fetch all restaurant categories (for sidebar)
async function fetchRestaurantCategories(): Promise<RestaurantCategoryResponse[]> {
  const response = await apiClient.get<RestaurantCategoryResponse[]>('/api/app/restaurant_categories/');
  return response.data;
}

/**
 * Hook to fetch all restaurant categories (for sidebar filter)
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.restaurantCategories(),
    queryFn: fetchRestaurantCategories,
    // Categories don't change often, so we can cache them longer
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
