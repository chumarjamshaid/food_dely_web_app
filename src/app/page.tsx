"use client";

import { useAddressAutocomplete, useAuth, useLogout } from "@/lib/api";
import { ArrowRight, Check, Clock3, LoaderCircle, MapPin, ShoppingBag, Smartphone, Store, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";
import { getAddressForCoordinates, getBrowserLocation, isCurrentLocationPlaceholder } from "@/lib/browser-location";

const heroImages = [
  "/images/Dashboard-1.png",
  "/images/Dashboard-2.png",
  "/images/pizza-1.png",
];

const cuisines = [
  { name: "Pizza", image: "/images/pizza.png" },
  { name: "Sushi", image: "/images/sushi.png" },
  { name: "Thai", image: "/images/thai.png" },
  { name: "Burgers", image: "/images/burger.png" },
  { name: "Desserts", image: "/images/desert-1.png" },
];

export default function Home() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const benefits = [
    { icon: Clock3, title: fr ? "Commande rapide" : "Quick ordering", copy: fr ? "Trouvez vos adresses préférées et commandez en quelques clics." : "Find nearby favorites and order in a few taps." },
    { icon: ShoppingBag, title: fr ? "Livraison ou à emporter" : "Delivery or pickup", copy: fr ? "Choisissez l’option qui convient le mieux à votre journée." : "Choose the option that works best for your day." },
    { icon: UtensilsCrossed, title: fr ? "Découverte locale" : "Local discovery", copy: fr ? "Découvrez les restaurants et les plats de votre quartier." : "Explore restaurants and dishes around your neighborhood." },
  ];
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const logout = useLogout();
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [debouncedAddress, setDebouncedAddress] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [heroImage, setHeroImage] = useState(0);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => setAuthReady(true), []);

  useEffect(() => {
    const shouldFocusAddress =
      window.location.hash === "#delivery-address" ||
      sessionStorage.getItem("focusDeliveryAddress") === "true";
    if (!shouldFocusAddress) return;

    sessionStorage.removeItem("focusDeliveryAddress");

    const storedAddress = sessionStorage.getItem("deliveryAddress") ?? "";
    const storedLat = Number(sessionStorage.getItem("deliveryLocationLat"));
    const storedLng = Number(sessionStorage.getItem("deliveryLocationLng"));
    const hasStoredCoords = Number.isFinite(storedLat) && Number.isFinite(storedLng);

    setAddress(isCurrentLocationPlaceholder(storedAddress) ? "" : storedAddress);
    setSelectedAddress("");
    setSelectedCoords(null);
    setSuggestionsOpen(true);

    if (isCurrentLocationPlaceholder(storedAddress) && hasStoredCoords) {
      setLocationLoading(true);
      void getAddressForCoordinates(
        { lat: storedLat, lng: storedLng },
        document.documentElement.lang === "fr" ? "fr" : "en",
      )
        .then((detectedAddress) => {
          setAddress(detectedAddress);
          setSelectedAddress(detectedAddress);
          setSelectedCoords({ lat: storedLat, lng: storedLng });
          sessionStorage.setItem("deliveryAddress", detectedAddress);
          setSuggestionsOpen(false);
        })
        .catch((error: unknown) => {
          setLocationError(error instanceof Error ? error.message : "We couldn’t determine your address. Please enter it manually.");
        })
        .finally(() => setLocationLoading(false));
    }

    window.requestAnimationFrame(() => {
      addressInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      addressInputRef.current?.focus({ preventScroll: true });
      addressInputRef.current?.select();
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroImage((current) => (current + 1) % heroImages.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedAddress(address), 300);
    return () => window.clearTimeout(timer);
  }, [address]);

  const { data: addressSuggestions = [], isFetching: suggestionsLoading } =
    useAddressAutocomplete(debouncedAddress);

  const startOrder = () => {
    const cleanAddress = selectedAddress.trim();
    if (!cleanAddress) {
      setAddressError(fr ? "Sélectionnez une adresse complète parmi les suggestions." : "Select a complete address from the suggestions.");
      setSuggestionsOpen(true);
      return;
    }
    setAddressError("");
    const params = new URLSearchParams({ address: cleanAddress });
    if (selectedCoords) {
      params.set("lat", String(selectedCoords.lat));
      params.set("lng", String(selectedCoords.lng));
    }
    router.push(`/partners?${params.toString()}`);
  };

  const useCurrentLocation = async () => {
    setLocationError("");
    setAddressError("");

    setLocationLoading(true);
    try {
        const coords = await getBrowserLocation();
        const label = await getAddressForCoordinates(coords, fr ? "fr" : "en");

        setSelectedCoords(coords);
        setAddress(label);
        setSelectedAddress(label);
        sessionStorage.setItem("deliveryAddress", label);
        sessionStorage.setItem("deliveryLocationLat", String(coords.lat));
        sessionStorage.setItem("deliveryLocationLng", String(coords.lng));
        setSuggestionsOpen(false);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "We couldn’t access your location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <main className="overflow-hidden bg-[#f7f3ed] text-stone-950">
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#181310] text-white [clip-path:inset(0)] [contain:paint] lg:h-[100dvh] lg:min-h-0">
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#181310] [clip-path:inset(0)]" aria-hidden="true">
          {heroImages.map((image, index) => (
            <Image
              key={image}
              src={image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover object-center transition-[opacity,transform] duration-[1800ms] ease-out motion-reduce:transition-none ${
                heroImage === index ? "scale-105 opacity-50" : "scale-100 opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(24,19,16,.98)_0%,rgba(24,19,16,.78)_48%,rgba(24,19,16,.38)_100%)]" />
          <div className="absolute inset-0 z-20 bg-[linear-gradient(0deg,#181310_0%,transparent_38%)]" />
        </div>
        <div className="home-glow absolute -left-32 top-32 z-[1] h-96 w-96 rounded-full bg-[#c83b2b]/20 blur-3xl motion-reduce:animate-none" />
        <div className="home-float absolute right-[8%] top-[18%] z-[1] hidden h-20 w-20 rounded-3xl border border-white/10 bg-white/5 backdrop-blur lg:block motion-reduce:animate-none" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8 lg:px-10 lg:py-7">
          <Link href="/" className="group font-serif text-2xl font-black tracking-tight sm:text-3xl">
            <span className="text-[#e14a39]">FOOD</span>DELY
            <span className="mt-1 block h-0.5 w-0 bg-[#e14a39] transition-all duration-300 group-hover:w-full" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
          {authReady && !isLoading ? (
            isAuthenticated ? (
              <nav className="flex items-center gap-3 text-sm font-semibold">
                <Link href="/orders" className="hidden rounded-full px-4 py-2 text-stone-200 transition hover:bg-white/10 sm:block">{fr ? "Commandes" : "Orders"}</Link>
                <Link href="/profile" className="rounded-full px-4 py-2 text-stone-200 transition hover:bg-white/10">{user?.firstname || "Profile"}</Link>
                <button onClick={() => logout()} className="rounded-full border border-white/20 px-4 py-2 transition hover:bg-white/10">{fr ? "Déconnexion" : "Sign out"}</button>
              </nav>
            ) : (
              <nav className="flex items-center gap-2 sm:gap-3">
                <Link href="/signin" className="rounded-full px-3 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-white/10 sm:px-5">{fr ? "Connexion" : "Sign in"}</Link>
                <Link href="/signup" className="hidden rounded-full bg-[#c83b2b] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#af3023] hover:shadow-xl hover:shadow-[#c83b2b]/20 sm:block sm:px-6">{fr ? "Créer un compte" : "Create account"}</Link>
              </nav>
            )
          ) : null}
          <LanguageSwitch />
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-20 lg:pt-14">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff9b8f] backdrop-blur">
              <MapPin size={14} aria-hidden="true" />
              {fr ? "Cuisine locale, livrée" : "Local food, delivered"}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {fr ? "Votre quartier a meilleur goût" : "Your neighborhood tastes"}{" "}
              <span className="relative whitespace-nowrap text-[#ff7868]">
                {fr ? "avec FoodDely." : "better"}
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[#ff7868]/40" />
              </span>{" "}
              {!fr && "with FoodDely."}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
              {fr ? "Découvrez les restaurants locaux, commandez ce que vous aimez et choisissez la livraison ou le retrait—le tout en toute simplicité." : "Discover local restaurants, order the food you love, and choose delivery or pickup—all in one simple experience."}
            </p>

            <div id="delivery-address" className="relative mt-9 max-w-2xl scroll-mt-8">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/25 backdrop-blur-md transition duration-300 focus-within:border-[#ff7868]/60 focus-within:bg-white/[0.14] focus-within:shadow-[#c83b2b]/10 sm:flex sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <MapPin className="shrink-0 text-[#ff7868]" size={21} aria-hidden="true" />
                <span className="sr-only">{fr ? "Adresse de livraison" : "Delivery address"}</span>
                <input
                  ref={addressInputRef}
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setSelectedAddress("");
                    setSelectedCoords(null);
                    setSuggestionsOpen(true);
                    if (addressError) setAddressError("");
                    if (locationError) setLocationError("");
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSuggestionsOpen(false);
                  }}
                  placeholder={fr ? "Saisissez votre adresse de livraison" : "Enter your delivery address"}
                  autoComplete="street-address"
                  className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-stone-400"
                />
              </label>
              {suggestionsLoading && <LoaderCircle size={19} className="mr-2 shrink-0 animate-spin text-[#ff9b8f]" aria-label="Loading address suggestions" />}
              <div className="mt-2 flex w-full gap-2 sm:mt-0 sm:w-auto">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition duration-300 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {locationLoading ? (
                    <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <MapPin size={17} aria-hidden="true" />
                  )}
                  {fr ? "Position actuelle" : "Current location"}
                </button>
                <button onClick={startOrder} className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#c83b2b] px-6 text-sm font-bold text-white transition duration-300 hover:bg-[#af3023] hover:shadow-lg hover:shadow-[#c83b2b]/25 sm:flex-none">
                  {fr ? "Trouver un repas" : "Find food"} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </div>
              </div>
              {locationError ? <p role="alert" className="mt-3 text-sm text-[#ff9b8f]">{locationError}</p> : null}
              {suggestionsOpen && debouncedAddress.trim().length >= 3 && (
                <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 text-stone-900 shadow-2xl">
                  {addressSuggestions.length > 0 ? addressSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => {
                        setAddress(suggestion.description);
                        setSelectedAddress(suggestion.description);
                        setSelectedCoords(null);
                        setSuggestionsOpen(false);
                        setAddressError("");
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[#fff1ed]"
                    >
                      <MapPin size={17} className="mt-0.5 shrink-0 text-[#c83b2b]" />
                      <span className="flex-1 leading-5">{suggestion.description}</span>
                      {selectedAddress === suggestion.description && <Check size={16} className="mt-0.5 text-emerald-600" />}
                    </button>
                  )) : !suggestionsLoading ? (
                    <p className="px-3 py-4 text-sm text-stone-500">{fr ? "Aucune adresse correspondante." : "No matching addresses found."}</p>
                  ) : null}
                </div>
              )}
            </div>
            {addressError ? <p role="alert" className="mt-3 text-sm text-[#ff9b8f]">{addressError}</p> : null}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-stone-400">
              <span>{fr ? "Aucun frais caché" : "No hidden fees at checkout"}</span>
              <span className="hidden h-1 w-1 rounded-full bg-stone-600 sm:block" />
              <span>{fr ? "Livraison et retrait" : "Delivery and pickup"}</span>
              <span className="hidden h-1 w-1 rounded-full bg-stone-600 sm:block" />
              <span>{fr ? "Restaurants locaux" : "Local restaurants"}</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="group relative ml-auto aspect-[4/5] max-w-[430px] overflow-hidden rounded-[36px] border border-white/15 bg-stone-900 shadow-2xl shadow-black/40">
              <Image src="/images/front-view-female-courier-red-uniform-cape-holding-delivery-bowl-light-pink-wall-service-uniform-delivery-worker-work.png" alt="FoodDely delivery partner" fill sizes="430px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30" />
            </div>
            <div className="home-float absolute -bottom-6 -left-8 max-w-[250px] rounded-2xl border border-white/15 bg-white/95 p-5 text-stone-950 shadow-xl motion-reduce:animate-none">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c83b2b]">{fr ? "Livré localement" : "Delivered locally"}</p>
              <p className="mt-2 text-lg font-bold">{fr ? "De la cuisine à votre porte." : "From the kitchen to your door."}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          {heroImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setHeroImage(index)}
              aria-label={`Show background ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${heroImage === index ? "w-10 bg-white" : "w-4 bg-white/35 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c83b2b]">{fr ? "Pensé pour la vraie vie" : "Made for real life"}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{fr ? "De l’envie au paiement, tout simplement." : "From craving to checkout, beautifully simple."}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(45,32,24,0.06)] transition duration-500 hover:-translate-y-2 hover:border-[#c83b2b]/20 hover:shadow-[0_28px_70px_rgba(90,45,30,0.13)] sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c83b2b]/10 text-[#c83b2b] transition duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-[#c83b2b] group-hover:text-white">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-xl font-bold tracking-tight">{title}</h2>
              <p className="mt-2 leading-7 text-stone-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c83b2b]">{fr ? "De quoi avez-vous envie ?" : "What are you craving?"}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{fr ? "Un monde de saveurs, tout près." : "A world of flavor, nearby."}</h2>
            </div>
            <Link href="/partners" className="group inline-flex items-center gap-2 text-sm font-bold text-[#b93425]">
              {fr ? "Explorer les restaurants" : "Explore restaurants"} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cuisines.map((cuisine) => (
              <Link key={cuisine.name} href="/partners" className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-900">
                <Image src={cuisine.image} alt={cuisine.name} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent transition group-hover:from-black/70" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-white">
                  <span className="font-bold">{cuisine.name}</span>
                  <span className="grid h-8 w-8 translate-y-2 place-items-center rounded-full bg-white text-stone-950 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:px-10">
        <article className="group relative overflow-hidden rounded-[32px] bg-[#c83b2b] p-7 text-white transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#c83b2b]/20 sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
          <Store size={34} aria-hidden="true" />
          <h2 className="mt-10 max-w-md text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{fr ? "Développez votre restaurant avec FoodDely." : "Grow your restaurant with FoodDely."}</h2>
          <p className="mt-4 max-w-md leading-7 text-red-100">{fr ? "Touchez plus de clients locaux et gérez vos commandes depuis un espace partenaire dédié." : "Reach more local customers and manage orders from a focused partner workspace."}</p>
          <Link href="/business-signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#a92f22]">
            {fr ? "Devenir partenaire" : "Become a partner"} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </article>

        <article className="group relative overflow-hidden rounded-[32px] bg-[#1d5a4f] p-7 text-white transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#1d5a4f]/20 sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
          <Smartphone size={34} aria-hidden="true" />
          <h2 className="mt-10 max-w-md text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{fr ? "Tout ce qu’il faut pour mieux commander." : "Everything you need for a better order."}</h2>
          <p className="mt-4 max-w-md leading-7 text-emerald-100">{fr ? "Enregistrez vos adresses, suivez vos commandes et retrouvez vos bonnes adresses." : "Save addresses, follow your orders, and return to the places you love."}</p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#174a41]">
            {fr ? "Créer un compte" : "Create an account"} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <footer className="bg-[#171310] text-stone-300">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-8 sm:pt-16 lg:px-10">
          <div className="grid gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_.7fr_.7fr_.9fr]">
            <div>
              <Link href="/" className="font-serif text-3xl font-black tracking-tight text-white"><span className="text-[#e14a39]">FOOD</span>DELY</Link>
              <p className="mt-5 max-w-sm text-sm leading-7 text-stone-400">{fr ? "Des restaurants locaux, des commandes faciles et des plats qui donnent envie." : "Local restaurants, effortless ordering, and food worth looking forward to."}</p>
              <Link href="/partners" className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#ff8475]">
                {fr ? "Commander" : "Start an order"} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{fr ? "Découvrir" : "Discover"}</h2>
              <nav className="mt-5 grid gap-3 text-sm text-stone-400">
                <Link href="/partners" className="transition hover:translate-x-1 hover:text-white">Restaurants</Link>
                <Link href="/anti-waste" className="transition hover:translate-x-1 hover:text-white">{fr ? "Offres anti-gaspillage" : "No-waste offers"}</Link>
                <Link href="/signup" className="transition hover:translate-x-1 hover:text-white">{fr ? "Créer un compte" : "Create account"}</Link>
              </nav>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{fr ? "Pour les partenaires" : "For partners"}</h2>
              <nav className="mt-5 grid gap-3 text-sm text-stone-400">
                <Link href="/business-signup" className="transition hover:translate-x-1 hover:text-white">{fr ? "Rejoindre FoodDely" : "Join FoodDely"}</Link>
                <Link href="/signin" className="transition hover:translate-x-1 hover:text-white">{fr ? "Connexion partenaire" : "Partner sign in"}</Link>
                <Link href="/learn-more" className="transition hover:translate-x-1 hover:text-white">{fr ? "Comment ça marche" : "How it works"}</Link>
              </nav>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{fr ? "Actualités FoodDely" : "FoodDely updates"}</h2>
              <p className="mt-5 text-sm leading-6 text-stone-400">{fr ? "Nouveaux restaurants, sélections de saison et offres locales." : "New restaurants, seasonal picks, and local offers."}</p>
              <Link href="/signup" className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition hover:border-[#ff8475]/50 hover:bg-white/5">
                {fr ? "Rejoindre la communauté" : "Join the community"}
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-7 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} FoodDely. {fr ? "Pensé pour les saveurs locales." : "Made for local flavor."}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/terms" className="transition hover:text-white">{fr ? "Conditions" : "Terms"}</Link>
              <Link href="/privacy" className="transition hover:text-white">{fr ? "Confidentialité" : "Privacy"}</Link>
              <Link href="/signin" className="transition hover:text-white">{fr ? "Compte" : "Account"}</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
