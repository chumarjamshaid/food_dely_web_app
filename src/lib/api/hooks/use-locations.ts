import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface AddressSuggestion {
  description: string;
  place_id: string;
}

export const locationKeys = {
  autocomplete: (query: string) => ["locations", "autocomplete", query] as const,
};

export function useAddressAutocomplete(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: locationKeys.autocomplete(normalizedQuery),
    queryFn: async () => {
      const response = await apiClient.get<AddressSuggestion[]>(
        "/api/app/locations/autocomplete/",
        { params: { query: normalizedQuery } },
      );
      return response.data;
    },
    enabled: normalizedQuery.length >= 3,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
