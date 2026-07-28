"use client";
import {
  useAddToCart,
  useAuth,
  useCancelOrder,
  useLogout,
  useOrders,
} from "@/lib/api";
import type { OrderListItem } from "@/lib/api/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function OrdersPageContent() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();
  const { data: orders, isLoading: ordersLoading, error } = useOrders();
  const cancelOrderMutation = useCancelOrder();
  const addToCartMutation = useAddToCart();

  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Redirect if not authenticated (use useEffect to avoid hydration mismatch)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleCancelOrder = (orderId: number) => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    setCancellingOrderId(orderId);
    cancelOrderMutation.mutate(
      {
        id: orderId,
        data: { reason: cancelReason },
      },
      {
        onSuccess: () => {
          setShowCancelDialog(null);
          setCancelReason("");
          setCancellingOrderId(null);
        },
        onError: () => {
          setCancellingOrderId(null);
          alert("Failed to cancel order. Please try again.");
        },
      }
    );
  };

  const handleReorder = async (order: OrderListItem) => {
    setReorderingOrderId(order.id);

    try {
      // Add all items from the order back to cart
      const addPromises = order.items.map((item) => {
        if (item.menu_item) {
          // Format options if they exist
          const options = item.options?.map((opt) => ({
            option: opt.option,
            item: Array.isArray(opt.menu_item_option_item)
              ? opt.menu_item_option_item[0]
              : opt.menu_item_option_item,
          }));

          return addToCartMutation.mutateAsync({
            quantity: item.quantity,
            menu_item: item.menu_item.id,
            options: options,
          });
        } else if (item.nowaste_item) {
          return addToCartMutation.mutateAsync({
            quantity: item.quantity,
            nowaste_item: item.nowaste_item.id,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(addPromises);
      setReorderingOrderId(null);
      router.push("/payment");
    } catch (error) {
      console.error("Failed to reorder:", error);
      setReorderingOrderId(null);
      alert("Failed to add items to cart. Please try again.");
    }
  };

  /** True if the order is cancelled (API may return "Canceled Customer", "Cancelled", etc.) */
  const isOrderCancelled = (status: string) =>
    status.toUpperCase().includes("CANCEL");

  /** User-friendly label for status (e.g. "Canceled Customer" → "Cancelled") */
  const getStatusDisplayText = (status: string) => {
    if (isOrderCancelled(status)) return "Cancelled";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (isOrderCancelled(status)) return "bg-red-100 text-red-700";
    const normalized = status.toUpperCase();
    switch (normalized) {
      case "PLACED":
        return "bg-blue-100 text-blue-700";
      case "PREPARING":
        return "bg-yellow-100 text-yellow-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** API may return `placed` (DD-MM-YYYY HH:mm) or `created_at` (ISO). Return formatted date or fallback. */
  const getOrderDateLabel = (order: OrderListItem & { placed?: string }) => {
    const raw = order.placed ?? order.created_at;
    if (!raw) return "—";
    // Parse API format "23-02-2026 15:35" (DD-MM-YYYY HH:mm)
    const match = /^(\d{2})-(\d{2})-(\d{4})\s*(.*)$/.exec(raw);
    if (match) {
      const [, d, m, y, time = "00:00"] = match;
      const iso = `${y}-${m}-${d}T${time}`;
      return formatDate(iso);
    }
    return formatDate(raw);
  };

  /** ISO-like string for sorting (most recent first). Handles `placed` (DD-MM-YYYY HH:mm) and `created_at`. */
  const getOrderSortKey = (order: OrderListItem & { placed?: string }) => {
    const raw = order.placed ?? order.created_at ?? "";
    const match = /^(\d{2})-(\d{2})-(\d{4})\s*(.*)$/.exec(raw);
    if (match) {
      const [, d, m, y, time = "00:00"] = match;
      return `${y}-${m}-${d}T${time}`;
    }
    return raw;
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (auth check in useEffect will handle redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-400">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6 min-h-[64px]">
          <Link href="/" className="flex items-center mr-4 lg:mr-6 cursor-pointer">
            <span
              className="text-[20px] sm:text-[24px] lg:text-[32px] font-extrabold select-none"
              style={{ fontFamily: "Abril Fatface, serif" }}
            >
              <span className="text-[#CD3625]">FOOD</span>
              <span className="text-black">DELY</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-black text-[16px] hover:text-gray-600 font-medium"
              >
                {user?.firstname || "Profile"}
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="bg-gray-200 text-black px-4 py-2 rounded-full font-medium hover:bg-gray-300 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-4 pb-8 pt-20 sm:pt-24 lg:pt-32 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2">
            My Orders
          </h1>
          <p className="text-gray-600">View and manage your order history</p>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 ml-4">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Failed to load orders</p>
            <p className="text-gray-400 text-sm mt-2">Please try again later.</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/partners"
              className="inline-block mt-4 bg-[#CD3625] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b83213] transition"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {[...orders]
              .sort((a, b) => getOrderSortKey(b).localeCompare(getOrderSortKey(a)))
              .map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-black">
                          Order #{order.id}
                        </h2>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusDisplayText(order.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Placed on {getOrderDateLabel(order)}
                      </p>
                      <p className="text-lg font-semibold text-black mt-2">
                        Total: {order.price.toFixed(2)} CHF
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Only show Cancel while the order is still cancellable (placed or preparing) */}
                      {(() => {
                        const s = (order.status || "").toLowerCase();
                        return s === "placed" || s === "preparing";
                      })() && (
                        <button
                          onClick={() => setShowCancelDialog(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      )}
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reorderingOrderId === order.id}
                        className="px-4 py-2 bg-[#CD3625] text-white rounded-full font-medium hover:bg-[#b83213] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reorderingOrderId === order.id ? "Adding to Cart..." : "Reorder"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 sm:p-6">
                  <h3 className="font-semibold text-black mb-4">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item) => {
                      const itemData = item.menu_item || item.nowaste_item;
                      if (!itemData) return null;

                      // Use item.price if available, otherwise fall back to itemData.price
                      const unitPrice = item.price ?? itemData.price ?? 0;
                      const totalPrice = unitPrice * item.quantity;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative flex-shrink-0">
                            {itemData.image ? (
                              <Image
                                src={itemData.image}
                                alt={itemData.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-black truncate">
                              {itemData.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × {unitPrice.toFixed(2)} CHF
                            </p>
                            {item.options && item.options.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                With options
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-black">
                              {totalPrice.toFixed(2)} CHF
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Order Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-black mb-4">Cancel Order</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for cancelling order #{showCancelDialog}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelDialog(null);
                    setCancelReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-full font-medium hover:bg-gray-300 transition"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancelOrder(showCancelDialog)}
                  disabled={!cancelReason.trim() || cancellingOrderId === showCancelDialog}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingOrderId === showCancelDialog ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-lg mt-4">Loading...</p>
          </div>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
