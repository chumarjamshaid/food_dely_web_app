import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { RestaurantOwnerProfile } from "../types";
import { ownerKeys } from "./use-customer";

// Query keys for owner-side endpoints
export const ownerSalesKeys = {
  all: ["owner-sales"] as const,
  range: (from: string, to: string) =>
    [...ownerSalesKeys.all, from, to] as const,
};

export const ownerOrdersKeys = {
  all: ["owner-orders"] as const,
  list: (params: { date?: string; status?: string }) =>
    [...ownerOrdersKeys.all, params] as const,
};

export const ownerRankingKeys = {
  all: ["owner-ranking"] as const,
  charge: (charge: number) => [...ownerRankingKeys.all, charge] as const,
};

export interface RestaurantRankingResponse {
  old_rank: number;
  new_rank: number;
}

export interface RestaurantSalesItem {
  date: string;
  sales: string;
}

export interface RestaurantSalesResponse {
  date_from: string;
  date_to: string;
  sales_items: RestaurantSalesItem[];
  total_sales: string;
  increase_rate: string;
}

export interface RestaurantOrderListItem {
  id: number;
  status: string;
  status_reason?: string | null;
  placed?: string;
  price?: string | number;
  total_price?: string | number;
  created_at?: string;
  date?: string;
  payment_status?: string;
  customer?: {
    firstname?: string;
    lastname?: string;
    avatar?: string | null;
  } | null;
  customer_firstname?: string;
  customer_lastname?: string;
  delivery_firstname?: string;
  delivery_lastname?: string;
  delivery_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_phone?: string;
  delivery_email?: string;
  [key: string]: unknown;
}

// Allowed status values for the orders filter (exact backend values)
export const ORDER_STATUS_VALUES = [
  "placed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancel_customer",
  "cancel_restaurant",
] as const;
export type RestaurantOrderStatus = (typeof ORDER_STATUS_VALUES)[number];

/**
 * GET /api/app/restaurant/sales/?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export function useRestaurantSales(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ownerSalesKeys.range(from, to),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantSalesResponse>(
        "/api/app/restaurant/sales/",
        { params: { from, to } },
      );
      return r.data;
    },
    enabled: enabled && !!from && !!to,
  });
}

/**
 * GET /api/app/restaurant/orders/?date=&status=
 */
export function useRestaurantOrders(
  params: { date?: string; status?: string } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ownerOrdersKeys.list(params),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantOrderListItem[]>(
        "/api/app/restaurant/orders/",
        {
          params: {
            date: params.date || undefined,
            status: params.status || undefined,
          },
        },
      );
      return r.data;
    },
    enabled,
  });
}

/**
 * GET /api/app/restaurant/ranking/?additional_charge=N
 */
export function useRestaurantRanking(additionalCharge: number, enabled = true) {
  return useQuery({
    queryKey: ownerRankingKeys.charge(additionalCharge),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantRankingResponse>(
        "/api/app/restaurant/ranking/",
        { params: { additional_charge: additionalCharge } },
      );
      return r.data;
    },
    enabled: enabled && Number.isFinite(additionalCharge),
  });
}

// Order state-transition mutations
function makeOrderAction(action: "prepare" | "ready" | "deliver" | "complete") {
  return async (orderId: number) => {
    const r = await apiClient.post<RestaurantOrderListItem>(
      `/api/app/restaurant/orders/${orderId}/${action}/`,
    );
    return r.data;
  };
}

function invalidateOrders(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ownerOrdersKeys.all });
}

export function useMarkOrderPreparing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: makeOrderAction("prepare"),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useMarkOrderReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: makeOrderAction("ready"),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useMarkOrderDelivering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: makeOrderAction("deliver"),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useMarkOrderCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: makeOrderAction("complete"),
    onSuccess: () => invalidateOrders(qc),
  });
}

// ---- Restaurant settings / delivery / openings ----

export interface RestaurantSettingsPayload {
  name: string;
  description: string;
  phone: string;
  website: string;
  address: string;
  postal_code: string;
  city: string;
}

export interface RestaurantDeliveryPayload {
  min_amount: number;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_radius: number;
  delivery_fee: number;
  delivery_time: number;
}

export interface RestaurantOpeningShift {
  day: string;
  start: string;
  end: string;
}

function postMultipart<T>(url: string, data: unknown) {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  return apiClient.post<T>(url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

function invalidateOwnerProfile(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ownerKeys.profile() });
}

export function useUpdateRestaurantSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RestaurantSettingsPayload) => {
      const r = await postMultipart<RestaurantOwnerProfile>(
        "/api/app/restaurant/settings/",
        data,
      );
      return r.data;
    },
    onSuccess: (restaurant) => {
      qc.setQueryData(ownerKeys.profile(), restaurant);
    },
    onError: () => invalidateOwnerProfile(qc),
  });
}

export function useUpdateRestaurantDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RestaurantDeliveryPayload) => {
      const r = await postMultipart<RestaurantOwnerProfile>(
        "/api/app/restaurant/delivery/",
        data,
      );
      return r.data;
    },
    onSuccess: (restaurant) => {
      qc.setQueryData(ownerKeys.profile(), restaurant);
    },
    onError: () => invalidateOwnerProfile(qc),
  });
}

export function useUpdateRestaurantOpenings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shifts: RestaurantOpeningShift[]) => {
      const r = await postMultipart<RestaurantOwnerProfile>(
        "/api/app/restaurant/openings/",
        shifts,
      );
      return r.data;
    },
    onSuccess: (restaurant) => {
      qc.setQueryData(ownerKeys.profile(), restaurant);
    },
    onError: () => invalidateOwnerProfile(qc),
  });
}

export function useCancelRestaurantOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { orderId: number; reason: string }) => {
      const r = await apiClient.post<RestaurantOrderListItem>(
        `/api/app/restaurant/orders/${args.orderId}/cancel/`,
        { reason: args.reason },
      );
      return r.data;
    },
    onSuccess: () => invalidateOrders(qc),
  });
}
