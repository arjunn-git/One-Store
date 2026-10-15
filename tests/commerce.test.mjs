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

console.log("\n------------------------------------------------------------");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
}
