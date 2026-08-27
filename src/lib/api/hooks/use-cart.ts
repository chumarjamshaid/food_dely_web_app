import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { getOrCreateSessionId, getSessionId, isAuthenticated, setSessionId } from "../session";
import type {
  AddToCartRequest,
  CartItemResponse,
  CartResponse,
} from "../types";

// Query keys for cart
export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const,
};

const CART_OPTION_SELECTIONS_KEY = "food_dely_cart_option_selections";
type SavedCartOptions = Record<string, { option: number; item: number }[]>;

function readSavedCartOptions(): SavedCartOptions {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CART_OPTION_SELECTIONS_KEY) || "{}") as SavedCartOptions;
  } catch {
    return {};
  }
}

function writeSavedCartOptions(options: SavedCartOptions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_OPTION_SELECTIONS_KEY, JSON.stringify(options));
}

function saveCartItemOptions(cartItemId: number, options: { option: number; item: number }[]) {
  const saved = readSavedCartOptions();
  if (options.length) saved[String(cartItemId)] = options;
  else delete saved[String(cartItemId)];
  writeSavedCartOptions(saved);
}

function hydrateSavedCartOptions(cart: CartResponse): CartResponse {
  const saved = readSavedCartOptions();
  const liveIds = new Set(cart.items.map((item) => String(item.id)));
  let storageChanged = false;
  for (const id of Object.keys(saved)) {
    if (!liveIds.has(id)) {
      delete saved[id];
      storageChanged = true;
    }
  }
  if (storageChanged) writeSavedCartOptions(saved);

  return {
    ...cart,
    items: cart.items.map((cartItem) => {
      const selections = saved[String(cartItem.id)];
      if (!selections?.length) return cartItem;
      return {
        ...cartItem,
        options: selections.map(({ option, item }) => ({
          id: item,
          option,
          item,
          menu_item_option_item: item,
        })),
      };
    }),
  };
}

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
    
    return hydrateSavedCartOptions(cartData);
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
          subtotal: "0.00",
          restaurant_discount: "0.00",
          delivery_fee: "0.00",
          promo_code: null,
          promo_discount: "0.00",
          tip_amount: "0.00",
          total: "0.00",
          currency: "CHF",
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
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
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
  saveCartItemOptions(cartItemId, []);

  // Store session_id for anonymous users
  if (!isAuthenticated() && cartData.session_id) {
    setSessionId(cartData.session_id);
  }

  return hydrateSavedCartOptions(cartData);
}

async function updateCartItem(
  cartItem: CartItemResponse,
  update: {
    quantity?: number;
    options?: { option: number; item: number }[];
  },
): Promise<CartResponse> {
  if (update.quantity != null && update.quantity <= 0) return removeFromCart(cartItem.id);
  const formData = new FormData();
  formData.append("data", JSON.stringify(update));
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
  const response = await apiClient.patch<CartResponse>(`/api/app/cart/items/${cartItem.id}/`, formData, {
    params: sessionId ? { session_id: sessionId } : undefined,
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (update.options) saveCartItemOptions(cartItem.id, update.options);
  return hydrateSavedCartOptions(response.data);
}

/**
 * Hook to fetch the current cart (works for both authenticated and anonymous users)
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: fetchCart,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    // Payment confirmation can clear the backend cart. Always reconcile cached
    // data when entering cart/checkout so a stale cart cannot be paid twice.
    refetchOnMount: "always",
    staleTime: 0,
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
    onSuccess: (data, variables) => {
      if ("menu_item" in variables && variables.options) {
        const matchingItem = [...data.items]
          .reverse()
          .find((item) => item.menu_item?.id === variables.menu_item);
        if (matchingItem) saveCartItemOptions(matchingItem.id, variables.options);
        data = hydrateSavedCartOptions(data);
      }
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
    mutationFn: ({
      cartItem,
      quantity,
      options,
    }: {
      cartItem: CartItemResponse;
      quantity?: number;
      options?: { option: number; item: number }[];
    }) => updateCartItem(cartItem, { quantity, options }),
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

async function applyPromoCode(code: string): Promise<CartResponse> {
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
  const response = await apiClient.post<CartResponse>("/api/app/cart/promo-code/", { code: code.trim() }, {
    params: sessionId ? { session_id: sessionId } : undefined,
  });
  return response.data;
}

async function removePromoCode(): Promise<CartResponse> {
  const sessionId = !isAuthenticated() ? getOrCreateSessionId() : null;
  const response = await apiClient.delete<CartResponse>("/api/app/cart/promo-code/", {
    params: sessionId ? { session_id: sessionId } : undefined,
  });
  return response.data;
}

export function useApplyPromoCode() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: applyPromoCode, onSuccess: data => queryClient.setQueryData(cartKeys.current(), data) });
}

export function useRemovePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: removePromoCode, onSuccess: data => queryClient.setQueryData(cartKeys.current(), data) });
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
      return;
    }

    // Remove all items one by one
    const removalPromises = cart.items.map((item) =>
      removeFromCart.mutateAsync(item.id)
    );

    await Promise.all(removalPromises);
    // Invalidate cart to ensure it's refetched
    queryClient.invalidateQueries({ queryKey: cartKeys.current() });
  };

  return useMutation({
    mutationFn: clearCart,
  });
}
