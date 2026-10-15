export type MarketCode = "IN" | "GB";
export type CurrencyCode = "INR" | "GBP";

export interface MarketShippingConfig {
  freeShippingThreshold: number;
  standardFee: number;
  expressFee: number;
  carrierName: string;
  estimatedDeliveryDays: string;
  trackingCarrierUrl: string;
}

export interface MarketTaxConfig {
  ratePercent: number;
  taxName: string; // GST vs VAT
  includedInPrice: boolean;
}

export interface MarketPaymentConfig {
  primaryGateway: "razorpay" | "stripe";
  supportedMethods: string[];
}

export interface MarketConfig {
  code: MarketCode;
  name: string;
  countryName: string;
  flagEmoji: string;
  currency: CurrencyCode;
  currencySymbol: string;
  locale: string;
  phoneCode: string;
  shipping: MarketShippingConfig;
  tax: MarketTaxConfig;
  payment: MarketPaymentConfig;
  returnWindowDays: number;
}

export const MARKETS_CONFIG: Record<MarketCode, MarketConfig> = {
  IN: {
    code: "IN",
    name: "India",
    countryName: "Republic of India",
    flagEmoji: "🇮🇳",
    currency: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
    phoneCode: "+91",
    shipping: {
      freeShippingThreshold: 1999, // Free shipping on orders over ₹1,999
      standardFee: 149,
      expressFee: 299,
      carrierName: "Blue Dart / Delhivery Express",
      estimatedDeliveryDays: "2 to 4 business days",
      trackingCarrierUrl: "https://www.delhivery.com/track/package/",
    },
    tax: {
      ratePercent: 18,
      taxName: "GST (CGST + SGST)",
      includedInPrice: true,
    },
    payment: {
      primaryGateway: "razorpay",
      supportedMethods: ["UPI", "Credit/Debit Card", "NetBanking", "RuPay", "EMI"],
    },
    returnWindowDays: 14,
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    countryName: "United Kingdom",
    flagEmoji: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
    phoneCode: "+44",
    shipping: {
      freeShippingThreshold: 50, // Free shipping on orders over £50
      standardFee: 4.99,
      expressFee: 8.99,
      carrierName: "Royal Mail Tracked 24/48",
      estimatedDeliveryDays: "2 to 3 business days",
      trackingCarrierUrl: "https://www.royalmail.com/track-your-item#/",
    },
    tax: {
      ratePercent: 20,
      taxName: "UK VAT",
      includedInPrice: true,
    },
    payment: {
      primaryGateway: "stripe",
      supportedMethods: ["Debit / Credit Card (Visa, Mastercard, Amex)", "Apple Pay", "Google Pay"],
    },
    returnWindowDays: 14,
  },
};

export const DEFAULT_MARKET: MarketCode = "IN";

/**
 * Validates and normalizes market code on the server or client.
 */
export function validateMarket(code: unknown): MarketCode {
  if (typeof code === "string") {
    const upper = code.toUpperCase();
    if (upper === "IN" || upper === "GB") {
      return upper as MarketCode;
    }
  }
  return DEFAULT_MARKET;
}

/**
 * Validates that currency matches the market
 */
export function validateMarketCurrency(market: MarketCode, currency: unknown): boolean {
  const expected = MARKETS_CONFIG[market].currency;
  return typeof currency === "string" && currency.toUpperCase() === expected;
}

/**
 * Format price according to market conventions
 */
export function formatMarketPrice(amount: number, market: MarketCode): string {
  const config = MARKETS_CONFIG[market];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: market === "IN" ? 0 : 2,
    maximumFractionDigits: market === "IN" ? 0 : 2,
  }).format(amount);
}
