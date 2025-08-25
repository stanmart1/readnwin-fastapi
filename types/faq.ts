// FAQ System TypeScript Types
// ReadnWin Next.js Application

export interface FAQCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  updated_by?: number;
}

export interface FAQWithCategory extends FAQ {
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category: string;
  priority?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface UpdateFAQRequest extends Partial<CreateFAQRequest> {
  id: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: number;
}

export interface FAQSearchParams {
  query?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'priority' | 'created_at' | 'view_count';
  sortOrder?: 'asc' | 'desc';
}

export interface FAQSearchResponse {
  faqs: FAQWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FAQStats {
  total_faqs: number;
  total_categories: number;
  total_views: number;
  most_viewed_faq?: FAQWithCategory;
  recent_faqs: FAQWithCategory[];
}

export interface FAQAnalytics {
  faq_id: number;
  question: string;
  view_count: number;
  search_count: number;
  helpful_count: number;
  not_helpful_count: number;
  last_viewed?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props Types
export interface FAQItemProps {
  faq: FAQWithCategory;
  isOpen?: boolean;
  onToggle?: (id: number) => void;
  onView?: (id: number) => void;
  onHelpful?: (id: number, helpful: boolean) => void;
}

export interface FAQAccordionProps {
  faqs: FAQWithCategory[];
  defaultOpen?: number[];
  onView?: (id: number) => void;
  onHelpful?: (id: number, helpful: boolean) => void;
}

export interface FAQSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export interface FAQCategoriesProps {
  categories: FAQCategory[];
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  onClearCategory: () => void;
  className?: string;
}

export interface FAQPageProps {
  initialFaqs?: FAQWithCategory[];
  categories?: FAQCategory[];
  stats?: FAQStats;
  searchParams?: FAQSearchParams;
}

// Admin Management Types
export interface FAQManagementProps {
  faqs: FAQWithCategory[];
  categories: FAQCategory[];
  stats: FAQStats;
  onRefresh: () => void;
}

export interface FAQFormProps {
  faq?: FAQ;
  categories: FAQCategory[];
  onSubmit: (data: CreateFAQRequest | UpdateFAQRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CategoryFormProps {
  category?: FAQCategory;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// SEO Types
export interface FAQStructuredData {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: {
      "@type": string;
      text: string;
    };
  }>;
}

// Error Types
export interface FAQError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// Validation Types
export interface FAQValidationErrors {
  question?: string;
  answer?: string;
  category?: string;
  priority?: string;
}

export interface CategoryValidationErrors {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
} 