import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { getOrCreateSessionId, isAuthenticated } from "../session";
import type {
  PaymentConfirmRequest,
  PaymentConfirmResponse,
  PaymentIntentRequest,
  PaymentIntentResponse,
} from "../types";
import { normalizeOrderStatus, orderKeys } from "./use-orders";

// Create payment intent
async function createPaymentIntent(
  data?: PaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const formData = new FormData();

  // Backend expects delivery info in the "data" field as JSON string
  // If data is provided and has content, send it; otherwise send empty object
  if (data && Object.keys(data).length > 0) {
    // Remove undefined values from data before sending
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== "")
    );
    formData.append("data", JSON.stringify(cleanData));
  } else {
    // If no data provided, send empty object (delivery info is optional)
    formData.append("data", JSON.stringify({}));
  }

  // For anonymous users, include session_id as query parameter
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  // Let the original API error propagate unchanged so checkout can display the
  // backend's exact translated message or untranslated translation key.
  const response = await apiClient.post<PaymentIntentResponse>(
    "/api/app/payment/intent/",
    formData,
    {
      params,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

// Confirm payment
async function confirmPayment(
  data: PaymentConfirmRequest
): Promise<PaymentConfirmResponse> {
  // For anonymous users, include session_id as query parameter
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.post<PaymentConfirmResponse>(
    "/api/app/payment/confirm/",
    data,
    {
      params, // Pass session_id as query parameter
      timeout: 20_000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return { ...response.data, status: normalizeOrderStatus(String(response.data.status)) };
}

/**
 * Hook to create a Stripe payment intent for the current cart
 * @param deliveryData - Optional delivery information to set on cart
 */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: createPaymentIntent,
  });
}

/**
 * Hook to confirm a Stripe payment after client-side confirmation
 * This will create the order from the cart after payment is verified
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmPayment,
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
