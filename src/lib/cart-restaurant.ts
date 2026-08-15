import type { CartResponse } from "@/lib/api/types";

const STORAGE_KEY = "cart_restaurant_id";
const STORAGE_NAME_KEY = "cart_restaurant_name";

/**
 * Returns the restaurant ID that the current cart is for.
 * Prefers API data (item.restaurant_id) when present; otherwise uses sessionStorage
 * (set when user adds first item so we can enforce single-restaurant cart).
 */
export function getCartRestaurantId(cart: CartResponse | null | undefined): number | null {
  if (!cart?.items?.length) return null;
  const fromCart = cart.restaurant_id ?? cart.restaurant?.id;
  if (fromCart != null) return fromCart;
  const fromApi = cart.items.find((item) => item.restaurant_id != null)?.restaurant_id
    ?? cart.items.find((item) => item.restaurant?.id)?.restaurant?.id
    ?? cart.items.find((item) => item.menu_item?.restaurant_id)?.menu_item?.restaurant_id
    ?? cart.items.find((item) => item.menu_item?.restaurant?.id)?.menu_item?.restaurant?.id
    ?? cart.items.find((item) => item.nowaste_item?.restaurant_id)?.nowaste_item?.restaurant_id
    ?? cart.items.find((item) => item.nowaste_item?.restaurant?.id)?.nowaste_item?.restaurant?.id;
  if (fromApi != null) return fromApi;
  if (typeof globalThis.window === "undefined") return null;
  const stored = globalThis.sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    const id = Number.parseInt(stored, 10);
    return Number.isNaN(id) ? null : id;
  }
  return null;
}

export function getCartRestaurantName(cart: CartResponse | null | undefined): string | null {
  if (!cart?.items?.length) return null;
  const fromApi = cart.restaurant_name
    ?? cart.restaurant?.name
    ?? cart.items.find((item) => item.restaurant_name)?.restaurant_name
    ?? cart.items.find((item) => item.restaurant?.name)?.restaurant?.name
    ?? cart.items.find((item) => item.menu_item?.restaurant_name)?.menu_item?.restaurant_name
    ?? cart.items.find((item) => item.menu_item?.restaurant?.name)?.menu_item?.restaurant?.name
    ?? cart.items.find((item) => item.nowaste_item?.restaurant_name)?.nowaste_item?.restaurant_name
    ?? cart.items.find((item) => item.nowaste_item?.restaurant?.name)?.nowaste_item?.restaurant?.name;
  if (fromApi?.trim()) return fromApi.trim();
  if (typeof globalThis.window === "undefined") return null;
  const storedName = globalThis.sessionStorage.getItem(STORAGE_NAME_KEY)?.trim();
  if (!storedName) return null;

  // A cart returned by the API is authoritative. Never pair its restaurant ID
  // with a name left in session storage by a previously visited restaurant.
  const apiRestaurantId = cart.restaurant_id
    ?? cart.restaurant?.id
    ?? cart.items.find((item) => item.restaurant_id != null)?.restaurant_id
    ?? cart.items.find((item) => item.restaurant?.id)?.restaurant?.id
    ?? cart.items.find((item) => item.menu_item?.restaurant_id)?.menu_item?.restaurant_id
    ?? cart.items.find((item) => item.menu_item?.restaurant?.id)?.menu_item?.restaurant?.id
    ?? cart.items.find((item) => item.nowaste_item?.restaurant_id)?.nowaste_item?.restaurant_id
    ?? cart.items.find((item) => item.nowaste_item?.restaurant?.id)?.nowaste_item?.restaurant?.id;
  const storedId = Number(globalThis.sessionStorage.getItem(STORAGE_KEY));
  if (apiRestaurantId != null && storedId !== apiRestaurantId) return null;

  return storedName;
}

export function setCartRestaurantId(restaurantId: number, restaurantName?: string): void {
  if (typeof globalThis.window !== "undefined") {
    globalThis.sessionStorage.setItem(STORAGE_KEY, String(restaurantId));
    if (restaurantName?.trim()) {
      globalThis.sessionStorage.setItem(STORAGE_NAME_KEY, restaurantName.trim());
    }
  }
}

export function clearCartRestaurantId(): void {
  if (typeof globalThis.window !== "undefined") {
    globalThis.sessionStorage.removeItem(STORAGE_KEY);
    globalThis.sessionStorage.removeItem(STORAGE_NAME_KEY);
  }
}
