// Centralized TypeScript type definitions for the application

// User and Authentication Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: number;
  role_id: number;
  assigned_at: string;
  assigned_by?: number;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
  assigned_at: string;
  assigned_by?: number;
}

// Book and Content Types
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  cover_image?: string;
  price: number;
  status: 'published' | 'draft' | 'archived';
  category_id?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  word_count?: number;
  reading_time?: number;
  language?: string;
  category?: string;
  tags?: string[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: number;
  name: string;
  bio?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

// Order and E-commerce Types
export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method?: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  currency: string;
  shipping_address?: Address;
  billing_address?: Address;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
  payment_transaction_id?: string;
  shipping_method?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  item_count?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  book_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id?: number;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
}

// Library and Reading Types
export interface Library {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryBook {
  id: number;
  library_id: number;
  book_id: number;
  added_at: string;
  added_by: number;
}

export interface ReadingProgress {
  id: number;
  user_id: number;
  book_id: number;
  progress_percentage: number;
  current_page?: number;
  total_pages?: number;
  reading_time_minutes: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  search?: string;
  status?: string;
  category_id?: number;
  author_id?: number;
  date_from?: string;
  date_to?: string;
}

// Component Props Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
}

export interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate?: (orderId: number, newStatus: string) => void;
  onPaymentStatusUpdate?: (orderId: number, newPaymentStatus: string) => void;
}

export interface OrderStatusManagerProps {
  order: Order;
  onStatusUpdate: (orderId: number, newStatus: string, notes?: string) => void;
  onPaymentStatusUpdate: (orderId: number, newPaymentStatus: string, notes?: string) => void;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  category_id?: number;
  status: 'published' | 'draft' | 'archived';
  cover_image?: string;
  language?: string;
  category?: string;
  tags?: string[];
}

export interface OrderFormData {
  user_id?: number;
  guest_email?: string;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  items: Array<{
    book_id: number;
    quantity: number;
  }>;
}

// Utility Types
export type StatusType = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethodType = 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
export type UserStatusType = 'active' | 'inactive' | 'suspended';
export type BookStatusType = 'published' | 'draft' | 'archived';

// Session and Auth Types
export interface SessionUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  roleDisplayName: string;
  roles: string[];
  permissions: string[];
  lastLogin: string;
}

export interface AuthToken {
  email: string;
  sub: string;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  roleDisplayName: string;
  roles: string[];
  permissions: string[];
  lastLogin: string;
  iat: number;
  exp: number;
  jti: string;
}

// Database Query Types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Export all types from other files
export * from './ecommerce';
export * from './next-auth'; 