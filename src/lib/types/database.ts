export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "support" | "fulfillment" | "operations" | "admin" | "owner";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "awaiting_fulfillment"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded";

export interface CustomerProfile {
  id: string; // internal UUID
  auth_user_id: string; // Supabase auth.users UUID
  full_name: string | null;
  email: string | null;
  is_email_verified: boolean;
  phone: string | null;
  is_phone_verified: boolean;
  country: string;
  preferred_currency: "INR" | "GBP";
  role: UserRole;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state_or_province: string;
  postal_code: string;
  country_code: "IN" | "GB";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  images: string[];
  price_inr: number;
  compare_at_price_inr?: number | null;
  price_gbp: number;
  compare_at_price_gbp?: number | null;
  cost_price_inr?: number | null;
  cost_price_gbp?: number | null;
  supplier_name?: string | null;
  available_in_in?: boolean;
  available_in_gb?: boolean;
  shipping_info?: string | null;
  sku: string;
  status: "draft" | "active" | "archived";
  seo_title?: string | null;
  seo_description?: string | null;
  is_featured: boolean;
  is_test_data?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_inr_adjustment: number;
  price_gbp_adjustment: number;
  cost_price_inr?: number | null;
  cost_price_gbp?: number | null;
  inventory_count: number;
  reserved_count?: number;
  low_stock_threshold: number;
  options: Record<string, string>;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  change_amount: number;
  previous_count: number;
  new_count: number;
  reason: string;
  performed_by?: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  currency: "INR" | "GBP";
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: "INR" | "GBP";
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: Address;
  billing_address?: Address | null;
  promo_code_id?: string | null;
  payment_provider?: "razorpay" | "stripe" | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_spend?: number | null;
  currency_restriction?: "INR" | "GBP" | null;
  max_uses?: number | null;
  current_uses: number;
  per_customer_limit: number;
  is_active: boolean;
  starts_at: string;
  expires_at?: string | null;
  created_at: string;
}

export type ActivityEventType =
  | "ORDER_CREATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CART_ADD"
  | "CART_REMOVE"
  | "CHECKOUT_INITIATED"
  | "MARKET_SWITCH"
  | "CUSTOMER_LOGIN"
  | "CUSTOMER_SIGNUP"
  | "CUSTOMER_LOGOUT"
  | "SEARCH_QUERY"
  | "INVENTORY_UPDATE"
  | "SUPPORT_INQUIRY";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  action: string;
  actor: string;
  market: "IN" | "GB";
  currency: "INR" | "GBP";
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}
