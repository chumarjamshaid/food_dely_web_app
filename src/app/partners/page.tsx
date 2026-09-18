"use client";

import SafeImage from "@/components/SafeImage";
import LanguageSwitch from "@/components/LanguageSwitch";
import {
  useAddresses,
  useAddressAutocomplete,
  useAuth,
  useCart,
  useCategories,
  useLogout,
  useRestaurantDetail,
  useRestaurants,
} from "@/lib/api";
import {
  ArrowRight,
  Bike,
  Check,
  Clock3,
  Leaf,
  LoaderCircle,
  LogOut,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Star,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { getTodayOpeningHours } from "@/lib/opening-hours";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getAddressForCoordinates, getBrowserLocation, isCurrentLocationPlaceholder } from "@/lib/browser-location";

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatDiscount(discount: {
  price_reduction_percentage: number | null;
  price_reduction_amount: number | null;
}) {
  if (discount.price_reduction_percentage) return `${discount.price_reduction_percentage}% off`;
  if (discount.price_reduction_amount) return `${Number(discount.price_reduction_amount).toFixed(2)} CHF off`;
  return "Special offer";
}

function RestaurantListPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();
  const { data: addresses } = useAddresses(isAuthenticated);
  const { data: cart } = useCart();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const [availability, setAvailability] = useState<"delivery" | "pickup">("delivery");
  const [highlight, setHighlight] = useState("all");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [changingLocation, setChangingLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState("");
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [currentLocationError, setCurrentLocationError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedFulfilmentType = sessionStorage.getItem("checkout_delivery_type");
    if (savedFulfilmentType === "delivery" || savedFulfilmentType === "pickup") {
      setAvailability(savedFulfilmentType);
    }
  }, []);

  const selectAvailability = (type: "delivery" | "pickup") => {
    setAvailability(type);
    sessionStorage.setItem("checkout_delivery_type", type);
  };

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedLocationSearch(locationSearch),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [locationSearch]);

  const { data: locationSuggestions = [], isFetching: locationSuggestionsLoading } =
    useAddressAutocomplete(changingLocation ? debouncedLocationSearch : "");

  const useCurrentLocation = async () => {
    setCurrentLocationError("");
    setCurrentLocationLoading(true);
    try {
      const coords = await getBrowserLocation();
      const label = await getAddressForCoordinates(coords);
      setDeliveryAddress(label);
      setDeliveryLat(coords.lat);
      setDeliveryLng(coords.lng);
      sessionStorage.setItem("deliveryAddress", label);
      sessionStorage.setItem("deliveryLocationLat", String(coords.lat));
      sessionStorage.setItem("deliveryLocationLng", String(coords.lng));
      const url = new URL(window.location.href);
      url.searchParams.set("address", label);
      url.searchParams.set("lat", String(coords.lat));
      url.searchParams.set("lng", String(coords.lng));
      window.history.replaceState(null, "", url.toString());
      setChangingLocation(false);
      setLocationSearch("");
      setSearch("");
    } catch (error) {
      setCurrentLocationError(error instanceof Error ? error.message : "We couldn’t access your location. Please try again.");
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  useEffect(() => {
    const addressFromUrl = searchParams.get("address")?.trim();
    const latFromUrl = searchParams.get("lat");
    const lngFromUrl = searchParams.get("lng");
    const parsedLat = latFromUrl === null ? null : Number(latFromUrl);
    const parsedLng = lngFromUrl === null ? null : Number(lngFromUrl);
    if (addressFromUrl) {
      if (
        isCurrentLocationPlaceholder(addressFromUrl) &&
        Number.isFinite(parsedLat) &&
        Number.isFinite(parsedLng)
      ) {
        const coordinates = { lat: parsedLat as number, lng: parsedLng as number };
        setDeliveryAddress("");
        setDeliveryLat(coordinates.lat);
        setDeliveryLng(coordinates.lng);
        setCurrentLocationLoading(true);
        void getAddressForCoordinates(coordinates)
          .then((detectedAddress) => {
            setDeliveryAddress(detectedAddress);
            sessionStorage.setItem("deliveryAddress", detectedAddress);
            sessionStorage.setItem("deliveryLocationLat", String(coordinates.lat));
            sessionStorage.setItem("deliveryLocationLng", String(coordinates.lng));
            const url = new URL(window.location.href);
            url.searchParams.set("address", detectedAddress);
            window.history.replaceState(null, "", url.toString());
          })
          .catch((error: unknown) => {
            setCurrentLocationError(error instanceof Error ? error.message : "We couldn’t determine your address. Please enter it manually.");
          })
          .finally(() => setCurrentLocationLoading(false));
        return;
      }
      setDeliveryAddress(addressFromUrl);
      setDeliveryLat(Number.isFinite(parsedLat) ? parsedLat : null);
      setDeliveryLng(Number.isFinite(parsedLng) ? parsedLng : null);
      sessionStorage.setItem("deliveryAddress", addressFromUrl);
      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
        sessionStorage.setItem("deliveryLocationLat", String(parsedLat));
        sessionStorage.setItem("deliveryLocationLng", String(parsedLng));
      }
      return;
    }

    const storedAddress = sessionStorage.getItem("deliveryAddress")?.trim();
    const storedLatValue = sessionStorage.getItem("deliveryLocationLat");
    const storedLngValue = sessionStorage.getItem("deliveryLocationLng");
    const storedLat = storedLatValue === null ? null : Number(storedLatValue);
    const storedLng = storedLngValue === null ? null : Number(storedLngValue);
    if (storedAddress) {
      if (
        isCurrentLocationPlaceholder(storedAddress) &&
        storedLat !== null && Number.isFinite(storedLat) &&
        storedLng !== null && Number.isFinite(storedLng)
      ) {
        const coordinates = { lat: storedLat, lng: storedLng };
        setDeliveryAddress("");
        setDeliveryLat(coordinates.lat);
        setDeliveryLng(coordinates.lng);
        setCurrentLocationLoading(true);
        void getAddressForCoordinates(coordinates)
          .then((detectedAddress) => {
            setDeliveryAddress(detectedAddress);
            sessionStorage.setItem("deliveryAddress", detectedAddress);
          })
          .catch((error: unknown) => {
            setCurrentLocationError(error instanceof Error ? error.message : "We couldn’t determine your address. Please enter it manually.");
          })
          .finally(() => setCurrentLocationLoading(false));
        return;
      }
      setDeliveryAddress(storedAddress);
      setDeliveryLat(storedLat !== null && Number.isFinite(storedLat) ? storedLat : null);
      setDeliveryLng(storedLng !== null && Number.isFinite(storedLng) ? storedLng : null);
      return;
    }

    if (isAuthenticated && addresses?.length) {
      const address = addresses.find((item) => item.default) ?? addresses[0];
      const formattedAddress = `${address.address}, ${address.postal_code} ${address.city}`;
      setDeliveryAddress(formattedAddress);
      setDeliveryLat(null);
      setDeliveryLng(null);
      sessionStorage.setItem("deliveryAddress", formattedAddress);
    }
  }, [addresses, isAuthenticated, searchParams]);

  const { data: restaurants = [], isLoading, error } = useRestaurants({
    category: category || undefined,
    open: showClosed ? undefined : true,
    delivery: availability === "delivery" ? true : undefined,
    address: availability === "delivery" ? deliveryAddress || undefined : undefined,
    lat: availability === "delivery" ? deliveryLat ?? undefined : undefined,
    lng: availability === "delivery" ? deliveryLng ?? undefined : undefined,
  });

  const searchTerms = normalizeSearchText(search).split(" ").filter(Boolean);
  const activeHighlightLabel =
    highlight === "rating"
      ? "Places with deals"
      : highlight === "free-delivery"
        ? "Free delivery"
        : highlight === "nowaste"
          ? "No Waste"
          : "";
  const quickFilters = [
    { value: "open", label: "Open now", icon: <Clock3 size={16} className="text-[#4b9b60]" /> },
    { value: "rating", label: "Places with deals", icon: <Tag size={16} className="text-[#f0a52f]" /> },
    { value: "nowaste", label: "NoWaste", icon: <Leaf size={16} className="text-[#58a56b]" /> },
  ] as const;
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchableText = normalizeSearchText(
      `${restaurant.name} ${restaurant.description ?? ""} ${(restaurant.categories ?? []).map((item) => `${item.name} ${item.description ?? ""}`).join(" ")}`,
    );

    if (searchTerms.some((term) => !searchableText.includes(term))) return false;
    if (availability === "delivery" && !restaurant.delivery_available) return false;
    if (highlight === "rating" && Number(restaurant.rating ?? 0) < 4) return false;
    if (highlight === "free-delivery" && Number(restaurant.delivery_fee ?? 0) !== 0) return false;
    if (highlight === "nowaste" && !restaurant.no_waste) return false;
    return true;
  });
  const hasRestaurants = restaurants.length > 0;

  const clearFilters = () => {
    setSearch("");
    setCategory(null);
    setHighlight("all");
    setShowClosed(false);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <header className="sticky top-0 z-50 border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center gap-2 px-4 py-2 sm:flex-nowrap sm:gap-3 sm:px-8 lg:px-10">
          <Link href="/" className="mr-auto text-xl font-black tracking-[-0.04em] sm:text-[24px]">
            <span className="text-[#c83b2b]">FOOD</span>DELY
          </Link>

          <div className="order-last grid w-full grid-cols-2 rounded-xl bg-[#f4eeeb] p-1 sm:order-none sm:flex sm:w-auto" role="group" aria-label="Fulfilment type">
            <button
              type="button"
              aria-pressed={availability === "delivery"}
              onClick={() => selectAvailability("delivery")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${availability === "delivery" ? "bg-white text-[#b63825] shadow-sm" : "text-[#766a64] hover:text-[#b63825]"}`}
            >
              <Bike size={16} />
              Delivery
            </button>
            <button
              type="button"
              aria-pressed={availability === "pickup"}
              onClick={() => selectAvailability("pickup")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${availability === "pickup" ? "bg-white text-[#b63825] shadow-sm" : "text-[#766a64] hover:text-[#b63825]"}`}
            >
              <PackageCheck size={16} />
              Pickup
            </button>
          </div>

          <Link href="/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-[#f7f1ee] hover:text-[#b63825]">
            <ShoppingBag size={20} />
            {Boolean(cart?.items?.length) && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#c83b2b] px-1 text-[10px] font-black text-white">
                {cart!.items.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Link>

          {!authLoading && (isAuthenticated ? (
            <>
              <Link href="/profile" className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold transition hover:bg-[#f7f1ee]">
                <UserRound size={19} />
                <span className="hidden lg:inline">{user?.firstname || "Profile"}</span>
              </Link>
              <button type="button" aria-label="Sign out" onClick={() => logout()} className="grid h-10 w-10 place-items-center rounded-xl text-stone-500 transition hover:bg-red-50 hover:text-red-700">
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <Link href="/signin" aria-label="Sign in" className="grid h-10 w-10 place-items-center rounded-xl bg-[#c83b2b] text-sm font-bold text-white transition hover:bg-[#aa3022] sm:w-auto sm:px-4">
              <UserRound size={18} className="sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          ))}

          <LanguageSwitch theme="light" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#c83b2b]">Restaurants near you</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#241f1c] sm:text-5xl">Choose a restaurant</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#70645e] sm:text-base">
            Browse local restaurants, then open a restaurant to explore its complete menu and customize your order.
          </p>
          {deliveryAddress && (
            <div className="mx-auto mt-6 flex w-fit max-w-full items-center gap-2 rounded-full border border-[#e5d7d0] bg-white px-4 py-2 text-sm font-semibold text-[#5f534d] shadow-[0_8px_22px_rgba(55,35,27,0.06)]">
              <MapPin size={16} className="shrink-0 text-[#c83b2b]" />
              <span className="truncate">{availability === "delivery" ? "Delivering" : "Pickup"} near {deliveryAddress}</span>
              <button
                type="button"
                onClick={() => {
                  setChangingLocation(true);
                  setLocationSearch("");
                  window.requestAnimationFrame(() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  });
                }}
                className="ml-1 shrink-0 text-[#b63825] hover:underline"
              >
                Change location
              </button>
            </div>
          )}
        </section>

        <section className="mx-auto mt-9 w-full max-w-[940px] rounded-[24px] border border-[#eadfd9] bg-white p-4 shadow-[0_18px_50px_rgba(55,35,27,0.08)] sm:p-5">
          <div className="relative">
            <label className="flex h-12 items-center gap-3 rounded-[16px] border border-[#e0d9d5] bg-white px-4 transition focus-within:border-[#c83b2b] focus-within:ring-4 focus-within:ring-[#c83b2b]/10">
              {changingLocation ? <MapPin size={20} className="text-[#c83b2b]" /> : <Search size={20} className="text-[#e34b3d]" />}
              <input
                ref={searchInputRef}
                type="search"
                value={changingLocation ? locationSearch : search}
                onChange={(event) => changingLocation ? setLocationSearch(event.target.value) : setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && changingLocation) {
                    setChangingLocation(false);
                    setLocationSearch("");
                  }
                }}
                placeholder={changingLocation ? "Enter and select a new location" : "Search restaurants or cuisines"}
                autoComplete={changingLocation ? "street-address" : "off"}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-400"
              />
              {changingLocation && locationSuggestionsLoading && <LoaderCircle size={18} className="animate-spin text-[#c83b2b]" />}
              {(changingLocation || search) && (
                <button
                  type="button"
                  onClick={() => {
                    if (changingLocation) {
                      setChangingLocation(false);
                      setLocationSearch("");
                    } else {
                      setSearch("");
                    }
                  }}
                  aria-label={changingLocation ? "Cancel changing location" : "Clear search"}
                className="rounded-lg p-1 text-stone-400 hover:bg-white"
              >
                <X size={17} />
              </button>
            )}
            </label>

            {changingLocation && (
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={currentLocationLoading}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#fff1ed] px-4 text-sm font-bold text-[#b63825] transition hover:bg-[#ffe5de] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {currentLocationLoading ? <LoaderCircle size={17} className="animate-spin" /> : <MapPin size={17} />}
                Use my current location
              </button>
            )}
            {currentLocationError && <p role="alert" className="mt-2 text-sm text-red-700">{currentLocationError}</p>}

            {changingLocation && debouncedLocationSearch.trim().length >= 3 && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[#e4d9d3] bg-white p-2 shadow-2xl">
                {locationSuggestions.length > 0 ? locationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => {
                      setDeliveryAddress(suggestion.description);
                      setDeliveryLat(null);
                      setDeliveryLng(null);
                      sessionStorage.setItem("deliveryAddress", suggestion.description);
                      sessionStorage.removeItem("deliveryLocationLat");
                      sessionStorage.removeItem("deliveryLocationLng");
                      const url = new URL(window.location.href);
                      url.searchParams.set("address", suggestion.description);
                      url.searchParams.delete("lat");
                      url.searchParams.delete("lng");
                      window.history.replaceState(null, "", url.toString());
                      setChangingLocation(false);
                      setLocationSearch("");
                      setSearch("");
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[#fff1ed]"
                  >
                    <MapPin size={17} className="mt-0.5 shrink-0 text-[#c83b2b]" />
                    <span className="flex-1 leading-5">{suggestion.description}</span>
                    {deliveryAddress === suggestion.description && <Check size={16} className="mt-0.5 text-emerald-600" />}
                  </button>
                )) : !locationSuggestionsLoading ? (
                  <p className="px-3 py-4 text-sm text-stone-500">No matching addresses found.</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="scrollbar-hide flex items-center gap-3 overflow-x-auto pb-1">
              {quickFilters.map((option) => {
                const isActive =
                  option.value === "open"
                    ? !showClosed
                    : option.value === "rating"
                        ? highlight === "rating"
                        : highlight === "nowaste";

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      if (option.value === "open") {
                        setShowClosed((current) => !current);
                      } else if (option.value === "rating") {
                        setHighlight((current) => current === "rating" ? "all" : "rating");
                      } else {
                        setHighlight((current) => current === "nowaste" ? "all" : "nowaste");
                      }
                    }}
                    className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-xs font-bold transition ${
                      isActive
                        ? "border-[#d9cec8] bg-[#f8f5f2] text-[#241f1c] shadow-sm"
                        : "border-[#e4dad4] bg-white text-[#665b55] hover:border-[#c83b2b] hover:text-[#241f1c]"
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                );
              })}

            </div>
          </div>
        </section>

        <section className="mt-7" aria-label="Restaurant categories">
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 lg:justify-center">
            <button type="button" onClick={() => setCategory(null)} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${category === null ? "bg-[#241b18] text-white shadow-sm" : "border border-[#e3d8d2] bg-white text-[#665b55] hover:border-[#c83b2b]"}`}>All cuisines</button>
            {!categoriesLoading && categories?.slice(0, showAllCategories ? undefined : 7).map((item) => (
              <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition ${category === item.id ? "bg-[#c83b2b] text-white shadow-sm" : "border border-[#e3d8d2] bg-white text-[#665b55] hover:border-[#c83b2b]"}`}>
                {item.icon && (
                  <SafeImage
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    unoptimized
                    fallbackSrc="/images/Food.png"
                    className="h-5 w-5 shrink-0 object-contain"
                    fallbackClassName="object-contain"
                  />
                )}
                <span>{item.name}</span>
              </button>
            ))}
            <button type="button" onClick={() => setShowAllCategories((current) => !current)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e3d8d2] bg-white px-5 py-2.5 text-xs font-bold text-[#665b55] transition hover:border-[#c83b2b]">
              {showAllCategories ? "Less" : "More"} <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>

          <div className="mt-9 flex items-end justify-between border-b border-[#e8ded9] pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-[#241f1c]">{filteredRestaurants.length} restaurants</h2>
              <p className="mt-1 text-sm text-stone-500">
                {isLoading
                  ? "Finding restaurants…"
                  : activeHighlightLabel
                    ? `${filteredRestaurants.length} ${activeHighlightLabel.toLowerCase()} found`
                    : `${filteredRestaurants.length} places found`}
              </p>
            </div>
            <p className="hidden text-sm font-semibold text-stone-500 sm:block">Select a card to view its menu</p>
          </div>

        {isLoading && !hasRestaurants ? (
          <div className="grid min-h-72 place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c83b2b] border-t-transparent" /></div>
        ) : error && !hasRestaurants ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <h2 className="text-lg font-black">Restaurants could not be loaded</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6">
              {deliveryAddress
                ? "We could not verify this delivery location. Change it and select a complete address from the suggestions."
                : "Please try again in a moment."}
            </p>
            {deliveryAddress && (
              <button
                type="button"
                onClick={() => {
                  setChangingLocation(true);
                  setLocationSearch("");
                  window.requestAnimationFrame(() => searchInputRef.current?.focus());
                }}
                className="mt-5 rounded-xl bg-[#c83b2b] px-5 py-3 text-sm font-bold text-white"
              >
                Change delivery address
              </button>
            )}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9cbc4] bg-white p-12 text-center">
            <h2 className="text-xl font-black">
              {activeHighlightLabel ? `No ${activeHighlightLabel.toLowerCase()} restaurants found` : "No restaurants found"}
            </h2>
            <p className="mt-2 text-stone-500">
              {activeHighlightLabel
                ? "Try another highlight filter or clear filters to see all restaurants."
                : "Try changing your search or filters."}
            </p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#c83b2b] px-5 py-3 text-sm font-bold text-white">Show all restaurants</button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => {
              const image = restaurant.images?.[0]?.image || "/images/logo.png";
              const restaurantDiscount = restaurant.discounts?.find((discount) =>
                discount.active && (discount.price_reduction_percentage || discount.price_reduction_amount),
              );
              return (
                <Link
                  key={restaurant.id}
                  href={`/partners/${restaurant.id}`}
                  aria-label={`View ${restaurant.name} restaurant and menu`}
                  className="group overflow-hidden rounded-[22px] border border-[#e8ddd7] bg-white shadow-[0_12px_35px_rgba(55,35,27,0.06)] transition duration-500 hover:-translate-y-2 hover:border-[#dca99d] hover:shadow-[0_25px_60px_rgba(75,42,30,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c83b2b]/25"
                >
                  <div className="relative aspect-[16/10] isolate overflow-hidden bg-[#f4eeeb]">
                    <SafeImage src={image} alt={restaurant.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" fallbackClassName="object-contain bg-[#fff8f5] p-12" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black shadow-sm backdrop-blur ${restaurant.open ? "bg-emerald-500 text-white" : "bg-white/90 text-stone-700"}`}>
                      {restaurant.open ? "Open now" : "Closed"}
                    </span>
                    {restaurant.no_waste && <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-700 backdrop-blur">No Waste</span>}
                    {restaurantDiscount && (
                      <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#c83b2b] px-3 py-1.5 text-xs font-black text-white shadow-lg">
                        <Tag size={13} /> {formatDiscount(restaurantDiscount)}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black tracking-[-0.025em] group-hover:text-[#b63825]">{restaurant.name}</h3>
                        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-stone-500">{restaurant.description || "Open the restaurant to explore its menu."}</p>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0eb] text-[#b63825] transition group-hover:translate-x-1 group-hover:bg-[#c83b2b] group-hover:text-white"><ArrowRight size={18} /></span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#eee6e2] pt-4 text-sm">
                      <span className="flex items-center gap-1 font-black"><Star size={15} className="fill-amber-400 text-amber-400" />{Number(restaurant.rating ?? 0).toFixed(1)}</span>
                      <span className="text-stone-500">Min. {Number(restaurant.min_amount ?? 0).toFixed(2)} CHF</span>
                      <span className="ml-auto flex items-center gap-1 font-bold text-[#b63825]"><MapPin size={14} /> View menu</span>
                    </div>
                    {!restaurant.open && <ClosedRestaurantHours restaurantId={restaurant.id} />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function ClosedRestaurantHours({ restaurantId }: { restaurantId: number }) {
  // The list endpoint does not currently include schedules, while the detail
  // endpoint does. React Query caches this for the subsequent detail visit.
  const { data, isLoading } = useRestaurantDetail(restaurantId);
  const todayHours = getTodayOpeningHours(data?.openings);

  return (
    <p className="mt-3 flex min-h-4 items-center gap-1.5 text-xs font-bold text-[#756963]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c83b2b]" />
      {isLoading ? "Checking today’s hours…" : todayHours ?? "Hours unavailable"}
    </p>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#fbfaf8]"><span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c83b2b] border-t-transparent" /></div>}>
      <RestaurantListPage />
    </Suspense>
  );
}
