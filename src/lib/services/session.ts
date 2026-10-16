"use client";

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
 * Sends a lightweight active session heartbeat to the server
 */
export function pingSessionHeartbeat(market: "IN" | "GB" = "IN"): void {
  if (typeof window === "undefined") return;

  try {
    const sessionId = getOrCreateAnonymousSessionId();
    fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        type: "SESSION_ACTIVE",
        anonymousSessionId: sessionId,
        market,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}
