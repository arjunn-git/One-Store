"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getFaviconTypeForPath,
  getFaviconUrlForPath,
  getFaviconDataUriForPath,
} from "@/lib/services/favicon";

/**
 * DynamicFaviconManager
 * Synchronizes the active browser tab favicon with the current route.
 * Works seamlessly on client-side SPA navigation without full page reloads,
 * direct URL navigations, and back/forward browser history traversal.
 * Uses inline SVG data URIs and stable link element mutation to guarantee
 * instant, zero-latency tab icon repainting across Chrome, Edge, Safari, and Firefox.
 */
export function DynamicFaviconManager() {
  const pathname = usePathname();
  const currentFaviconRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || typeof document === "undefined") return;

    const faviconType = getFaviconTypeForPath(pathname);

    // Skip redundant DOM manipulation if route category has not changed
    if (currentFaviconRef.current === faviconType) {
      return;
    }
    currentFaviconRef.current = faviconType;

    try {
      const head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;

      const dataUri = getFaviconDataUriForPath(pathname);
      const fileUrl = getFaviconUrlForPath(pathname);
      const effectiveHref = dataUri || `${fileUrl}?v=${Date.now()}`;

      // 1. Primary SVG Favicon (stable element with direct href mutation)
      let linkIcon = document.getElementById("dynamic-favicon") as HTMLLinkElement | null;
      if (!linkIcon) {
        linkIcon = document.createElement("link");
        linkIcon.id = "dynamic-favicon";
        linkIcon.rel = "icon";
        linkIcon.type = "image/svg+xml";
        head.appendChild(linkIcon);
      }
      linkIcon.href = effectiveHref;

      // 2. Shortcut Icon (for Chromium & Edge backward compatibility)
      let linkShortcut = document.getElementById("dynamic-shortcut-icon") as HTMLLinkElement | null;
      if (!linkShortcut) {
        linkShortcut = document.createElement("link");
        linkShortcut.id = "dynamic-shortcut-icon";
        linkShortcut.rel = "shortcut icon";
        linkShortcut.type = "image/svg+xml";
        head.appendChild(linkShortcut);
      }
      linkShortcut.href = effectiveHref;

      // 3. Apple Touch Icon
      let linkApple = document.getElementById("dynamic-apple-icon") as HTMLLinkElement | null;
      if (!linkApple) {
        linkApple = document.createElement("link");
        linkApple.id = "dynamic-apple-icon";
        linkApple.rel = "apple-touch-icon";
        head.appendChild(linkApple);
      }
      linkApple.href = effectiveHref;

      // 4. Remove any stale/conflicting raster icon links (e.g. Next.js injected /favicon.ico?...)
      // so Chrome doesn't prioritize an old cached .ico over the dynamic SVG
      const conflictingIcons = head.querySelectorAll(
        "link[rel*='icon']:not(#dynamic-favicon):not(#dynamic-shortcut-icon):not(#dynamic-apple-icon)"
      );
      conflictingIcons.forEach((el) => el.remove());
    } catch (err) {
      console.warn("Could not dynamically update browser tab favicon:", err);
    }
  }, [pathname]);

  return null;
}
