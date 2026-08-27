"use client";

import { usePathname } from "next/navigation";
import LanguageSwitch from "./LanguageSwitch";

export default function GlobalLanguageSwitch() {
  const pathname = usePathname();
  const managerPaths = [
    "/dashboard",
    "/order-list",
    "/archive-list",
    "/restaurant-settings",
    "/manage-menu",
    "/discounts",
    "/customer-reviews",
    "/ranking",
    "/sales",
  ];
  const isManagerPage = managerPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // The landing page places the switch directly inside its own header.
  if (pathname === "/") return null;

  return (
    <div
      className={
        isManagerPage
          ? "fixed bottom-5 left-4 z-40 sm:left-5"
          : "fixed bottom-24 left-3 z-40 sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:z-[100]"
      }
    >
      <LanguageSwitch theme="light" />
    </div>
  );
}
