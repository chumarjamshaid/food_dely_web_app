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

  try {
    // For anonymous users, include session_id as query parameter
    const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
    const params = sessionId ? { session_id: sessionId } : undefined;

    // Explicitly set Content-Type to multipart/form-data (axios will add boundary)
    // This overrides the default 'application/json' header from apiClient
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
  } catch (error) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: unknown; status?: number } };

      // Check for cart_invalid error specifically
      const responseData = axiosError.response?.data;
      if (responseData && typeof responseData === 'object') {
        const dataObj = responseData as Record<string, unknown>;
        const errorMessage = String(dataObj.error || dataObj.message || '');

        if (errorMessage.includes('cart_invalid')) {
          // Throw a more helpful error
          throw new Error("CART_INVALID: Your cart appears to be corrupted. Please clear your cart and add items again.");
        }
      }
    }
    throw error;
  }
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
