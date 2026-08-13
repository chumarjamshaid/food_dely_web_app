import type { OrderListItem } from "@/lib/api/types";

export function getOrderRestaurantName(order: OrderListItem): string {
  const restaurant = order.restaurant as { name?: string } | string | undefined;
  const fromOrder = order.restaurant_name
    ?? (typeof restaurant === "string" ? restaurant : restaurant?.name);
  if (fromOrder?.trim()) return fromOrder.trim();

  for (const item of order.items) {
    const itemRestaurant = item.restaurant as { name?: string } | string | undefined;
    const menuRestaurant = item.menu_item?.restaurant as { name?: string } | string | undefined;
    const noWasteRestaurant = item.nowaste_item?.restaurant as { name?: string } | string | undefined;
    const name = item.restaurant_name
      ?? (typeof itemRestaurant === "string" ? itemRestaurant : itemRestaurant?.name)
      ?? item.menu_item?.restaurant_name
      ?? (typeof menuRestaurant === "string" ? menuRestaurant : menuRestaurant?.name)
      ?? item.nowaste_item?.restaurant_name
      ?? (typeof noWasteRestaurant === "string" ? noWasteRestaurant : noWasteRestaurant?.name);
    if (name?.trim()) return name.trim();
  }

  return "Restaurant name unavailable";
}

export function getOrderRestaurantId(order: OrderListItem): number | null {
  const numericId = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
    if (value && typeof value === "object" && "id" in value) {
      const id = (value as { id?: unknown }).id;
      return typeof id === "number" && Number.isFinite(id) ? id : null;
    }
    return null;
  };

  const orderRecord = order as OrderListItem & { restaurant?: unknown };
  const fromOrder = numericId(order.restaurant_id) ?? numericId(orderRecord.restaurant);
  if (fromOrder) return fromOrder;

  for (const item of order.items) {
    const itemRecord = item as typeof item & { restaurant?: unknown };
    const menuItem = item.menu_item as (typeof item.menu_item & { restaurant?: unknown }) | undefined;
    const noWasteItem = item.nowaste_item as (typeof item.nowaste_item & { restaurant?: unknown }) | undefined;
    const id = numericId(item.restaurant_id)
      ?? numericId(itemRecord.restaurant)
      ?? numericId(item.menu_item?.restaurant_id)
      ?? numericId(menuItem?.restaurant)
      ?? numericId(item.nowaste_item?.restaurant_id)
      ?? numericId(noWasteItem?.restaurant);
    if (id) return id;
  }

  return null;
}
