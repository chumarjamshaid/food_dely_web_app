"use client";
import {
  useAddToCart,
  useAuth,
  useCart,
  useLogout,
  useRemoveFromCart,
  useRestaurantDetail
} from "@/lib/api";
import type { MenuItemOptionResponse, MenuItemResponse } from "@/lib/api/types";
import SafeImage from "@/components/SafeImage";
import * as Popover from "@radix-ui/react-popover";
import {
  clearCartRestaurantId,
  getCartRestaurantId,
  getCartRestaurantName,
  setCartRestaurantId,
} from "@/lib/cart-restaurant";
import { getCartTotal } from "@/lib/cart-total";
import { getTodayOpeningHours } from "@/lib/opening-hours";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  LogOut,
  MapPin,
  Plus,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";

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
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [showRestaurantWarning, setShowRestaurantWarning] = useState(false);
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
        image: apiRestaurant.images?.[0]?.image || "/images/logo.png",
        address: apiRestaurant.address,
        city: apiRestaurant.city || "",
        rating: apiRestaurant.rating || 0,
        reviews: apiRestaurant.reviews || 0,
        delivery_fee: apiRestaurant.delivery_fee || 0,
        min_amount: apiRestaurant.min_amount || 0,
        open: apiRestaurant.open || false,
        openings: apiRestaurant.openings,
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
      const count = Array.isArray(value) ? value.length : value == null ? 0 : 1;
      return opt.items.length > 0 && count < (opt.minimum_selections ?? (opt.required ? 1 : 0));
    }) || [];

    if (missingRequired.length > 0) {
      setShowMissingOptions(true);
      return;
    }
    const overLimit = item.options?.some(opt => {
      const value = itemOptions[opt.id];
      const count = Array.isArray(value) ? value.length : value == null ? 0 : 1;
      return opt.maximum_selections != null && count > opt.maximum_selections;
    });
    if (overLimit) { setShowMissingOptions(true); return; }

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
          setCartRestaurantId(restaurantId, restaurant?.name);
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
          setCartRestaurantId(restaurantId, restaurant?.name);
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
  const subtotal = getCartTotal(apiCart);
  const cartRestaurantName = getCartRestaurantName(apiCart) || "another restaurant";
  const todayHours = getTodayOpeningHours(restaurant?.openings);

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
    <div className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      {/* Popup warning when user tries to add items from a different restaurant */}
      {showRestaurantWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Different restaurant</h3>
            <p className="text-gray-600 mb-3">
              Your cart contains items from <strong className="text-gray-900">{cartRestaurantName}</strong>.
            </p>
            <p className="text-gray-600 mb-6">
              Empty your cart before adding items from {restaurant.name}.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href="/cart"
                className="rounded-full border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Review cart
              </Link>
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
      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 sm:px-8">
          <Link
            href="/partners"
            className="flex h-10 w-fit items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#5e544f] transition hover:bg-[#f7f1ee] hover:text-[#b63825]"
          >
            <ArrowLeft size={19} />
            <span className="hidden sm:inline">Restaurants</span>
          </Link>

          <Link href="/" className="flex items-center justify-self-center">
            <span className="select-none text-[22px] font-black tracking-[-0.04em] sm:text-[26px]">
              <span className="text-[#CD3625]">FOOD</span>
              <span className="text-black">DELY</span>
            </span>
          </Link>

          <nav className="flex items-center justify-self-end gap-1 sm:gap-2">
            <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#514944] transition hover:bg-[#f7f1ee] hover:text-[#b63825]">
              <ShoppingBag size={20} />
              {apiCart?.items && apiCart.items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#CD3625] px-1 text-[10px] font-black text-white">
                  {apiCart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            {!authLoading && (
              isAuthenticated ? (
                <>
                  <Link href="/profile" className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold transition hover:bg-[#f7f1ee] sm:px-3">
                    <UserRound size={18} />
                    <span className="hidden sm:inline">{user?.firstname || "Profile"}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Sign out"
                    onClick={() => {
                      logout();
                      window.location.href = "/";
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#766b65] transition hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <Link href="/signin" className="rounded-xl bg-[#CD3625] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ad321f]">
                  Sign in
                </Link>
              ))}
          </nav>
        </div>
      </header>

      {/* Success Message Toast */}
      {addedMessage && (
        <div className="fixed right-4 top-20 z-50 rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {addedMessage}
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col">
        <main className="mx-auto flex w-full flex-col gap-5 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:gap-8 lg:px-8">
          {/* Restaurant Header - Matching Partners Page Style */}
          <div className="restaurant-reveal grid overflow-hidden rounded-[24px] border border-[#e8ddd7] bg-white shadow-[0_18px_45px_rgba(50,31,24,0.1)] lg:grid-cols-[minmax(300px,38%)_1fr]">
            <div className="group relative h-[180px] overflow-hidden sm:h-[210px] lg:h-[230px]">
              <SafeImage
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                fallbackClassName="object-contain bg-[#fff8f5] p-8"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
              <div className="absolute left-3 top-3 flex gap-2 sm:left-4 sm:top-4">
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur ${restaurant.open ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white"}`}>
                  {restaurant.open ? "Open now" : "Currently closed"}
                </span>
                {restaurant.no_waste && (
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 backdrop-blur">
                    No Waste
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.17em] text-[#ff9b8f]">Restaurant menu</p>
                <h1 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                  {restaurant.name}
                </h1>
                {restaurant.description && (
                  <p className="mt-1.5 line-clamp-1 max-w-2xl text-xs leading-5 text-white/75">{restaurant.description}</p>
                )}
              </div>
            </div>
            <div className="flex content-center flex-wrap items-center gap-2.5 p-4 sm:p-5 lg:p-6">
              <div className="mb-1 w-full">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b63825]">At a glance</p>
                <p className="mt-1 text-sm text-[#7d716a]">Everything you need before choosing your meal.</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#fff8e8] px-3 py-2 text-sm font-bold">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                {restaurant.rating.toFixed(1)} <span className="font-normal text-gray-500">({restaurant.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f8f4f1] px-3 py-2 text-sm font-bold">
                <ShoppingBag size={17} className="text-[#b63825]" />
                Min. {restaurant.min_amount.toFixed(2)} CHF
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f8f4f1] px-3 py-2 text-sm font-bold">
                <Clock3 size={17} className="text-[#b63825]" />
                {restaurant.open ? "Accepting orders" : todayHours || "Closed"}
              </div>
              {restaurant.delivery_fee > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-[#f8f4f1] px-3 py-2 text-sm font-semibold text-[#615750]">
                  <MapPin size={17} />
                  {restaurant.delivery_fee.toFixed(2)} CHF delivery
                </div>
              )}
            </div>
          </div>

          {/* Mobile cart summary: keep it in the page flow between the
              restaurant overview and menu navigation. */}
          {cartItems.length > 0 && (
            <section className="rounded-[20px] border border-[#e5d9d3] bg-white p-3 shadow-[0_12px_32px_rgba(55,35,27,0.09)] lg:hidden">
              <div className="flex items-center gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0eb] text-[#b63825]">
                  <ShoppingBag size={19} />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#CD3625] px-1 text-[10px] font-black text-white">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#786c66]">Your cart · {restaurant.name}</p>
                  <p className="mt-0.5 text-base font-black text-[#241f1c]">{subtotal.toFixed(2)} CHF</p>
                </div>
                <Link
                  href="/cart"
                  className="flex min-h-11 shrink-0 items-center rounded-xl bg-[#CD3625] px-4 text-sm font-bold text-white shadow-md shadow-[#CD3625]/20"
                >
                  View cart
                </Link>
              </div>
            </section>
          )}

          {/* Sticky Menu Category Bar */}
          {(foodCategories.length > 0 || (apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0)) && (
            <div
              className="sticky top-[72px] z-40 -mx-1 mb-6 rounded-2xl bg-[#fbfaf8]/95 px-1 py-2 backdrop-blur-xl"
            >
              <div>
                <div className="scrollbar-hide flex items-stretch gap-2 overflow-x-auto rounded-2xl border border-[#e9dfda] bg-white p-2 shadow-[0_10px_30px_rgba(55,35,27,0.05)]">
                  {/* No Waste Category - Featured */}
                  {apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0 && (
                    <button
                      onClick={() => setSelectedFoodCategoryId("nowaste")}
                      className={`flex min-h-12 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-all duration-300 ${
                        selectedFoodCategoryId === "nowaste"
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          : 'bg-[#f7fbf8] text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      <span>♻ No Waste</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${selectedFoodCategoryId === "nowaste" ? "bg-white/20" : "bg-emerald-100"}`}>
                        {apiRestaurant.nowaste_items.length}
                      </span>
                    </button>
                  )}
                  {foodCategories.map((foodCategory) => (
                    <button
                      key={foodCategory.id}
                      onClick={() => setSelectedFoodCategoryId(foodCategory.id)}
                      className={`flex min-h-12 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-all duration-300 ${
                        selectedFoodCategoryId === foodCategory.id
                          ? 'bg-[#CD3625] text-white shadow-lg shadow-[#CD3625]/20'
                          : 'bg-[#fbf8f6] text-[#615650] hover:bg-[#fff0eb] hover:text-[#b73825]'
                      }`}
                    >
                      <span>{foodCategory.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${selectedFoodCategoryId === foodCategory.id ? "bg-white/20" : "bg-[#eee5e0]"}`}>
                        {foodCategory.menu_items?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
            <div className="flex-1 min-w-0">
              {/* Menu Items */}
              <div className="mb-8">
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#b63825]">
                    Freshly prepared
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                    {selectedFoodCategoryId === "nowaste"
                      ? "No Waste selections"
                      : currentFoodCategory?.name || "Menu"}
                  </h2>
                  {currentFoodCategory?.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d716a]">
                      {currentFoodCategory.description}
                    </p>
                  )}
                </div>

                {/* No Waste Items */}
                {selectedFoodCategoryId === "nowaste" && apiRestaurant?.nowaste_items && apiRestaurant.nowaste_items.length > 0 && (
                  <div className="mb-6 grid grid-cols-1 items-start gap-4">
                    {apiRestaurant.nowaste_items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative grid w-full overflow-hidden rounded-[22px] border border-emerald-200 bg-white shadow-[0_12px_30px_rgba(22,101,70,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:grid-cols-[150px_1fr]"
                      >
                        <div className="relative h-[170px] overflow-hidden bg-[#f4eeeb] sm:h-[180px]">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(min-width: 640px) 150px, 100vw"
                            className="object-cover"
                            fallbackClassName="object-contain bg-[#fff8f5] p-6"
                          />
                        </div>
                        <div className="min-w-0 p-5 pr-20">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="text-xl font-black tracking-tight">{item.name}</h3>
                            <span className="text-lg font-black text-[#b63825]">{item.price.toFixed(2)} CHF</span>
                          </div>
                          {item.description && <p className="mt-2 text-sm leading-6 text-[#796e68]">{item.description}</p>}
                        </div>
                        <button
                          className="absolute bottom-4 right-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#CD3625] px-4 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#ad321f] hover:shadow-lg disabled:opacity-50"
                          onClick={() => handleAddNoWasteItem(item.id, item.name)}
                          disabled={addingItemId === item.id}
                        >
                          {addingItemId === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Plus size={16} />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regular Menu Items by Category */}
                {currentFoodCategory && currentFoodCategory.menu_items && currentFoodCategory.menu_items.length > 0 && (
                  <div className="grid grid-cols-1 items-start gap-4">
                    {currentFoodCategory.menu_items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative grid w-full overflow-hidden rounded-[22px] border border-[#e9dfda] bg-white shadow-[0_12px_30px_rgba(55,35,27,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#e5b5a9] hover:shadow-[0_20px_45px_rgba(55,35,27,0.11)] sm:grid-cols-[150px_1fr]"
                      >
                        <div className="relative h-[170px] overflow-hidden bg-[#f4eeeb] sm:h-[210px]">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(min-width: 640px) 150px, 100vw"
                            className="object-cover"
                            fallbackClassName="object-contain bg-[#fff8f5] p-6"
                          />
                        </div>
                        <div className="min-w-0 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="text-xl font-black tracking-tight">{item.name}</h3>
                            <span className="text-lg font-black text-[#b63825]">{item.price.toFixed(2)} CHF</span>
                          </div>
                          {item.description && <p className="mt-2 text-sm leading-6 text-[#796e68]">{item.description}</p>}

                          {/* Menu Item Options */}
                          {item.options && item.options.length > 0 && (
                            <div className="mt-5 space-y-4 border-t border-[#eee5e0] pt-4">
                              {item.options.filter((option) => option.items.length > 0).map((option) => (
                                <fieldset key={option.id}>
                                  <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold text-[#4d4540]">
                                    <span>{option.name}</span>
                                    <span className="text-[11px] font-semibold text-[#94877f]">{option.required ? "Required" : "Optional"}{option.multiple ? " · Multiple" : ""}</span>
                                  </legend>
                                  {option.multiple && option.items.length > 5 ? (
                                    <CompactMultiOptionSelector
                                      optionName={option.name}
                                      items={option.items}
                                      selected={(() => {
                                        const value = selectedOptions[item.id]?.[option.id];
                                        return Array.isArray(value) ? value : value == null ? [] : [value];
                                      })()}
                                      onToggle={(optionItemId) =>
                                        handleOptionSelect(item.id, option.id, optionItemId, true)
                                      }
                                    />
                                  ) : option.multiple ? (
                                    // Multi-select: Use checkboxes
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {option.items.map((optionItem) => {
                                        const selectedValue = selectedOptions[item.id]?.[option.id];
                                        const isSelected = Array.isArray(selectedValue)
                                          ? selectedValue.includes(optionItem.id)
                                          : selectedValue === optionItem.id;
                                        return (
                                          <label
                                            key={optionItem.id}
                                            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${isSelected ? "border-[#CD3625] bg-[#fff0eb] text-[#a83221]" : "border-[#ded4cf] bg-white text-[#5f5550] hover:border-[#d5a99f]"}`}
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
                                      className="min-h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#d9cec8] bg-white px-4 pr-10 text-sm font-semibold text-[#514843] outline-none transition hover:border-[#c9aaa1] focus:border-[#CD3625] focus:ring-4 focus:ring-[#CD3625]/10"
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
                                </fieldset>
                              ))}
                            </div>
                          )}

                          {/* Allergy Information */}
                          {item.allergies && item.allergies.length > 0 && (
                            <div className="mt-4 border-t border-[#eee5e0] pt-3">
                              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#8b7e77]">Contains allergens</div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.allergies.map((allergy, allergyIndex) => {
                                  const allergyName = typeof allergy === "string" 
                                    ? allergy 
                                    : (typeof allergy === "object" && allergy !== null && "name" in allergy)
                                      ? allergy.name 
                                      : `Allergy ${allergyIndex + 1}`;
                                  return (
                                    <span key={allergyIndex} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                      {allergyName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="mx-5 mb-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#CD3625] px-5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#ad321f] hover:shadow-lg disabled:opacity-50 sm:col-start-2 sm:mt-0"
                          onClick={() => handleAddMenuItem(item)}
                          disabled={addingItemId === item.id}
                        >
                          {addingItemId === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Plus size={17} />
                              Add to cart · {item.price.toFixed(2)} CHF
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {(!currentFoodCategory || !currentFoodCategory.menu_items || currentFoodCategory.menu_items.length === 0) &&
                 (selectedFoodCategoryId !== "nowaste" || !apiRestaurant?.nowaste_items || apiRestaurant.nowaste_items.length === 0) && (
                  <div className="rounded-[22px] border border-dashed border-[#d9cac3] bg-white px-6 py-12 text-center">
                    <ShoppingBag className="mx-auto text-[#c8b6ae]" size={30} />
                    <p className="mt-3 font-bold text-[#5e544f]">No items in this category yet</p>
                    <p className="mt-1 text-sm text-[#8a7e77]">Choose another menu category to continue.</p>
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
            <aside className="hidden w-full flex-shrink-0 lg:sticky lg:top-24 lg:block lg:w-[330px]">
              <div className="mb-6 overflow-hidden rounded-[24px] border border-[#e5d9d3] bg-white shadow-[0_18px_48px_rgba(55,35,27,0.1)]">
                {/* Cart Title */}
                <div className="border-b border-[#eee5e0] bg-[#fff9f6] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CD3625] text-white shadow-md shadow-[#CD3625]/20">
                      <ShoppingBag size={19} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#b63825]">
                        Your cart
                      </div>
                      <div className="mt-0.5 truncate text-lg font-black leading-tight text-[#241f1c]">
                        {restaurant.name}
                      </div>
                    </div>
                    {cartItems.length > 0 && (
                      <span className="ml-auto flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f2e7e2] px-2 text-xs font-black text-[#8e3528]">
                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                {/* Cart Items */}
                {isCartLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : cartItems.length > 0 ? (
                  <div className="mb-5 flex flex-col gap-2.5">
                    {cartItems.map((cartItem) => {
                      const item = cartItem.menu_item || cartItem.nowaste_item;
                      if (!item) return null;
                      
                      return (
                        <div key={cartItem.id} className="group flex items-center gap-3 rounded-xl border border-[#eee5e0] bg-[#fffdfa] p-2.5 transition hover:border-[#e3b9ae] hover:bg-[#fff8f5]">
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                            <SafeImage
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              fallbackClassName="object-contain bg-[#fff8f5] p-5"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between w-full">
                              <div className="truncate text-sm font-bold text-[#2d2724]">
                                {item.name}
                              </div>
                              <div className="ml-3 whitespace-nowrap text-xs font-black text-[#b63825]">
                                {item.price.toFixed(2)} CHF
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-xs font-semibold text-[#8b7e77]">Quantity {cartItem.quantity}</span>
                              <button
                                className="ml-2 rounded-lg p-1 opacity-60 transition hover:bg-red-50 hover:opacity-100"
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
                  <div className="rounded-2xl border border-dashed border-[#dacbc4] bg-[#fbf8f6] px-4 py-9 text-center">
                    <ShoppingBag className="mx-auto text-[#c9b6ad]" size={27} />
                    <p className="mt-3 text-sm font-bold text-[#5e544f]">Your cart is empty</p>
                    <p className="mt-1 text-xs leading-5 text-[#93867f]">Add an item from the menu to begin.</p>
                  </div>
                )}
                {/* Cart Summary */}
                {cartItems.length > 0 && (
                  <div className="mt-2 border-t border-[#eee5e0] pt-5">
                    <div className="flex items-center justify-between text-lg font-black text-[#241f1c]">
                      <span>Cart total</span>
                      <span className="text-[#b63825]">{subtotal.toFixed(2)} CHF</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#8b7e77]">Final delivery charges and discounts are confirmed at checkout.</p>
                  </div>
                )}
                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#CD3625] px-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ad321f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Order and checkout
                  <ShoppingBag size={18} />
                </button>
                <Link
                  href="/cart"
                  className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl text-sm font-bold text-[#796d67] transition hover:bg-[#f8f2ef] hover:text-[#b63825]"
                >
                  Review full cart
                </Link>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function CompactMultiOptionSelector({
  optionName,
  items,
  selected,
  onToggle,
}: {
  optionName: string;
  items: MenuItemOptionResponse[];
  selected: number[];
  onToggle: (optionItemId: number) => void;
}) {
  const selectedItems = items.filter((item) => selected.includes(item.id));
  const summary =
    selectedItems.length === 0
      ? `Choose ${optionName}`
      : selectedItems.length <= 2
        ? selectedItems.map((item) => item.name).join(", ")
        : `${selectedItems.length} choices selected`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${optionName}: ${summary}`}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#d9cec8] bg-white px-4 text-left text-sm font-semibold text-[#514843] outline-none transition hover:border-[#c9aaa1] focus-visible:border-[#CD3625] focus-visible:ring-4 focus-visible:ring-[#CD3625]/10"
        >
          <span className={`min-w-0 truncate ${selectedItems.length === 0 ? "text-[#8c817b]" : ""}`}>
            {summary}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-[#8c817b]">
            {selectedItems.length > 0 && (
              <span className="rounded-full bg-[#fff0eb] px-2 py-0.5 font-bold text-[#a83221]">
                {selectedItems.length}
              </span>
            )}
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-[#ded4cf] bg-white p-1.5 shadow-[0_18px_45px_rgba(55,35,27,0.18)]"
        >
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {items.map((optionItem) => {
              const isSelected = selected.includes(optionItem.id);
              return (
                <label
                  key={optionItem.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isSelected ? "bg-[#fff0eb] text-[#a83221]" : "text-[#5f5550] hover:bg-[#faf6f3]"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => onToggle(optionItem.id)}
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isSelected ? "border-[#CD3625] bg-[#CD3625] text-white" : "border-[#cfc3bd] bg-white"}`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 font-semibold">{optionItem.name}</span>
                  {optionItem.price > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-[#8c817b]">
                      +{optionItem.price.toFixed(2)} CHF
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
