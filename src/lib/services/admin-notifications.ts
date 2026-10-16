import nodemailer from "nodemailer";

export const ADMIN_NOTIFICATION_RECIPIENT =
  process.env.ADMIN_NOTIFY_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "onestore.auth@gmail.com";

const GMAIL_APP_PASSWORD = (
  process.env.ADMIN_GMAIL_APP_PASSWORD || "pgmrltcacjwauuig"
).replace(/\s+/g, "");

// Dedicated Gmail SMTP Transporter
function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: ADMIN_NOTIFICATION_RECIPIENT,
      pass: GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// -----------------------------------------------------------------------------
// 1. Order Placed Notification
// -----------------------------------------------------------------------------
export interface OrderNotificationData {
  orderNumber: string;
  totalAmount: number;
  currency: string;
  market: "IN" | "GB";
  paymentProvider: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  shippingAddress: {
    line1?: string;
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    countryCode?: string;
  };
  items?: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
  }>;
}

export async function notifyAdminOrderPlaced(data: OrderNotificationData): Promise<boolean> {
  const symbol = data.currency === "GBP" ? "£" : "₹";
  const formattedTotal = `${symbol}${Number(data.totalAmount).toLocaleString()}`;
  const marketName = data.market === "GB" ? "United Kingdom (£)" : "India (₹)";

  const itemsHtml = (data.items || [])
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #243447;">
          <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600;">${item.name}</td>
          <td style="padding: 10px 0; color: #9CAFC3; font-family: monospace;">${item.sku || "N/A"}</td>
          <td style="padding: 10px 0; color: #7DD3FC; text-align: center; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 10px 0; color: #FFFFFF; text-align: right; font-weight: 600;">${symbol}${item.price}</td>
        </tr>
      `
    )
    .join("");

  const emailHtml = `
    <div style="background-color: #080B10; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #102A43; border: 1px solid #243447; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        
        <!-- Header Ribbon -->
        <div style="background: linear-gradient(135deg, #102A43 0%, #080B10 100%); padding: 24px; border-bottom: 1px solid #243447; text-align: center;">
          <div style="display: inline-block; padding: 6px 14px; background: rgba(125, 211, 252, 0.15); border: 1px solid #7DD3FC; border-radius: 999px; color: #7DD3FC; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
            🛒 NEW STOREFRONT ORDER
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
            Order Placed: <span style="color: #7DD3FC; font-family: monospace;">${data.orderNumber}</span>
          </h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #9CAFC3;">
            Total Value: <strong style="color: #FFFFFF; font-size: 18px;">${formattedTotal}</strong> (${marketName})
          </p>
        </div>

        <!-- Order Information Table -->
        <div style="padding: 24px;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7DD3FC; margin: 0 0 16px 0;">
            Customer & Delivery Details
          </h2>

          <div style="background: #080B10; border: 1px solid #243447; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3; width: 140px;">Customer Name:</td>
                <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Customer Email:</td>
                <td style="padding: 6px 0; color: #7DD3FC;"><a href="mailto:${data.customerEmail}" style="color: #7DD3FC; text-decoration: none;">${data.customerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Phone:</td>
                <td style="padding: 6px 0; color: #FFFFFF;">${data.phone || "Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Payment Method:</td>
                <td style="padding: 6px 0; color: #FFFFFF; text-transform: uppercase; font-weight: 600;">${data.paymentProvider}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Delivery Address:</td>
                <td style="padding: 6px 0; color: #FFFFFF; line-height: 1.5;">
                  ${data.shippingAddress.line1 || ""}<br />
                  ${data.shippingAddress.city ? `${data.shippingAddress.city}, ` : ""}${data.shippingAddress.stateOrProvince || ""} ${data.shippingAddress.postalCode || ""}<br />
                  <strong>${data.shippingAddress.countryCode === "GB" ? "United Kingdom" : "India"}</strong>
                </td>
              </tr>
            </table>
          </div>

          <!-- Items Ordered -->
          ${
            data.items && data.items.length > 0
              ? `
            <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7DD3FC; margin: 0 0 12px 0;">
              Items In This Order
            </h2>
            <div style="background: #080B10; border: 1px solid #243447; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="border-bottom: 1px solid #243447; color: #9CAFC3; text-align: left;">
                    <th style="padding-bottom: 8px;">Product</th>
                    <th style="padding-bottom: 8px;">SKU</th>
                    <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>
            `
              : ""
          }

          <!-- Quick Action Buttons -->
          <div style="text-align: center; padding-top: 8px;">
            <a href="https://one-store-gray.vercel.app/admin/orders" style="display: inline-block; background-color: #7DD3FC; color: #080B10; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
              Open Admin Command Center
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #080B10; border-top: 1px solid #243447; padding: 16px; text-align: center; font-size: 11px; color: #9CAFC3;">
          Automated Admin Notification dispatched to <strong>${ADMIN_NOTIFICATION_RECIPIENT}</strong> · One Store Operations
        </div>

      </div>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"One Store Operations" <${ADMIN_NOTIFICATION_RECIPIENT}>`,
      to: ADMIN_NOTIFICATION_RECIPIENT,
      replyTo: data.customerEmail,
      subject: `🛒 [NEW ORDER] ${data.orderNumber} — ${formattedTotal} (${data.customerName})`,
      html: emailHtml,
    });
    return true;
  } catch (err) {
    console.error("[Admin Order Notification Error]:", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 2. Customer Support Inquiry Notification
// -----------------------------------------------------------------------------
export interface SupportNotificationData {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  orderNumber?: string;
  message: string;
}

export async function notifyAdminSupportInquiry(data: SupportNotificationData): Promise<boolean> {
  const emailHtml = `
    <div style="background-color: #080B10; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #102A43; border: 1px solid #243447; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        
        <div style="background: linear-gradient(135deg, #102A43 0%, #080B10 100%); padding: 24px; border-bottom: 1px solid #243447; text-align: center;">
          <div style="display: inline-block; padding: 6px 14px; background: rgba(125, 211, 252, 0.15); border: 1px solid #7DD3FC; border-radius: 999px; color: #7DD3FC; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
            🎧 ACTIVE CUSTOMER INQUIRY
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
            ${data.subject}
          </h1>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9CAFC3;">
            Ticket Reference: <strong style="color: #7DD3FC; font-family: monospace;">${data.ticketId}</strong>
          </p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #080B10; border: 1px solid #243447; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3; width: 130px;">Sender Name:</td>
                <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Sender Email:</td>
                <td style="padding: 6px 0;"><a href="mailto:${data.email}" style="color: #7DD3FC; text-decoration: none;">${data.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9CAFC3;">Order Reference:</td>
                <td style="padding: 6px 0; color: #FFFFFF; font-family: monospace;">${data.orderNumber || "None specified"}</td>
              </tr>
            </table>
          </div>

          <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7DD3FC; margin: 0 0 8px 0;">
            Customer Message
          </h2>
          <div style="background: #080B10; border: 1px solid #243447; border-radius: 12px; padding: 18px; font-size: 13px; line-height: 1.6; color: #F4F8FC; white-space: pre-wrap; margin-bottom: 24px;">${data.message}</div>

          <div style="text-align: center;">
            <a href="mailto:${data.email}?subject=Re:%20[${data.ticketId}]%20${encodeURIComponent(data.subject)}" style="display: inline-block; background-color: #7DD3FC; color: #080B10; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
              Reply Directly to Customer
            </a>
          </div>
        </div>

        <div style="background: #080B10; border-top: 1px solid #243447; padding: 16px; text-align: center; font-size: 11px; color: #9CAFC3;">
          Dispatched live to Admin Inbox <strong>${ADMIN_NOTIFICATION_RECIPIENT}</strong>
        </div>

      </div>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"One Store Concierge" <${ADMIN_NOTIFICATION_RECIPIENT}>`,
      to: ADMIN_NOTIFICATION_RECIPIENT,
      replyTo: data.email,
      subject: `🎧 [SUPPORT INQUIRY] ${data.ticketId}: ${data.subject} (${data.name})`,
      html: emailHtml,
    });
    return true;
  } catch (err) {
    console.error("[Admin Support Notification Error]:", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 3. Payment Verified Notification
// -----------------------------------------------------------------------------
export interface PaymentNotificationData {
  orderNumber: string;
  paymentId: string;
  totalAmount: number;
  currency: string;
  market: "IN" | "GB";
  paymentProvider: string;
  customerEmail?: string;
}

export async function notifyAdminPaymentCaptured(data: PaymentNotificationData): Promise<boolean> {
  const symbol = data.currency === "GBP" ? "£" : "₹";
  const formattedTotal = `${symbol}${Number(data.totalAmount).toLocaleString()}`;

  const emailHtml = `
    <div style="background-color: #080B10; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #102A43; border: 1px solid #243447; border-radius: 16px; padding: 28px; text-align: center;">
        <div style="display: inline-block; padding: 6px 14px; background: rgba(52, 211, 153, 0.15); border: 1px solid #34D399; border-radius: 999px; color: #34D399; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
          ✓ PAYMENT CAPTURED & VERIFIED
        </div>
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #FFFFFF;">
          Payment Received: <span style="color: #34D399;">${formattedTotal}</span>
        </h1>
        <p style="font-size: 13px; color: #9CAFC3; margin-bottom: 24px;">
          Order <strong>${data.orderNumber}</strong> has been successfully settled via <strong>${data.paymentProvider.toUpperCase()}</strong>.
        </p>
        <div style="background: #080B10; border: 1px solid #243447; border-radius: 12px; padding: 16px; text-align: left; font-size: 13px; font-family: monospace; color: #7DD3FC; margin-bottom: 24px;">
          Payment ID: ${data.paymentId}<br />
          Market: ${data.market === "GB" ? "United Kingdom (£)" : "India (₹)"}<br />
          ${data.customerEmail ? `Customer: ${data.customerEmail}` : ""}
        </div>
        <a href="https://one-store-gray.vercel.app/admin/orders" style="display: inline-block; background-color: #7DD3FC; color: #080B10; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          View in Order Management
        </a>
      </div>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"One Store Billing" <${ADMIN_NOTIFICATION_RECIPIENT}>`,
      to: ADMIN_NOTIFICATION_RECIPIENT,
      subject: `💳 [PAYMENT SETTLED] ${data.orderNumber} — ${formattedTotal} via ${data.paymentProvider.toUpperCase()}`,
      html: emailHtml,
    });
    return true;
  } catch (err) {
    console.error("[Admin Payment Notification Error]:", err);
    return false;
  }
}
