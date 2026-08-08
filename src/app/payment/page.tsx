"use client";
import {
  useAddresses,
  useAuth,
  useCart,
  useClearCart,
  useConfirmPayment,
  useCreatePaymentIntent,
  useValidateCart,
} from "@/lib/api";
import SafeImage from "@/components/SafeImage";
import { getCartTotal } from "@/lib/cart-total";
import { extractApiError } from "@/lib/api/error";
import "@fontsource/abril-fatface";
import "@fontsource/playfair-display/700.css";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Initialize Stripe
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CartItem {
  id: string;
  image: string;
  name: string;
  price: string;
  qty: number;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  deliveryNotes: string;
  preferredTime: string;
  receiveNotifications: boolean;
  tipAmount: string;
}

// Payment form component that uses Stripe Elements
function PaymentForm({
  clientSecret,
  onSuccess,
  onError,
}: Readonly<{
  clientSecret: string;
  onSuccess: (orderId: number) => void;
  onError: (error: string) => void;
}>) {
  const stripe = useStripe();
  const elements = useElements();
  const confirmPayment = useConfirmPayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onError("Stripe not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);

    try {
      // Stripe's current Payment Element validates and commits its internal
      // state before the PaymentIntent can be confirmed.
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || "Payment form validation failed.");
        setIsProcessing(false);
        return;
      }

      const origin = typeof globalThis !== "undefined" && globalThis.window ? globalThis.window.location.origin : "";
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${origin}/payment/callback`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        onError(result.error.message || "Payment confirmation failed");
        setIsProcessing(false);
        return;
      }

      const paymentIntent = result && typeof result === "object" && "paymentIntent" in result
        ? (result as { paymentIntent: { status: string; id: string; last_payment_error?: unknown } }).paymentIntent
        : null;
      if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          // Step 2: Confirm payment and create order via /api/app/payment/confirm/
          confirmPayment.mutate(
            { payment_intent_id: paymentIntent.id },
            {
              onSuccess: (order) => {
                setIsProcessing(false);
                onSuccess(order.id);
              },
              onError: (err: unknown) => {
                const error = err as {
                  response?: { data?: { message?: string; error?: string } };
                };
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.response?.data?.error ||
                  "Failed to confirm payment. Please contact support.";
                onError(errorMessage);
                setIsProcessing(false);
              },
            }
          );
        } else if (paymentIntent.status === "requires_action") {
          onError("Payment requires additional authentication. Please complete the verification.");
          setIsProcessing(false);
        } else {
          onError(`Payment was not successful. Status: ${paymentIntent.status}. Please try again.`);
          setIsProcessing(false);
        }
      } else {
        onError("Stripe did not return a payment result. Please check the payment status before trying again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Stripe payment confirmation failed", error);
      const errorMessage = extractApiError(error, "Stripe could not complete this payment. Please try again.");
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PaymentElement />
      <button
        onClick={handlePayment}
        disabled={!stripe || isProcessing || confirmPayment.isPending}
        className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c83b2b] px-5 text-base font-black text-white shadow-[0_12px_28px_rgba(200,59,43,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ad321f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing || confirmPayment.isPending ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  // Fetch cart from API - don't refetch on mount to avoid creating new sessions
  const { data: apiCart, isLoading: isCartLoading, refetch: refetchCart } = useCart();
  // Clear cart hook
  const clearCart = useClearCart();
  // Remove from cart hook
  // Validate cart state
  const cartValidation = useValidateCart();
  // Check if user is authenticated and get profile
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  // Fetch user addresses for logged-in users
  const { data: addresses, isLoading: isAddressesLoading } = useAddresses();
  const router = useRouter();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const createPaymentIntent = useCreatePaymentIntent();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Sync cart items from API when available
  useEffect(() => {
    if (apiCart?.items && apiCart.items.length > 0) {
      const items: CartItem[] = [];

      // Process all cart items (both menu items and nowaste items)
      apiCart.items.forEach((item) => {
        if (item.menu_item) {
          items.push({
            id: item.id.toString(),
            image: item.menu_item.image || "/images/Food.png",
            name: item.menu_item.name,
            price: `${item.menu_item.price.toFixed(2)} CHF`,
            qty: item.quantity,
          });
        } else if (item.nowaste_item) {
          items.push({
            id: item.id.toString(),
            image: item.nowaste_item.image || "/images/Food.png",
            name: item.nowaste_item.name,
            price: `${item.nowaste_item.price.toFixed(2)} CHF`,
            qty: item.quantity,
          });
        }
      });

      setCartItems(items);
    } else if (!isCartLoading && (!apiCart?.items || apiCart.items.length === 0)) {
      // Cart is empty or doesn't exist
      setCartItems([]);
    }
  }, [apiCart, isCartLoading]);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    deliveryNotes: "",
    preferredTime: "",
    receiveNotifications: false,
    tipAmount: "",
  });

  useEffect(() => {
    const legacyQuerySecret = searchParams.get("client_secret");
    // A PaymentIntent belongs to one exact cart snapshot and may already be
    // confirmed. Never revive a previous checkout secret for a new cart.
    sessionStorage.removeItem("checkout_client_secret");
    setClientSecret(null);
    if (legacyQuerySecret) {
      router.replace("/payment");
    }
  }, [router, searchParams]);

  // Pre-fill form with user data if authenticated, or from tab-scoped checkout data.
  useEffect(() => {
    if (isAuthenticated && user && !isAuthLoading) {
      setGuestInfo((prev) => ({
        ...prev,
        firstName: user.firstname || prev.firstName,
        lastName: user.lastname || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    } else if (!isAuthenticated && !isAuthLoading) {
      // For non-authenticated users, check sessionStorage for data saved from cart page
      if (typeof window !== "undefined") {
        const savedGuestInfo = sessionStorage.getItem("checkout_guest_info");
        const savedDeliveryType = sessionStorage.getItem("checkout_delivery_type");

        if (savedGuestInfo) {
          try {
            const parsedInfo = JSON.parse(savedGuestInfo);
            setGuestInfo((prev) => ({
              ...prev,
              firstName: parsedInfo.firstName || prev.firstName,
              lastName: parsedInfo.lastName || prev.lastName,
              email: parsedInfo.email || prev.email,
              phone: parsedInfo.phone || prev.phone,
              address: parsedInfo.address || prev.address,
              postalCode: parsedInfo.postalCode || prev.postalCode,
              city: parsedInfo.city || prev.city,
              deliveryNotes: parsedInfo.deliveryNotes || prev.deliveryNotes,
            }));
          } catch {
            sessionStorage.removeItem("checkout_guest_info");
          }
        }

        if (savedDeliveryType === "delivery" || savedDeliveryType === "pickup") {
          setDeliveryType(savedDeliveryType);
        }
      }
    }
  }, [isAuthenticated, user, isAuthLoading]);

  // Pre-fill address fields from API (logged-in) or URL/sessionStorage (guest)
  useEffect(() => {
    if (isAuthLoading || isAddressesLoading) return;

    if (isAuthenticated && addresses && addresses.length > 0) {
      // For logged-in users, use their default address or first address
      const defaultAddress = addresses.find((addr) => addr.default) || addresses[0];
      setGuestInfo((prev) => ({
        ...prev,
        address: defaultAddress.address || prev.address,
        postalCode: defaultAddress.postal_code || prev.postalCode,
        city: defaultAddress.city || prev.city,
      }));
    } else if (!isAuthenticated) {
      // For non-logged-in users, get address from URL query parameter or sessionStorage
      let addressFromUrl = searchParams.get("address");

      // If not in URL, check sessionStorage (set from partners page)
      if (!addressFromUrl && typeof window !== "undefined") {
        addressFromUrl = sessionStorage.getItem("deliveryAddress");
      }

      if (addressFromUrl) {
        const decodedAddress = decodeURIComponent(addressFromUrl);
        // Parse the address - format could be "Street, PostalCode City" or just the address
        const parts = decodedAddress.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          // Format: "Street Address, PostalCode City"
          const streetAddress = parts[0];
          const postalAndCity = parts[1].trim();
          // Try to extract postal code and city (assuming format like "12345 City Name")
          const postalCityMatch = postalAndCity.match(/^(\d+)\s+(.+)$/);
          if (postalCityMatch) {
            setGuestInfo((prev) => ({
              ...prev,
              address: streetAddress,
              postalCode: postalCityMatch[1],
              city: postalCityMatch[2],
            }));
          } else {
            // Just set the full address if we can't parse it
            setGuestInfo((prev) => ({
              ...prev,
              address: decodedAddress,
            }));
          }
        } else {
          // Just a single address string
          setGuestInfo((prev) => ({
            ...prev,
            address: decodedAddress,
          }));
        }
      }
    }
  }, [isAuthenticated, addresses, isAddressesLoading, isAuthLoading, searchParams]);

  const subtotal = getCartTotal(apiCart);

  const handleGuestInfoChange = (field: keyof GuestInfo, value: string | boolean) => {
    setGuestInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Get delivery information
  const getDeliveryInfo = () => {
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      return null;
    }

    // For delivery, require address, postal code, and city
    if (deliveryType === "delivery") {
      if (!guestInfo.address || !guestInfo.postalCode || !guestInfo.city) {
        return null;
      }
    }

    return {
      delivery_firstname: guestInfo.firstName,
      delivery_lastname: guestInfo.lastName,
      delivery_address: guestInfo.address || "",
      delivery_postal_code: guestInfo.postalCode || "",
      delivery_city: guestInfo.city || "",
      delivery_phone: guestInfo.phone,
      delivery_email: guestInfo.email,
      tip_amount: guestInfo.tipAmount ? Number(guestInfo.tipAmount) : undefined,
    };
  };

  const handlePaymentSuccess = (orderId: number) => {
    sessionStorage.removeItem("checkout_client_secret");
    setPaymentSuccess(true);
    setTimeout(() => {
      router.push(`/order-confirmation?id=${orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setTimeout(() => setPaymentError(null), 5000);
  };

  const deliveryInfo = getDeliveryInfo();
  const hasCartItems = apiCart?.items && apiCart.items.length > 0;
  const canProceedToPayment = deliveryInfo !== null && hasCartItems && !isCartLoading;

  // Create payment intent when user is ready to pay
  const handleCreatePaymentIntent = () => {
    if (cartValidation.errors.length > 0) {
      setPaymentError(cartValidation.errors.join(" "));
      return;
    }

    if (!cartValidation.isValid) {
      setPaymentError("Cart validation failed. Please refresh the page and try again.");
      return;
    }

    // Validate cart exists and has items
    if (!apiCart) {
      setPaymentError("Cart not found. Please refresh the page and try again.");
      return;
    }

    if (!apiCart.items || apiCart.items.length === 0) {
      setPaymentError("Your cart is empty. Please add items to your cart first.");
      return;
    }

    // Validate cart has valid items
    const hasValidItems = apiCart.items.some(item =>
      (item.menu_item?.id) ||
      (item.nowaste_item?.id)
    );

    if (!hasValidItems) {
      setPaymentError("Your cart contains invalid items. Please refresh and try again.");
      return;
    }

    // Validate delivery information
    if (!deliveryInfo) {
      setPaymentError("Please fill in all required delivery information");
      return;
    }

    // Validate required delivery fields
    if (deliveryType === "delivery") {
      if (!deliveryInfo.delivery_address || !deliveryInfo.delivery_city || !deliveryInfo.delivery_postal_code) {
        setPaymentError("Please provide complete delivery address (address, city, and postal code)");
        return;
      }

      // Validate postal code format (should not be empty)
      if (deliveryInfo.delivery_postal_code.trim() === "") {
        setPaymentError("Postal code is required for delivery");
        return;
      }

      // Validate city format (should not be empty)
      if (deliveryInfo.delivery_city.trim() === "") {
        setPaymentError("City is required for delivery");
        return;
      }
    }

    setPaymentError(null);

    // According to docs, delivery info is optional - try with it first
    createPaymentIntent.mutate(deliveryInfo, {
      onSuccess: (intentData) => {
        // Handle both response formats
        const clientSecret = intentData.payment_intent_client_secret || intentData.client_secret;
        if (!clientSecret) {
          setPaymentError("Payment intent created but client secret is missing. Please try again.");
          return;
        }
        setClientSecret(clientSecret);
        setPaymentError(null);
      },
      onError: (err: unknown) => {
        const error = err as {
          response?: {
            data?: {
              message?: string;
              error?: string;
              detail?: string;
              [key: string]: unknown;
            };
            status?: number;
          };
        };

        // Extract error message from various possible locations
        const errorData = error?.response?.data;
        let errorMessage = "Failed to create payment intent. Please try again.";

        if (errorData) {
          // Try different possible error message fields
          errorMessage =
            (typeof errorData.error === "string" ? errorData.error : null) ||
            (typeof errorData.message === "string" ? errorData.message : null) ||
            (typeof errorData.detail === "string" ? errorData.detail : null) ||
            (typeof errorData === "string" ? errorData : null) ||
            errorMessage;
        }

        setPaymentError(errorMessage);

        // Handle specific error cases based on API documentation error codes
        if (errorMessage.includes("api.cart_not_found") || errorMessage.includes("cart_not_found")) {
          setPaymentError("Your cart was not found (404). Please add items to your cart and try again.");
        } else if (errorMessage.includes("api.cart_empty") || errorMessage.includes("cart_empty")) {
          setPaymentError("Your cart is empty (404). Please add items to your cart first.");
        } else if (errorMessage.includes("api.cart_delivery_not_defined") || errorMessage.includes("cart_delivery_not_defined")) {
          setPaymentError("Delivery information is not defined (404). Please fill in all delivery details.");
        } else if (errorMessage.includes("api.payment_intent_invalid") || errorMessage.includes("payment_intent_invalid")) {
          // According to API docs, this is a 400 error - backend validation failed
          setPaymentError(
            "Payment validation failed. Please check the following:\n" +
            "• Your cart contains valid items with correct quantities\n" +
            "• All items are available and in stock\n\n" +
            "Technical Details: Server-side cart validation failed. " +
            "This could be due to invalid items, incorrect quantities, or pricing issues. " +
            "Please refresh the page and try again. If the problem persists, contact support."
          );
        } else if (errorMessage.includes("cart_invalid") || errorMessage.includes("CART_INVALID") || errorMessage.includes("api.cart_invalid")) {
          // Cart is corrupted - user needs to clear it and start over
          // Set a special error flag to show the clear cart button
          setPaymentError("CART_INVALID");
        } else if (errorMessage.includes("delivery") || errorMessage.includes("address")) {
          setPaymentError("Please provide complete delivery information (address, city, and postal code).");
        } else if (errorMessage.includes("cart")) {
          setPaymentError("There's an issue with your cart. Please refresh the page and try again.");
        }
      },
    });
  };

  const getDeliveryTimeOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 1; i <= 8; i++) {
      const time = new Date(now.getTime() + i * 30 * 60000);
      options.push({
        value: time.toISOString(),
        label: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
    }
    return options;
  };

  return (
    <div className="checkout-theme min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <header className="sticky left-0 top-0 z-50 w-full border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
          <Link
            href="/cart"
            className="flex w-fit items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#665b55] transition hover:bg-[#f7f1ee] hover:text-[#b63825]"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to cart</span>
          </Link>

          <Link href="/" className="text-[24px] font-black tracking-[-0.04em]">
            <span className="text-[#c83b2b]">FOOD</span>DELY
          </Link>

          <div className="flex justify-end">
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0eb] text-[#b63825] transition hover:bg-[#ffe5dd]">
              <ShoppingBag size={20} />
              {apiCart?.items && apiCart.items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c83b2b] px-1 text-[10px] font-black text-white">
                  {apiCart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b63825]">
            <LockKeyhole size={15} />
            Secure checkout
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Complete your order
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#7d716a]">
            Confirm your details, choose delivery or pickup, and pay securely.
          </p>
        </div>

        {/* Tabs */}
        {/* <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-4 sm:px-16 mt-4 sm:mt-8 mb-4 sm:mb-8">
          <button className="px-4 sm:px-8 py-2 rounded-full border-2 border-[#CD3625] text-[#CD3625] font-medium text-base sm:text-lg bg-white">
            Payments
          </button>
          <button className="px-4 sm:px-8 py-2 rounded-full bg-[#CD3625] text-white font-medium text-base sm:text-lg shadow">
            Archives des commandes
          </button>
        </div> */}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex-1 max-w-full lg:max-w-[840px]">
            {/* Delivery/Pickup Toggle */}
            <div className="rounded-[26px] border border-[#e9dfda] bg-white p-5 shadow-[0_16px_45px_rgba(55,35,27,0.06)] sm:p-7 lg:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0eb] text-[#b63825]">
                  <Truck size={21} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b63825]">Fulfilment</p>
                  <div className="text-xl font-black text-[#222]">
                    Delivery details
                  </div>
                </div>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-[#f8f3f0] p-1.5">
                <button
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-bold transition ${deliveryType === "delivery"
                    ? "bg-white text-[#b63825] shadow-sm"
                    : "text-[#766a64] hover:text-[#b63825]"
                    }`}
                  onClick={() => setDeliveryType("delivery")}
                >
                  <Truck size={18} />
                  Delivery
                </button>
                <button
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-bold transition ${deliveryType === "pickup"
                    ? "bg-white text-[#b63825] shadow-sm"
                    : "text-[#766a64] hover:text-[#b63825]"
                    }`}
                  disabled
                  title="Pickup checkout is not available yet"
                >
                  <PackageCheck size={18} />
                  Pickup unavailable
                </button>
              </div>

              {/* Guest Checkout Section */}
              <div className="mb-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#222]">
                    {isAuthenticated ? "Delivery Information" : "Guest Checkout"}
                  </h3>
                  {isAuthenticated && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Logged in as {user?.email}
                    </span>
                  )}
                </div>

                <div className="mb-4 rounded-2xl border border-[#eee4df] bg-[#fcfaf9] p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        value={guestInfo.firstName}
                        onChange={(e) => handleGuestInfoChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        value={guestInfo.lastName}
                        onChange={(e) => handleGuestInfoChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        value={guestInfo.email}
                        onChange={(e) => handleGuestInfoChange("email", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        value={guestInfo.phone}
                        onChange={(e) => handleGuestInfoChange("phone", e.target.value)}
                        required
                      />
                    </div>
                    {deliveryType === "delivery" && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Address *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                            value={guestInfo.address}
                            onChange={(e) => handleGuestInfoChange("address", e.target.value)}
                            required
                            placeholder="Street address, building number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                            value={guestInfo.city}
                            onChange={(e) => handleGuestInfoChange("city", e.target.value)}
                            required
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                            value={guestInfo.postalCode}
                            onChange={(e) => handleGuestInfoChange("postalCode", e.target.value)}
                            required
                            placeholder="Postal code"
                          />
                        </div>
                      </>
                    )}
                    <div className="hidden sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred {deliveryType === "delivery" ? "Delivery" : "Pickup"} Time
                      </label>
                      <select
                        className="h-12 w-full appearance-none border border-gray-300 bg-white px-4 py-0 text-base leading-normal focus:border-transparent focus:ring-2 focus:ring-[#CD3625]"
                        value={guestInfo.preferredTime}
                        onChange={(e) => handleGuestInfoChange("preferredTime", e.target.value)}
                      >
                        <option value="">Select a time</option>
                        {getDeliveryTimeOptions().map((time) => (
                          <option key={time.value} value={time.value}>{time.label}</option>
                        ))}
                      </select>
                    </div>
                    {deliveryType === "delivery" && (
                      <div className="hidden sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Notes
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                          rows={3}
                          placeholder="Building access codes, special instructions..."
                          value={guestInfo.deliveryNotes}
                          onChange={(e) => handleGuestInfoChange("deliveryNotes", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {!isAuthenticated && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2" />
                          <path d="M12 6v6l4 2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div>
                          <p className="text-blue-800 text-sm">
                            Create your account to unlock exclusive promotions, loyalty points, and discounts.
                          </p>
                          <button
                            onClick={() => router.push("/signup")}
                            className="mt-2 text-[#CD3625] hover:text-red-600 font-medium text-sm"
                          >
                            Create Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="hidden items-center gap-2">
                    <input
                      type="checkbox"
                      id="notifications"
                      className="w-4 h-4 rounded border-gray-300 accent-[#CD3625]"
                      checked={guestInfo.receiveNotifications}
                      onChange={(e) => handleGuestInfoChange("receiveNotifications", e.target.checked)}
                    />
                    <label htmlFor="notifications" className="text-sm text-gray-700">
                      Receive notifications on deals, discounts, and loyalty offers
                    </label>
                  </div>
                  <div className="mt-4 border-t border-[#eee4df] pt-4">
                    <label className="block text-sm font-bold text-gray-700">Optional tip (CHF)</label>
                    <input type="number" min="0" max="200" step="0.01" inputMode="decimal" value={guestInfo.tipAmount} onChange={e=>handleGuestInfoChange("tipAmount", e.target.value)} placeholder="0.00" className="mt-2 h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none focus:border-[#CD3625] focus:ring-2 focus:ring-[#CD3625]/15" />
                  </div>
                </div>
              </div>



              <div className="hidden">
                {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#4ADE80" />
                      <path
                        d="M8 12l2.5 2.5L16 9"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-black font-medium text-lg sm:text-xl">
                      Add new card
                    </span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto justify-center sm:justify-end">
                    <Image
                      src="/images/mastercard.svg"
                      alt="Visa"
                      width={40}
                      height={28}
                      className="w-8 h-6 sm:w-10 sm:h-7 lg:w-[40px] lg:h-[28px]"
                    />
                    <Image
                      src="/images/visa.svg"
                      alt="Visa"
                      width={40}
                      height={28}
                      className="w-8 h-6 sm:w-10 sm:h-7 lg:w-[40px] lg:h-[28px]"
                    />
                    <svg
                      width="40"
                      height="28"
                      viewBox="0 0 32 20"
                      fill="none"
                      className="w-8 h-6 sm:w-10 sm:h-7 lg:w-[40px] lg:h-[28px]"
                    >
                      <rect width="32" height="20" rx="4" fill="#fff" />
                      <text
                        x="4"
                        y="15"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#009CDE"
                      >
                        troy
                      </text>
                    </svg>
                  </div>
                </div> */}
                {/* <form className="grid grid-cols-1 sm:grid-cols-12 gap-y-4 sm:gap-y-6 gap-x-0 sm:gap-x-4 items-start sm:items-center">
                  <div className="col-span-1 sm:col-span-6 flex flex-col items-start">
                    <label className="text-base sm:text-[18px] font-medium text-black mb-0.5">
                      Card number
                    </label>
                    <span className="text-gray-500 text-sm sm:text-[15px]">
                      Enter the 16-digit card number on the card
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-6 w-full">
                    <div className="flex items-center bg-white rounded-xl border border-gray-200 px-3 sm:px-4 py-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 14.25C5.58579 14.25 5.25 14.5858 5.25 15C5.25 15.4142 5.58579 15.75 6 15.75V14.25ZM9.5 15.75C9.91421 15.75 10.25 15.4142 10.25 15C10.25 14.5858 9.91421 14.25 9.5 14.25V15.75ZM5 6.75H19V5.25H5V6.75ZM20.25 8V16H21.75V8H20.25ZM19 17.25H5V18.75H19V17.25ZM3.75 16V8H2.25V16H3.75ZM5 17.25C4.30964 17.25 3.75 16.6904 3.75 16H2.25C2.25 17.5188 3.48122 18.75 5 18.75V17.25ZM20.25 16C20.25 16.6904 19.6904 17.25 19 17.25V18.75C20.5188 18.75 21.75 17.5188 21.75 16H20.25ZM19 6.75C19.6904 6.75 20.25 7.30964 20.25 8H21.75C21.75 6.48122 20.5188 5.25 19 5.25V6.75ZM5 5.25C3.48122 5.25 2.25 6.48122 2.25 8H3.75C3.75 7.30964 4.30964 6.75 5 6.75V5.25ZM3 10.75H21V9.25H3V10.75ZM6 15.75H9.5V14.25H6V15.75Z"
                          fill="black"
                        />
                      </svg>

                      <input
                        type="text"
                        className="flex-1 py-1.5 outline-none bg-transparent text-base sm:text-[18px]"
                        placeholder=""
                        value={formData.cardNumber}
                        onChange={(e) =>
                          handleInputChange("cardNumber", e.target.value)
                        }
                      />
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="ml-2"
                      >
                        <circle cx="12" cy="12" r="12" fill="#F3F3F3" />
                        <path
                          d="M8 12l2.5 2.5L16 9"
                          stroke="#BDBDBD"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-6 flex flex-col items-start">
                    <label className="text-base sm:text-[18px] font-medium text-black mb-0.5">
                      Card owner
                    </label>
                    <span className="text-gray-500 text-sm sm:text-[15px]">
                      Enter the name on the card
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-6 w-full">
                    <input
                      type="text"
                      className="w-full py-2 px-3 sm:px-4 rounded-xl border border-gray-200 bg-white text-base sm:text-[18px] outline-none"
                      placeholder=""
                      value={formData.cardOwner}
                      onChange={(e) =>
                        handleInputChange("cardOwner", e.target.value)
                      }
                    />
                  </div>
                
                  <div className="col-span-1 sm:col-span-5 flex flex-col items-start">
                    <label className="text-base sm:text-[18px] font-medium mb-0.5 text-black">
                      Expiry date
                    </label>
                    <span className="text-gray-500 text-sm sm:text-[15px]">
                      Enter the expration date of the card
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-7 flex flex-col sm:flex-row items-start sm:items-end justify-start sm:justify-end gap-2 sm:gap-4 w-full">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <input
                        type="text"
                        className="w-14 sm:w-16 py-2 px-2 rounded-xl border border-gray-200 bg-white text-base sm:text-[18px] outline-none text-center text-black"
                        placeholder=""
                        value={formData.expiryMonth}
                        onChange={(e) =>
                          handleInputChange("expiryMonth", e.target.value)
                        }
                      />
                      <span className="text-xl sm:text-[28px] font-medium text-black">
                        /
                      </span>
                      <input
                        type="text"
                        className="w-14 sm:w-16 py-2 px-2 rounded-xl border border-gray-200 bg-white text-base sm:text-[18px] outline-none text-center text-black"
                        placeholder=""
                        value={formData.expiryYear}
                        onChange={(e) =>
                          handleInputChange("expiryYear", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <label className="text-sm sm:text-[14px] font-medium mb-0.5 text-black">
                        CVV2
                      </label>
                      <span className="text-gray-500 text-xs sm:text-[12px]">
                        Security code
                      </span>
                    </div>
                    <input
                      type="text"
                      className="w-16 sm:w-20 py-2 px-2 sm:px-4 rounded-xl border border-gray-200 bg-white text-base sm:text-[18px] outline-none"
                      placeholder=""
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value)}
                    />
                  </div>
                </form> */}
              </div>
              {/* <div className="flex items-center justify-center sm:justify-end gap-4 mb-4 sm:mb-6 lg:mb-8 max-w-full lg:max-w-[900px] mx-auto">
                <input
                  type="checkbox"
                  id="default"
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 accent-[#CD3625] cursor-pointer hover:accent-[#CD3625]"
                  checked={formData.setAsDefault}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                />
                <label
                  htmlFor="default"
                  className="text-base sm:text-[18px] font-medium text-black"
                >
                  Set as default
                </label>
              </div> */}
              {/* Cart Loading State */}
              {isCartLoading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 text-sm">Loading your cart...</p>
                  </div>
                  <p className="text-blue-700 text-xs mt-2">
                    Please wait while we fetch your cart items...
                  </p>
                </div>
              )}

              {/* Cart Empty Warning */}
              {!isCartLoading && (!apiCart?.items || apiCart.items.length === 0) && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 font-medium">Your cart is empty</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Please add items to your cart before proceeding to checkout.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => refetchCart()}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Refresh Cart
                      </button>
                      <button
                        onClick={() => router.push("/menu")}
                        className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
                      >
                        Go to Menu
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Error Message */}
              {paymentError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  {paymentError === "CART_INVALID" ? (
                    <div>
                      <p className="text-red-800 font-medium text-sm mb-3">
                        Your cart appears to be corrupted. This can happen when items are added incorrectly.
                      </p>
                      <p className="text-red-700 text-sm mb-4">
                        Please clear your cart and add the items again to continue.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            clearCart.mutate(undefined, {
                              onSuccess: () => {
                                setPaymentError(null);
                                router.push("/menu");
                              },
                            });
                          }}
                          disabled={clearCart.isPending}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {clearCart.isPending ? "Clearing cart..." : "Clear Cart"}
                        </button>
                        <button
                          onClick={() => refetchCart()}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                        >
                          Refresh Cart
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-800 text-sm whitespace-pre-line">{paymentError}</p>
                  )}
                </div>
              )}

              {/* Payment Success Message */}
              {paymentSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">Payment successful! Redirecting...</p>
                </div>
              )}

              {/* Create Payment Intent Button */}
              {canProceedToPayment && !clientSecret && (
                <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
                  <button
                    onClick={handleCreatePaymentIntent}
                    disabled={createPaymentIntent.isPending}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c83b2b] px-5 text-base font-black text-white shadow-[0_12px_28px_rgba(200,59,43,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ad321f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CreditCard size={19} />
                    {createPaymentIntent.isPending ? "Preparing payment..." : "Continue to Payment"}
                  </button>
                </div>
              )}

              {/* Stripe Payment Form */}
              {clientSecret && !stripePromise && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-black">Stripe configuration is required</p>
                  <p className="mt-1 leading-6">
                    Add a valid <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
                    to the local environment, then rebuild the app.
                  </p>
                </div>
              )}

              {clientSecret && stripePromise && (
                <div className="mb-6 rounded-2xl border border-[#e8ddd7] bg-white p-4 sm:p-5">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#c83b2b",
                          colorText: "#241f1c",
                          colorBackground: "#ffffff",
                          colorDanger: "#b42318",
                          borderRadius: "12px",
                          fontFamily: "system-ui, sans-serif",
                          spacingUnit: "4px",
                        },
                        rules: {
                          ".Input": {
                            border: "1px solid #d9cec8",
                            boxShadow: "none",
                            padding: "13px 14px",
                          },
                          ".Input:focus": {
                            border: "1px solid #c83b2b",
                            boxShadow: "0 0 0 4px rgba(200,59,43,.10)",
                          },
                          ".Label": {
                            fontWeight: "600",
                            color: "#4f4641",
                          },
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </div>
              )}

              {/* Show message if cart is empty or delivery info missing */}
              {(!canProceedToPayment || !deliveryInfo) && (
                <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
                  <p className="text-gray-600 text-sm">
                    {!apiCart || apiCart.items.length === 0
                      ? "Your cart is empty"
                      : "Please fill in all required delivery information"}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-[24px] border border-[#3a2b26] bg-[#241b18] p-5 text-white shadow-[0_22px_55px_rgba(42,28,22,0.18)] lg:sticky lg:top-24">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff9b8f]">
                    Your order
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    Order summary
                  </h2>
                </div>
                <Link href="/cart" className="text-sm font-bold text-[#ff9b8f] hover:underline">
                  Edit cart
                </Link>
              </div>
              {/* Cart Items */}
              <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <div className="w-[80px] h-[56px] sm:w-[100px] sm:h-[70px] rounded-xl overflow-hidden relative flex-shrink-0">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        fallbackClassName="object-contain bg-[#fff8f5] p-4"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between w-full">
                        <div className="truncate text-sm font-bold text-white">
                          {item.name}
                        </div>
                        <div className="ml-2 text-xs font-bold text-stone-300">
                          {item.price}
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-stone-400">
                        Quantity {item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Cart Summary */}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm text-stone-300">
                <div className="flex justify-between">
                  <span>Cart total</span>
                  <span>{subtotal.toFixed(2)} CHF</span>
                </div>
                <div className="my-2 border-t border-white/10" />
                <div className="mt-1 flex items-center justify-between text-xl font-black text-white">
                  <span>Payable amount</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} CHF</span>
                </div>
                <p className="flex items-start gap-2 pt-2 text-xs leading-5 text-stone-400">
                  <LockKeyhole className="mt-0.5 shrink-0" size={14} />
                  The backend and Stripe confirm the final payment amount.
                </p>
              </div>
              <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
                <MapPin size={16} className="text-[#ff9b8f]" />
                Order details
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Name</span>
                  <span className="max-w-[190px] text-right font-semibold">
                    {guestInfo.firstName} {guestInfo.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Phone</span>
                  <span className="max-w-[190px] text-right font-semibold">{guestInfo.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Email</span>
                  <span className="max-w-[190px] truncate text-right font-semibold">{guestInfo.email || "—"}</span>
                </div>
                {deliveryType === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Address</span>
                    <span className="max-w-[190px] text-right font-semibold">{guestInfo.address || "—"}</span>
                  </div>
                )}
                {guestInfo.preferredTime && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Preferred time</span>
                    <span className="font-medium">{guestInfo.preferredTime}</span>
                  </div>
                )}
                {guestInfo.deliveryNotes && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Notes</span>
                    <span className="font-medium">{guestInfo.deliveryNotes}</span>
                  </div>
                )}
              </div>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs font-semibold text-stone-300">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading payment...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
