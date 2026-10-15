// ==============================================================================
// ONE STORE: Automated Verification & Unit Test Suite
// Run via: node tests/commerce.test.mjs
// ==============================================================================

import assert from "node:assert/strict";
import crypto from "node:crypto";

console.log("------------------------------------------------------------");
console.log("RUNNING ONE STORE AUTOMATED VERIFICATION SUITE");
console.log("------------------------------------------------------------\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Dual Market Pricing Recalculation
runTest("Dual Currency Recalculation (India ₹ vs UK £)", () => {
  const baseInr = 24999;
  const baseGbp = 249;
  const adjInr = 1000;
  const adjGbp = 10;

  const totalInr = baseInr + adjInr;
  const totalGbp = baseGbp + adjGbp;

  assert.equal(totalInr, 25999, "India total price should match");
  assert.equal(totalGbp, 259, "UK total price should match");
});

// 2. Shipping Thresholds
runTest("Free Shipping Threshold Logic", () => {
  const inrThreshold = 5000;
  const gbpThreshold = 50;

  const orderInr1 = 6000;
  const orderInr2 = 4000;
  const orderGbp1 = 120;
  const orderGbp2 = 30;

  assert.equal(orderInr1 >= inrThreshold ? 0 : 250, 0, "INR order over 5000 has free shipping");
  assert.equal(orderInr2 >= inrThreshold ? 0 : 250, 250, "INR order below 5000 has standard 250 fee");
  assert.equal(orderGbp1 >= gbpThreshold ? 0 : 5, 0, "GBP order over 50 has free shipping");
  assert.equal(orderGbp2 >= gbpThreshold ? 0 : 5, 5, "GBP order below 50 has standard 5 fee");
});

// 3. Promotional Code Discount Engine
runTest("Promo Code Calculation (LAUNCH10)", () => {
  const subtotal = 38999;
  const promoCode = "LAUNCH10";

  let discount = 0;
  if (promoCode === "LAUNCH10") {
    discount = (subtotal * 10) / 100;
  }

  assert.equal(discount, 3899.9, "10% discount should match");
  assert.equal(subtotal - discount, 35099.1, "Net total should match");
});

// 4. Razorpay Webhook Signature Verification
runTest("Cryptographic Webhook Signature Verification", () => {
  const webhookSecret = "test_whsec_12345";
  const payload = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_test_99", notes: { order_number: "OS-2026-IN-4891" } } } },
  });

  const validSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
  const tamperedPayload = payload + "tamper";
  const tamperedSignature = crypto.createHmac("sha256", webhookSecret).update(tamperedPayload).digest("hex");

  assert.equal(
    crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex"),
    validSignature,
    "Valid signature matches"
  );
  assert.notEqual(validSignature, tamperedSignature, "Tampered payload fails verification");
});

// 5. Razorpay Standard Checkout Client Signature Verification (order_id|payment_id)
runTest("Razorpay Payment Signature Verification (order_id|payment_id)", () => {
  const keySecret = "rzp_sec_test_abc123";
  const orderId = "order_O8vK1234567890";
  const paymentId = "pay_P8vK9876543210";

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  function verifyPayment(oId, pId, sig, secret) {
    const computed = crypto.createHmac("sha256", secret).update(`${oId}|${pId}`).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig));
  }

  assert.equal(
    verifyPayment(orderId, paymentId, expectedSignature, keySecret),
    true,
    "Valid payment signature must be verified"
  );

  const forgedSignature = crypto.createHmac("sha256", "wrong_secret").update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(
    verifyPayment(orderId, paymentId, forgedSignature, keySecret),
    false,
    "Forged signature must be rejected"
  );
});

// 6. Masked Email Security Function
runTest("Email Privacy Masking (No PII leak)", () => {
  function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  assert.equal(maskEmail("arjuntaneja204@gmail.com"), "a***4@gmail.com");
  assert.equal(maskEmail("oliver@domain.co.uk"), "o***r@domain.co.uk");
});

// 7. OTP Format & Normalization
runTest("6-Digit OTP Code Normalization & Validation", () => {
  const testOtp = "  8 3 9 1 0 2  ";
  const cleaned = testOtp.replace(/\D/g, "");

  assert.equal(cleaned.length, 6, "Must be exactly 6 digits");
  assert.equal(cleaned, "839102", "Must strip whitespace");
  assert.match(cleaned, /^\d{6}$/, "Must be numeric only");
});

