import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { RestaurantClosingPeriod, RestaurantOwnerProfile } from "../types";
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
  state: () => [...ownerRankingKeys.all, "state"] as const,
  preview: (charge: number) => [...ownerRankingKeys.all, "preview", charge] as const,
};

export interface RestaurantRankingResponse {
  ranking_score: string;
  current_rank: number;
  ranking_cost_per_order: string;
  rank_plus_enabled: boolean;
  average_rating: string;
  positive_reviews_count: number;
  comparison_restaurants_count: number;
  comparison_scope: string;
  min_cost: string;
  max_cost: string;
  step: string;
  terms_version: string;
}

export interface RestaurantRankingPreviewResponse {
  current_rank: number;
  estimated_rank: number;
  positions_change: number;
  current_score: string;
  estimated_score: string;
  comparison_restaurants_count: number;
  comparison_scope: string;
}

export interface RestaurantSalesItem {
  date: string;
  sales: string;
  net: string;
}

export interface RestaurantSalesResponse {
  date_from: string;
  date_to: string;
  sales_items: RestaurantSalesItem[];
  total_sales: string;
  total_service_fees: string;
  net_income: string;
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
  "can_cust",
  "can_rest",
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
 * GET /api/app/restaurant/ranking/
 */
export function useRestaurantRanking(enabled = true) {
  return useQuery({
    queryKey: ownerRankingKeys.state(),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantRankingResponse>(
        "/api/app/restaurant/ranking/",
      );
      return r.data;
    },
    enabled,
  });
}

export function useRestaurantRankingPreview(charge: number, enabled = true) {
  return useQuery({
    queryKey: ownerRankingKeys.preview(charge),
    queryFn: async () => {
      const r = await apiClient.post<RestaurantRankingPreviewResponse>(
        "/api/app/restaurant/ranking/preview/",
        { ranking_cost_per_order: charge.toFixed(2) },
      );
      return r.data;
    },
    enabled: enabled && Number.isFinite(charge),
  });
}

export function useApplyRestaurantRanking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ranking_cost_per_order: string; terms_accepted?: boolean; terms_version?: string }) => {
      const r = await apiClient.post<RestaurantRankingResponse>("/api/app/restaurant/ranking/", data);
      return r.data;
    },
    onSuccess: (data) => qc.setQueryData(ownerRankingKeys.state(), data),
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
  latitude?: number | null;
  longitude?: number | null;
  meat_origin?: string;
  fish_origin?: string;
}

export interface RestaurantDeliveryPayload {
  min_amount: number;
  delivery_available: boolean;
  delivery_radius: number;
  delivery_fee: number;
}

export interface RestaurantClosingPayload {
  title?: string;
  start_at: string;
  end_at: string;
  enabled?: boolean;
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

export const ownerClosingKeys = { all: ["owner-closings"] as const };

export function useRestaurantClosings(enabled = true) {
  return useQuery({
    queryKey: ownerClosingKeys.all,
    queryFn: async () => (await apiClient.get<RestaurantClosingPeriod[]>("/api/app/restaurant/closings/")).data,
    enabled,
  });
}

export function useSetRestaurantManualClosed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (closed: boolean) =>
      (await apiClient.post<RestaurantOwnerProfile>(closed ? "/api/app/restaurant/close/" : "/api/app/restaurant/reopen/")).data,
    onSuccess: (restaurant) => qc.setQueryData(ownerKeys.profile(), restaurant),
  });
}

export function useCreateRestaurantClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RestaurantClosingPayload) => (await postMultipart<RestaurantClosingPeriod>("/api/app/restaurant/closings/", data)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ownerClosingKeys.all }); invalidateOwnerProfile(qc); },
  });
}

export function useDeleteRestaurantClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await apiClient.delete(`/api/app/restaurant/closings/${id}/`); return id; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ownerClosingKeys.all }); invalidateOwnerProfile(qc); },
  });
}

export function useToggleRestaurantClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) =>
      (await apiClient.post<RestaurantClosingPeriod>(`/api/app/restaurant/closings/${id}/${enabled ? "enable" : "disable"}/`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ownerClosingKeys.all }); invalidateOwnerProfile(qc); },
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
