"use client";
import { useConfirmPayment, useOrderDetail } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const confirmPayment = useConfirmPayment();
    const hasConfirmed = useRef(false);

    // Handle Stripe redirect - confirm payment and create order
    useEffect(() => {
        if (paymentIntent && redirectStatus === "succeeded" && !orderId && !confirmedOrderId && !hasConfirmed.current) {
            hasConfirmed.current = true;
            confirmPayment.mutate(
                { payment_intent_id: paymentIntent },
                {
                    onSuccess: (order) => {
                        setConfirmedOrderId(order.id);
                    },
                    onError: (err: unknown) => {
                        const error = err as { response?: { data?: { message?: string; error?: string } } };
                        setConfirmError(
                            error?.response?.data?.message ||
                            error?.response?.data?.error ||
                            "Failed to confirm payment. Please contact support."
                        );
                    },
                }
            );
        }
    }, [paymentIntent, redirectStatus, orderId, confirmedOrderId, confirmPayment]);

    // Determine which order ID to use
    const effectiveOrderId = orderId ? Number.parseInt(orderId, 10) : confirmedOrderId;

    const { data: order, isLoading, error } = useOrderDetail(
        effectiveOrderId || 0
    );

    // Show loading while confirming payment from Stripe redirect
    if (paymentIntent && !orderId && !confirmedOrderId && !confirmError) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-lg mt-4">Confirming your payment...</p>
                </div>
            </div>
        );
    }

    // Show error if payment confirmation failed
    if (confirmError) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-red-500 text-lg mb-2">Payment Confirmation Failed</p>
                    <p className="text-gray-600 text-sm mb-4">{confirmError}</p>
                    <Link
                        href="/orders"
                        className="inline-block mt-4 bg-[#CD3625] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b83213] transition"
                    >
                        View Orders
                    </Link>
                </div>
            </div>
        );
    }

    // Show error if Stripe payment failed
    if (redirectStatus && redirectStatus !== "succeeded") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-red-500 text-lg mb-2">Payment Failed</p>
                    <p className="text-gray-600 text-sm mb-4">Your payment was not successful. Please try again.</p>
                    <Link
                        href="/payment"
                        className="inline-block mt-4 bg-[#CD3625] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b83213] transition"
                    >
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }

    if (!effectiveOrderId) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-lg">Order ID not provided</p>
                    <Link
                        href="/orders"
                        className="inline-block mt-4 bg-[#CD3625] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b83213] transition"
                    >
                        View Orders
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-lg mt-4">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg">Failed to load order details</p>
                    <Link
                        href="/orders"
                        className="inline-block mt-4 bg-[#CD3625] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b83213] transition"
                    >
                        View Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <svg
                            className="w-12 h-12 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                        Order Confirmed!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Thank you for your order. We&apos;ve received it and will start preparing it soon.
                    </p>
                </div>

                {/* Order Details Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-black mb-1">
                                Order #{order.id}
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Placed on {order.placed || (order.created_at ? new Date(order.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }) : "Recently")}
                            </p>
                        </div>
                        <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold ${order.status === "placed"
                                    ? "bg-blue-100 text-blue-700"
                                    : order.status === "preparing"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                }`}
                        >
                            {order.status}
                        </span>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-black mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order?.items?.map((item) => {
                                const itemData = item.menu_item || item.nowaste_item;
                                if (!itemData) return null;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
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
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-black">
                                                {(item.price * item.quantity).toFixed(2)} CHF
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery Information */}
                    {order.delivery && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="font-semibold text-black mb-3">Delivery Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Name:</span>
                                    <span className="ml-2 font-medium text-black">
                                        {order.delivery.firstname} {order.delivery.lastname}
                                    </span>
                                </div>
                                {order.delivery.phone && (
                                    <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="ml-2 font-medium text-black">
                                            {order.delivery.phone}
                                        </span>
                                    </div>
                                )}
                                {order.delivery.email && (
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <span className="ml-2 font-medium text-black">
                                            {order.delivery.email}
                                        </span>
                                    </div>
                                )}
                                <div className="sm:col-span-2">
                                    <span className="text-gray-600">Address:</span>
                                    <span className="ml-2 font-medium text-black">
                                        {order.delivery.address}, {order.delivery.postal_code}{" "}
                                        {order.delivery.city}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Total */}
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-black">Total</span>
                        <span className="text-2xl font-bold text-[#CD3625]">
                            {Number(order?.total ?? order?.price ?? 0).toFixed(2)} CHF
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/orders"
                        className="px-8 py-3 bg-[#CD3625] text-white rounded-full font-medium hover:bg-[#b83213] transition text-center"
                    >
                        View All Orders
                    </Link>
                    <Link
                        href="/partners"
                        className="px-8 py-3 bg-gray-100 text-black rounded-full font-medium hover:bg-gray-200 transition text-center"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
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
            <OrderConfirmationContent />
        </Suspense>
    );
}
