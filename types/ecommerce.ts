// Ecommerce System Types and Interfaces
// Supports both eBooks and Physical Books with intelligent checkout flow

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: number;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  social_media?: Record<string, any>;
  is_verified: boolean;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author_id: number;
  author_name?: string;
  category_id: number;
  category_name?: string;
  isbn?: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  sample_pdf_url?: string;
  ebook_file_url?: string;
  format: 'ebook' | 'physical' | 'both';
  language: string;
  pages?: number;
  publication_date?: string;
  publisher?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  weight_grams?: number; // For physical books
  dimensions?: { length: number; width: number; height: number }; // For physical books
  stock_quantity: number; // For physical books
  low_stock_threshold: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  status: 'draft' | 'published' | 'archived' | 'out_of_stock';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  view_count: number;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  book_id: number;
  quantity: number;
  added_at: string;
  book?: Book;
}

export interface CartAnalytics {
  totalItems: number;
  totalValue: number;
  totalSavings: number;
  itemCount: number;
  averageItemValue: number;
  ebookCount: number;
  physicalCount: number;
  isEbookOnly: boolean;
  isPhysicalOnly: boolean;
  isMixedCart: boolean;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description?: string;
  base_cost: number;
  cost_per_item: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_transaction_id?: string;
  shipping_address?: ShippingAddress;
  billing_address?: BillingAddress;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  book_id: number;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
  total_price: number;
  format: 'ebook' | 'physical' | 'both';
  created_at: string;
  book?: Book;
}

export interface UserLibraryItem {
  id: number;
  user_id: number;
  book_id: number;
  order_id?: number;
  purchase_date: string;
  download_count: number;
  last_downloaded_at?: string;
  is_favorite: boolean;
  book?: Book;
  readingProgress?: {
    currentPage: number;
    totalPages: number;
    progressPercentage: number;
    lastReadAt: string | null;
  };
}

export interface PaymentTransaction {
  id: number;
  transaction_id: string;
  order_id?: number;
  gateway_id: string; // 'flutterwave', 'paystack', 'bank_transfer'
  user_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  gateway_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BankTransferProof {
  id: number;
  transaction_id: string;
  user_id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  amount: number;
  reference_number?: string;
  proof_image_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: number;
  country: string;
  state?: string;
  city?: string;
  postal_code?: string;
  rate: number;
  tax_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Discount {
  id: number;
  code?: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  applicable_categories?: number[];
  applicable_books?: number[];
  created_at: string;
  updated_at: string;
}

export interface PaymentGateway {
  id: number;
  gateway_id: string; // 'flutterwave', 'paystack'
  name: string;
  description?: string;
  enabled: boolean;
  test_mode: boolean;
  public_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  hash?: string; // For Flutterwave
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

// Checkout Flow Types
export interface CheckoutFormData {
  shipping: ShippingAddress;
  billing: BillingAddress & { sameAsShipping: boolean };
  payment: {
    method: 'flutterwave' | 'paystack' | 'bank_transfer';
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  };
  shippingMethod?: ShippingMethod;
  discountCode?: string;
}

export interface CheckoutSummary {
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  estimated_delivery?: string;
  isEbookOnly: boolean;
  isPhysicalOnly: boolean;
  isMixedCart: boolean;
}

// Payment Gateway Response Types
export interface FlutterwavePaymentData {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  tx_ref: string;
  redirect_url?: string;
  customer: {
    email: string;
    phone_number?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface PayStackPaymentData {
  amount: number;
  email: string;
  reference: string;
  currency?: string;
  callback_url?: string;
  channels?: string[];
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CartResponse {
  cartItems: CartItem[];
  analytics: CartAnalytics;
}

export interface OrderResponse {
  order: Order;
  paymentUrl?: string;
  bankTransferDetails?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    amount: number;
    reference: string;
  };
}

// Admin Dashboard Types
export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_order_value: number;
}

export interface InventoryStats {
  total_books: number;
  low_stock_books: number;
  out_of_stock_books: number;
  total_physical_books: number;
  total_ebooks: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  users_with_library: number;
}

// Utility Types
export type BookFormat = 'ebook' | 'physical' | 'both';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'pending_bank_transfer' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'flutterwave' | 'bank_transfer';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled'; 