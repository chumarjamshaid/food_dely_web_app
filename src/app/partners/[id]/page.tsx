"use client";
import {
  useAddToCart,
  useAuth,
  useCart,
  useLogout,
  useRemoveFromCart,
  useRestaurantDetail
} from "@/lib/api";
import type { MenuItemResponse } from "@/lib/api/types";
import {
  clearCartRestaurantId,
  getCartRestaurantId,
  setCartRestaurantId,
} from "@/lib/cart-restaurant";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

interface SelectedOptions {
  [itemId: number]: {
    [optionId: number]: number | number[]; // optionId -> optionItemId (single or multiple)
  };
}

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const restaurantId = Number.parseInt(id, 10);

  // Use "nowaste" for No Waste category, number for food categories, null for initial state
  const [selectedFoodCategoryId, setSelectedFoodCategoryId] = useState<number | "nowaste" | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [showMissingOptions, setShowMissingOptions] = useState(false);
  const [isMenuBarSticky, setIsMenuBarSticky] = useState(false);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [showRestaurantWarning, setShowRestaurantWarning] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const initialSelectionDone = useRef(false);

  // Authentication hooks
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();

  // Fetch restaurant detail from API
  const { data: apiRestaurant, isLoading: isLoadingRestaurant } = useRestaurantDetail(restaurantId);

  // Fetch cart from API
  const { data: apiCart, isLoading: isCartLoading, refetch: refetchCart } = useCart();
  const addToCartMutation = useAddToCart();
  const removeFromCartMutation = useRemoveFromCart();

  // Use API data for restaurant info
  const restaurant = apiRestaurant
    ? {
        name: apiRestaurant.name,
        description: apiRestaurant.description || "",
        image: apiRestaurant.images?.[0]?.image || "/images/pizza.png",
        address: apiRestaurant.address,
        city: apiRestaurant.city || "",
        rating: apiRestaurant.rating || 0,
        reviews: apiRestaurant.reviews || 0,
        delivery_fee: apiRestaurant.delivery_fee || 0,
        min_amount: apiRestaurant.min_amount || 0,
        open: apiRestaurant.open || false,
        no_waste: apiRestaurant.no_waste || false,
      }
    : null;

  // Set initial category when data loads (only once)
  useEffect(() => {
    if (apiRestaurant && !initialSelectionDone.current) {
      initialSelectionDone.current = true;
      // If restaurant has nowaste items, show them first; otherwise show first food category
      if (apiRestaurant.nowaste_items && apiRestaurant.nowaste_items.length > 0) {
        setSelectedFoodCategoryId("nowaste");
      } else if (apiRestaurant.foods && apiRestaurant.foods.length > 0) {
        setSelectedFoodCategoryId(apiRestaurant.foods[0].id);
      }
    }
  }, [apiRestaurant]);

  // Sticky menu bar effect
  useEffect(() => {
    const handleScroll = () => {
      if (menuBarRef.current) {
        const rect = menuBarRef.current.getBoundingClientRect();
        setIsMenuBarSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear stored cart restaurant when cart becomes empty
  useEffect(() => {
    if (apiCart?.items?.length === 0) {
      clearCartRestaurantId();
    }
  }, [apiCart?.items?.length]);

  const handleOptionSelect = (itemId: number, optionId: number, optionItemId: number, isMultiple = false) => {
    setSelectedOptions(prev => {
      const itemOptions = prev[itemId] || {};
      const currentVal = itemOptions[optionId];

      if (isMultiple) {
        // Handle multi-select
        const currentArray = Array.isArray(currentVal) ? currentVal : [];
        const exists = currentArray.includes(optionItemId);
        
        let newArray;
        if (exists) {
          newArray = currentArray.filter(v => v !== optionItemId);
        } else {
          newArray = [...currentArray, optionItemId];
        }
        
        return {
          ...prev,
          [itemId]: {
            ...itemOptions,
            [optionId]: newArray,
          },
        };
      } else {
        // Handle single-select
        return {
          ...prev,
          [itemId]: {
            ...itemOptions,
            [optionId]: optionItemId,
          },
        };
      }
    });
  };

  // Add menu item to cart - directly calls API like partners page
  const handleAddMenuItem = (item: MenuItemResponse) => {
    // Prevent adding from a different restaurant than the one already in the cart
    const cartRestaurantId = getCartRestaurantId(apiCart ?? undefined);
    if (
      apiCart?.items?.length &&
      cartRestaurantId != null &&
      cartRestaurantId !== restaurantId
    ) {
      setShowRestaurantWarning(true);
      return;
    }

    // Check required options
    const itemOptions = selectedOptions[item.id] || {};
    const missingRequired = item.options?.filter(opt => {
      const value = itemOptions[opt.id];
      if (!opt.required) return false;
      if (value === undefined || value === null) return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    }) || [];

    if (missingRequired.length > 0) {
      setShowMissingOptions(true);
      return;
    }

    setAddingItemId(item.id);

    // Build options array - Format options for API (matching partners page)
    const formattedOptions: { option: number; item: number }[] = [];
    
    Object.entries(itemOptions).forEach(([optId, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => {
          formattedOptions.push({
            option: Number(optId),
            item: Number(v),
          });
        });
      } else {
        formattedOptions.push({
          option: Number(optId),
          item: Number(value),
        });
      }
    });

    addToCartMutation.mutate(
      {
        quantity: 1,
        menu_item: item.id,
        options: formattedOptions,
      },
      {
        onSuccess: () => {
          setAddingItemId(null);
          setCartRestaurantId(restaurantId);
          setAddedMessage(`${item.name} added to cart!`);
          setTimeout(() => setAddedMessage(null), 3000);
          refetchCart();
          // Clear options for this item
          setSelectedOptions(prev => {
            const newState = { ...prev };
            delete newState[item.id];
            return newState;
          });
        },
        onError: () => {
          setAddingItemId(null);
        },
      }
    );
  };

  // Add no-waste item to cart - directly calls API like partners page
  const handleAddNoWasteItem = (nowasteItemId: number, itemName: string) => {
    // Prevent adding from a different restaurant than the one already in the cart
    const cartRestaurantId = getCartRestaurantId(apiCart ?? undefined);
    if (
      apiCart?.items?.length &&
      cartRestaurantId != null &&
      cartRestaurantId !== restaurantId
    ) {
      setShowRestaurantWarning(true);
      return;
    }

    setAddingItemId(nowasteItemId);
    addToCartMutation.mutate(
      {
        quantity: 1,
        nowaste_item: nowasteItemId,
      },
      {
        onSuccess: () => {
          setAddingItemId(null);
          setCartRestaurantId(restaurantId);
          setAddedMessage(`${itemName} added to cart!`);
          setTimeout(() => setAddedMessage(null), 3000);
          refetchCart();
        },
        onError: () => {
          setAddingItemId(null);
        },
      }
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (cartItemId: number) => {
    removeFromCartMutation.mutate(cartItemId, {
      onSuccess: () => {
        refetchCart();
      },
      onError: () => {
        console.error("Failed to remove item from cart");
      },
    });
  };

  // Navigate to checkout
  const handleCheckout = () => {
    router.push("/payment");
  };

  // Calculate totals from API cart
  const cartItems = apiCart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.menu_item?.price || item.nowaste_item?.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);
  const deliveryFee = restaurant?.delivery_fee || 0;
  const taxes = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + taxes;

  // Show loading state
  if (isLoadingRestaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Restaurant not found</p>
        </div>
      </div>
    );
  }

  // Get current food category (only for numeric IDs, not "nowaste")
  const currentFoodCategory = typeof selectedFoodCategoryId === "number"
    ? apiRestaurant?.foods?.find(f => f.id === selectedFoodCategoryId)
    : undefined;
  const foodCategories = apiRestaurant?.foods || [];

  return (
    <div className="bg-white">
      {/* Popup warning when user tries to add items from a different restaurant */}
      {showRestaurantWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Different restaurant</h3>
            <p className="text-gray-600 mb-6">
              Your cart contains items from another restaurant. Please complete or clear your current order before adding items from a different restaurant.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRestaurantWarning(false)}
                className="bg-[#CD3625] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#b83213] transition cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-400">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6 min-h-[64px]">
          {/* Back Button */}
          <button
            onClick={() => router.push("/partners")}
            className="mr-4 lg:mr-6 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            {!authLoading && (
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

      {/* Success Message Toast */}
      {addedMessage && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          {addedMessage}
        </div>
      )}

      <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto">
        <main className="w-full mx-auto px-4 pb-8 pt-24 sm:pt-28 lg:pt-32 flex flex-col gap-4 sm:gap-6 lg:gap-8">
          {/* Restaurant Header - Matching Partners Page Style */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-[200px] sm:h-[250px] lg:h-[300px]">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {restaurant.name}
                </h2>
                {restaurant.description && (
                  <p className="text-white/80 mt-1">{restaurant.description}</p>
                )}
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-wrap gap-4 sm:gap-8 items-center">
              <div className="flex items-center gap-2 text-black font-semibold">
                <Image src="/images/star-icon.svg" alt="Star" width={20} height={20} />
                {restaurant.rating.toFixed(1)} <span className="font-normal text-gray-500">({restaurant.reviews} reviews)</span>
              </div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2 text-black font-semibold">
                <Image src="/images/lock-icon.svg" alt="Min" width={18} height={18} />
                Min. {restaurant.min_amount.toFixed(2)} CHF
              </div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2 text-black font-semibold">
                <Image src="/images/clock-icon.svg" alt="Status" width={18} height={18} />
                <span className={restaurant.open ? "text-green-600" : "text-red-600"}>
                  {restaurant.open ? "Open" : "Closed"}
                </span>
              </div>
              {restaurant.delivery_fee > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                  <div className="text-gray-600">
                    Delivery: {restaurant.delivery_fee.toFixed(2)} CHF
                  </div>
                </>
              )}
              {restaurant.no_waste && (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                  No Waste
                </span>
              )}
            </div>
          </div>

          {/* Sticky Menu Category Bar */}
          {(foodCategories.length > 0 || (apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0)) && (
            <div 
              ref={menuBarRef}
              className={`${isMenuBarSticky ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200' : ''} mb-6`}
            >
              <div className={`${isMenuBarSticky ? 'max-w-[1400px] mx-auto px-4' : ''}`}>
                <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 scrollbar-hide">
                  {/* No Waste Category - Featured */}
                  {apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0 && (
                    <button
                      onClick={() => setSelectedFoodCategoryId("nowaste")}
                      className={`px-6 py-3 rounded-full cursor-pointer font-medium text-base whitespace-nowrap transition-all duration-200 ${
                        selectedFoodCategoryId === "nowaste"
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ♻ No Waste
                    </button>
                  )}
                  {foodCategories.map((foodCategory) => (
                    <button
                      key={foodCategory.id}
                      onClick={() => setSelectedFoodCategoryId(foodCategory.id)}
                      className={`px-6 py-3 rounded-full cursor-pointer font-medium text-base whitespace-nowrap transition-all duration-200 ${
                        selectedFoodCategoryId === foodCategory.id
                          ? 'bg-[#CD3625] text-white shadow-lg'
                          : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {foodCategory.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              {/* Menu Items */}
              <div className="mb-8">
                <h2 className="md:text-[28px] text-[20px] text-black font-medium mb-4">
                  {selectedFoodCategoryId === "nowaste"
                    ? "♻ No Waste - Featured"
                    : currentFoodCategory?.name || "Menu"}
                </h2>

                {/* No Waste Items */}
                {selectedFoodCategoryId === "nowaste" && apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    {apiRestaurant.nowaste_items.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex bg-white rounded-xl shadow-lg w-full md:w-[420px] h-auto md:h-full min-h-[180px] md:min-h-[230px] items-center overflow-hidden border-2 border-emerald-200"
                      >
                        <div className="w-[120px] md:w-[190px] h-[120px] md:h-[190px] rounded-xl overflow-hidden flex-shrink-0 relative ml-4 md:ml-6 mt-3">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col pl-4 md:pl-6 pr-4 py-10 flex-1 h-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[20px] md:text-[24px] font-bold text-[#373A3C]">
                              {item.price.toFixed(2)} CHF
                            </span>
                          </div>
                          <div className="text-[14px] md:text-[16px] font-bold text-[#373A3C] mb-1 leading-tight">
                            {item.name}
                          </div>
                          <div className="text-base text-[#8F8F8F] text-[10px] leading-snug mt-1">
                            {item.description}
                          </div>
                        </div>
                        <button
                          className="absolute bottom-1 right-1 w-8 h-8 bg-[#CD3625] rounded-full cursor-pointer text-white text-3xl flex items-center justify-center disabled:opacity-50"
                          onClick={() => handleAddNoWasteItem(item.id, item.name)}
                          disabled={addingItemId === item.id}
                        >
                          {addingItemId === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Image
                              src="/images/plus-icon.svg"
                              alt="Add to cart"
                              width={20}
                              height={20}
                            />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regular Menu Items by Category */}
                {currentFoodCategory && currentFoodCategory.menu_items && currentFoodCategory.menu_items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {currentFoodCategory.menu_items.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex bg-white rounded-xl shadow-lg w-full md:w-[420px] h-auto md:h-full min-h-[180px] md:min-h-[230px] items-center overflow-hidden"
                      >
                        <div className="w-[120px] md:w-[190px] h-[120px] md:h-[190px] rounded-xl overflow-hidden flex-shrink-0 relative ml-4 md:ml-6 mt-3">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col pl-4 md:pl-6 pr-4 py-10 flex-1 h-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[20px] md:text-[24px] font-bold text-[#373A3C]">
                              {item.price.toFixed(2)} CHF
                            </span>
                          </div>
                          <div className="text-[14px] md:text-[16px] font-bold text-[#373A3C] mb-1 leading-tight">
                            {item.name}
                          </div>
                          <div className="text-base text-[#8F8F8F] text-[10px] leading-snug mt-1">
                            {item.description}
                          </div>

                          {/* Menu Item Options */}
                          {item.options && item.options.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.options.map((option) => (
                                <div key={option.id} className="space-y-1">
                                  <label className="text-xs font-medium text-gray-700">
                                    {option.name} {option.required && <span className="text-red-500">*</span>}
                                  </label>
                                  {option.multiple ? (
                                    // Multi-select: Use checkboxes
                                    <div className="flex flex-wrap gap-2">
                                      {option.items.map((optionItem) => {
                                        const selectedValue = selectedOptions[item.id]?.[option.id];
                                        const isSelected = Array.isArray(selectedValue)
                                          ? selectedValue.includes(optionItem.id)
                                          : selectedValue === optionItem.id;
                                        return (
                                          <label
                                            key={optionItem.id}
                                            className="flex items-center gap-1 cursor-pointer bg-gray-50 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                                          >
                                            <input
                                              type="checkbox"
                                              className="rounded text-[#CD3625] focus:ring-[#CD3625] w-4 h-4"
                                              checked={isSelected}
                                              onChange={() => handleOptionSelect(item.id, option.id, optionItem.id, true)}
                                            />
                                            <span className="text-xs text-gray-700">
                                              {optionItem.name} {optionItem.price > 0 ? `(+${optionItem.price.toFixed(2)} CHF)` : ''}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    // Single-select: Use dropdown
                                    <select
                                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CD3625] focus:border-transparent transition-all appearance-none cursor-pointer hover:border-[#CD3625]"
                                      style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.75rem center',
                                        paddingRight: '2.5rem'
                                      }}
                                      value={String(selectedOptions[item.id]?.[option.id] || '')}
                                      onChange={(e) => {
                                        const optionItemId = Number.parseInt(e.target.value, 10);
                                        if (!Number.isNaN(optionItemId) && optionItemId > 0) {
                                          handleOptionSelect(item.id, option.id, optionItemId, false);
                                        } else {
                                          // Clear selection if empty value
                                          setSelectedOptions(prev => {
                                            const newOptions = { ...prev };
                                            if (newOptions[item.id]) {
                                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                              const { [option.id]: _, ...rest } = newOptions[item.id];
                                              if (Object.keys(rest).length === 0) {
                                                delete newOptions[item.id];
                                              } else {
                                                newOptions[item.id] = rest;
                                              }
                                            }
                                            return newOptions;
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">Choose {option.name}</option>
                                      {option.items.map((optionItem) => (
                                        <option key={optionItem.id} value={optionItem.id}>
                                          {optionItem.name} {optionItem.price > 0 ? `(+${optionItem.price.toFixed(2)} CHF)` : ''}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Allergy Information */}
                          {item.allergies && item.allergies.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1">Allergies:</div>
                              <div className="flex flex-wrap gap-1">
                                {item.allergies.map((allergy, allergyIndex) => {
                                  const allergyName = typeof allergy === "string" 
                                    ? allergy 
                                    : (typeof allergy === "object" && allergy !== null && "name" in allergy)
                                      ? allergy.name 
                                      : `Allergy ${allergyIndex + 1}`;
                                  return (
                                    <span key={allergyIndex} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                      {allergyName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="absolute bottom-1 right-1 w-8 h-8 bg-[#CD3625] rounded-full cursor-pointer text-white text-3xl flex items-center justify-center disabled:opacity-50"
                          onClick={() => handleAddMenuItem(item)}
                          disabled={addingItemId === item.id}
                        >
                          {addingItemId === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Image
                              src="/images/plus-icon.svg"
                              alt="Add to cart"
                              width={20}
                              height={20}
                            />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {(!currentFoodCategory || !currentFoodCategory.menu_items || currentFoodCategory.menu_items.length === 0) &&
                 (selectedFoodCategoryId !== "nowaste" || !apiRestaurant?.nowaste_items || apiRestaurant.nowaste_items.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items available in this category.</p>
                  </div>
                )}

                {/* Missing Options Warning */}
                {showMissingOptions && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-yellow-800">
                        Please select all required options before adding to cart.
                      </div>
                      <button
                        onClick={() => setShowMissingOptions(false)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cart */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                {/* Cart Title */}
                <div className="text-[16px] text-[#444] font-normal mb-1">
                  Your Cart From
                </div>
                <div className="md:text-[28px] text-[20px] font-medium text-[#222] mb-6 leading-tight">
                  {restaurant.name}
                </div>
                {/* Cart Items */}
                {isCartLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : cartItems.length > 0 ? (
                  <div className="flex flex-col gap-6 mb-8">
                    {cartItems.map((cartItem) => {
                      const item = cartItem.menu_item || cartItem.nowaste_item;
                      if (!item) return null;
                      
                      return (
                        <div key={cartItem.id} className="flex items-center gap-4">
                          <div className="w-[80px] md:w-[100px] h-[60px] md:h-[70px] rounded-xl overflow-hidden relative flex-shrink-0">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
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
                              <div className="text-[16px] md:text-[18px] font-normal text-[#222] truncate">
                                {item.name}
                              </div>
                              <div className="text-[14px] md:text-[16px] font-normal text-[#222] ml-4 whitespace-nowrap">
                                {item.price.toFixed(2)} CHF
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-gray-500 text-sm">Qty: {cartItem.quantity}</span>
                              <button
                                className="ml-2 cursor-pointer"
                                onClick={() => handleRemoveFromCart(cartItem.id)}
                              >
                                <Image
                                  src="/images/delete-icon.svg"
                                  alt="Remove"
                                  width={24}
                                  height={24}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Your cart is empty
                  </div>
                )}
                {/* Cart Summary */}
                {cartItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-12 mt-2 flex flex-col gap-1.5 text-[15px] md:text-[17px] text-[#222]">
                    <div className="flex justify-between">
                      <span>Sub total</span>
                      <span>{subtotal.toFixed(2)} CHF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery fee</span>
                      <span>{deliveryFee.toFixed(2)} CHF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>{taxes.toFixed(2)} CHF</span>
                    </div>
                    <div className="border-t border-gray-200 my-2" />
                    <div className="flex justify-between items-center font-medium text-[20px] md:text-[24px] mt-2">
                      <span>Total</span>
                      <span className="font-semibold">{total.toFixed(2)} CHF</span>
                    </div>
                  </div>
                )}
                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="mt-8 w-full bg-[#CD3625] hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-2 rounded-full text-[18px] md:text-[20px] flex items-center justify-center gap-4 shadow-lg transition"
                >
                  Order and checkout
                  <Image
                    src="/images/leftarrow.svg"
                    alt="menu"
                    width={28}
                    height={28}
                  />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
