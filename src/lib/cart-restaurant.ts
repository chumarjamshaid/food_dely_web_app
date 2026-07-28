import type { CartResponse } from "@/lib/api/types";

const STORAGE_KEY = "cart_restaurant_id";

/**
 * Returns the restaurant ID that the current cart is for.
 * Prefers API data (item.restaurant_id) when present; otherwise uses sessionStorage
 * (set when user adds first item so we can enforce single-restaurant cart).
 */
export function getCartRestaurantId(cart: CartResponse | null | undefined): number | null {
  if (!cart?.items?.length) return null;
  const fromApi = cart.items.find((item) => item.restaurant_id != null)?.restaurant_id;
  if (fromApi != null) return fromApi;
  if (typeof globalThis.window === "undefined") return null;
  const stored = globalThis.sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    const id = Number.parseInt(stored, 10);
    return Number.isNaN(id) ? null : id;
  }
  return null;
}

export function setCartRestaurantId(restaurantId: number): void {
  if (typeof globalThis.window !== "undefined") {
    globalThis.sessionStorage.setItem(STORAGE_KEY, String(restaurantId));
  }
}

export function clearCartRestaurantId(): void {
  if (typeof globalThis.window !== "undefined") {
    globalThis.sessionStorage.removeItem(STORAGE_KEY);
  }
}