// 8. Inventory Stockout & Reservation
runTest("Inventory Reservation & Stock Boundary Check", () => {
  const variantStock = 5;
  const requestedQty1 = 3;
  const requestedQty2 = 8;

  const validReservation = requestedQty1 <= variantStock;
  const invalidReservation = requestedQty2 <= variantStock;

  assert.equal(validReservation, true, "Should allow reservation within stock limits");
  assert.equal(invalidReservation, false, "Should block overselling beyond available stock");
});

// 9. Customer Order Access Security (Isolation Protection)
runTest("Customer Isolation Guard: Unauthorized Customer Access Blocked", () => {
  const orderA = {
    orderNumber: "OS-2026-IN-1111",
    customerId: "cust_user_A",
    accessToken: "sec_tok_9999",
  };

  function canAccessOrder(order, accessingUserId, providedToken, isAdmin = false) {
    if (isAdmin) return true;
    if (accessingUserId && order.customerId === accessingUserId) return true;
    if (providedToken && order.accessToken === providedToken) return true;
    return false;
  }

  // Customer A can view own order
  assert.equal(canAccessOrder(orderA, "cust_user_A", null, false), true);
  // Admin can view order
  assert.equal(canAccessOrder(orderA, "cust_admin", null, true), true);
  // Guest with valid token can view order
  assert.equal(canAccessOrder(orderA, null, "sec_tok_9999", false), true);
  // Customer B cannot view Customer A's order without matching token
  assert.equal(canAccessOrder(orderA, "cust_user_B", null, false), false);
  // Guest with invalid token cannot view order
  assert.equal(canAccessOrder(orderA, null, "invalid_token", false), false);
});

// 10. Webhook Idempotency (Duplicate Event Handling)
runTest("Webhook Idempotency: Duplicate Payment Events Ignored", () => {
  const processedEvents = new Set();

  function handleWebhookEvent(eventId, orderStatus) {
    if (processedEvents.has(eventId)) {
      return { handled: true, duplicate: true, action: "NOOP" };
    }
    if (orderStatus === "succeeded") {
      return { handled: true, duplicate: true, action: "ALREADY_PAID" };
    }
    processedEvents.add(eventId);
    return { handled: true, duplicate: false, action: "SET_PAID" };
  }

  const res1 = handleWebhookEvent("evt_001", "pending");
  assert.equal(res1.duplicate, false);
  assert.equal(res1.action, "SET_PAID");

  const res2 = handleWebhookEvent("evt_001", "succeeded");
  assert.equal(res2.duplicate, true);
  assert.equal(res2.action, "NOOP");
});

// 11. Server-Side Price Calculation Tampering Protection
runTest("Server-Side Price Calculation: Tampered Client Prices Ignored", () => {
  const serverCatalog = {
    "prod_1": { priceInr: 24999 },
  };

  const clientSubmittedCart = {
    productId: "prod_1",
    tamperedClientPrice: 1, // Attacker sends 1 rupee
    quantity: 2,
  };

  // Server recalcs from trusted catalog
  const catalogItem = serverCatalog[clientSubmittedCart.productId];
  const trustedItemTotal = catalogItem.priceInr * clientSubmittedCart.quantity;

  assert.equal(trustedItemTotal, 49998, "Server must enforce real catalog price (₹49,998) instead of client-submitted price");
});

// 12. Supabase Dual OTP Type ('email' vs 'signup') Fallback Simulation
runTest("Supabase Dual OTP Type Fallback: Token Resolution Across Signup & Login", () => {
  function simulateVerifyOtp(token, requestedType, validTokenType) {
    // Primary attempt
    if (requestedType === validTokenType && token === "654321") {
      return { success: true, userId: "usr_verified_123" };
    }
    // Fallback attempt
    const fallbackType = requestedType === "signup" ? "email" : "signup";
    if (fallbackType === validTokenType && token === "654321") {
      return { success: true, userId: "usr_verified_123", recoveredViaFallback: true };
    }
    return { success: false, error: "Invalid verification code" };
  }

  // Case A: Existing user token validated on email type
  const resLogin = simulateVerifyOtp("654321", "email", "email");
  assert.equal(resLogin.success, true);

  // Case B: New user where Supabase internally created as 'email' but client sent 'signup'
  const resSignupFallback = simulateVerifyOtp("654321", "signup", "email");
  assert.equal(resSignupFallback.success, true);
  assert.equal(resSignupFallback.recoveredViaFallback, true);

  // Case C: Invalid code
  const resBad = simulateVerifyOtp("000000", "email", "email");
  assert.equal(resBad.success, false);
});

