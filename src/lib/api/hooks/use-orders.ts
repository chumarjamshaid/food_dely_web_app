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

  const response = await apiClient.get<OrderListItem[]>("/api/app/orders/", {
    params,
  });
  return response.data;
}

// Fetch single order detail
async function fetchOrderDetail(id: number): Promise<OrderDetailResponse> {
  const response = await apiClient.get<OrderDetailResponse>(
    `/api/app/orders/${id}/`
  );
  return response.data;
}

// Fetch order status only (lightweight for polling)
async function fetchOrderStatus(id: number): Promise<OrderStatusResponse> {
  const response = await apiClient.get<OrderStatusResponse>(
    `/api/app/orders/${id}/status/`
  );
  return response.data;
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
  return response.data;
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
  return response.data;
}

// Cancel an order
async function cancelOrder(
  id: number,
  data: CancelOrderRequest
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/app/orders/${id}/cancel/`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

/**
 * Hook to fetch all orders for the current user/session
 */
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
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
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrderDetail(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
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
      // Update order in cache
      queryClient.setQueryData(orderKeys.detail(variables.id), data);
      // Invalidate orders list to reflect status change
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
