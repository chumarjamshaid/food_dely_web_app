import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface DiscountMenuItemRef {
  id: number;
  name: string;
  description?: string;
}

export interface RestaurantDiscount {
  id: number;
  name: string;
  description: string;
  active: boolean;
  price_reduction_percentage: number | null;
  price_reduction_amount: number | null;
  price_reduction_min: number | null;
  menu_items: DiscountMenuItemRef[];
}

export interface DiscountPayload {
  name: string;
  description: string;
  price_reduction_percentage: number | null;
  price_reduction_amount: number | null;
  price_reduction_min: number | null;
  menu_items: number[];
}

export const discountsKeys = {
  all: ["restaurant-discounts"] as const,
  detail: (id: number) => ["restaurant-discounts", id] as const,
};

function postMultipart<T>(url: string, data: unknown) {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  return apiClient.post<T>(url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function useDiscounts(enabled = true) {
  return useQuery({
    queryKey: discountsKeys.all,
    queryFn: async () => {
      const r = await apiClient.get<RestaurantDiscount[]>(
        "/api/app/restaurant/discounts/",
      );
      return r.data;
    },
    enabled,
  });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DiscountPayload) => {
      const r = await postMultipart<RestaurantDiscount>(
        "/api/app/restaurant/discounts/",
        data,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: discountsKeys.all }),
  });
}

export function useUpdateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; data: DiscountPayload }) => {
      const r = await postMultipart<RestaurantDiscount>(
        `/api/app/restaurant/discounts/${args.id}/`,
        args.data,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: discountsKeys.all }),
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/app/restaurant/discounts/${id}/`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: discountsKeys.all }),
  });
}

export function useEnableDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await apiClient.post<RestaurantDiscount>(
        `/api/app/restaurant/discounts/${id}/enable/`,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: discountsKeys.all }),
  });
}

export function useDisableDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await apiClient.post<RestaurantDiscount>(
        `/api/app/restaurant/discounts/${id}/disable/`,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: discountsKeys.all }),
  });
}
