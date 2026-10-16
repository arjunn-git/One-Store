"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getFaviconUrlForPath } from "@/lib/services/favicon";

/**
 * DynamicFaviconManager
 * Synchronizes the active browser tab favicon with the current route.
 * Works seamlessly on client-side SPA navigation without full page reloads,
 * direct URL navigations, and back/forward browser history traversal.
 */
export function DynamicFaviconManager() {
  const pathname = usePathname();
  const currentFaviconRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || typeof document === "undefined") return;

    const faviconUrl = getFaviconUrlForPath(pathname);

    // Skip redundant DOM manipulation if favicon has not changed
    if (currentFaviconRef.current === faviconUrl) {
      return;
    }
    currentFaviconRef.current = faviconUrl;

    try {
      const head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;

      // Remove existing dynamic/static icon elements to prevent duplicate conflicts
      const existingIcons = head.querySelectorAll(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
      );
      existingIcons.forEach((el) => el.remove());

      // 1. Primary SVG Favicon
      const linkIcon = document.createElement("link");
      linkIcon.rel = "icon";
      linkIcon.type = "image/svg+xml";
      linkIcon.href = faviconUrl;
      head.appendChild(linkIcon);

      // 2. Shortcut Icon (for Chromium & Edge backward compatibility)
      const linkShortcut = document.createElement("link");
      linkShortcut.rel = "shortcut icon";
      linkShortcut.type = "image/svg+xml";
      linkShortcut.href = faviconUrl;
      head.appendChild(linkShortcut);

      // 3. Apple Touch Icon
      const linkApple = document.createElement("link");
      linkApple.rel = "apple-touch-icon";
      linkApple.href = faviconUrl;
      head.appendChild(linkApple);
    } catch (err) {
      console.warn("Could not dynamically update browser tab favicon:", err);
    }
  }, [pathname]);

  return null;
}
