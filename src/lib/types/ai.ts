export interface AIProductRecommendation {
  id: string;
  name: string;
  slug: string;
  priceInr: number;
  priceGbp: number;
  formattedPrice: string;
  compareAtFormattedPrice?: string;
  imageUrl?: string;
  categoryName?: string;
  inStock: boolean;
  inventoryCount: number;
  sku: string;
  highlight?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  products?: AIProductRecommendation[];
  quickPrompts?: string[];
  actionLink?: {
    label: string;
    href: string;
  };
  orderInfo?: {
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    createdAt: string;
    itemsCount: number;
  };
  feedback?: "up" | "down" | null;
  provider?: string;
}

export interface AIChatRequest {
  message: string;
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  market?: "IN" | "GB";
  sessionId?: string;
}

export interface AIChatResponse {
  reply: string;
  products?: AIProductRecommendation[];
  quickPrompts?: string[];
  actionLink?: {
    label: string;
    href: string;
  };
  orderInfo?: {
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    createdAt: string;
    itemsCount: number;
  };
  provider: string;
  error?: string;
}

export interface AIAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  totalRecommendationRequests: number;
  activeProvider: string;
  isLlmConfigured: boolean;
  commonTopics: Array<{ topic: string; count: number }>;
  marketBreakdown: {
    IN: number;
    GB: number;
  };
}