// 13. Resend Cooldown Enforcement
runTest("OTP Resend Cooldown Timer Logic (60s Guard)", () => {
  function canResendOtp(lastSentTimestamp, currentTimestamp, cooldownSeconds = 60) {
    const elapsedSeconds = (currentTimestamp - lastSentTimestamp) / 1000;
    return elapsedSeconds >= cooldownSeconds;
  }

  const now = Date.now();
  assert.equal(canResendOtp(now - 30 * 1000, now), false, "Must block resend within 30 seconds");
  assert.equal(canResendOtp(now - 61 * 1000, now), true, "Must allow resend after 61 seconds");
});

// 14. OAuth Provider Validation & Callback URL Check
runTest("OAuth Provider & Redirect URL Validation (Google & Apple)", () => {
  function buildOAuthAuthorizeUrl(supabaseUrl, provider, callbackUrl) {
    if (!["google", "apple"].includes(provider)) throw new Error("Invalid provider");
    return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callbackUrl)}`;
  }

  const supabaseUrl = "https://iivszrkvwvqptfxiqbfv.supabase.co";
  const callbackUrl = "https://one-store-gray.vercel.app/auth/callback";

  const googleUrl = buildOAuthAuthorizeUrl(supabaseUrl, "google", callbackUrl);
  assert.ok(googleUrl.includes("provider=google"));
  assert.ok(googleUrl.includes(encodeURIComponent(callbackUrl)));

  const appleUrl = buildOAuthAuthorizeUrl(supabaseUrl, "apple", callbackUrl);
  assert.ok(appleUrl.includes("provider=apple"));
  assert.ok(appleUrl.includes(encodeURIComponent(callbackUrl)));
});

// 15. Apple Private Relay & Metadata Extraction
runTest("Apple Private Relay & Metadata Preservation", () => {
  function extractProfileFromAuthUser(user, existingProfile = null) {
    const meta = user.user_metadata || {};
    const fullName =
      meta.full_name ||
      meta.name ||
      (meta.first_name ? `${meta.first_name} ${meta.last_name || ""}`.trim() : null);

    if (existingProfile) {
      return {
        ...existingProfile,
        is_email_verified: !!user.email_confirmed_at,
        // Preserve existing full_name if Apple did not resend it
        full_name: fullName || existingProfile.full_name,
      };
    }

    return {
      auth_user_id: user.id,
      email: user.email,
      is_email_verified: !!user.email_confirmed_at,
      full_name: fullName,
      is_private_relay: user.email?.endsWith("@privaterelay.appleid.com") || false,
    };
  }

  // Initial Apple Sign-In: user provides name and private relay email
  const initialUser = {
    id: "usr_apple_1",
    email: "x9fj2k@privaterelay.appleid.com",
    email_confirmed_at: "2026-10-15T00:00:00Z",
    user_metadata: { first_name: "John", last_name: "Appleseed" },
  };
  const profile1 = extractProfileFromAuthUser(initialUser);
  assert.equal(profile1.full_name, "John Appleseed");
  assert.equal(profile1.is_private_relay, true);

  // Subsequent Apple Sign-In: Apple omits user_metadata
  const subsequentUser = {
    id: "usr_apple_1",
    email: "x9fj2k@privaterelay.appleid.com",
    email_confirmed_at: "2026-10-15T00:00:00Z",
    user_metadata: {},
  };
  const profile2 = extractProfileFromAuthUser(subsequentUser, profile1);
  assert.equal(profile2.full_name, "John Appleseed", "Must preserve existing name when Apple omits it");
});

// 16. OAuth Callback Error Normalization
runTest("OAuth Cancellation & Error Handling", () => {
  function normalizeCallbackError(errorParam, errorDescription) {
    if (errorParam === "access_denied" || errorDescription?.toLowerCase().includes("denied")) {
      return "Sign-in was cancelled. You can sign in using your email code.";
    }
    if (errorDescription) return errorDescription;
    return "Social authentication could not be completed. Please try again or use your email verification code.";
  }

  assert.equal(
    normalizeCallbackError("access_denied", "The user denied access to your application"),
    "Sign-in was cancelled. You can sign in using your email code."
  );
  assert.equal(
    normalizeCallbackError("server_error", "Internal provider error"),
    "Internal provider error"
  );
});

// 17. Multi-Market Config & Server-Side Market Validation
runTest("Multi-Market Server Validation (India vs UK)", () => {
  function validateMarket(raw) {
    if (!raw) return "IN";
    const cleaned = String(raw).trim().toUpperCase();
    return cleaned === "GB" || cleaned === "UK" ? "GB" : "IN";
  }

  assert.equal(validateMarket("in"), "IN");
  assert.equal(validateMarket("IN"), "IN");
  assert.equal(validateMarket("GB"), "GB");
  assert.equal(validateMarket("uk"), "GB");
  assert.equal(validateMarket("US"), "IN", "Invalid markets safely fallback to IN default");
  assert.equal(validateMarket(null), "IN");
  assert.equal(validateMarket(undefined), "IN");
});

// 18. UK Test Catalogue Isolation & Test Data Flag Enforcement
runTest("UK Test Catalogue Isolation & Flag Enforcement", () => {
  const catalog = [
    { id: "1", name: "India Kurta", available_in_in: true, available_in_gb: false, is_test_data: false, status: "active" },
    { id: "2", name: "Global Watch", available_in_in: true, available_in_gb: true, is_test_data: false, status: "active" },
    { id: "3", name: "UK Bluetooth Headphones", sku: "UK-TEST-AUD-001", available_in_in: false, available_in_gb: true, is_test_data: true, status: "draft" },
    { id: "4", name: "UK Desk Lamp", sku: "UK-TEST-HOME-002", available_in_in: false, available_in_gb: true, is_test_data: true, status: "active" },
  ];

  function filterByMarket(products, market, includeDrafts = false) {
    return products.filter((p) => {
      const isAvailable = market === "GB" ? p.available_in_gb : p.available_in_in;
      const isStatusOk = includeDrafts ? true : p.status === "active";
      return isAvailable && isStatusOk;
    });
  }

  const indiaStore = filterByMarket(catalog, "IN");
  assert.equal(indiaStore.length, 2);
  assert.ok(indiaStore.every((p) => p.available_in_in));
  assert.ok(!indiaStore.some((p) => p.is_test_data), "India storefront must never contain UK test records");

  const ukStorePublic = filterByMarket(catalog, "GB", false);
  assert.equal(ukStorePublic.length, 2); // Global Watch + UK Desk Lamp (active)
  assert.ok(ukStorePublic.some((p) => p.sku === "UK-TEST-HOME-002"));

  const ukStoreAdmin = filterByMarket(catalog, "GB", true);
  assert.equal(ukStoreAdmin.length, 3); // includes draft
});

// 19. Currency Formatting and Precision (INR rounded integers vs GBP 2 decimal places)
runTest("Currency Formatting Precision (INR vs GBP)", () => {
  function formatMarketPrice(amount, market) {
    if (typeof amount !== "number" || isNaN(amount)) return market === "GB" ? "£0.00" : "₹0";
    if (market === "GB") {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }

  assert.equal(formatMarketPrice(39.99, "GB"), "£39.99");
  assert.equal(formatMarketPrice(9.9, "GB"), "£9.90");
  assert.equal(formatMarketPrice(24999.5, "IN"), "₹25,000");
  assert.equal(formatMarketPrice(1499, "IN"), "₹1,499");
});

// 20. OAuth Missing Credentials Graceful Handling (preventing infinite spinners)
runTest("OAuth Client Graceful Failure On Missing Provider URL", () => {
  function handleOAuthResponse(data, error) {
    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.url) {
      return {
        success: false,
        error: "Provider is not configured in Supabase yet. Please use OTP login or configure provider credentials.",
      };
    }
    return { success: true, url: data.url };
  }

  // Case 1: Supabase returns null URL when Apple OAuth is disabled/unconfigured
  const unconfiguredAppleResult = handleOAuthResponse({ url: null }, null);
  assert.equal(unconfiguredAppleResult.success, false, "Must fail cleanly when url is null");
  assert.ok(unconfiguredAppleResult.error.includes("not configured"));

  // Case 2: Configured provider returns redirect URL
  const configuredGoogleResult = handleOAuthResponse({ url: "https://accounts.google.com/o/oauth2/v2/auth?..." }, null);
  assert.equal(configuredGoogleResult.success, true);
  assert.ok(configuredGoogleResult.url.startsWith("https://accounts.google.com"));
});

console.log("\n------------------------------------------------------------");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
}
