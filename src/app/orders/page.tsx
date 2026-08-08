"use client";
import {
  useAddToCart,
  useAuth,
  useCancelOrder,
  useLogout,
  useOrders,
} from "@/lib/api";
import type { OrderListItem } from "@/lib/api/types";
import SafeImage from "@/components/SafeImage";
import { ArrowLeft, PackageCheck, RotateCcw } from "lucide-react";
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
    <div className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <header className="sticky top-0 z-50 border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
          <Link href="/partners" className="flex w-fit items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#665b55] transition hover:bg-[#f7f1ee] hover:text-[#b63825]">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Restaurants</span>
          </Link>

          <Link href="/" className="text-[24px] font-black tracking-[-0.04em]">
            <span className="text-[#c83b2b]">FOOD</span>DELY
          </Link>

          <div className="flex justify-end">
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/profile"
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#665b55] hover:bg-[#f7f1ee]"
              >
                {user?.firstname || "Profile"}
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-xl bg-[#f1ebe7] px-3 py-2 text-sm font-bold text-[#665b55] hover:bg-[#e8ded8]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#b63825]">Order history</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Your orders
          </h1>
          <p className="mt-2 text-sm text-[#7d716a]">Track active orders and quickly return to your favourites.</p>
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
          <div className="rounded-[28px] border border-dashed border-[#d9cac3] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83b2b]"><PackageCheck size={28} /></div>
            <p className="mt-5 text-xl font-black">You haven&apos;t placed any orders yet.</p>
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
                className="overflow-hidden rounded-[24px] border border-[#e9dfda] bg-white shadow-[0_14px_38px_rgba(55,35,27,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(55,35,27,0.09)]"
              >
                {/* Order Header */}
                <div className="border-b border-[#eee5e0] bg-[#fcfaf9] p-4 sm:p-6">
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
                        Total: {Number(order.price).toFixed(2)} CHF
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-center rounded-xl border border-[#d9cec8] bg-white px-4 py-2 font-bold text-[#5f554f] transition hover:border-[#c83b2b] hover:text-[#b63825]"
                      >
                        Track order
                      </Link>
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
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#c83b2b] px-4 py-2 font-bold text-white transition hover:bg-[#ad321f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={15} />
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
                          className="flex items-center gap-4 rounded-2xl border border-[#eee5e0] bg-[#fcfaf9] p-3"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative flex-shrink-0">
                            <SafeImage
                              src={itemData.image}
                              alt={itemData.name}
                              fill
                              className="object-cover"
                              fallbackClassName="object-contain bg-[#fff8f5] p-3"
                            />
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
