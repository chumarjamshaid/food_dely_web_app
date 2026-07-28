"use client";
import { useLogout, useRestaurantOwnerProfile } from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ManagerNavItem =
  | "Dashboard"
  | "Orders"
  | "Restaurant"
  | "Menu"
  | "Discounts"
  | "Reviews"
  | "Ranking"
  | "Sales";

const NAV_ITEMS: { label: ManagerNavItem; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Orders", href: "/order-list" },
  { label: "Restaurant", href: "/restaurant-settings" },
  { label: "Menu", href: "/manage-menu" },
  { label: "Discounts", href: "/discounts" },
  { label: "Reviews", href: "/customer-reviews" },
  { label: "Ranking", href: "/ranking" },
  { label: "Sales", href: "/sales" },
];

interface Props {
  active?: ManagerNavItem;
}

export default function RestaurantManagerHeader({ active }: Props) {
  const logout = useLogout();
  const router = useRouter();
  const tokenPresent =
    typeof window !== "undefined" ? hasAuthToken() : false;
  const ownerQuery = useRestaurantOwnerProfile(tokenPresent);
  const restaurant = ownerQuery.data;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickAway);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    router.replace("/signin");
  }

  const ownerInitial =
    restaurant?.name?.trim().charAt(0).toUpperCase() ||
    restaurant?.owner_firstname?.trim().charAt(0).toUpperCase() ||
    "R";
  const ownerFullName = [restaurant?.owner_firstname, restaurant?.owner_lastname]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 w-full z-30 bg-white shadow border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-[1400px] mx-auto gap-2 sm:gap-0">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div
            className="text-[20px] sm:text-[24px] lg:text-[36px] font-bold flex items-center justify-center text-center"
            style={{ fontFamily: "Playfair Display" }}
          >
            <span className="text-[#CD3625]">FOOD</span>
            <span className="text-black">DELY</span>
            <span className="text-black font-serif ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">
              Manager
            </span>
          </div>
          <div
            ref={menuRef}
            className="relative flex gap-2 sm:gap-4 mt-2 sm:mt-0"
          >
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 border border-gray-300 rounded-full pl-1.5 pr-3 sm:pr-4 py-1 sm:py-1.5 hover:bg-gray-50 transition"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CD3625] text-white flex items-center justify-center font-semibold text-sm">
                {ownerInitial}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold text-black max-w-[160px] truncate">
                  {restaurant?.name || "Restaurant"}
                </span>
                {ownerFullName && (
                  <span className="text-[11px] text-gray-500 max-w-[160px] truncate">
                    {ownerFullName}
                  </span>
                )}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-40 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-[#CD3625] text-white flex items-center justify-center font-semibold">
                      {ownerInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">
                        {restaurant?.name || "Restaurant"}
                      </p>
                      {ownerFullName && (
                        <p className="text-xs text-gray-600 truncate">
                          {ownerFullName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    {restaurant?.owner_email && (
                      <p className="truncate">{restaurant.owner_email}</p>
                    )}
                    {restaurant?.phone && (
                      <p className="truncate">{restaurant.phone}</p>
                    )}
                    {(restaurant?.address ||
                      restaurant?.city ||
                      restaurant?.postal_code) && (
                      <p className="truncate">
                        {[
                          restaurant?.address,
                          restaurant?.postal_code,
                          restaurant?.city,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/restaurant-settings"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-50"
                  >
                    Restaurant settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center px-8 justify-between gap-4 mb-2 bg-white pt-[170px] md:pt[120px] max-w-[1400px] mx-auto">
        {/* <button className="flex items-center justify-center mr-2 pb-2">
          <Image
            src="/images/menu-icon.svg"
            alt="menu"
            width={28}
            height={28}
          />
        </button>
        <span className="mx-4 mb-2 text-[#CD3625] text-xl">|</span> */}

        <div className="flex items-center justify-between overflow-x-auto pb-2 w-full gap-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === active;
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`px-6 py-2 rounded-full font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 ${isActive
                    ? "bg-[#CD3625] text-white"
                    : "bg-white text-black border-gray-50"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="w-full h-[1px] bg-[#C5CBD1]"></div>
    </>
  );
}
