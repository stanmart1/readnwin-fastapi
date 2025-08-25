/**
 * Enhanced API service for book upload with full backend integration
 */

export interface BookUploadData {
  // Required fields
  title: string;
  author_id: string;
  category_id: string;
  price: string;
  
  // Optional basic fields
  subtitle?: string;
  isbn?: string;
  description?: string;
  short_description?: string;
  language?: string;
  pages?: string;
  publication_date?: string;
  publisher?: string;
  
  // Book type and format
  book_type?: 'physical' | 'ebook' | 'both';
  format?: string;
  
  // Pricing fields
  original_price?: string;
  cost_price?: string;
  
  // Physical book fields
  weight_grams?: string;
  dimensions?: string;
  shipping_class?: string;
  
  // Inventory management
  stock_quantity?: string;
  inventory_enabled?: boolean;
  low_stock_threshold?: string;
  
  // Status and features
  status?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new_release?: boolean;
  
  // SEO fields
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

export interface BookUploadFiles {
  cover_image?: File;
  ebook_file?: File;
  audiobook_file?: File;
  sample_file?: File;
}

export interface BookUploadResponse {
  message: string;
  book_id: number;
  book: {
    id: number;
    title: string;
    subtitle?: string;
    author: string;
    price: number;
    status: string;
    is_featured: boolean;
    is_bestseller: boolean;
    is_new_release: boolean;
    inventory_enabled: boolean;
    stock_quantity: number;
  };
}

export class BookUploadService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  
  /**
   * Create a new book with files
   */
  async createBook(data: BookUploadData, files: BookUploadFiles): Promise<BookUploadResponse> {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });
    
    const response = await fetch(`${this.baseUrl}/admin/books`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create book');
    }
    
    return response.json();
  }
  
  /**
   * Update an existing book
   */
  async updateBook(bookId: number, data: Partial<BookUploadData>, files?: BookUploadFiles): Promise<BookUploadResponse> {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Add files if provided
    if (files) {
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/admin/books/${bookId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update book');
    }
    
    return response.json();
  }
  
  /**
   * Get all books with filtering
   */
  async getBooks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category_id?: number;
    format?: string;
    is_featured?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/admin/books?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch books');
    }
    
    return response.json();
  }
  
  /**
   * Delete a book
   */
  async deleteBook(bookId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete book');
    }
    
    return response.json();
  }
  
  /**
   * Get categories for dropdown
   */
  async getCategories() {
    const response = await fetch(`${this.baseUrl}/admin/categories`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch categories');
    }
    
    return response.json();
  }
  
  /**
   * Get authors for dropdown
   */
  async getAuthors() {
    const response = await fetch(`${this.baseUrl}/admin/authors`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch authors');
    }
    
    return response.json();
  }
  
  /**
   * Bulk operations
   */
  async bulkDelete(bookIds: number[]): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/admin/books/bulk-delete`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ book_ids: bookIds })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk delete books');
    }
    
    return response.json();
  }
  
  async bulkUpdateStatus(bookIds: number[], status: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/admin/books/bulk-status`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ book_ids: bookIds, status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk update status');
    }
    
    return response.json();
  }
  
  async bulkFeature(bookIds: number[], isFeatured: boolean): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/admin/books/bulk-feature`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ book_ids: bookIds, is_featured: isFeatured })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk update featured status');
    }
    
    return response.json();
  }
}

// Export singleton instance
export const bookUploadService = new BookUploadService();