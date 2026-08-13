"use client";
import {
  useAddToCart,
  useCancelOrder,
  useCart,
  useOrderDetail,
  useOrderStatus,
  useRestaurantDetail,
} from "@/lib/api";
import SafeImage from "@/components/SafeImage";
import type { OrderStatus } from "@/lib/api/types";
import { getOrderRestaurantId, getOrderRestaurantName } from "@/lib/order-restaurant";
import { ArrowLeft, Bike, Check, ChefHat, Clock3, MapPin, PackageCheck, PartyPopper, ShoppingBag, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: "bg-blue-100", text: "text-blue-800" },
  preparing: { bg: "bg-yellow-100", text: "text-yellow-800" },
  ready: { bg: "bg-orange-100", text: "text-orange-800" },
  delivering: { bg: "bg-amber-100", text: "text-amber-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  can_cust: { bg: "bg-red-100", text: "text-red-800" },
  can_rest: { bg: "bg-red-100", text: "text-red-800" },
};

const statusLabels: Record<OrderStatus, string> = {
  placed: "Order placed",
  preparing: "Preparing",
  ready: "Ready",
  delivering: "On the way",
  completed: "Completed",
  can_cust: "Cancelled by you",
  can_rest: "Cancelled by restaurant",
};

const statusExperience = {
  placed: { icon: Clock3, eyebrow: "Order received", title: "Your order is in", copy: "The restaurant has received your order and will begin shortly.", gradient: "from-blue-600 to-indigo-700", glow: "bg-blue-400" },
  preparing: { icon: ChefHat, eyebrow: "In the kitchen", title: "Freshly preparing", copy: "Your meal is being prepared with care right now.", gradient: "from-orange-500 to-[#c83b2b]", glow: "bg-orange-300" },
  ready: { icon: PackageCheck, eyebrow: "Packed and ready", title: "Ready to leave", copy: "Everything is packed and waiting for its journey to you.", gradient: "from-amber-500 to-orange-600", glow: "bg-amber-300" },
  delivering: { icon: Bike, eyebrow: "On the move", title: "Heading your way", copy: "Your order has left the restaurant and is on its way.", gradient: "from-violet-600 to-indigo-700", glow: "bg-violet-300" },
  completed: { icon: PartyPopper, eyebrow: "Delivered", title: "Enjoy your meal", copy: "Your order has arrived. We hope every bite is worth it.", gradient: "from-emerald-500 to-teal-700", glow: "bg-emerald-300" },
  can_cust: { icon: XCircle, eyebrow: "Order cancelled", title: "Cancelled by you", copy: "This order is no longer being prepared or delivered.", gradient: "from-rose-600 to-red-800", glow: "bg-rose-300" },
  can_rest: { icon: XCircle, eyebrow: "Order cancelled", title: "Cancelled by restaurant", copy: "The restaurant could not complete this order.", gradient: "from-rose-600 to-red-800", glow: "bg-rose-300" },
} satisfies Record<OrderStatus, { icon: typeof Clock3; eyebrow: string; title: string; copy: string; gradient: string; glow: string }>;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id ? parseInt(params.id as string, 10) : 0;

  const { data: cart } = useCart();
  const { data: order, isLoading: orderLoading, error } = useOrderDetail(orderId);
  const { data: liveStatus } = useOrderStatus(
    orderId,
    Boolean(order) && !["completed", "can_cust", "can_rest"].includes(order?.status ?? ""),
    10_000,
  );
  const cancelOrder = useCancelOrder();
  const addToCart = useAddToCart();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const currentStatus = liveStatus?.status ?? order?.status ?? "placed";
  const canCancel = order && (currentStatus === "placed" || currentStatus === "preparing");
  const statusStyle = statusColors[currentStatus] || statusColors.placed;
  const experience = statusExperience[currentStatus] || statusExperience.placed;
  const StatusIcon = experience.icon;
  const orderTotal = Number(order?.total ?? order?.price ?? 0);
  const embeddedRestaurantName = order ? getOrderRestaurantName(order) : "";
  const restaurantId = order ? getOrderRestaurantId(order) : null;
  const { data: orderRestaurant } = useRestaurantDetail(restaurantId ?? 0);
  const restaurantName = embeddedRestaurantName === "Restaurant name unavailable"
    ? orderRestaurant?.name ?? "Restaurant"
    : embeddedRestaurantName;
  const delivery = order?.delivery ?? (order?.delivery_firstname ? {
    firstname: order.delivery_firstname, lastname: order.delivery_lastname ?? "", address: order.delivery_address ?? "",
    postal_code: order.delivery_postal_code ?? "", city: order.delivery_city ?? "", phone: order.delivery_phone, email: order.delivery_email,
  } : undefined);

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

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
          <div className="mx-auto grid min-h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
            <Link href="/orders" className="flex w-fit items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#665b55] transition hover:bg-[#f7f1ee] hover:text-[#b63825]">
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">All orders</span>
            </Link>

            <Link href="/" className="text-[24px] font-black tracking-[-0.04em]">
              <span className="text-[#c83b2b]">FOOD</span>DELY
            </Link>

            <div className="flex justify-end">
              <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0eb] text-[#b63825]">
                <ShoppingBag size={20} />
                {cart?.items && cart.items.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c83b2b] px-1 text-[10px] font-black text-white">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push("/orders")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#b63825] transition hover:text-[#8f2d20]"
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
                <div className="overflow-hidden rounded-[28px] border border-[#e9dfda] bg-white shadow-[0_20px_55px_rgba(55,35,27,0.09)]">
                  <div className={`relative overflow-hidden bg-gradient-to-br ${experience.gradient} p-6 text-white sm:p-8`}>
                    <div className={`absolute -right-12 -top-12 h-48 w-48 rounded-full ${experience.glow} opacity-30 blur-3xl motion-safe:animate-pulse`} />
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur sm:h-20 sm:w-20">
                          {!['completed','can_cust','can_rest'].includes(currentStatus) && <span className="absolute inset-0 rounded-2xl border border-white/50 motion-safe:animate-ping" />}
                          <StatusIcon size={32} className={currentStatus === 'delivering' ? 'motion-safe:animate-bounce' : currentStatus === 'preparing' ? 'motion-safe:animate-pulse' : ''} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">{experience.eyebrow}</p>
                          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{experience.title}</h1>
                          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{experience.copy}</p>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-2xl border border-white/20 bg-black/15 px-4 py-3 backdrop-blur">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Order number</p>
                        <p className="mt-1 text-xl font-black">#{order.id}</p>
                        <p className="mt-1 max-w-48 text-sm font-bold text-white/85">{restaurantName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <p className="text-sm font-semibold text-[#756a65]">
                        Placed on {order.placed || (order.created_at ? new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "Recently")}
                      </p>
                      <p className="text-sm font-black text-[#b63825]">{restaurantName}</p>
                      <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${statusStyle.bg} ${statusStyle.text}`}>{statusLabels[currentStatus]}</span>
                    </div>

                  {/* Order Status Timeline */}
                  <div className="mb-2 grid grid-cols-5 gap-1 sm:gap-2">
                    {(["placed", "preparing", "ready", "delivering", "completed"] as OrderStatus[]).map((status, index) => {
                      const isActive = ["placed", "preparing", "ready", "delivering", "completed"].indexOf(currentStatus) >= index;
                      const isCurrent = status === currentStatus;
                      const isCancelled = currentStatus === "can_cust" || currentStatus === "can_rest";
                      return (
                        <div key={status} className="relative min-w-0 text-center">
                          {index < 4 && <span className={`absolute left-[55%] top-5 h-0.5 w-[90%] ${isActive && !isCancelled ? 'bg-[#CD3625]' : 'bg-[#e7ded9]'}`} />}
                          <div className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-700 ${
                            isCancelled ? "bg-gray-200" : isActive ? "bg-[#CD3625]" : "bg-gray-200"
                          } ${isCurrent ? 'scale-110 shadow-[0_0_0_6px_rgba(205,54,37,.12)]' : ''}`}>
                            {isActive && !isCancelled ? (
                              isCurrent && status !== 'completed' ? <span className="h-2.5 w-2.5 rounded-full bg-white motion-safe:animate-pulse" /> : <Check size={17} className="text-white" />
                            ) : (
                              <span className="text-gray-500 text-xs">{index + 1}</span>
                            )}
                          </div>
                          <p className={`mt-3 text-[9px] font-black leading-3 sm:text-[11px] ${isActive && !isCancelled ? "text-[#b63825]" : "text-[#91857e]"}`}>
                            {statusLabels[status]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {!["completed", "can_cust", "can_rest"].includes(currentStatus) && (
                    <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#fff7f3] px-3 py-3 text-xs font-semibold text-[#7c5148]">
                      <Clock3 size={15} className="text-[#b63825]" />
                      Status refreshes automatically every 10 seconds.
                    </p>
                  )}

                  {/* Cancelled Reason */}
                  {(currentStatus === "can_cust" || currentStatus === "can_rest") && (order.status_reason || order.cancel_reason) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-medium text-sm">Cancellation Reason:</p>
                      <p className="text-red-700 text-sm mt-1">{order.status_reason || order.cancel_reason}</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="rounded-[24px] border border-[#e9dfda] bg-white p-6 shadow-[0_14px_38px_rgba(55,35,27,0.06)]">
                  <h2 className="text-lg font-semibold text-[#222] mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-200">
                          <SafeImage
                            src={item.menu_item?.image || item.nowaste_item?.image}
                            alt={item.menu_item?.name || item.nowaste_item?.name || "Item"}
                            fill
                            className="object-cover"
                            fallbackClassName="object-contain bg-[#fff8f5] p-4"
                          />
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
                          <p className="font-semibold text-[#222]">{Number(item.price).toFixed(2)} CHF</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="rounded-[22px] border border-[#3a2b26] bg-[#241b18] p-6 text-white shadow-[0_20px_50px_rgba(42,28,22,0.16)]">
                  <h2 className="mb-4 text-lg font-black text-white">Order summary</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Subtotal</span>
                      <span className="font-medium">{Number(order.subtotal ?? orderTotal).toFixed(2)} CHF</span>
                    </div>
                    <div className="my-3 border-t border-white/10"></div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-white">Total</span>
                      <span className="font-bold text-white">{orderTotal.toFixed(2)} CHF</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                {delivery && (
                  <div className="rounded-[22px] border border-[#e9dfda] bg-white p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><MapPin size={18} className="text-[#b63825]" /> Delivery information</h2>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{delivery.firstname} {delivery.lastname}</p>
                      </div>
                      {delivery.address && (
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <p className="font-medium">
                            {delivery.address}
                            <br />
                            {delivery.postal_code} {delivery.city}
                          </p>
                        </div>
                      )}
                      {delivery.phone && (
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{delivery.phone}</p>
                        </div>
                      )}
                      {delivery.email && (
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{delivery.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="rounded-[22px] border border-[#e9dfda] bg-white p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><PackageCheck size={18} className="text-[#b63825]" /> Order actions</h2>
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
