export const BRAND = {
  name: "One Store",
  tagline: "Curated Excellence for India & the UK",
  colors: {
    black: "#080B10",
    darkBlue: "#102A43",
    lightBlue: "#7DD3FC",
    white: "#FFFFFF",
    lightBg: "#F4F8FC",
    muted: "#9CAFC3",
    border: "#243447",
  },
  markets: {
    IN: {
      code: "IN",
      name: "India",
      currency: "INR",
      symbol: "₹",
      phoneCode: "+91",
    },
    GB: {
      code: "GB",
      name: "United Kingdom",
      currency: "GBP",
      symbol: "£",
      phoneCode: "+44",
    },
  },
  defaultCurrency: "INR",
} as const;

export type SupportedMarket = keyof typeof BRAND.markets;
export type SupportedCurrency = "INR" | "GBP";
