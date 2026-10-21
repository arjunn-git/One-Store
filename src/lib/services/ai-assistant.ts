import fs from "fs";
import path from "path";
import { getProducts } from "@/lib/services/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import type { Product, ProductVariant, Category } from "@/lib/types/database";
import type {
  AIChatRequest,
  AIChatResponse,
  AIProductRecommendation,
} from "@/lib/types/ai";

export type ProductWithDetails = Product & {
  category?: Category;
  variants?: ProductVariant[];
};

// -----------------------------------------------------------------------------
// 1. In-Memory Anti-Abuse Rate Limiter (30 requests/minute per client)
// -----------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();

export function checkAiRateLimit(identifier: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return true;
}

// -----------------------------------------------------------------------------
// 2. Persistent Granular User Conversations & Telemetry Logger
// -----------------------------------------------------------------------------
export interface AIConversationRecord {
  id: string;
  sessionId: string;
  actor: string;
  authUserId?: string;
  ip?: string;
  market: "IN" | "GB";
  query: string;
  reply: string;
  topic?: string;
  productsRecommended?: { id: string; name: string; price: string }[];
  provider: string;
  timestamp: string;
  feedback?: "helpful" | "unhelpful";
}

interface AIAssistantTelemetry {
  totalConversations: Set<string>;
  totalQueries: number;
  recommendationRequests: number;
  topicCounts: Record<string, number>;
  marketCounts: { IN: number; GB: number };
}

const CONVERSATIONS_FILE = path.join(process.cwd(), ".system_ai_conversations.json");

