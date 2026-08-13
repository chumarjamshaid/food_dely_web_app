"use client";

import SafeImage from "@/components/SafeImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Check,
  LoaderCircle,
  LogOut,
  MapPin,
  Search,
  ShoppingBag,
  Star,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { getTodayOpeningHours } from "@/lib/opening-hours";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const [availability, setAvailability] = useState("all");
  const [highlight, setHighlight] = useState("all");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [changingLocation, setChangingLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedLocationSearch(locationSearch),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [locationSearch]);

  const { data: locationSuggestions = [], isFetching: locationLoading } =
    useAddressAutocomplete(changingLocation ? debouncedLocationSearch : "");

  useEffect(() => {
    const addressFromUrl = searchParams.get("address")?.trim();
    if (addressFromUrl) {
      setDeliveryAddress(addressFromUrl);
      sessionStorage.setItem("deliveryAddress", addressFromUrl);
      return;
    }

    const storedAddress = sessionStorage.getItem("deliveryAddress")?.trim();
    if (storedAddress) {
      setDeliveryAddress(storedAddress);
      return;
    }

    if (isAuthenticated && addresses?.length) {
      const address = addresses.find((item) => item.default) ?? addresses[0];
      const formattedAddress = `${address.address}, ${address.postal_code} ${address.city}`;
      setDeliveryAddress(formattedAddress);
      sessionStorage.setItem("deliveryAddress", formattedAddress);
    }
  }, [addresses, isAuthenticated, searchParams]);

  const { data: restaurants = [], isLoading, error } = useRestaurants({
    category: category || undefined,
    open: showClosed ? undefined : true,
    delivery: availability === "delivery" ? true : undefined,
    reviews: highlight === "rating" ? 4 : undefined,
    nowaste: highlight === "nowaste" ? true : undefined,
    address: deliveryAddress || undefined,
  });

  const searchTerms = normalizeSearchText(search).split(" ").filter(Boolean);
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

  const clearFilters = () => {
    setSearch("");
    setCategory(null);
    setAvailability("all");
    setHighlight("all");
    setShowClosed(false);
  };

  const hasFilters = Boolean(search || category || availability !== "all" || highlight !== "all" || showClosed);

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <header className="sticky top-0 z-50 border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-8 lg:px-10">
          <Link href="/" className="mr-auto text-[24px] font-black tracking-[-0.04em]">
            <span className="text-[#c83b2b]">FOOD</span>DELY
          </Link>

          <div className="hidden rounded-xl bg-[#f4eeeb] p-1 sm:flex">
            {["delivery", "pickup"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                  deliveryType === type ? "bg-white text-[#b63825] shadow-sm" : "text-[#766b65]"
                }`}
              >
                {type}
              </button>
            ))}
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
            <Link href="/signin" className="rounded-xl bg-[#c83b2b] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#aa3022]">Sign in</Link>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b63825]">Restaurants near you</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Choose a restaurant</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#70645e]">
            Browse local restaurants, then open a restaurant to explore its complete menu and customize your order.
          </p>
          {deliveryAddress && (
            <div className="mx-auto mt-5 flex w-fit max-w-full items-center gap-2 rounded-full border border-[#e5d7d0] bg-white px-4 py-2 text-sm font-bold text-[#5f534d] shadow-sm">
              <MapPin size={16} className="shrink-0 text-[#c83b2b]" />
              <span className="truncate">Delivering near {deliveryAddress}</span>
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

        <section className="mx-auto mt-9 max-w-5xl rounded-[24px] border border-[#eadfd9] bg-white p-4 shadow-[0_16px_45px_rgba(55,35,27,0.07)] sm:p-5">
          <div className="relative">
            <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#ddd3ce] bg-[#fbfaf8] px-4 transition focus-within:border-[#c83b2b] focus-within:ring-4 focus-within:ring-[#c83b2b]/10">
              {changingLocation ? <MapPin size={21} className="text-[#c83b2b]" /> : <Search size={21} className="text-[#c83b2b]" />}
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
                placeholder={changingLocation ? "Enter and select a new delivery address" : "Search restaurants or cuisines"}
                autoComplete={changingLocation ? "street-address" : "off"}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-400"
              />
              {changingLocation && locationLoading && <LoaderCircle size={18} className="animate-spin text-[#c83b2b]" />}
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

            {changingLocation && debouncedLocationSearch.trim().length >= 3 && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[#e4d9d3] bg-white p-2 shadow-2xl">
                {locationSuggestions.length > 0 ? locationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => {
                      setDeliveryAddress(suggestion.description);
                      sessionStorage.setItem("deliveryAddress", suggestion.description);
                      const url = new URL(window.location.href);
                      url.searchParams.set("address", suggestion.description);
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
                )) : !locationLoading ? (
                  <p className="px-3 py-4 text-sm text-stone-500">No matching addresses found.</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-[160px] rounded-xl data-[size=default]:h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All restaurants</SelectItem>
                <SelectItem value="delivery">Offers delivery</SelectItem>
              </SelectContent>
            </Select>
            <Select value={highlight} onValueChange={setHighlight}>
              <SelectTrigger className="w-[160px] rounded-xl data-[size=default]:h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All highlights</SelectItem>
                <SelectItem value="rating">Highly rated</SelectItem>
                <SelectItem value="free-delivery">Free delivery</SelectItem>
                <SelectItem value="nowaste">No Waste</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && <button type="button" onClick={clearFilters} className="h-11 rounded-xl px-4 text-sm font-bold text-[#b63825] hover:bg-[#fff1ed]">Clear filters</button>}
            <label className="ml-auto flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#ded3cd] bg-white px-4 text-sm font-bold text-[#665b55] transition hover:border-[#c83b2b]">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(event) => setShowClosed(event.target.checked)}
                className="h-4 w-4 accent-[#c83b2b]"
              />
              Display closed restaurants
            </label>
          </div>
        </section>

        <section className="mt-7">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 lg:justify-center">
            <button type="button" onClick={() => setCategory(null)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${category === null ? "bg-[#241b18] text-white" : "border border-[#e3d8d2] bg-white text-[#665b55] hover:border-[#c83b2b]"}`}>All cuisines</button>
            {!categoriesLoading && categories?.map((item) => (
              <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${category === item.id ? "bg-[#c83b2b] text-white" : "border border-[#e3d8d2] bg-white text-[#665b55] hover:border-[#c83b2b]"}`}>{item.name}</button>
            ))}
          </div>
        </section>

        <div className="mt-9 flex items-end justify-between border-b border-[#e8ded9] pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.03em]">All restaurants</h2>
            <p className="mt-1 text-sm text-stone-500">{isLoading ? "Finding restaurants…" : `${filteredRestaurants.length} places found`}</p>
          </div>
          <p className="hidden text-sm font-semibold text-stone-500 sm:block">Select a card to view its menu</p>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c83b2b] border-t-transparent" /></div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">Restaurants could not be loaded. Please try again.</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9cbc4] bg-white p-12 text-center">
            <h2 className="text-xl font-black">No restaurants found</h2>
            <p className="mt-2 text-stone-500">Try changing your search or filters.</p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#c83b2b] px-5 py-3 text-sm font-bold text-white">Show all restaurants</button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => {
              const image = restaurant.images?.[0]?.image || "/images/logo.png";
              return (
                <Link
                  key={restaurant.id}
                  href={`/partners/${restaurant.id}`}
                  aria-label={`View ${restaurant.name} restaurant and menu`}
                  className="group overflow-hidden rounded-[24px] border border-[#e8ddd7] bg-white shadow-[0_12px_35px_rgba(55,35,27,0.06)] transition duration-500 hover:-translate-y-2 hover:border-[#dca99d] hover:shadow-[0_25px_60px_rgba(75,42,30,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c83b2b]/25"
                >
                  <div className="relative aspect-[16/10] isolate overflow-hidden bg-[#f4eeeb]">
                    <SafeImage src={image} alt={restaurant.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" fallbackClassName="object-contain bg-[#fff8f5] p-12" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-black shadow-sm backdrop-blur ${restaurant.open ? "bg-emerald-500 text-white" : "bg-white/90 text-stone-700"}`}>
                      {restaurant.open ? "Open now" : "Closed"}
                    </span>
                    {restaurant.no_waste && <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-emerald-700 backdrop-blur">No Waste</span>}
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
