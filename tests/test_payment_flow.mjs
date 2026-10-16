async function testCheckoutAndPayment() {
  console.log("--- 1. Placing Test Order via /api/checkout ---");
  const checkoutPayload = {
    items: [
      {
        productId: "p1000000-0000-0000-0000-000000000001",
        variantId: "v1000000-0000-0000-0000-000000000001",
        quantity: 1,
      },
    ],
    market: "IN",
    currency: "INR",
    customerEmail: "customer@example.com",
    recipientName: "Test Customer",
    phone: "+919876543210",
    line1: "100 Marine Drive",
    city: "Mumbai",
    stateOrProvince: "Maharashtra",
    postalCode: "400020",
    countryCode: "IN",
    paymentProvider: "razorpay",
  };

  const checkoutRes = await fetch("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutPayload),
  });

  const checkoutData = await checkoutRes.json();
  console.log("Checkout response status:", checkoutRes.status);
  console.log("Checkout data:", checkoutData);

  if (!checkoutData.success) {
    console.error("FAIL: Checkout failed:", checkoutData);
    process.exit(1);
  }

  const { orderNumber, accessToken } = checkoutData;
  console.log(`\n--- 2. Order created successfully: ${orderNumber} ---`);

  console.log("\n--- 3. Completing Test Sandbox Payment ---");
  const payRes = await fetch("http://localhost:3000/api/payments/sandbox-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderNumber,
      accessToken,
    }),
  });

  const payData = await payRes.json();
  console.log("Payment complete status:", payRes.status);
  console.log("Payment response:", payData);

  if (!payData.success) {
    console.error("FAIL: Payment completion failed:", payData);
    process.exit(1);
  }

  console.log("\n--- 4. Verifying Order Status via Order Lookup API ---");
  const lookupRes = await fetch(`http://localhost:3000/api/orders/${orderNumber}?token=${accessToken}`);
  const lookupData = await lookupRes.json();
  console.log("Order lookup status:", lookupRes.status);
  console.log("Lookup details:", {
    order_number: lookupData.order?.order_number,
    status: lookupData.order?.status,
    payment_status: lookupData.order?.payment_status,
    total_amount: lookupData.order?.total_amount,
  });

  console.log("\n--- SUCCESS: Payment gateway test flow completed end-to-end! ---");
}

testCheckoutAndPayment().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
