"use client";

import { useLogout, useRestaurantOwnerProfile } from "@/lib/api";
import { hasAuthToken } from "@/lib/api/client";
import { ChevronDown, LogOut, Menu, Settings, Store, X } from "lucide-react";
import Link from "next/link";
import LanguageSwitch from "./LanguageSwitch";
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

export default function RestaurantManagerHeader({ active }: { active?: ManagerNavItem }) {
  const router = useRouter();
  const logout = useLogout();
  const tokenPresent = typeof window !== "undefined" ? hasAuthToken() : false;
  const ownerQuery = useRestaurantOwnerProfile(tokenPresent);
  const restaurant = ownerQuery.data;
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restaurant?.validation_status) return;
    if (restaurant.validation_status !== "approved" || !restaurant.active) {
      router.replace("/restaurant-status");
    }
  }, [restaurant?.active, restaurant?.validation_status, router]);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function handleLogout() {
    setAccountOpen(false);
    setMobileOpen(false);
    logout();
    router.replace("/signin");
  }

  const initial =
    restaurant?.name?.trim().charAt(0).toUpperCase() ||
    restaurant?.owner_firstname?.trim().charAt(0).toUpperCase() ||
    "R";
  const ownerName = [restaurant?.owner_firstname, restaurant?.owner_lastname]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/dashboard" className="group shrink-0 font-serif text-2xl font-black tracking-tight text-stone-950">
          <span className="text-[#c83b2b]">FOOD</span>DELY
          <span className="ml-2 align-middle font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 sm:text-xs">
            Partner
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex" aria-label="Restaurant management">
          {NAV_ITEMS.map((item) => {
            const selected = active === item.label;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition xl:px-4 ${
                  selected
                    ? "bg-[#c83b2b] text-white shadow-sm"
                    : "text-stone-600 hover:bg-[#f7f3ed] hover:text-stone-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitch theme="light" />
          <div ref={accountRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 pr-3 text-left transition hover:border-stone-300 hover:bg-stone-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c83b2b] text-sm font-bold text-white">{initial}</span>
              <span className="hidden max-w-28 truncate text-sm font-bold text-stone-800 xl:block">{restaurant?.name || "Restaurant"}</span>
              <ChevronDown size={15} className={`text-stone-400 transition ${accountOpen ? "rotate-180" : ""}`} />
            </button>

            {accountOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_22px_60px_rgba(45,32,24,.16)]">
                <div className="border-b border-stone-100 bg-[#faf7f4] px-4 py-4">
                  <p className="truncate font-bold text-stone-950">{restaurant?.name || "Restaurant"}</p>
                  {ownerName && <p className="mt-1 truncate text-sm text-stone-600">{ownerName}</p>}
                  {restaurant?.owner_email && <p className="mt-1 truncate text-xs text-stone-400">{restaurant.owner_email}</p>}
                </div>
                <div className="p-2">
                  <Link href="/restaurant-settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"><Settings size={17} />Restaurant settings</Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut size={17} />Sign out</button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close partner navigation" : "Open partner navigation"}
            aria-expanded={mobileOpen}
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-800 transition hover:bg-stone-50 lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-100 bg-white px-4 pb-5 pt-3 sm:px-8 lg:hidden">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f7f3ed] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#c83b2b] font-bold text-white">{initial}</span>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{restaurant?.name || "Restaurant"}</p><p className="truncate text-xs text-stone-500">{ownerName || restaurant?.owner_email}</p></div>
            </div>
            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Mobile restaurant management">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className={`rounded-xl px-3 py-2.5 text-center text-sm font-semibold ${active === item.label ? "bg-[#c83b2b] text-white" : "bg-stone-50 text-stone-700"}`}>{item.label}</Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
              <Link href="/restaurant-settings" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold"><Store size={16} />Settings</Link>
              <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-semibold text-red-600"><LogOut size={16} />Sign out</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
