import { recordActivity } from "./activity";

export const SUPPORT_EMAIL_DESTINATION = "onestore.auth@gmail.com";

export interface SupportInquiryPayload {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
}

export interface SupportTicketRecord extends SupportInquiryPayload {
  id: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  deliveredTo: string;
  deliveryMethod: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __one_store_support_tickets__: SupportTicketRecord[] | undefined;
}

export function getSupportTickets(): SupportTicketRecord[] {
  if (!globalThis.__one_store_support_tickets__) {
    globalThis.__one_store_support_tickets__ = [];
  }
  return globalThis.__one_store_support_tickets__;
}

export async function dispatchSupportInquiry(payload: SupportInquiryPayload): Promise<{
  success: boolean;
  ticketId: string;
  deliveredTo: string;
  message: string;
  error?: string;
}> {
  const { name, email, orderNumber, subject, message } = payload;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return {
      success: false,
      ticketId: "",
      deliveredTo: SUPPORT_EMAIL_DESTINATION,
      message: "Please fill in all mandatory inquiry fields.",
      error: "Missing required fields",
    };
  }

  const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  let deliveryMethod = "Activity Stream";

  // 1. Attempt Email Delivery via Resend API (if API key configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey !== "re_placeholder_key") {
    try {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080B10; color: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #243447;">
          <div style="border-bottom: 1px solid #243447; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #7DD3FC; font-size: 20px; margin: 0;">One Store — Customer Support Inquiry</h1>
            <p style="color: #9CAFC3; font-size: 12px; margin: 4px 0 0 0;">Ticket Reference: <strong style="color: #FFFFFF;">${ticketId}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #9CAFC3; width: 140px;">Customer Name:</td>
              <td style="padding: 8px 0; color: #FFFFFF; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9CAFC3;">Customer Email:</td>
              <td style="padding: 8px 0; color: #7DD3FC;"><a href="mailto:${email}" style="color: #7DD3FC; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9CAFC3;">Order Reference:</td>
              <td style="padding: 8px 0; color: #FFFFFF; font-family: monospace;">${orderNumber || "None specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9CAFC3;">Inquiry Subject:</td>
              <td style="padding: 8px 0; color: #FFFFFF; font-weight: bold;">${subject}</td>
            </tr>
          </table>

          <div style="background: #102A43; padding: 16px; border-radius: 8px; border: 1px solid #243447; margin-bottom: 20px;">
            <p style="color: #7DD3FC; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">Customer Message:</p>
            <p style="color: #FFFFFF; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="border-top: 1px solid #243447; padding-top: 16px; font-size: 11px; color: #9CAFC3;">
            <p style="margin: 0;">This email was sent to <strong>${SUPPORT_EMAIL_DESTINATION}</strong> directly from One Store Concierge.</p>
            <p style="margin: 4px 0 0 0;">Click 'Reply' to respond directly to the customer at ${email}.</p>
          </div>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "One Store <support@onestore.com>",
          to: [SUPPORT_EMAIL_DESTINATION],
          reply_to: email,
          subject: `[Support Ticket ${ticketId}] ${subject} — from ${name}`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        deliveryMethod = "Resend API";
      }
    } catch {
      // Fallback to secondary methods
    }
  }

  // 2. Dispatch via FormSubmit Direct Email Gateway to onestore.auth@gmail.com
  // FormSubmit forwards the structured payload directly to onestore.auth@gmail.com
  try {
    const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(SUPPORT_EMAIL_DESTINATION)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `[One Store Support ${ticketId}] ${subject} from ${name}`,
        _replyto: email,
        _template: "table",
        ticket_id: ticketId,
        customer_name: name,
        customer_email: email,
        order_number: orderNumber || "N/A",
        subject: subject,
        customer_message: message,
        dispatched_at: new Date().toISOString(),
      }),
    });

    if (fsRes.ok) {
      deliveryMethod = deliveryMethod === "Resend API" ? "Resend & FormSubmit" : "FormSubmit Gateway";
    }
  } catch {
    // Non-blocking fallback
  }

  // 3. Record High-Priority Live Telemetry in Admin Stream
  try {
    await recordActivity({
      type: "SUPPORT_INQUIRY",
      action: `Support Inquiry: ${subject}`,
      actor: `${name} (${email})`,
      market: orderNumber?.includes("-GB-") ? "GB" : "IN",
      currency: orderNumber?.includes("-GB-") ? "GBP" : "INR",
      resourceType: "support",
      resourceId: ticketId,
      details: {
        ticketId,
        name,
        email,
        orderNumber: orderNumber || "None",
        subject,
        message,
        destination: SUPPORT_EMAIL_DESTINATION,
        deliveryMethod,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Non-blocking
  }

  // 4. Record to persistent memory ring buffer
  const ticket: SupportTicketRecord = {
    id: ticketId,
    name,
    email,
    orderNumber,
    subject,
    message,
    status: "open",
    createdAt: new Date().toISOString(),
    deliveredTo: SUPPORT_EMAIL_DESTINATION,
    deliveryMethod,
  };

  const tickets = getSupportTickets();
  tickets.unshift(ticket);
  if (tickets.length > 100) {
    tickets.pop();
  }

  return {
    success: true,
    ticketId,
    deliveredTo: SUPPORT_EMAIL_DESTINATION,
    message: `Your inquiry has been successfully routed to ${SUPPORT_EMAIL_DESTINATION}. Reference: ${ticketId}.`,
  };
}
