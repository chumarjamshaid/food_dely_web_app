import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface Allergy {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

export const allergiesKeys = {
  all: ["allergies"] as const,
};

export function useAllergies(enabled = true) {
  return useQuery({
    queryKey: allergiesKeys.all,
    queryFn: async () => {
      const r = await apiClient.get<Allergy[]>("/api/app/allergies/");
      return r.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
