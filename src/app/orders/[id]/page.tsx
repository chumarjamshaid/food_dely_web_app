"use client";
import {
  useAddToCart,
  useAuth,
  useCancelOrder,
  useCart,
  useLogout,
  useOrderDetail,
} from "@/lib/api";
import type { OrderStatus } from "@/lib/api/types";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  PLACED: { bg: "bg-blue-100", text: "text-blue-800" },
  PREPARING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800" },
  COMPLETED: { bg: "bg-gray-100", text: "text-gray-800" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800" },
};

const statusLabels: Record<OrderStatus, string> = {
  PLACED: "Order Placed",
  PREPARING: "Preparing",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id ? parseInt(params.id as string, 10) : 0;

  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();
  const { data: cart } = useCart();
  const { data: order, isLoading: orderLoading, error } = useOrderDetail(orderId);
  const cancelOrder = useCancelOrder();
  const addToCart = useAddToCart();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const canCancel = order && (order.status === "PLACED" || order.status === "PREPARING");
  const statusStyle = order ? (statusColors[order.status] || statusColors.PLACED) : statusColors.PLACED;

  const handleReorder = async () => {
    if (!order) return;

    for (const item of order.items) {
      if (item.menu_item?.id) {
        await addToCart.mutateAsync({
          menu_item: item.menu_item.id,
          quantity: item.quantity,
          options: item.options?.map(opt => ({
            option: opt.option,
            item: opt.item || (Array.isArray(opt.menu_item_option_item) ? opt.menu_item_option_item[0] : opt.menu_item_option_item),
          })),
        });
      } else if (item.nowaste_item?.id) {
        await addToCart.mutateAsync({
          nowaste_item: item.nowaste_item.id,
          quantity: item.quantity,
        });
      }
    }
    router.push("/cart");
  };

  const handleCancel = () => {
    if (!cancelReason.trim() || !order) return;

    cancelOrder.mutate(
      { id: order.id, data: { reason: cancelReason } },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          setCancelReason("");
        },
      }
    );
  };

  // Redirect to signin if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push("/signin?redirect=/orders");
    return null;
  }

  return (
    <div className="bg-white">
      <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-400">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6 min-h-[64px]">
            <button className="mr-4 lg:mr-6 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 cursor-pointer">
              <Image
                src="/images/menu-icon.svg"
                alt="Menu"
                width={32}
                height={32}
              />
            </button>

            <Link href="/" className="flex items-center mr-4 lg:mr-8 cursor-pointer">
              <span
                className="text-[20px] sm:text-[24px] lg:text-[32px] font-extrabold select-none"
                style={{ fontFamily: "Abril Fatface, serif" }}
              >
                <span className="text-[#CD3625]">FOOD</span>
                <span className="text-black">DELY</span>
              </span>
            </Link>

            <div className="flex-1" />

            <div className="flex items-center gap-3 mr-4 lg:mr-6">
              <Link href="/cart" className="relative flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F7F8FD] cursor-pointer hover:bg-gray-100 transition">
                <Image
                  src="/images/cart-icon.svg"
                  alt="Cart"
                  width={20}
                  height={20}
                  className="lg:w-6 lg:h-6"
                />
                {cart?.items && cart.items.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-[#CD3625] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                )}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {!authLoading && isAuthenticated && (
                <div className="flex items-center gap-4">
                  <Link
                    href="/orders"
                    className="text-[#CD3625] text-[16px] font-medium"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="text-black text-[16px] hover:text-gray-600 font-medium"
                  >
                    {user?.firstname || "Profile"}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = "/";
                    }}
                    className="bg-gray-200 text-black px-4 py-2 rounded-full font-medium hover:bg-gray-300 transition text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full mx-auto px-4 pb-8 pt-24 sm:pt-28 lg:pt-32">
          {/* Back Button */}
          <button
            onClick={() => router.push("/orders")}
            className="inline-flex items-center gap-2 text-[#CD3625] hover:text-red-600 font-medium transition mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Orders
          </button>

          {/* Loading State */}
          {orderLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-500">Loading order details...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-800 font-medium">Failed to load order details</p>
              <p className="text-red-600 text-sm mt-1">Please try again later</p>
            </div>
          )}

          {/* Order Details */}
          {!orderLoading && !error && order && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Order Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Header */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-[#222]">Order #{order.id}</h1>
                      <p className="text-gray-500 mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  {/* Order Status Timeline */}
                  <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                    {["PLACED", "PREPARING", "DELIVERED", "COMPLETED"].map((status, index) => {
                      const isActive = ["PLACED", "PREPARING", "DELIVERED", "COMPLETED"].indexOf(order.status) >= index;
                      const isCancelled = order.status === "CANCELLED";
                      return (
                        <div key={status} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCancelled ? "bg-gray-200" : isActive ? "bg-[#CD3625]" : "bg-gray-200"
                          }`}>
                            {isActive && !isCancelled ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <span className="text-gray-500 text-xs">{index + 1}</span>
                            )}
                          </div>
                          {index < 3 && (
                            <div className={`w-12 sm:w-20 h-1 ${
                              isCancelled ? "bg-gray-200" : isActive ? "bg-[#CD3625]" : "bg-gray-200"
                            }`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancelled Reason */}
                  {order.status === "CANCELLED" && order.cancel_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-medium text-sm">Cancellation Reason:</p>
                      <p className="text-red-700 text-sm mt-1">{order.cancel_reason}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-[#222] mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-200">
                          {(item.menu_item?.image || item.nowaste_item?.image) ? (
                            <Image
                              src={item.menu_item?.image || item.nowaste_item?.image || "/images/default-food.png"}
                              alt={item.menu_item?.name || item.nowaste_item?.name || "Item"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#222]">
                            {item.menu_item?.name || item.nowaste_item?.name || "Unknown Item"}
                          </h3>
                          {item.menu_item?.description && (
                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                              {item.menu_item.description}
                            </p>
                          )}
                          {item.options && item.options.length > 0 && (
                            <p className="text-gray-500 text-xs mt-1">
                              Options: {item.options.length} selected
                            </p>
                          )}
                          <p className="text-gray-600 text-sm mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#222]">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-[#222] mb-4">Order Summary</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${order.price.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-[#222]">Total</span>
                      <span className="font-bold text-[#222]">${order.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                {order.delivery && (
                  <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold text-[#222] mb-4">Delivery Information</h2>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{order.delivery.firstname} {order.delivery.lastname}</p>
                      </div>
                      {order.delivery.address && (
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <p className="font-medium">
                            {order.delivery.address}
                            <br />
                            {order.delivery.postal_code} {order.delivery.city}
                          </p>
                        </div>
                      )}
                      {order.delivery.phone && (
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{order.delivery.phone}</p>
                        </div>
                      )}
                      {order.delivery.email && (
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{order.delivery.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-[#222] mb-4">Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={handleReorder}
                      disabled={addToCart.isPending}
                      className="w-full px-6 py-3 bg-[#CD3625] text-white rounded-full font-medium hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {addToCart.isPending ? "Adding to cart..." : "Reorder"}
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={cancelOrder.isPending}
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-[#222] mb-4">Cancel Order #{orderId}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Please provide a reason for cancellation:
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CD3625] focus:border-transparent resize-none"
                  rows={3}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={!cancelReason.trim() || cancelOrder.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
