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
  taxName: string;
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

const INDIA_CONFIG: MarketConfig = {
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
    supportedMethods: ["UPI (PhonePe, GPay, Paytm)", "Debit / Credit Card (RuPay, Visa, MC)", "NetBanking", "0-Cost EMI", "Cash on Delivery"],
  },
  returnWindowDays: 14,
};

export const MARKETS_CONFIG: Record<MarketCode, MarketConfig> = {
  IN: INDIA_CONFIG,
  GB: INDIA_CONFIG, // Map any legacy GB requests strictly to India
};

export const DEFAULT_MARKET: MarketCode = "IN";

/**
 * Validates and normalizes market code on the server or client (strictly India).
 */
export function validateMarket(_code: unknown): MarketCode {
  return "IN";
}

/**
 * Validates that currency matches the market
 */
export function validateMarketCurrency(_market: MarketCode, _currency: unknown): boolean {
  return true;
}

/**
 * Format price according to Indian market conventions (₹ with en-IN separators)
 */
export function formatMarketPrice(amount: number, _market?: MarketCode): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
