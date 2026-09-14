"use client";

import { useEffect } from "react";

/**
 * Home is a static route, but a client that remains open across a deployment
 * can hold an obsolete App Router payload. Use a document navigation for home
 * links so the browser always requests the current deployment.
 */
export default function HomeNavigationGuard() {
  useEffect(() => {
    const navigateHome = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/" || url.search || url.hash) return;

      event.preventDefault();
      window.location.assign(url.href);
    };

    document.addEventListener("click", navigateHome, true);
    return () => document.removeEventListener("click", navigateHome, true);
  }, []);

  return null;
}
