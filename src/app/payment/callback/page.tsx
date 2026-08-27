"use client";
import { useConfirmPayment } from "@/lib/api";
import { extractApiError } from "@/lib/api/error";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmPayment = useConfirmPayment();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const confirmationStarted = useRef(false);

  // Get Stripe params from URL
  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  useEffect(() => {
    if (status !== "processing" || confirmationStarted.current) return;
    confirmationStarted.current = true;

    const confirmOrder = async () => {
      // Validate we have the required params
      if (!paymentIntent) {
        setStatus("error");
        setErrorMessage("Missing payment information. Please try again.");
        return;
      }

      // Check redirect status from Stripe
      if (redirectStatus !== "succeeded") {
        setStatus("error");
        if (redirectStatus === "failed") {
          setErrorMessage("Payment failed. Please try again with a different payment method.");
        } else if (redirectStatus === "pending") {
          setErrorMessage("Payment is still being processed. Please wait a moment and refresh.");
        } else {
          setErrorMessage(`Payment was not successful. Status: ${redirectStatus || "unknown"}`);
        }
        return;
      }

      // Call backend to confirm payment and create order
      confirmPayment.mutate(
        { payment_intent_id: paymentIntent },
        {
          onSuccess: (order) => {
            setOrderId(order.id);
            setStatus("success");
            // Redirect to order confirmation after a short delay
            setTimeout(() => {
              router.push(`/order-confirmation?id=${order.id}`);
            }, 1500);
          },
          onError: (err: unknown) => {
            const message = extractApiError(err, "Failed to confirm payment. Please contact support.");

            // Check for specific error codes
            if (message.toLowerCase().includes("already") && message.toLowerCase().includes("confirm")) {
              // Payment was already confirmed - try to get the order
              setStatus("success");
              setErrorMessage("Payment was already processed. Redirecting to your orders...");
              setTimeout(() => {
                router.push("/orders");
              }, 2000);
              return;
            }

            setStatus("error");
            setErrorMessage(message);
          },
        }
      );
    };

    confirmOrder();
  }, [paymentIntent, redirectStatus, confirmPayment, router, status]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[600px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <span
              className="text-[28px] font-extrabold select-none"
              style={{ fontFamily: "Abril Fatface, serif" }}
            >
              <span className="text-[#CD3625]">FOOD</span>
              <span className="text-black">DELY</span>
            </span>
          </Link>
        </div>

        {/* Processing State */}
        {status === "processing" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-[#222] mb-4">Processing Your Payment</h1>
            <p className="text-gray-600">
              Please wait while we confirm your payment and create your order...
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Do not close this page.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="#22C55E"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#222] mb-4">Payment Successful!</h1>
            {orderId && (
              <p className="text-[#CD3625] font-semibold text-xl mb-4">
                Order #{orderId}
              </p>
            )}
            <p className="text-gray-600 mb-6">
              {errorMessage || "Your order has been placed successfully. Redirecting..."}
            </p>
            <div className="inline-block w-6 h-6 border-2 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#222] mb-4">Payment Issue</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/payment"
                className="px-6 py-3 bg-[#CD3625] text-white rounded-full font-medium hover:bg-red-600 transition"
              >
                Try Again
              </Link>
              <Link
                href="/orders"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
              >
                View Orders
              </Link>
              <Link
                href="/partners"
                className="px-6 py-3 border border-[#CD3625] text-[#CD3625] rounded-full font-medium hover:bg-red-50 transition"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">
                If you believe this is an error and your payment was charged,
                please contact our support team with your payment reference.
              </p>
              {paymentIntent && (
                <p className="text-gray-400 text-xs mt-2 font-mono">
                  Ref: {paymentIntent.slice(0, 20)}...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
