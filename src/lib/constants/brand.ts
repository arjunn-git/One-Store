export const BRAND = {
  name: "One Store",
  tagline: "India's Premier Destination for Curated Audio, Carry & Studio Essentials",
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
      code: "IN",
      name: "India",
      currency: "INR",
      symbol: "₹",
      phoneCode: "+91",
    },
  },
  defaultCurrency: "INR",
} as const;

export type SupportedMarket = "IN" | "GB";
export type SupportedCurrency = "INR" | "GBP";
