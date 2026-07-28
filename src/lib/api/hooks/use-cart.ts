import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { getSessionId, isAuthenticated, setSessionId } from "../session";
import type { AddToCartRequest, CartResponse } from "../types";

// Query keys for cart
export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const,
};

// Fetch current cart
async function fetchCart(): Promise<CartResponse> {
  try {
    // Include session_id as query parameter for GET requests (in addition to header and cookies)
    const sessionId = !isAuthenticated() ? getSessionId() : null;
    const params = sessionId ? { session_id: sessionId } : undefined;
    
    const response = await apiClient.get<CartResponse>("/api/app/cart/", {
      params,
    });
    const cartData = response.data;
    
    // Store session_id for anonymous users
    if (!isAuthenticated() && cartData.session_id) {
      setSessionId(cartData.session_id);
    }
    
    return cartData;
  } catch (error) {
    // If cart doesn't exist yet (400 or 404), return an empty cart structure
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 400 || axiosError.response?.status === 404) {
        // Return empty cart - it will be created when first item is added
        return {
          id: 0,
          customer: null,
          session_id: null,
          items: [],
          total_price: "0.00"
        };
      }
    }
    throw error;
  }
}

// Add item to cart - no retry logic to prevent duplicate items
async function addToCart(data: AddToCartRequest): Promise<CartResponse> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  // For anonymous users, include session_id as query parameter (required by backend)
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.post<CartResponse>(
    "/api/app/cart/",
    formData,
    {
      params, // Pass session_id as query parameter
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  const cartData = response.data;
  
  // CRITICAL: Store session_id IMMEDIATELY for anonymous users
  // This must happen synchronously before any other requests
  if (!isAuthenticated() && cartData.session_id) {
    setSessionId(cartData.session_id);
  }
  
  return cartData;
}

// Remove item from cart
async function removeFromCart(cartItemId: number): Promise<CartResponse> {
  const formData = new FormData();
  formData.append("cart_item", cartItemId.toString());

  // For anonymous users, include session_id as query parameter (required by backend)
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.delete<CartResponse>("/api/app/cart/", {
    params, // Pass session_id as query parameter
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const cartData = response.data;

  // Store session_id for anonymous users
  if (!isAuthenticated() && cartData.session_id) {
    setSessionId(cartData.session_id);
  }

  return cartData;
}

// Update cart item quantity
async function updateCartItem(cartItemId: number, quantity: number): Promise<CartResponse> {
  const formData = new FormData();
  formData.append("cart_item", cartItemId.toString());
  formData.append("quantity", quantity.toString());

  // For anonymous users, include session_id as query parameter (required by backend)
  const sessionId = !isAuthenticated() ? getSessionId() : null;
  const params = sessionId ? { session_id: sessionId } : undefined;

  const response = await apiClient.patch<CartResponse>("/api/app/cart/", formData, {
    params, // Pass session_id as query parameter
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const cartData = response.data;

  // Store session_id for anonymous users
  if (!isAuthenticated() && cartData.session_id) {
    setSessionId(cartData.session_id);
  }

  return cartData;
}

/**
 * Hook to fetch the current cart (works for both authenticated and anonymous users)
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: fetchCart,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to add an item to the cart
 * Retries disabled to prevent duplicate items when API fails
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCart,
    retry: 0, // Disable retries to prevent duplicate items
    onSuccess: (data) => {
      // Store session_id immediately if present (for anonymous users)
      if (!isAuthenticated() && data.session_id) {
        setSessionId(data.session_id);
      }
      // Update cart cache with new data
      queryClient.setQueryData(cartKeys.current(), data);
    },
    onError: () => {
      // Refetch cart on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}

/**
 * Hook to remove an item from the cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromCart,
    onSuccess: (data) => {
      // Update cart cache with new data
      queryClient.setQueryData(cartKeys.current(), data);
    },
    onError: () => {
      // Refetch cart on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}

/**
 * Hook to update cart item quantity
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      updateCartItem(cartItemId, quantity),
    onSuccess: (data) => {
      // Update cart cache with new data
      queryClient.setQueryData(cartKeys.current(), data);
    },
    onError: () => {
      // Refetch cart on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}

/**
 * Helper hook to add a menu item to cart
 */
export function useAddMenuItemToCart() {
  const addToCart = useAddToCart();

  const addMenuItem = (
    menuItemId: number,
    quantity: number,
    options?: { option: number; item: number }[]
  ) => {
    return addToCart.mutate({
      quantity,
      menu_item: menuItemId,
      options,
    });
  };

  return {
    ...addToCart,
    addMenuItem,
  };
}

/**
 * Helper hook to add a nowaste item to cart
 */
export function useAddNoWasteItemToCart() {
  const addToCart = useAddToCart();

  const addNoWasteItem = (nowasteItemId: number, quantity: number) => {
    return addToCart.mutate({
      quantity,
      nowaste_item: nowasteItemId,
    });
  };

  return {
    ...addToCart,
    addNoWasteItem,
  };
}

/**
 * Hook to validate cart state before payment
 * Returns an object with validation status and error messages
 */
export function useValidateCart() {
  const { data: cart, isLoading, error } = useCart();

  const validation = {
    isValid: false,
    hasItems: false,
    hasValidItems: false,
    errors: [] as string[],
  };

  if (isLoading) {
    return { ...validation, isLoading: true };
  }

  if (error) {
    return {
      ...validation,
      errors: ["Failed to load cart. Please refresh the page."],
    };
  }

  if (!cart) {
    return {
      ...validation,
      errors: ["Cart not found. Please add items to your cart."],
    };
  }

  if (!cart.items || cart.items.length === 0) {
    return {
      ...validation,
      hasItems: false,
      errors: ["Your cart is empty. Please add items before proceeding."],
    };
  }

  // Check if cart has valid items (either menu_item or nowaste_item with valid IDs)
  const hasValidItems = cart.items.some(
    (item) =>
      (item.menu_item && item.menu_item.id && item.quantity > 0) ||
      (item.nowaste_item && item.nowaste_item.id && item.quantity > 0)
  );

  if (!hasValidItems) {
    return {
      ...validation,
      hasItems: true,
      hasValidItems: false,
      errors: ["Your cart contains invalid items. Please remove and re-add items."],
    };
  }

  // Check for items with zero or negative quantities
  const invalidQuantityItems = cart.items.filter(
    (item) => !item.quantity || item.quantity <= 0
  );

  if (invalidQuantityItems.length > 0) {
    return {
      ...validation,
      hasItems: true,
      hasValidItems: false,
      errors: ["Some items in your cart have invalid quantities. Please update them."],
    };
  }

  // All validations passed
  return {
    isValid: true,
    hasItems: true,
    hasValidItems: true,
    errors: [],
  };
}

/**
 * Hook to clear all items from the cart (by removing each item individually)
 */
export function useClearCart() {
  const { data: cart } = useCart();
  const removeFromCart = useRemoveFromCart();
  const queryClient = useQueryClient();

  const clearCart = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("Cart is already empty");
      return;
    }

    console.log(`Clearing cart with ${cart.items.length} items...`);

    // Remove all items one by one
    const removalPromises = cart.items.map((item) =>
      removeFromCart.mutateAsync(item.id)
    );

    try {
      await Promise.all(removalPromises);
      console.log("Cart cleared successfully");
      // Invalidate cart to ensure it's refetched
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: clearCart,
  });
}