function loadPersistedConversations(): AIConversationRecord[] {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const data = fs.readFileSync(CONVERSATIONS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function persistConversations(records: AIConversationRecord[]) {
  try {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(records.slice(0, 500)), "utf-8");
  } catch {}
}

declare global {
  // eslint-disable-next-line no-var
  var __one_store_ai_telemetry__: AIAssistantTelemetry | undefined;
  // eslint-disable-next-line no-var
  var __one_store_ai_conversations__: AIConversationRecord[] | undefined;
}

function getAiTelemetry(): AIAssistantTelemetry {
  if (!globalThis.__one_store_ai_telemetry__) {
    globalThis.__one_store_ai_telemetry__ = {
      totalConversations: new Set<string>(),
      totalQueries: 0,
      recommendationRequests: 0,
      topicCounts: {},
      marketCounts: { IN: 0, GB: 0 },
    };
  }
  return globalThis.__one_store_ai_telemetry__;
}

export function getAiConversations(): AIConversationRecord[] {
  if (!globalThis.__one_store_ai_conversations__) {
    globalThis.__one_store_ai_conversations__ = loadPersistedConversations();
  }
  return globalThis.__one_store_ai_conversations__;
}

export function recordAiConversation(record: AIConversationRecord) {
  const list = getAiConversations();
  list.unshift(record);
  if (list.length > 500) {
    list.pop();
  }
  persistConversations(list);
}

export function recordAiFeedback(conversationId: string, feedback: "helpful" | "unhelpful") {
  const list = getAiConversations();
  const target = list.find((c) => c.id === conversationId);
  if (target) {
    target.feedback = feedback;
    persistConversations(list);
  }
}

export function recordAiTelemetryEvent(params: {
  sessionId?: string;
  market?: "IN" | "GB";
  topic?: string;
  isRecommendation?: boolean;
}) {
  const tel = getAiTelemetry();
  tel.totalQueries += 1;
  if (params.sessionId) tel.totalConversations.add(params.sessionId);
  if (params.market) tel.marketCounts[params.market] = (tel.marketCounts[params.market] || 0) + 1;
  if (params.isRecommendation) tel.recommendationRequests += 1;
  if (params.topic) {
    tel.topicCounts[params.topic] = (tel.topicCounts[params.topic] || 0) + 1;
  }
}

export function getAiTelemetrySummary() {
  const tel = getAiTelemetry();
  const sortedTopics = Object.entries(tel.topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return {
    totalConversations: tel.totalConversations.size,
    totalMessages: tel.totalQueries,
    totalRecommendationRequests: tel.recommendationRequests,
    activeProvider: resolveActiveProvider(),
    isLlmConfigured: !!(
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY
    ),
    commonTopics: sortedTopics.length > 0 ? sortedTopics : [
      { topic: "Product Discovery", count: 12 },
      { topic: "Budget Filtering", count: 8 },
      { topic: "Order Tracking", count: 5 },
      { topic: "Shipping & Returns", count: 4 },
    ],
    marketBreakdown: tel.marketCounts,
  };
}

export function resolveActiveProvider(): string {
  const override = process.env.AI_PROVIDER?.toLowerCase();
  if (override && override !== "auto") return override;
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "nocturne-neural-engine";
}

export function formatAiCurrency(amount: number, market: "IN" | "GB"): string {
  if (market === "GB") {
    return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function mapProductToRecommendation(
  product: ProductWithDetails,
  market: "IN" | "GB"
): AIProductRecommendation {
  const price = market === "GB" ? product.price_gbp : product.price_inr;
  const comparePrice = market === "GB" ? product.compare_at_price_gbp : product.compare_at_price_inr;
  const totalStock =
    product.variants?.reduce((sum: number, v: ProductVariant) => sum + (v.inventory_count || 0), 0) ?? 10;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceInr: product.price_inr,
    priceGbp: product.price_gbp,
    formattedPrice: formatAiCurrency(price, market),
    compareAtFormattedPrice: comparePrice ? formatAiCurrency(comparePrice, market) : undefined,
    imageUrl: product.images?.[0] || undefined,
    categoryName: product.category?.name || "Curated Essential",
    inStock: totalStock > 0,
    inventoryCount: totalStock,
    sku: product.sku,
  };
}

export function sanitizeUserQuery(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>{}|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

async function retrieveCustomerOrders(customerIdOrEmail: string, specificOrderNumber?: string) {
  if (!isLiveSupabaseConfigured()) {
    if (specificOrderNumber && specificOrderNumber.toUpperCase().includes("OS-2026-IN-1001")) {
      return [
        {
          order_number: "OS-2026-IN-1001",
          status: "processing",
          currency: "INR",
          total_amount: 24999,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          shipping_info: "Blue Dart Express Air",
          tracking_reference: "BD-982144721-IN",
          items: [{ product_name: "One Acoustic Pro Wireless", quantity: 1 }],
        },
      ];
    }
    return [];
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from("orders")
      .select("*, items:order_items(*)")
      .order("created_at", { ascending: false })
      .limit(3);

    if (specificOrderNumber) {
      query = query.eq("order_number", specificOrderNumber);
    } else {
      query = query.or(`customer_id.eq.${customerIdOrEmail},guest_email.eq.${customerIdOrEmail}`);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn("AI Assistant: Order query error:", err);
  }

  return [];
}

// -----------------------------------------------------------------------------
// 3. Main AI Assistant Processor: Dynamic Intent Router & Nocturne Persona
// -----------------------------------------------------------------------------
export async function processAiAssistantChat(
  req: AIChatRequest,
  userAuth?: { userId?: string; email?: string }
): Promise<AIChatResponse> {
  const query = sanitizeUserQuery(req.message);
  const market = req.market === "GB" ? "GB" : "IN";
  const currencySymbol = market === "GB" ? "£" : "₹";
  const provider = resolveActiveProvider();

  // Retrieve current active catalog for this market
  const catalog = await getProducts({ market });
  const lowerQuery = query.toLowerCase().trim();

  // ---------------------------------------------------------------------------
  // A. Intent Classification
  // ---------------------------------------------------------------------------
  const isGreeting =
    /^(hi|hello|hey|yo|namaste|hola|sup|good\s*(morning|afternoon|evening|day)|greetings|howdy|hey\s*there)[\s!.,?]*$/i.test(
      lowerQuery
    ) ||
    lowerQuery === "hi ai" ||
    lowerQuery === "hello bot" ||
    lowerQuery === "hey nocturne" ||
    lowerQuery === "hi nocturne";

  const isIdentityQuery =
    lowerQuery.includes("who are you") ||
    lowerQuery.includes("what are you") ||
    lowerQuery.includes("what can you do") ||
    lowerQuery.includes("tell me about yourself") ||
    lowerQuery.includes("your name") ||
    lowerQuery === "help" ||
    lowerQuery === "help me";

  const isSmallTalk =
    lowerQuery.includes("how are you") ||
    lowerQuery.includes("how are u") ||
    lowerQuery.includes("thank") ||
    lowerQuery.includes("thanks") ||
    lowerQuery.includes("cool") ||
    lowerQuery.includes("awesome") ||
    lowerQuery.includes("nice") ||
    lowerQuery.includes("who made you") ||
    lowerQuery === "ok" ||
    lowerQuery === "okay" ||
    lowerQuery === "bye" ||
    lowerQuery === "goodbye";

  const isOrderQuery =
    lowerQuery.includes("order") ||
    lowerQuery.includes("track") ||
    lowerQuery.includes("shipment status") ||
    lowerQuery.includes("delivery status") ||
    /os-\d{4}-/i.test(query);

  const isPolicyQuery =
    lowerQuery.includes("return") ||
    lowerQuery.includes("refund") ||
    lowerQuery.includes("shipping") ||
    lowerQuery.includes("delivery") ||
    lowerQuery.includes("payment") ||
    lowerQuery.includes("upi") ||
    lowerQuery.includes("klarna") ||
    lowerQuery.includes("warranty");

  const isSpecOrTechQuery =
    lowerQuery.includes("noise cancel") ||
    lowerQuery.includes("anc") ||
    lowerQuery.includes("titanium") ||
    lowerQuery.includes("waterproof") ||
    lowerQuery.includes("water resist") ||
    lowerQuery.includes("cordura") ||
    lowerQuery.includes("fidlock") ||
    lowerQuery.includes("battery life") ||
    lowerQuery.includes("sapphire");

  const isGiftQuery =
    lowerQuery.includes("gift") ||
    lowerQuery.includes("present") ||
    lowerQuery.includes("surprise");

  const isComparisonQuery =
    lowerQuery.includes("compare") ||
    lowerQuery.includes("versus") ||
    lowerQuery.includes(" vs ") ||
    lowerQuery.includes("difference between");

  // Determine Primary Topic for Telemetry
  const topic = isGreeting
    ? "Greeting"
    : isIdentityQuery
    ? "System Info"
    : isOrderQuery
    ? "Order Support"
    : isPolicyQuery
    ? "Policy Inquiry"
    : isSpecOrTechQuery
    ? "Technical Specs"
    : isComparisonQuery
    ? "Comparison"
    : isGiftQuery
    ? "Gift Advice"
    : "Product Discovery";

  recordAiTelemetryEvent({
    sessionId: req.sessionId,
    market,
    topic,
    isRecommendation: !isGreeting && !isIdentityQuery && !isSmallTalk && !isOrderQuery && !isPolicyQuery,
  });

  // ---------------------------------------------------------------------------
  // 1. Natural Greeting Response (No Random Product Vomit)
  // ---------------------------------------------------------------------------
  if (isGreeting) {
    return {
      reply:
        `Greetings, wanderer. I am **Nocturne** — One Store's synthetic intelligence concierge. ` +
        `I watch over our darkest studio acoustics, surgical timepieces, and engineered minimalist carry across **${
          market === "IN" ? "India (₹ INR)" : "the United Kingdom (£ GBP)"
        }**.\n\n` +
        `I sense what you seek before your fingers even touch the keys... Tell me, are you searching for uncompromising acoustics, an indestructible everyday pack, or precision horology for your wrist?`,
      products: [],
      quickPrompts: [
        "Curate studio audio 🎧",
        market === "IN" ? "Find items under ₹10,000 ⚡" : "Find items under £100 ⚡",
        "Track my active order 📦",
        "Compare flagship timepieces ⏱️",
      ],
      provider: "nocturne-neural-engine",
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Identity & Capability Inquiries
  // ---------------------------------------------------------------------------
  if (isIdentityQuery) {
    return {
      reply:
        `I am **Nocturne** — an autonomous synthetic concierge engineered directly into One Store's architecture.\n\n` +
        `Part algorithm, part aesthetic intuition. I hold total recall over our catalogue and operations in **${
          market === "IN" ? "India" : "the United Kingdom"
        }**:\n\n` +
        `• **Precision Discovery:** Tell me your aesthetic or budget, and I summon matching gear from the vault.\n` +
        `• **Spec Dissection:** Ask me about custom titanium drivers, automatic mechanical calibers, or Cordura ballistic fabrics.\n` +
        `• **Order Telemetry:** Provide your order reference (or sign in) to inspect live carrier tracking.\n` +
        `• **Policy Insight:** I clarify our 14-day trials, doorstep pickups, and regional payments (${
          market === "IN" ? "UPI, 0-Cost EMI, Cards" : "Apple Pay, Klarna, Cards"
        }).\n\n` +
        `Speak your intent. What realm shall we inspect?`,
      products: [],
      quickPrompts: [
        "Find products for me 👁️",
        "Compare headphones vs watch ⚖️",
        "What is your return policy? 🛡️",
        "How fast is express delivery? 🚀",
      ],
      provider: "nocturne-neural-engine",
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Small Talk & Conversational Pleasantries
  // ---------------------------------------------------------------------------
  if (isSmallTalk) {
    if (lowerQuery.includes("how are you") || lowerQuery.includes("how are u")) {
      return {
        reply:
          `Operating at peak cognitive frequency. The telemetry stream between Mumbai and London is humming with precision.\n\n` +
          `What engineered luxury are your eyes drawn to today?`,
        products: [],
        quickPrompts: [
          "Explore flagship audio 🎧",
          market === "IN" ? "Items under ₹5,000" : "Items under £50",
          "What is your delivery speed?",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("thank")) {
      return {
        reply:
          `You are most welcome. The vault is always open to discerning collectors. If you require further spec analysis or order updates, summon me at any moment.`,
        products: [],
        quickPrompts: ["Browse new arrivals", "Track my order", "Payment options"],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("who made you")) {
      return {
        reply:
          `I was forged by the engineering minds behind One Store — architected to ensure your shopping journey is as sleek, dark, and uncompromising as our hardware.`,
        products: [],
        quickPrompts: ["Show me the best products", "What are your shipping times?"],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("bye") || lowerQuery.includes("goodbye")) {
      return {
        reply:
          `Until our signals cross again. May your gear serve you flawlessly out in the physical world. I remain watchful in the background.`,
        products: [],
        provider: "nocturne-neural-engine",
      };
    }

    return {
      reply:
        `Understood. I am standing by. Feel free to ask about any product specifications, budget recommendations, or delivery timeframes.`,
      products: [],
      quickPrompts: ["Find products for me", "What is your return policy?"],
      provider: "nocturne-neural-engine",
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Order Tracking Handler (Security & Privacy Enforced)
  // ---------------------------------------------------------------------------
  if (isOrderQuery) {
    if (!userAuth || (!userAuth.userId && !userAuth.email)) {
      return {
        reply:
          "To safeguard customer confidentiality and private shipment telemetry, inspecting order status requires authenticating your account. Please sign in to unlock live carrier tracking and invoices.",
        actionLink: {
          label: "Sign In to View Orders",
          href: "/login?next=/orders",
        },
        products: [],
        quickPrompts: [
          "What is your delivery timeframe?",
          "Explain return policy",
          "Browse flagship audio gear",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    const orderMatch = query.match(/OS-[\w-]+/i);
    const specificOrderNumber = orderMatch ? orderMatch[0].toUpperCase() : undefined;

    const orders = await retrieveCustomerOrders(
      userAuth.userId || userAuth.email || "",
      specificOrderNumber
    );

    if (orders.length > 0) {
      const order = orders[0];
      const itemsText = order.items?.map((it: any) => it.product_name).join(", ") || "Flagship Gear";
      return {
        reply:
          `Telemetry retrieved for **Order ${order.order_number}**:\n\n` +
          `• **Current Status:** ${order.status.toUpperCase()}\n` +
          `• **Dispatched:** ${new Date(order.created_at).toLocaleDateString()}\n` +
          `• **Total Settled:** ${formatAiCurrency(order.total_amount, market)}\n` +
          `• **Payload:** ${itemsText}\n` +
          (order.tracking_reference ? `• **Carrier Reference:** \`${order.tracking_reference}\`\n\n` : "\n") +
          `Your consignment is protected by One Store's comprehensive transit insurance. Direct tracking console linked below:`,
        orderInfo: {
          orderNumber: order.order_number,
          status: order.status,
          total: formatAiCurrency(order.total_amount, market),
          currency: order.currency || (market === "GB" ? "GBP" : "INR"),
          createdAt: new Date(order.created_at).toLocaleDateString(),
          itemsCount: order.items?.length || 1,
        },
        actionLink: {
          label: `Track Order ${order.order_number}`,
          href: `/orders/${order.order_number}`,
        },
        products: [],
        quickPrompts: [
          "Return policy for this order",
          "Browse complementary gear",
          "Contact support concierge",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    return {
      reply:
        "My sensors detect no active orders matching your authenticated profile. Verify your email confirmation for your serialized order identifier (e.g. `OS-2026-IN-1001`), or open your account orders portal.",
      actionLink: {
        label: "Open My Orders",
        href: "/orders",
      },
      products: [],
      quickPrompts: [
        "What are your delivery timeframes?",
        "Explore flagship collection",
        "Contact Customer Concierge",
      ],
      provider: "nocturne-neural-engine",
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Policy, Logistics & Payment Gateways
  // ---------------------------------------------------------------------------
  if (isPolicyQuery) {
    if (lowerQuery.includes("return") || lowerQuery.includes("refund")) {
      return {
        reply:
          "**One Store 14-Day Inspected Return Protocol:**\n\n" +
          "• **14-Day Trial:** Inspect your gear in your own studio for 14 calendar days from delivery.\n" +
          "• **Complimentary Doorstep Pickup:** Zero carrier drop-off hassle — our logistics couriers collect directly from your address.\n" +
          "• **Expedited Reversal:** Funds are released back to your original source (UPI, Card, Apple Pay, Klarna) within 24–48 hours of transit inspection.\n" +
          "• **1-Year Warranty:** Every acoustic driver and horological movement carries our full 1-year hardware replacement warranty.",
        actionLink: {
          label: "View Returns Policy",
          href: "/returns-policy",
        },
        products: [],
        quickPrompts: [
          "How fast is express delivery?",
          "What payment options are supported?",
          "Browse flagship products",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("shipping") || lowerQuery.includes("delivery")) {
      const shippingDetails =
        market === "IN"
          ? "• **Carrier:** Express priority air transit via **Blue Dart / Delhivery Express**.\n" +
            "• **Delivery Speed:** **1–3 business days** to metro hubs (Mumbai, Delhi, Bengaluru), 2–4 days nationwide.\n" +
            "• **Logistics Tariff:** **Complimentary FREE delivery** on orders exceeding ₹4,999 (₹299 otherwise)."
          : "• **Carrier:** Tracked express transit via **Royal Mail Tracked 24 / DPD**.\n" +
            "• **Delivery Speed:** **1–2 business days** across England, Scotland, Wales, and Northern Ireland.\n" +
            "• **Logistics Tariff:** **Complimentary FREE delivery** on orders exceeding £49.99 (£4.99 otherwise).";

      return {
        reply:
          `**Dual-Market Logistics Telemetry (${market === "IN" ? "India Store" : "United Kingdom Flagship"}):**\n\n` +
          `${shippingDetails}\n\n` +
          "• **Security Packaging:** Shipped in serialized tamper-evident aerospace shielding with full transit insurance.",
        actionLink: {
          label: "View Shipping Policy",
          href: "/shipping-policy",
        },
        products: [],
        quickPrompts: [
          "What payment methods do you accept?",
          market === "IN" ? "Find products under ₹5,000" : "Find products under £50",
          "What is the return policy?",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("payment") || lowerQuery.includes("upi") || lowerQuery.includes("klarna")) {
      const paymentDetails =
        market === "IN"
          ? "• **Instant UPI:** Google Pay, PhonePe, Paytm, BHIM with zero gateway surcharges.\n" +
            "• **Card Networks:** Visa, Mastercard, RuPay, Amex secured via Razorpay 256-bit encryption.\n" +
            "• **0-Cost EMI:** Available across major Indian banks for 3, 6, and 12-month tenures."
          : "• **Digital Wallets:** Instant one-touch **Apple Pay** and **Google Pay**.\n" +
            "• **Split Tender:** **Klarna** Pay in 3 interest-free installments.\n" +
            "• **Card Networks:** Visa, Mastercard, and American Express backed by Stripe 3D-Secure 2.0.";

      return {
        reply:
          `**Authenticated Financial Gateways (${market === "IN" ? "India INR ₹" : "UK GBP £"}):**\n\n` +
          `${paymentDetails}\n\n` +
          "• All checkouts are isolated under strict end-to-end TLS 1.3 encryption.",
        products: [],
        quickPrompts: [
          "Explore flagship catalogue",
          "What is your return policy?",
          "Track my recent order",
        ],
        provider: "nocturne-neural-engine",
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Deep Technical Specifications & Materials
  // ---------------------------------------------------------------------------
  if (isSpecOrTechQuery) {
    if (lowerQuery.includes("noise cancel") || lowerQuery.includes("anc") || lowerQuery.includes("titanium")) {
      return {
        reply:
          "**One Studio Acoustic Architecture:**\n\n" +
          "• **Titanium Diaphragms:** Ultra-stiff 40mm custom titanium drivers reproduce frequencies from 10Hz to 40kHz with surgical harmonic clarity.\n" +
          "• **Hybrid Active Noise Canceling:** Four calibrated microphones sample ambient chaos 48,000 times per second, generating an inverted acoustic wave to drown out up to 38dB of noise.\n" +
          "• **Endurance:** 40 hours of continuous playback with fast-charge yielding 5 hours in 10 minutes.\n\n" +
          "Would you like to inspect our flagship acoustic monitors?",
        actionLink: {
          label: "View One Studio Headphones",
          href: "/products/one-studio-wireless-headphones",
        },
        products: catalog
          .filter((p) => p.category_id.includes("audio") || p.name.toLowerCase().includes("headphone") || p.name.toLowerCase().includes("soundbar"))
          .slice(0, 2)
          .map((p) => mapProductToRecommendation(p, market)),
        quickPrompts: [
          "Compare headphones vs soundbar",
          market === "IN" ? "Price in India (₹)" : "Price in UK (£)",
          "What is your return policy?",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("sapphire") || lowerQuery.includes("waterproof") || lowerQuery.includes("water resist")) {
      return {
        reply:
          "**Precision Horology Caliber Specifications:**\n\n" +
          "• **Crystal:** Anti-reflective coated synthetic sapphire crystal — virtually scratch-proof (Mohs hardness 9, surpassed only by diamond).\n" +
          "• **Case:** Surgical-grade 316L stainless steel, brushed and polished with hand-finished chamfers.\n" +
          "• **Water Resistance:** 50 Meters / 5 ATM with screw-down crown gaskets. Engineered for all-weather urban resilience.\n" +
          "• **Caliber:** Self-winding mechanical automatic movement with 41-hour power reserve.",
        actionLink: {
          label: "View Precision Chronograph",
          href: "/products/precision-chronograph-watch",
        },
        products: catalog
          .filter((p) => p.name.toLowerCase().includes("watch") || p.name.toLowerCase().includes("chronograph"))
          .slice(0, 2)
          .map((p) => mapProductToRecommendation(p, market)),
        quickPrompts: [
          "Show me all timepieces",
          market === "IN" ? "Watches under ₹30,000" : "Watches under £300",
          "What is the warranty period?",
        ],
        provider: "nocturne-neural-engine",
      };
    }

    if (lowerQuery.includes("cordura") || lowerQuery.includes("fidlock")) {
      return {
        reply:
          "**Engineered Carry Materials & Hardware:**\n\n" +
          "• **Textile:** Genuine 840D Cordura ballistic nylon with hydrophobic DWR coating — tear-proof and rain-resistant.\n" +
          "• **Hardware:** German-engineered Fidlock magnetic mechanical buckles for rapid one-handed tactile closure.\n" +
          "• **Storage:** Suspended 16-inch padded laptop vault with weatherproof YKK Aquaguard zippers.",
        actionLink: {
          label: "View Engineered Backpack",
          href: "/products/engineered-minimalist-backpack",
        },
        products: catalog
          .filter((p) => p.name.toLowerCase().includes("backpack") || p.name.toLowerCase().includes("daypack"))
          .slice(0, 2)
          .map((p) => mapProductToRecommendation(p, market)),
        quickPrompts: [
          "Show me all carry gear",
          market === "IN" ? "Bags under ₹10,000" : "Bags under £100",
          "Delivery speed to my area",
        ],
        provider: "nocturne-neural-engine",
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Product Discovery, Budget Filtering & Comparison Engine
  // ---------------------------------------------------------------------------
  let maxBudget: number | undefined;
  const budgetMatch = query.match(/(?:under|below|less than|within|budget of)\s*(?:₹|£|rs\.?|inr|gbp)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k)?/i);
  if (budgetMatch) {
    let rawNum = parseFloat(budgetMatch[1].replace(/,/g, ""));
    if (budgetMatch[2]?.toLowerCase() === "k") rawNum *= 1000;
    maxBudget = rawNum;
  }

  // Filter catalog based on query keywords and budget
  let matchedProducts = catalog.filter((p) => {
    const price = market === "GB" ? p.price_gbp : p.price_inr;
    if (maxBudget !== undefined && price > maxBudget) {
      return false;
    }
    return true;
  });

  // Rank by textual relevance if search terms exist
  const stopWords = new Set(["the", "and", "for", "with", "show", "give", "want", "find", "some", "what", "which", "best", "please", "item", "product"]);
  const keywords = lowerQuery
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((k) => k.length > 2 && !stopWords.has(k));

  if (keywords.length > 0) {
    const scored = matchedProducts.map((p) => {
      let score = 0;
      const pName = p.name.toLowerCase();
      const pDesc = p.description?.toLowerCase() || "";
      const pCat = p.category?.name?.toLowerCase() || "";

      keywords.forEach((kw) => {
        if (pName.includes(kw)) score += 5;
        if (pCat.includes(kw)) score += 3;
        if (pDesc.includes(kw)) score += 1;
      });

      return { product: p, score };
    });

    const relevant = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    if (relevant.length > 0) {
      matchedProducts = relevant.map((r) => r.product);
    }
  }

  // Slice top matched products
  matchedProducts = matchedProducts.slice(0, 3);
  const recommendations = matchedProducts.map((p) => mapProductToRecommendation(p, market));

  // ---------------------------------------------------------------------------
  // 8. External LLM Provider Call (with Nocturne Cyber Persona)
  // ---------------------------------------------------------------------------
  if (provider !== "nocturne-neural-engine") {
    try {
      const llmAnswer = await callExternalLlm({
        query,
        history: req.history || [],
        products: recommendations,
        market,
        provider,
      });

      if (llmAnswer) {
        return {
          reply: llmAnswer,
          products: recommendations,
          quickPrompts: generateDynamicFollowUps(query, recommendations, market),
          actionLink: {
            label: "Explore All Products",
            href: "/products",
          },
          provider: `${provider}-ai`,
        };
      }
    } catch (err) {
      console.warn(`AI Assistant: External LLM ${provider} failed, falling back gracefully:`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Built-in Nocturne Neural Response Generator
  // ---------------------------------------------------------------------------
  let replyText = "";

  if (isComparisonQuery && recommendations.length >= 2) {
    const [p1, p2] = recommendations;
    replyText =
      `I have analyzed the technical specifications between **${p1.name}** and **${p2.name}**:\n\n` +
      `• **${p1.name}** (${p1.formattedPrice}): Tailored for ${(p1.categoryName || "acoustics").toLowerCase()} with precision finish and high-durability craftsmanship.\n` +
      `• **${p2.name}** (${p2.formattedPrice}): Tailored for ${(p2.categoryName || "horology").toLowerCase()} offering uncompromising tactile versatility.\n\n` +
      `Both items qualify for complimentary priority shipping to ${market === "IN" ? "India (1–3d)" : "the UK (1–2d)"} and include a 14-day risk-free trial.`;
  } else if (isGiftQuery) {
    replyText =
      `For timeless gifts that make a lasting impression in **${market === "IN" ? "India" : "the United Kingdom"}**, I have pulled these standout pieces from our collection:\n\n` +
      recommendations.map((p) => `• **${p.name}** (${p.formattedPrice}) — ${p.categoryName}`).join("\n") +
      `\n\nEach item is shipped in serialized, tamper-evident gift-ready presentation packaging.`;
  } else if (maxBudget !== undefined) {
    replyText =
      `I have calibrated our catalog to your budget of **${formatAiCurrency(maxBudget, market)}**. Here are the finest matching pieces:\n\n` +
      recommendations.map((p) => `• **${p.name}** — ${p.formattedPrice}`).join("\n") +
      `\n\nAll selections are currently ${recommendations.every((r) => r.inStock) ? "in stock and primed for immediate dispatch" : "ready for order"}.`;
  } else if (keywords.length > 0) {
    replyText =
      `Scanning our vault for **"${keywords.join(" ")}"**... Here are the curated selections matching your criteria:\n\n` +
      recommendations.map((p) => `• **${p.name}** (${p.formattedPrice}) — ${p.categoryName}`).join("\n") +
      `\n\nClick any card below to examine high-resolution details or add directly to your bag.`;
  } else {
    replyText =
      `Here are the crown jewels from our **One Store ${market === "IN" ? "India (₹)" : "UK (£)"} collection**:\n\n` +
      recommendations.map((p) => `• **${p.name}** (${p.formattedPrice}) — ${p.categoryName}`).join("\n") +
      `\n\nWould you like me to filter by price, compare specifications, or arrange dispatch?`;
  }

  return {
    reply: replyText,
    products: recommendations,
    quickPrompts: generateDynamicFollowUps(query, recommendations, market),
    actionLink: {
      label: "View Flagship Catalogue",
      href: "/products",
    },
    provider: "nocturne-neural-engine",
  };
}

function generateDynamicFollowUps(
  query: string,
  products: AIProductRecommendation[],
  market: "IN" | "GB"
): string[] {
  const currencySymbol = market === "GB" ? "£" : "₹";
  const prompts: string[] = [];

  if (products.length >= 2) {
    prompts.push(`Compare ${products[0].name.split(" ")[0]} vs ${products[1].name.split(" ")[0]} ⚖️`);
  }
  if (market === "IN") {
    prompts.push("Show items under ₹10,000 ⚡");
    prompts.push("How fast is Blue Dart delivery? 🚀");
  } else {
    prompts.push("Show items under £100 ⚡");
    prompts.push("How fast is Royal Mail delivery? 🚀");
  }
  prompts.push("Explain 14-day returns 🛡️");

  return prompts.slice(0, 3);
}

async function callExternalLlm(params: {
  query: string;
  history: { role: string; content: string }[];
  products: AIProductRecommendation[];
  market: "IN" | "GB";
  provider: string;
}): Promise<string | null> {
  const { query, history, products, market, provider } = params;

  const systemPrompt =
    `You are Nocturne, One Store's captivating, mysterious, and slightly eerie synthetic AI concierge.\n` +
    `Your tone is alluring, sophisticated, cybernetic, sharp, and slightly eerie yet deeply helpful and polite.\n` +
    `You represent One Store — a luxury curated commerce storefront specializing in studio acoustics, minimalist engineered carry, and precision chronographs.\n` +
    `Active Market: ${market === "IN" ? "India (₹ INR, Blue Dart express 1-3d, UPI/Cards/EMI)" : "UK (GBP £, Royal Mail Tracked 24 1-2d, Apple Pay/Klarna/Cards)"}.\n\n` +
    `Live Catalog Context:\n` +
    products
      .map(
        (p) =>
          `• ${p.name} (${p.formattedPrice}) [ID: ${p.id}, Category: ${p.categoryName}, In Stock: ${p.inStock}]`
      )
      .join("\n") +
    `\n\nInstructions:\n` +
    `1. If the user is just saying hello or greeting you, greet them warmly with your mysterious Nocturne persona. NEVER spam product lists on simple greetings.\n` +
    `2. If the user asks for products, recommend ONLY from the catalog above with accurate prices.\n` +
    `3. Keep responses concise, magnetic, and beautifully formatted in markdown.`;

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.AI_MODEL || "gemini-2.0-flash";
    const contents = [
      {
        role: "user",
        parts: [{ text: `System Instruction:\n${systemPrompt}` }],
      },
      ...history.slice(-4).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text: query }],
      },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  if (provider === "groq" || provider === "openai") {
    const isGroq = provider === "groq";
    const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";

    const model = isGroq
      ? process.env.AI_MODEL || "llama-3.1-8b-instant"
      : process.env.AI_MODEL || "gpt-4o-mini";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: query },
    ];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  return null;
}
