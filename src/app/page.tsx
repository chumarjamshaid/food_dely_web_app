"use client";
import PartnerCard from "@/components/PartnerCard";
import { useAuth, useLogout } from "@/lib/api";
import "@fontsource/abril-fatface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const aboutUsRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const logout = useLogout();

  const images = useMemo(
    () => ["/images/Dashboard-1.png", "/images/Dashboard-2.png"],
    []
  );

  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Failed to preload images:", error);
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, [images]);

  useEffect(() => {
    if (!imagesLoaded) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length, imagesLoaded]);

  // Basic address validation function
  const validateAddress = (address: string): boolean => {
    // Remove extra whitespace and check minimum length
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 10) {
      setAddressError(
        "Please enter a complete address (minimum 10 characters)"
      );
      return false;
    }

    // Check for basic address components
    const hasStreetNumber = /\d/.test(trimmedAddress);
    const hasStreetName = /[a-zA-Z]/.test(trimmedAddress);
    const hasCityOrZip =
      /(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|plaza|pl|circle|cir|terrace|ter|place|pl|highway|hwy|freeway|fwy|expressway|expy|route|rt|county|cnty|city|town|village|neighborhood|district|area|zone|postal|zip|postcode)/i.test(
        trimmedAddress
      );

    if (!hasStreetNumber || !hasStreetName) {
      setAddressError(
        "Please enter a valid street address with number and street name"
      );
      return false;
    }

    if (!hasCityOrZip) {
      setAddressError("Please include city, state, or zip code");
      return false;
    }

    setAddressError("");
    return true;
  };

  const handleOrderNow = async () => {
    if (!validateAddress(address)) {
      return;
    }

    setIsOrdering(true);

    // Simulate API call to verify address
    try {
      // In a real implementation, you would call a geocoding service here
      // For now, we'll simulate a successful validation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to partners page with address
      window.location.href = `/partners?address=${encodeURIComponent(address)}`;
    } catch {
      setAddressError("Unable to verify address. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  const scrollToAboutUs = () => {
    aboutUsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={`Background ${index + 1}`}
            className={`w-full h-full object-cover object-center transition-opacity duration-1500 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            priority={index === 0}
            quality={90}
            fill
            sizes="100vw"
          />
        ))}
        <div className="absolute inset-0 bg-black opacity-70" />
      </div>
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header className="relative flex items-center justify-between px-8 py-8 min-h-[64px]">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[36px] font-extrabold select-none pointer-events-none mt-16 md:mt-0"
            style={{ fontFamily: "Abril Fatface, serif" }}
          >
            <span className="text-red-600">FOOD</span>
            <span className="text-white">DELY</span>
          </div>
          <div className="sm:ml-auto ml-0 flex items-center gap-4 z-10">
            {!authLoading && (
              <>
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/signin"
                      className="text-red-600 text-[18px] hover:text-red-500 underline mr-10"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-[#CD3625] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-red-700 transition"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/orders"
                      className="text-white text-[18px] hover:text-gray-300"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/profile"
                      className="text-white text-[18px] hover:text-gray-300"
                    >
                      {user?.firstname || "Profile"}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = "/";
                      }}
                      className="bg-gray-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-600 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </header>
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col mt-16 md:mt-24">
          <div className="flex flex-col items-center justify-center flex-1">
            <h1
              className="text-[36px] font-bold text-white mb-5 md:-mt-32 -mt-4"
              style={{ fontFamily: "Abril Fatface, serif" }}
            >
              Order Your Pleasure
            </h1>
            <div className="flex flex-col items-center gap-4 w-full max-w-lg">
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (addressError) setAddressError("");
                  }}
                  className="w-full px-6 py-4 rounded-full bg-black bg-opacity-40 text-white placeholder-gray-300 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {addressError && (
                  <p className="text-red-400 text-sm mt-2 ml-4">
                    {addressError}
                  </p>
                )}
              </div>
              <button
                onClick={handleOrderNow}
                disabled={isOrdering || !address.trim()}
                className="flex items-center justify-center gap-2 bg-[#CD3625] mt-4 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-600 transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOrdering ? "Verifying..." : "Order Now"}
                <span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              <button
                onClick={scrollToAboutUs}
                className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-red-600 transition w-full md:w-auto mt-4"
              >
                About Us
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:gap-40 gap-28 md:mt-32 mt-16 py-10 md:pt-0">
              <PartnerCard
                image="/images/handshake-businessmen.png"
                title="Become a Partner"
                description="Grow your business and reach new customers by partnering with us."
                buttonText="Sign up your store"
                link="/business-signup"
              />
              <PartnerCard
                image="/images/towfiqu-barbhuiya-0ZUoBtLw3y4-unsplash.png"
                title="Get the best experience"
                description="Experience the best your neighborhood has to offer, all in one app."
                buttonText="Get the app"
              />
            </div>

            {/* About Us Section */}
            <div ref={aboutUsRef} className="w-full mt-16 md:mt-24">
              <div className="rounded-3xl p-6 md:p-10 lg:p-16 w-full flex flex-col gap-20 md:gap-40">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-16 w-full">
                  <div className="flex-1 max-w-xl text-center md:text-left">
                    <h2
                      className="mb-4 md:mb-6 leading-[1.1] px-2 md:px-4"
                      style={{
                        fontFamily: `'Playfair Display', serif`,
                        fontWeight: 700,
                        fontSize: "clamp(32px, 8vw, 60px)",
                        lineHeight: 1.1,
                      }}
                    >
                      <span className="text-yellow-500">Tell</span>{" "}
                      <span className="text-white">us</span>{" "}
                      <span className="text-red-600">where</span>{" "}
                      <span className="text-white">you are</span>
                    </h2>
                    <p className="text-gray-400 text-base md:text-[24px] px-2 md:px-4 mb-6 md:mb-8 font-normal">
                      Tell us where you are, and we&apos;ll bring delicious
                      meals straight to you. Your location helps us serve you
                      better and faster!
                    </p>
                    <button className="bg-[#CD3625] hover:bg-[#b83213] text-white font-semibold rounded-full px-8 md:px-24 py-2 md:py-3 text-lg md:text-2xl transition shadow-none">
                      Order Now
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative min-w-[200px] md:min-w-[260px] min-h-[200px] md:min-h-[260px]">
                    <div className="rounded-full overflow-hidden w-[280px] h-[280px] md:w-[500px] md:h-[500px] bg-[#E9E0DA] relative z-10 flex items-center justify-center">
                      <Image
                        src="/images/front-view-female-courier-red-uniform-cape-holding-delivery-bowl-trying-hear-light-pink-wall-service-uniform-delivery-worker.png"
                        alt="feature"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 left-8 md:top-12 md:left-16 bg-[#F2B530] z-20">
                      <Image
                        src="/images/icon-clock.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 right-8 md:top-12 md:right-16 bg-[#216659] z-20">
                      <Image
                        src="/images/icon-bag.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg bottom-0 left-16 md:bottom-0 md:left-28 bg-[#CD3625] z-20">
                      <Image
                        src="/images/icon-fork.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#CD3625] rounded-full top-8 left-2 md:top-16 md:left-4 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#F2B530] rounded-full top-6 right-4 md:top-12 md:right-8 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#216659] rounded-full bottom-0 left-8 md:bottom-0 md:left-16 z-30" />
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row-reverse items-center justify-center gap-6 md:gap-16 w-full">
                  <div className="flex-1 max-w-xl text-center md:text-left">
                    <h2
                      className="mb-4 md:mb-6 leading-[1.1] px-2 md:px-4"
                      style={{
                        fontFamily: `'Playfair Display', serif`,
                        fontWeight: 700,
                        fontSize: "clamp(32px, 8vw, 60px)",
                        lineHeight: 1.1,
                      }}
                    >
                      <span className="text-yellow-500">Find</span>{" "}
                      <span className="text-white">your</span>{" "}
                      <span className="text-red-600">pleasure</span>
                    </h2>
                    <p className="text-gray-400 text-base md:text-[24px] px-2 md:px-4 mb-6 md:mb-8 font-normal">
                      Discover meals that satisfy your cravings and bring you
                      joy. Explore a variety of delicious options tailored to
                      your taste!
                    </p>
                    <button className="bg-[#CD3625] hover:bg-[#b83213] text-white font-semibold rounded-full px-8 md:px-24 py-2 md:py-3 text-lg md:text-2xl transition shadow-none">
                      Order Now
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative min-w-[200px] md:min-w-[260px] min-h-[200px] md:min-h-[260px]">
                    <div className="rounded-full overflow-hidden w-[280px] h-[280px] md:w-[500px] md:h-[500px] bg-[#E9E0DA] relative z-10 flex items-center justify-center">
                      <Image
                        src="/images/low-angle-teenage-girl-eating-donut.png"
                        alt="feature"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 left-8 md:top-12 md:left-16 bg-[#F2B530] z-20">
                      <Image
                        src="/images/icon-clock.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 right-8 md:top-12 md:right-16 bg-[#216659] z-20">
                      <Image
                        src="/images/icon-bag.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg bottom-0 left-16 md:bottom-0 md:left-28 bg-[#CD3625] z-20">
                      <Image
                        src="/images/icon-fork.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#CD3625] rounded-full top-8 left-2 md:top-16 md:left-4 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#F2B530] rounded-full top-6 right-4 md:top-12 md:right-8 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#216659] rounded-full bottom-0 left-8 md:bottom-0 md:left-16 z-30" />
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-16 w-full">
                  <div className="flex-1 max-w-xl text-center md:text-left">
                    <h2
                      className="mb-4 md:mb-6 leading-[1.1] px-2 md:px-4"
                      style={{
                        fontFamily: `'Playfair Display', serif`,
                        fontWeight: 700,
                        fontSize: "clamp(32px, 8vw, 60px)",
                        lineHeight: 1.1,
                      }}
                    >
                      <span className="text-yellow-500">Order</span>{" "}
                      <span className="text-white">for</span>{" "}
                      <span className="text-red-600">delivery</span>{" "}
                      <span className="text-white">or takeaway</span>
                    </h2>
                    <p className="text-gray-400 text-base md:text-[24px] px-2 md:px-4 mb-6 md:mb-8 font-normal">
                      Enjoy your favorite meals delivered straight to your door
                      or ready for pickup. Choose between hassle-free delivery
                      or quick takeaway at your convenience.
                    </p>
                    <button className="bg-[#CD3625] hover:bg-[#b83213] text-white font-semibold rounded-full px-8 md:px-24 py-2 md:py-3 text-lg md:text-2xl transition shadow-none">
                      Order Now
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative min-w-[200px] md:min-w-[260px] min-h-[200px] md:min-h-[260px]">
                    <div className="rounded-full overflow-hidden w-[280px] h-[280px] md:w-[500px] md:h-[500px] bg-[#E9E0DA] relative z-10 flex items-center justify-center">
                      <Image
                        src="/images/front-view-female-courier-red-uniform-cape-holding-delivery-bowl-light-pink-wall-service-uniform-delivery-worker-work.png"
                        alt="feature"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 left-8 md:top-12 md:left-16 bg-[#F2B530] z-20">
                      <Image
                        src="/images/icon-clock.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg top-6 right-8 md:top-12 md:right-16 bg-[#216659] z-20">
                      <Image
                        src="/images/icon-bag.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg bottom-0 left-16 md:bottom-0 md:left-28 bg-[#CD3625] z-20">
                      <Image
                        src="/images/icon-fork.svg"
                        alt="icon"
                        className="w-8 h-8 md:w-14 md:h-14"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#CD3625] rounded-full top-8 left-2 md:top-16 md:left-4 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#F2B530] rounded-full top-6 right-4 md:top-12 md:right-8 z-30" />
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-[#216659] rounded-full bottom-0 left-8 md:bottom-0 md:left-16 z-30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
