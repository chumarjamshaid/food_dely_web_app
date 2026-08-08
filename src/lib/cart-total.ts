import type { CartResponse } from "@/lib/api/types";

export function getCartTotal(cart?: CartResponse): number {
  const apiTotal = Number.parseFloat(String(cart?.total ?? cart?.total_price ?? ""));

  if (Number.isFinite(apiTotal) && apiTotal > 0) {
    return apiTotal;
  }

  return (
    cart?.items.reduce((total, cartItem) => {
      const product = cartItem.menu_item ?? cartItem.nowaste_item;
      const price = Number(product?.price ?? 0);
      return total + (Number.isFinite(price) ? price * cartItem.quantity : 0);
    }, 0) ?? 0
  );
}
