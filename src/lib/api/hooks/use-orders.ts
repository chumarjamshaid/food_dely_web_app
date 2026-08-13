import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { getSessionId, isAuthenticated } from "../session";
import type {
  CancelOrderRequest,
  OrderDetailResponse,
  OrderListItem,
  OrderStatusResponse,
  SubmitCartRequest,
} from "../types";

export function normalizeOrderStatus(status: string): OrderStatusResponse["status"] {
  const value = status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (value.includes("cancel") && (value.includes("rest") || value.includes("restaurant"))) return "can_rest";
  if (value.includes("cancel")) return "can_cust";
  if (value === "placed" || value === "preparing" || value === "ready" || value === "delivering" || value === "completed") return value;
  return "placed";
}

function normalizeOrder<T extends { status: string }>(order: T): T {
  return { ...order, status: normalizeOrderStatus(order.status) };
}

function orderTimestamp(order: OrderListItem): number {
  const raw = order.placed || order.created_at || "";
  const apiDate = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(raw);
  if (apiDate) {
    const [, day, month, year, hour = "0", minute = "0"] = apiDate;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? order.id : timestamp;
}

// Query keys for orders
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  status: (id: number) => [...orderKeys.details(), id, "status"] as const,
};

// Fetch all orders for current user/session
async function fetchOrders(): Promise<OrderListItem[]> {
  // For anonymous users, include session_id as query parameter
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  try {
    const response = await apiClient.get<OrderListItem[]>("/api/app/orders/", { params });
    return response.data
      .map(normalizeOrder)
      .sort((a, b) => orderTimestamp(b) - orderTimestamp(a));
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404) return [];
    throw error;
  }
}

function guestParams() {
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  return sessionId ? { session_id: sessionId } : undefined;
}

// Fetch single order detail
async function fetchOrderDetail(id: number): Promise<OrderDetailResponse> {
  const response = await apiClient.get<OrderDetailResponse>(
    `/api/app/orders/${id}/`, { params: guestParams(), timeout: 15_000 }
  );
  return normalizeOrder(response.data);
}

// Fetch order status only (lightweight for polling)
async function fetchOrderStatus(id: number): Promise<OrderStatusResponse> {
  const response = await apiClient.get<OrderStatusResponse>(
    `/api/app/orders/${id}/status/`, { params: guestParams() }
  );
  return normalizeOrder(response.data);
}

// Submit cart to create an order
async function submitCart(
  data: SubmitCartRequest
): Promise<OrderDetailResponse> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  // For anonymous users, include session_id as query parameter
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.post<OrderDetailResponse>(
    "/api/app/cart/submit/",
    formData,
    {
      params, // Pass session_id as query parameter
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return normalizeOrder(response.data);
}

// Create order directly (used after payment confirmation)
async function createOrder(
  data: { payment_intent_id: string }
): Promise<OrderDetailResponse> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  // For anonymous users, include session_id as query parameter
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.post<OrderDetailResponse>(
    "/api/app/order/",
    formData,
    {
      params, // Pass session_id as query parameter
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return normalizeOrder(response.data);
}

// Cancel an order
async function cancelOrder(
  id: number,
  data: CancelOrderRequest
): Promise<OrderStatusResponse> {
  const response = await apiClient.post<OrderStatusResponse>(
    `/api/app/orders/${id}/cancel/`,
    data,
    {
      params: guestParams(),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return normalizeOrder(response.data);
}

/**
 * Hook to fetch all orders for the current user/session
 */
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch a single order's details
 * @param id - Order ID
 */
export function useOrderDetail(id: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrderDetail(id),
    enabled: !!id,
    initialData: () =>
      queryClient
        .getQueryData<OrderListItem[]>(orderKeys.lists())
        ?.find((order) => order.id === id) as OrderDetailResponse | undefined,
    initialDataUpdatedAt: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "placed" || status === "preparing" || status === "ready" || status === "delivering" ? 30_000 : false;
    },
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Hook to fetch order status (lightweight, useful for polling)
 * @param id - Order ID
 * @param enabled - Whether to enable polling
 * @param refetchInterval - Optional refetch interval in ms for polling
 */
export function useOrderStatus(
  id: number,
  enabled = true,
  refetchInterval?: number
) {
  return useQuery({
    queryKey: orderKeys.status(id),
    queryFn: () => fetchOrderStatus(id),
    enabled: enabled && !!id,
    refetchInterval,
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to submit cart and create an order
 */
export function useSubmitCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitCart,
    onSuccess: (data) => {
      // Invalidate cart (should be empty after submission)
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Add new order to orders list
      queryClient.setQueryData(orderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Hook to create order after payment confirmation
 * This calls /api/app/order/ with payment_intent_id
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      // Invalidate cart (should be empty after order creation)
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Add new order to cache
      queryClient.setQueryData(orderKeys.detail(data.id), data);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelOrderRequest }) =>
      cancelOrder(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<OrderDetailResponse>(orderKeys.detail(variables.id), current => current ? { ...current, ...data } : current);
      queryClient.setQueryData(orderKeys.status(variables.id), data);
      // Invalidate orders list to reflect status change
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
