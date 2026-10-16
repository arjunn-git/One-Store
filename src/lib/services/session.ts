"use client";

import { isAdminEmail } from "@/lib/services/auth";

const SESSION_STORAGE_KEY = "one_store_anonymous_session_id";

/**
 * Returns a privacy-safe random anonymous session identifier.
 * Persisted in browser sessionStorage/localStorage for the active visit.
 */
export function getOrCreateAnonymousSessionId(): string {
  if (typeof window === "undefined") {
    return "session_ssr";
  }

  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return `ses_fallback_${Date.now()}`;
  }
}

/**
 * Resolves current client actor identity (real customer full name & email if logged in,
 * or identifiable market-specific session label if anonymous).
 */
export function getClientActor(market: "IN" | "GB" = "IN"): string {
  if (typeof window === "undefined") return "Storefront Visitor";

  try {
    // 1. Check local storage / cookies for authenticated customer profile
    const savedName = localStorage.getItem("one_store_user_name");
    const nameMatch = document.cookie.match(/one_store_user_name=([^;]+)/);
    const cookieName = nameMatch ? decodeURIComponent(nameMatch[1]).trim() : "";

    const savedEmail = localStorage.getItem("one_store_user_email");
    const emailMatch = document.cookie.match(/one_store_user_email=([^;]+)/);
    const cookieEmail = emailMatch ? decodeURIComponent(emailMatch[1]).trim() : "";

    const email = savedEmail || cookieEmail;
    if (email && isAdminEmail(email)) {
      return `Store Admin (${email})`;
    }

    const name = savedName || cookieName;

    if (name && email) {
      return `${name} (${email})`;
    }
    if (name) {
      return `${name} (Customer)`;
    }
    if (email) {
      const username = email.split("@")[0];
      return `${username} (${email})`;
    }

    // 2. Fallback to identifiable session identifier
    const sessionId = getOrCreateAnonymousSessionId();
    const shortId = sessionId.slice(-5);
    const marketLabel = market === "GB" ? "UK" : "India";
    return `${marketLabel} Shopper (#${shortId})`;
  } catch {
    return "Storefront Visitor";
  }
}

/**
 * Sends a lightweight active session heartbeat to the server
 */
export function pingSessionHeartbeat(market: "IN" | "GB" = "IN"): void {
  if (typeof window === "undefined") return;

  try {
    const sessionId = getOrCreateAnonymousSessionId();
    const actor = getClientActor(market);
    fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        type: "SESSION_ACTIVE",
        anonymousSessionId: sessionId,
        actor,
        market,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}
