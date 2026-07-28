"use client";
import {
  useAuth,
  useCart,
  useCreatePaymentIntent,
  useLogout,
  useRemoveFromCart,
} from "@/lib/api";
import { clearCartRestaurantId } from "@/lib/cart-restaurant";
import "@fontsource/abril-fatface";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  deliveryNotes: string;
}

export default function CartPage() {
  const router = useRouter();
  const { data: apiCart, isLoading: isCartLoading, refetch: refetchCart } = useCart();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const logout = useLogout();
  const removeFromCartMutation = useRemoveFromCart();
  const createPaymentIntent = useCreatePaymentIntent();

  // Local state for cart items (for immediate UI updates)
  const [localCartItems, setLocalCartItems] = useState<Array<{
    id: number;
    quantity: number;
    menu_item: { id: number; name: string; price: number; image?: string } | null;
    nowaste_item: { id: number; name: string; price: number; image?: string } | null;
  }>>([]);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    deliveryNotes: "",
  });

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isAuthLoading) {
      setGuestInfo((prev) => ({
        ...prev,
        firstName: user.firstname || prev.firstName,
        lastName: user.lastname || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user, isAuthLoading]);

  // Refetch cart on mount
  useEffect(() => {
    refetchCart();
  }, [refetchCart]);

  // Clear stored cart restaurant when cart becomes empty (e.g. after removing last item)
  useEffect(() => {
    if (apiCart?.items?.length === 0) {
      clearCartRestaurantId();
    }
  }, [apiCart?.items?.length]);

  // Sync local cart items with API cart
  useEffect(() => {
    if (apiCart?.items) {
      setLocalCartItems(apiCart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        menu_item: item.menu_item ? {
          id: item.menu_item.id,
          name: item.menu_item.name,
          price: item.menu_item.price,
          image: item.menu_item.image,
        } : null,
        nowaste_item: item.nowaste_item ? {
          id: item.nowaste_item.id,
          name: item.nowaste_item.name,
          price: item.nowaste_item.price,
          image: item.nowaste_item.image,
        } : null,
      })) as unknown as Array<{
        id: number;
        quantity: number;
        menu_item: { id: number; name: string; price: number; image?: string } | null;
        nowaste_item: { id: number; name: string; price: number; image?: string } | null;
      }>);
    }
  }, [apiCart]);

  const handleRemoveItem = (itemId: number) => {
    // Update local state immediately
    setLocalCartItems(prev => prev.filter(item => item.id !== itemId));
    // Then sync with API
    removeFromCartMutation.mutate(itemId, {
      onSuccess: () => {
        refetchCart();
      },
    });
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    // Update local state immediately for responsive UI
    setLocalCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleGuestInfoChange = (field: keyof GuestInfo, value: string) => {
    setGuestInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate totals using local cart items for immediate updates
  const subtotal = localCartItems.reduce((sum, item) => {
    const price = item.menu_item?.price || item.nowaste_item?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = deliveryType === "delivery" ? 5.00 : 0;
  const taxes = subtotal * 0.077; // 7.7% Swiss VAT
  const total = subtotal + deliveryFee + taxes;

  // Validate form
  const isFormValid = () => {
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      return false;
    }
    if (deliveryType === "delivery") {
      return !!(guestInfo.address && guestInfo.postalCode && guestInfo.city);
    }
    return true;
  };

  // Handle checkout - Create payment intent and redirect to Stripe
  const handleCheckout = async () => {
    if (!apiCart?.items || apiCart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!isFormValid()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const deliveryInfo = {
      delivery_firstname: guestInfo.firstName,
      delivery_lastname: guestInfo.lastName,
      delivery_address: deliveryType === "delivery" ? guestInfo.address : "Pickup",
      delivery_postal_code: deliveryType === "delivery" ? guestInfo.postalCode : "",
      delivery_city: deliveryType === "delivery" ? guestInfo.city : "",
      delivery_phone: guestInfo.phone,
      delivery_email: guestInfo.email,
    };

    createPaymentIntent.mutate(deliveryInfo, {
      onSuccess: (response) => {
        // Get the Stripe checkout URL and redirect
        const clientSecret = response.payment_intent_client_secret || response.client_secret;
        if (clientSecret) {
          // Keep checkout data scoped to this browser tab and out of the URL.
          if (typeof window !== "undefined") {
            sessionStorage.setItem("checkout_guest_info", JSON.stringify(guestInfo));
            sessionStorage.setItem("checkout_delivery_type", deliveryType);
            sessionStorage.setItem("checkout_client_secret", clientSecret);
          }
          window.location.href = "/payment";
        } else {
          setError("Failed to create payment. Please try again.");
          setIsProcessing(false);
        }
      },
      onError: (err) => {
        const error = err as { response?: { data?: { message?: string; error?: string } } };
        setError(error?.response?.data?.message || error?.response?.data?.error || "Failed to process checkout");
        setIsProcessing(false);
      },
    });
  };

  if (isCartLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-400">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6 min-h-[64px]">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mr-4 lg:mr-6 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            {/* Cart */}
            <Link href="/cart" className="relative flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#CD3625] cursor-pointer transition">
              <Image
                src="/images/cart-icon.svg"
                alt="Cart"
                width={20}
                height={20}
                className="lg:w-6 lg:h-6 brightness-0 invert"
              />
              {apiCart?.items && apiCart.items.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-white text-[#CD3625] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#CD3625]">
                  {apiCart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              )}
            </Link>
            {/* Notification Bell */}
            <div className="relative">
              <button className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F7F8FD] cursor-pointer">
                <Image
                  src="/images/star-icon.svg"
                  alt="Notifications"
                  width={20}
                  height={20}
                  className="lg:w-6 lg:h-6"
                />
              </button>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#CD3625] rounded-full border-2 border-white"></div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {!isAuthLoading && (
              <>
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/signin"
                      className="text-yellow-600 text-[16px] lg:text-[18px] underline hover:text-yellow-700"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-[#CD3625] text-white cursor-pointer px-6 lg:px-8 py-2.5 lg:py-3.5 rounded-full font-semibold hover:bg-[#b83213] transition text-sm lg:text-base">
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/orders"
                      className="text-black text-[16px] hover:text-gray-600 font-medium"
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
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto pt-24 lg:pt-28">

        <main className="px-4 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-black mb-8">Your Cart</h1>

          {!isCartLoading && localCartItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Image
                  src="/images/cart-icon.svg"
                  alt="Empty cart"
                  width={48}
                  height={48}
                  className="opacity-50"
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
              <Link
                href="/partners"
                className="inline-block bg-[#CD3625] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#b83213] transition"
              >
                Browse Restaurants
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

                  <div className="space-y-4">
                    {localCartItems.map((item) => {
                      const menuItem = item.menu_item || item.nowaste_item;
                      if (!menuItem) return null;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="w-[80px] h-[56px] sm:w-[100px] sm:h-[70px] rounded-xl overflow-hidden relative flex-shrink-0">
                            {menuItem.image ? (
                              <Image
                                src={menuItem.image}
                                alt={menuItem.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
                                <h3 className="font-semibold text-black text-base sm:text-lg truncate">{menuItem.name}</h3>
                                {item.nowaste_item && (
                                  <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded mt-1 w-fit">
                                    No Waste
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-[#CD3625] text-base sm:text-lg ml-2 sm:ml-4">
                                {(menuItem.price * item.quantity).toFixed(2)} CHF
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 bg-white">
                                <button
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl font-medium text-[#222] hover:bg-gray-100 rounded transition"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <span className="mx-2 sm:mx-3 text-base sm:text-lg font-medium text-[#222] min-w-[20px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-lg sm:text-xl font-medium text-[#222] hover:bg-gray-100 rounded transition"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removeFromCartMutation.isPending}
                                className="p-2 hover:bg-red-50 rounded-lg transition"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} CHF</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>{deliveryFee.toFixed(2)} CHF</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes (7.7%)</span>
                      <span>{taxes.toFixed(2)} CHF</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-black pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{total.toFixed(2)} CHF</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Form */}
              <div className="lg:w-[400px]">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-black mb-6">Delivery Details</h2>

                  {/* Delivery Type Toggle */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${deliveryType === "delivery"
                        ? "bg-[#CD3625] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      Delivery
                    </button>
                    <button
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${deliveryType === "pickup"
                        ? "bg-[#CD3625] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      Pickup
                    </button>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={guestInfo.firstName}
                          onChange={(e) => handleGuestInfoChange("firstName", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={guestInfo.lastName}
                          onChange={(e) => handleGuestInfoChange("lastName", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => handleGuestInfoChange("email", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => handleGuestInfoChange("phone", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        placeholder="+41 XX XXX XX XX"
                      />
                    </div>

                    {deliveryType === "delivery" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address *
                          </label>
                          <input
                            type="text"
                            value={guestInfo.address}
                            onChange={(e) => handleGuestInfoChange("address", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                            placeholder="Street and number"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code *
                            </label>
                            <input
                              type="text"
                              value={guestInfo.postalCode}
                              onChange={(e) => handleGuestInfoChange("postalCode", e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                              placeholder="1234"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={guestInfo.city}
                              onChange={(e) => handleGuestInfoChange("city", e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                              placeholder="City"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Notes (optional)
                      </label>
                      <textarea
                        value={guestInfo.deliveryNotes}
                        onChange={(e) => handleGuestInfoChange("deliveryNotes", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                        rows={3}
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || !isFormValid() || localCartItems.length === 0}
                    className="mt-6 w-full bg-[#CD3625] text-white py-4 rounded-full font-bold text-lg hover:bg-[#b83213] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-xs text-gray-500 text-center">
                    You will be redirected to Stripe for secure payment
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
