"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddresses,
  useAddToCart,
  useAuth,
  useCart,
  useCategories,
  useLogout,
  useRestaurantDetail,
  useRestaurants
} from "@/lib/api";
import type { MenuItemResponse, NoWasteItem } from "@/lib/api/types";
import {
  clearCartRestaurantId,
  getCartRestaurantId,
  setCartRestaurantId,
} from "@/lib/cart-restaurant";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { partners as staticPartners } from "../../data/partnersData";

function PartnersPageContent() {
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [priceFilter, setPriceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [moreFilter, setMoreFilter] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery"); // "delivery" or "pickup"
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showRestaurantWarning, setShowRestaurantWarning] = useState(false);

  // Authentication hooks
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();

  // Fetch addresses for logged-in users
  const { data: addresses, isLoading: addressesLoading } = useAddresses(isAuthenticated);

  // Cart hooks
  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();

  // Set delivery address based on authentication status
  useEffect(() => {
    if (authLoading || addressesLoading) return;

    if (isAuthenticated && addresses && addresses.length > 0) {
      // For logged-in users, use their default address or first address
      const defaultAddress = addresses.find(addr => addr.default) || addresses[0];
      const fullAddress = `${defaultAddress.address}, ${defaultAddress.postal_code} ${defaultAddress.city}`;
      setDeliveryAddress(fullAddress);
    } else if (!isAuthenticated) {
      // For non-logged-in users, get address from URL query parameter
      const addressFromUrl = searchParams.get("address");
      if (addressFromUrl) {
        const decodedAddress = decodeURIComponent(addressFromUrl);
        setDeliveryAddress(decodedAddress);
        // Save to sessionStorage so it persists when navigating to payment page
        if (typeof window !== "undefined") {
          sessionStorage.setItem("deliveryAddress", decodedAddress);
        }
      } else if (typeof window !== "undefined") {
        // Try to get from sessionStorage if not in URL
        const storedAddress = sessionStorage.getItem("deliveryAddress");
        if (storedAddress) {
          setDeliveryAddress(storedAddress);
        }
      }
    }
  }, [isAuthenticated, addresses, addressesLoading, authLoading, searchParams]);

  // Fetch restaurant categories for sidebar
  const { data: apiCategories, isLoading: categoriesLoading } = useCategories();

  // Fetch restaurants from API with search/category filters
  const { data: apiRestaurants, isLoading, error } = useRestaurants({
    search: search || undefined,
    category: selectedCategoryId || undefined,
  });

  // When restaurants load, select the first one
  useEffect(() => {
    if (apiRestaurants && apiRestaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(apiRestaurants[0].id);
    }
  }, [apiRestaurants, selectedRestaurantId]);

  // When category changes, reset selected restaurant
  useEffect(() => {
    setSelectedRestaurantId(null);
  }, [selectedCategoryId]);

  // Clear stored cart restaurant when cart becomes empty
  useEffect(() => {
    if (cart?.items?.length === 0) {
      clearCartRestaurantId();
    }
  }, [cart?.items?.length]);

  // Fetch selected restaurant details with menu
  const { data: restaurantDetail, isLoading: detailLoading } = useRestaurantDetail(
    selectedRestaurantId || 0
  );

  // Transform API response to match existing data structure
  const partners = apiRestaurants
    ? apiRestaurants.map(r => ({
      id: r.id,
      image: r.images?.[0]?.image || "/images/pizza.png",
      title: r.name,
      description: r.description || "",
      buttonText: "View Menu",
      time: r.open ? "Open" : "Closed",
      isNew: false,
      open: r.open,
      rating: r.rating || 0,
      reviews: r.reviews || 0,
      minAmount: r.min_amount || 0,
      deliveryFee: r.delivery_fee || 0,
      noWaste: r.no_waste || false,
      categories: r.categories?.map(c => c.id) || [],
      dietary: {
        glutenFree: false,
        lactoseFree: false,
        vegetarian: false,
        vegan: false,
      },
    }))
    : staticPartners;

  // State for selected options: itemId -> optionId -> value(s)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, Record<number, number | number[]>>>({});

  const handleOptionToggle = (itemId: number, optionId: number, itemValue: number, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      const itemOptions = prev[itemId] || {};
      const currentVal = itemOptions[optionId];

      if (isMultiple) {
        // Handle multi-select
        const currentArray = Array.isArray(currentVal) ? currentVal : [];
        const exists = currentArray.includes(itemValue);

        let newArray;
        if (exists) {
          newArray = currentArray.filter(v => v !== itemValue);
        } else {
          newArray = [...currentArray, itemValue];
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
            [optionId]: itemValue,
          },
        };
      }
    });
  };

  const handleAddMenuItem = (item: MenuItemResponse) => {
    // Prevent adding from a different restaurant than the one already in the cart
    const cartRestaurantId = getCartRestaurantId(cart ?? undefined);
    if (
      cart?.items?.length &&
      selectedRestaurantId != null &&
      cartRestaurantId != null &&
      cartRestaurantId !== selectedRestaurantId
    ) {
      setShowRestaurantWarning(true);
      return;
    }

    // Check required options
    const itemOptions = selectedOptions[item.id] || {};
    const missingRequired = item.options?.filter(opt => opt.required && !itemOptions[opt.id]); // Now checking 'required' field

    if (missingRequired && missingRequired.length > 0) {
      alert(`Please select ${missingRequired[0].name}`);
      return;
    }

    setAddingItemId(item.id);

    // Format options for API
    // Format options for API - Flatten arrays for compatibility
    const formattedOptions: Array<{ option: number; item: number }> = [];

    Object.entries(itemOptions).forEach(([optId, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => {
          formattedOptions.push({
            option: Number(optId),
            item: v,
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
          if (selectedRestaurantId != null) setCartRestaurantId(selectedRestaurantId);
          // Cart cache is already updated by the mutation, no need to refetch
          // Clear options for this item
          setSelectedOptions(prev => {
            const newState = { ...prev };
            delete newState[item.id];
            return newState;
          });
        },
        onError: () => {
          setAddingItemId(null);
          // alert("Failed to add item to cart");
        },
      }
    );
  };

  const handleAddNoWasteItem = (item: NoWasteItem) => {
    // Prevent adding from a different restaurant than the one already in the cart
    const cartRestaurantId = getCartRestaurantId(cart ?? undefined);
    if (
      cart?.items?.length &&
      selectedRestaurantId != null &&
      cartRestaurantId != null &&
      cartRestaurantId !== selectedRestaurantId
    ) {
      setShowRestaurantWarning(true);
      return;
    }

    setAddingItemId(item.id);
    addToCartMutation.mutate(
      {
        quantity: 1,
        nowaste_item: item.id,
      },
      {
        onSuccess: () => {
          setAddingItemId(null);
          if (selectedRestaurantId != null) setCartRestaurantId(selectedRestaurantId);
          // Cart cache is already updated by the mutation, no need to refetch
        },
        onError: () => {
          setAddingItemId(null);
          // alert("Failed to add item to cart");
        },
      }
    );
  };

  const filteredPartners = partners.filter(partner => {
    const searchMatch = search === "" ||
      partner.title.toLowerCase().includes(search.toLowerCase()) ||
      partner.description.toLowerCase().includes(search.toLowerCase());

    const categoryMatch = !selectedCategoryId ||
      partner.categories?.includes(selectedCategoryId);

    let priceMatch = true;
    if (priceFilter === "low") {
      priceMatch = partner.minAmount < 20;
    } else if (priceFilter === "medium") {
      priceMatch = partner.minAmount >= 20 && partner.minAmount <= 50;
    } else if (priceFilter === "high") {
      priceMatch = partner.minAmount > 50;
    }

    let typeMatch = true;
    if (typeFilter === "restaurant") {
      typeMatch = partner.categories?.includes(2);
    } else if (typeFilter === "fast-food") {
      typeMatch = partner.categories?.includes(1);
    }

    let moreMatch = true;
    if (moreFilter === "rating") {
      moreMatch = partner.rating >= 4.5;
    } else if (moreFilter === "delivery") {
      moreMatch = partner.deliveryFee === 0;
    } else if (moreFilter === "discount") {
      moreMatch = partner.noWaste;
    }

    return searchMatch && categoryMatch && priceMatch && typeMatch && moreMatch;
  });

  return (
    <div className="bg-white mt-10">
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

      <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto">
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

            <div className="flex items-center mr-4 lg:mr-8 cursor-pointer">
              <span
                className="text-[20px] sm:text-[24px] lg:text-[32px] font-extrabold select-none"
                style={{ fontFamily: "Abril Fatface, serif" }}
              >
                <span className="text-[#CD3625]">FOOD</span>
                <span className="text-black">DELY</span>
              </span>
            </div>

            <div className="hidden md:flex gap-4 mr-8">
              <button
                className={`px-8 py-2 rounded-full border font-medium transition cursor-pointer ${deliveryType === "delivery"
                  ? "border-[#CD3625] text-white bg-[#CD3625]"
                  : "border-gray-400 text-black bg-white hover:bg-gray-100"
                  }`}
                onClick={() => setDeliveryType("delivery")}
              >
                Delivery
              </button>
              <button
                className={`px-8 py-2 rounded-full border font-medium transition cursor-pointer ${deliveryType === "pickup"
                  ? "border-[#CD3625] text-white bg-[#CD3625]"
                  : "border-gray-400 text-black bg-white hover:bg-gray-100"
                  }`}
                onClick={() => setDeliveryType("pickup")}
              >
                Pickup
              </button>
            </div>

            <div className="hidden sm:flex items-center bg-[#F7F8FD] rounded-full px-4 py-2 w-[200px] md:w-[280px] lg:w-[320px] mr-4 lg:mr-8">
              <Image
                src="/images/search-icon.svg"
                alt="Search"
                width={20}
                height={20}
                className="text-[#CD3625] mr-2"
              />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none w-full text-gray-700 py-2 text-sm lg:text-base"
              />
            </div>

            <div className="flex items-center gap-3 mr-4 lg:mr-6">


              {/* Cart */}
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
                {/* Notification dot */}
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

        {/* Delivery Address Bar */}
        {deliveryType === "delivery" && (
          <div className="fixed top-[88px] lg:top-[108px] left-0 w-full z-40 bg-[#FFF8F7] border-b border-gray-200">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center gap-2 flex-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#CD3625] flex-shrink-0"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="#CD3625"
                  />
                </svg>
                {isEditingAddress ? (
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    onBlur={() => setIsEditingAddress(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingAddress(false);
                      }
                    }}
                    autoFocus
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CD3625] focus:border-transparent"
                    placeholder="Enter delivery address"
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">Delivering to:</span>
                    <span className="text-sm text-gray-900 truncate">
                      {deliveryAddress || "No address set"}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="ml-4 text-[#CD3625] text-sm font-medium hover:text-[#b83213] transition flex-shrink-0"
              >
                {isEditingAddress ? "Done" : "Change"}
              </button>
            </div>
          </div>
        )}

        <main className="w-full mx-auto px-4 pb-8 pt-20 sm:pt-24 lg:pt-32 flex flex-col gap-4 sm:gap-6 lg:gap-8" style={{ marginTop: deliveryType === "delivery" ? "40px" : "0" }}>
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2 w-full">
            <h2 className="font-bold text-xl sm:text-2xl text-black whitespace-nowrap">
              Partners
            </h2>

            <div className="flex sm:hidden items-center bg-[#F7F8FD] rounded-full px-4 py-2 w-full">
              <Image
                src="/images/search-icon.svg"
                alt="Search"
                width={20}
                height={20}
                className="text-[#CD3625] mr-2"
              />
              <input
                type="text"
                placeholder="Search partner or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-700 text-base py-2"
              />
            </div>

            <div className="hidden sm:flex items-center bg-[#F7F8FD] rounded-full px-4 py-2 w-[200px] md:w-[280px] lg:w-[320px] mr-2 ml-4 lg:ml-8">
              <Image
                src="/images/search-icon.svg"
                alt="Search"
                width={20}
                height={20}
                className="text-[#CD3625] mr-2"
              />
              <input
                type="text"
                placeholder="Search partner or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-700 text-base py-2"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 ml-0 sm:ml-4 lg:ml-20">
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[140px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                  <SelectValue placeholder="Any Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Price</SelectItem>
                  <SelectItem value="low">Under 20 CHF</SelectItem>
                  <SelectItem value="medium">20-50 CHF</SelectItem>
                  <SelectItem value="high">Over 50 CHF</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[140px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                  <SelectValue placeholder="All Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Type</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="fast-food">Fast Food</SelectItem>
                </SelectContent>
              </Select>

              <Select value={moreFilter} onValueChange={setMoreFilter}>
                <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[140px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg whitespace-nowrap">
                  <SelectValue placeholder="More Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">More Filter</SelectItem>
                  <SelectItem value="rating">High Rating</SelectItem>
                  <SelectItem value="delivery">Fast Delivery</SelectItem>
                  <SelectItem value="discount">With Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:flex ml-auto items-center gap-2">
              <button
                className={`w-10 h-6 rounded-full flex items-center p-1 transition-all duration-200 focus:outline-none ${isMapView ? 'bg-[#CD3625]' : 'bg-gray-300'
                  }`}
                onClick={() => setIsMapView(!isMapView)}
              >
                <span className={`w-4 h-4 bg-white rounded-full block shadow transition-transform duration-200 ${isMapView ? 'translate-x-4' : 'translate-x-0'
                  }`} />
              </button>
              <span className="text-gray-700 text-base font-medium">
                Map View
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between lg:flex-row gap-4 lg:gap-8">
            {/* Sidebar with Restaurant Categories */}
            <aside className="lg:w-60 flex flex-col gap-4">
              <h3 className="font-bold text-lg text-black">Categories</h3>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
                  {/* All Categories option */}
                  <button
                    className={`py-2 lg:py-3 px-3 lg:px-4 cursor-pointer rounded-lg text-left whitespace-nowrap lg:whitespace-normal text-sm lg:text-base transition-all duration-200 ${selectedCategoryId === null
                      ? "bg-[#CD3625] text-white font-semibold"
                      : "bg-white text-gray-700 border border-gray-200 font-medium hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    All Categories
                  </button>

                  {/* API Categories */}
                  {apiCategories?.map((category) => (
                    <button
                      key={category.id}
                      className={`py-2 lg:py-3 px-3 lg:px-4 cursor-pointer rounded-lg text-left whitespace-nowrap lg:whitespace-normal text-sm lg:text-base transition-all duration-200 ${selectedCategoryId === category.id
                        ? "bg-[#CD3625] text-white font-semibold"
                        : "bg-white text-gray-700 border border-gray-200 font-medium hover:bg-gray-50"
                        }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Restaurant List in Sidebar */}
              {filteredPartners.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-lg text-black mb-3">Restaurants</h3>
                  <div className="flex flex-row lg:flex-col gap-2 lg:gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide max-h-[400px] lg:overflow-y-auto">
                    {filteredPartners.map((partner) => (
                      <button
                        key={partner.id}
                        className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 w-fit shrink-0 lg:w-full lg:shrink ${selectedRestaurantId === partner.id
                          ? "bg-[#CD3625] text-white"
                          : "bg-white border border-gray-200 hover:bg-gray-50"
                          }`}
                        onClick={() => setSelectedRestaurantId(partner.id)}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image
                            src={partner.image}
                            alt={partner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-left max-w-[120px] sm:max-w-[150px] lg:max-w-none">
                          <p className={`font-medium text-xs sm:text-sm truncate ${selectedRestaurantId === partner.id ? "text-white" : "text-black"
                            }`}>
                            {partner.title}
                          </p>
                          <p className={`text-xs ${selectedRestaurantId === partner.id ? "text-white/80" : "text-gray-500"
                            }`}>
                            {partner.open ? "Open" : "Closed"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content - Selected Restaurant Details & Menu */}
            <section className="flex-1 flex flex-col gap-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-lg mt-4">Loading restaurants...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 text-lg">Failed to load restaurants</p>
                  <p className="text-gray-400 text-sm mt-2">Please try again later.</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No restaurants found matching your search criteria.</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
                </div>
              ) : selectedRestaurantId ? (
                <>
                  {/* Selected Restaurant Header */}
                  {(() => {
                    const selectedPartner = filteredPartners.find(p => p.id === selectedRestaurantId);
                    if (!selectedPartner) return null;
                    return (
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="relative h-[200px] sm:h-[250px] lg:h-[300px]">
                          <Image
                            src={selectedPartner.image}
                            alt={selectedPartner.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                              {selectedPartner.title}
                            </h2>
                            <p className="text-white/80 mt-1">{selectedPartner.description}</p>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6 flex flex-wrap gap-4 sm:gap-8 items-center">
                          <div className="flex items-center gap-2 text-black font-semibold">
                            <Image src="/images/star-icon.svg" alt="Star" width={20} height={20} />
                            {selectedPartner.rating} <span className="font-normal text-gray-500">({selectedPartner.reviews} reviews)</span>
                          </div>
                          <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                          <div className="flex items-center gap-2 text-black font-semibold">
                            <Image src="/images/lock-icon.svg" alt="Min" width={18} height={18} />
                            Min. {selectedPartner.minAmount.toFixed(2)} CHF
                          </div>
                          <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                          <div className="flex items-center gap-2 text-black font-semibold">
                            <Image src="/images/clock-icon.svg" alt="Status" width={18} height={18} />
                            <span className={selectedPartner.open ? "text-green-600" : "text-red-600"}>
                              {selectedPartner.open ? "Open" : "Closed"}
                            </span>
                          </div>
                          {selectedPartner.deliveryFee > 0 && (
                            <>
                              <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                              <div className="text-gray-600">
                                Delivery: {selectedPartner.deliveryFee.toFixed(2)} CHF
                              </div>
                            </>
                          )}
                          {selectedPartner.noWaste && (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                              No Waste
                            </span>
                          )}
                          <Link
                            href={`/partners/${selectedRestaurantId}`}
                            className="bg-[#CD3625] text-white px-6 py-2 rounded-full font-medium hover:bg-[#b83213] transition ml-auto"
                          >
                            View Full Menu
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Menu Section */}
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">Menu</h3>
                    {detailLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-6 h-6 border-2 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 mt-2">Loading menu...</p>
                      </div>
                    ) : restaurantDetail ? (
                      <div className="space-y-8">
                        {/* No Waste Items - Featured Category */}
                        {restaurantDetail.nowaste_items && restaurantDetail.nowaste_items.length > 0 && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xl font-bold">♻</span>
                              </div>
                              <h4 className="text-2xl font-bold text-emerald-800">No Waste - Featured</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {restaurantDetail.nowaste_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                  {item.image && (
                                    <div className="relative h-[140px]">
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="p-4">
                                    <h4 className="font-semibold text-black text-lg">{item.name}</h4>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                                    <div className="flex items-center justify-between mt-3">
                                      <span className="text-[#CD3625] font-bold text-lg">
                                        {item.price.toFixed(2)} CHF
                                      </span>
                                      <button
                                        onClick={() => handleAddNoWasteItem(item)}
                                        disabled={addingItemId === item.id}
                                        className="bg-[#CD3625] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#b83213] transition disabled:opacity-70 disabled:cursor-not-allowed"
                                      >
                                        {addingItemId === item.id ? "Adding..." : "Add to Cart"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Regular Food Categories */}
                        {restaurantDetail.foods && restaurantDetail.foods.length > 0 ? (
                          restaurantDetail.foods.map((foodCategory) => (
                            <div key={foodCategory.id} className="space-y-4">
                              <div className="flex items-center gap-3">
                                {foodCategory.image && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                    <Image
                                      src={foodCategory.image}
                                      alt={foodCategory.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-xl sm:text-2xl font-bold text-black">{foodCategory.name}</h4>
                                  {foodCategory.description && (
                                    <p className="text-gray-600 text-sm mt-1">{foodCategory.description}</p>
                                  )}
                                </div>
                              </div>

                              {foodCategory.menu_items && foodCategory.menu_items.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {foodCategory.menu_items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                      {item.image && (
                                        <div className="relative h-[140px]">
                                          <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="p-4">
                                        <h4 className="font-semibold text-black text-lg">{item.name}</h4>
                                        {item.description && (
                                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                                        )}

                                        {/* Menu Item Options - Render Actual Selectors */}
                                        {item.options && item.options.length > 0 && (
                                          <div className="mt-2 space-y-3">
                                            {item.options.map((option) => (
                                              <div key={option.id} className="text-sm">
                                                <label className="block text-gray-700 font-medium text-xs mb-1">
                                                  {option.name} {option.required && <span className="text-red-500">*</span>}
                                                </label>
                                                {option.multiple ? (
                                                  <div className="flex flex-wrap gap-2">
                                                    {option.items.map((optItem) => {
                                                      const isSelected = (selectedOptions[item.id]?.[option.id] as number[] || []).includes(optItem.id);
                                                      return (
                                                        <label key={optItem.id} className="flex items-center gap-1 cursor-pointer bg-gray-50 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                                                          <input
                                                            type="checkbox"
                                                            className="rounded text-[#CD3625] focus:ring-[#CD3625]"
                                                            checked={isSelected}
                                                            onChange={() => handleOptionToggle(item.id, option.id, optItem.id, true)}
                                                          />
                                                          <span className="text-xs">{optItem.name} (+{optItem.price})</span>
                                                        </label>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  <select
                                                    className="w-full text-xs p-1 border border-gray-300 rounded focus:border-[#CD3625] outline-none"
                                                    value={selectedOptions[item.id]?.[option.id] as number || ""}
                                                    onChange={(e) => handleOptionToggle(item.id, option.id, Number(e.target.value), false)}
                                                  >
                                                    <option value="">Select...</option>
                                                    {option.items.map((optItem) => (
                                                      <option key={optItem.id} value={optItem.id}>
                                                        {optItem.name} (+{optItem.price})
                                                      </option>
                                                    ))}
                                                  </select>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3">
                                          <span className="text-[#CD3625] font-bold text-lg">
                                            {item.price.toFixed(2)} CHF
                                          </span>
                                          <button
                                            onClick={() => handleAddMenuItem(item)}
                                            disabled={addingItemId === item.id}
                                            className="bg-[#CD3625] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#b83213] transition disabled:opacity-70 disabled:cursor-not-allowed"
                                          >
                                            {addingItemId === item.id ? "Adding..." : "Add to Cart"}
                                          </button>
                                        </div>

                                        {/* Allergies */}
                                        {item.allergies && item.allergies.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {item.allergies.map((allergy, idx) => {
                                              // Handle both string and object formats
                                              const allergyName = typeof allergy === "string"
                                                ? allergy
                                                : (typeof allergy === "object" && allergy !== null && "name" in allergy)
                                                  ? allergy.name
                                                  : `Allergy ${idx + 1}`;
                                              const allergyKey = typeof allergy === "object" && allergy !== null && "id" in allergy
                                                ? allergy.id
                                                : idx;
                                              return (
                                                <span
                                                  key={allergyKey}
                                                  className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded"
                                                >
                                                  {allergyName}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                  <p className="text-gray-500 text-sm">No items in this category.</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No menu categories available for this restaurant.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <p className="text-gray-500">No menu items available for this restaurant.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Select a restaurant from the sidebar to view details.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#CD3625] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-lg mt-4">Loading...</p>
        </div>
      </div>
    }>
      <PartnersPageContent />
    </Suspense>
  );
}
