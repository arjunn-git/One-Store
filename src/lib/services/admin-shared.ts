export const OFFICIAL_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  "onestore.auth@gmail.com"
).toLowerCase().trim();

export const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "one-store-admin-isolated-session-secret-2026";

/**
 * Edge-compatible admin token verification using standard Web Crypto API (crypto.subtle).
 * Zero Node.js dependencies, 100% Edge Runtime compliant.
 */
export async function verifyAdminTokenEdge(
  token?: string | null
): Promise<{ valid: boolean; email?: string }> {
  if (!token) return { valid: false };
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature || signature.length !== 64) return { valid: false };

    const payloadStr =
      typeof atob === "function"
        ? atob(payloadB64)
        : typeof Buffer !== "undefined"
          ? Buffer.from(payloadB64, "base64").toString("utf-8")
          : "";

    if (!payloadStr) return { valid: false };

    const encoder = new TextEncoder();
    const keyData = encoder.encode(ADMIN_SESSION_SECRET);
    const msgData = encoder.encode(payloadStr);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const expectedSig = sigArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (signature.toLowerCase() !== expectedSig.toLowerCase()) {
      return { valid: false };
    }

    const parsed = JSON.parse(payloadStr);
    if (parsed.email !== OFFICIAL_ADMIN_EMAIL) return { valid: false };
    if (parsed.role !== "admin") return { valid: false };

    // Max session age: 7 days
    if (Date.now() - parsed.issuedAt > 7 * 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}
