'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CartItem, CartAnalytics, Book } from '@/types/ecommerce';

interface CartContextType {
  // Cart state
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Cart analytics
  analytics: CartAnalytics;
  
  // Cart type helpers
  isEbookOnly: () => boolean;
  isPhysicalOnly: () => boolean;
  isMixedCart: () => boolean;
  
  // Cart actions
  addToCart: (bookId: number, quantity?: number) => Promise<void>;
  updateQuantity: (bookId: number, quantity: number) => Promise<void>;
  removeFromCart: (bookId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Cart calculations
  getSubtotal: () => number;
  getTotalSavings: () => number;
  getTotalItems: () => number;
  
  // Refresh cart
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Use auth from useAuth hook
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CartAnalytics>({
    totalItems: 0,
    totalValue: 0,
    totalSavings: 0,
    itemCount: 0,
    averageItemValue: 0,
    ebookCount: 0,
    physicalCount: 0,
    isEbookOnly: false,
    isPhysicalOnly: false,
    isMixedCart: false
  });

  // Load cart items when user session changes
  useEffect(() => {
    console.log('🔄 Cart context effect triggered - isAuthenticated:', isAuthenticated, 'user:', user?.id);
    
    if (isAuthenticated && user?.id) {
      console.log('🛒 Loading cart items for authenticated user...');
      // Add small delay to ensure token is properly set
      setTimeout(() => {
        loadCartItems();
      }, 100);
    } else {
      console.log('🛒 Clearing cart - user not authenticated');
      // Clear cart when user logs out
      setCartItems([]);
      setAnalytics({
        totalItems: 0,
        totalValue: 0,
        totalSavings: 0,
        itemCount: 0,
        averageItemValue: 0,
        ebookCount: 0,
        physicalCount: 0,
        isEbookOnly: false,
        isPhysicalOnly: false,
        isMixedCart: false
      });
    }
  }, [isAuthenticated, user]);

  // Listen for cart refresh events (e.g., after guest cart transfer)
  useEffect(() => {
    const handleCartRefresh = () => {
      console.log('🔄 Cart refresh event received, reloading cart items...');
      if (user?.id) {
        loadCartItems();
      }
    };

    window.addEventListener('cart-refresh', handleCartRefresh);
    
    return () => {
      window.removeEventListener('cart-refresh', handleCartRefresh);
    };
  }, [user?.id]);

  const loadCartItems = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping cart load');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired or invalid, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
        throw new Error('Failed to load cart');
      }

      const cartData = await response.json();
      console.log('📦 Raw cart data from API:', cartData);
      console.log('📦 Book formats in cart:', cartData.map((item: any) => ({ 
        title: item.book_title, 
        format: item.book_format,
        id: item.book_id 
      })));
      const formattedItems = cartData.map((item: any) => ({
        id: item.id,
        user_id: user?.id || 0,
        book_id: item.book_id,
        quantity: item.quantity,
        added_at: new Date().toISOString(),
        book: {
          id: item.book_id,
          title: item.book_title,
          author_name: item.book_author,
          price: item.book_price,
          original_price: item.book_original_price,
          cover_image_url: item.book_cover,
          format: item.book_format || 'ebook',
          category_name: item.book_category,
          stock_quantity: item.book_stock_quantity,
          // Add required fields from API response
          author_id: item.author_id || 0,
          category_id: item.category_id || 0,
          language: item.language || 'en',
          low_stock_threshold: item.low_stock_threshold || 0,
          is_featured: item.is_featured || false,
          is_bestseller: item.is_bestseller || false,
          is_new_release: item.is_new_release || false,
          status: item.status || 'published' as const,
          view_count: item.view_count || 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }
      }));
      console.log('📦 Formatted cart items:', formattedItems);
      console.log('📦 Formatted book formats:', formattedItems.map((item: any) => ({ 
        title: item.book?.title, 
        format: item.book?.format,
        id: item.book?.id 
      })));
      
      setCartItems(formattedItems);
      
      // Calculate analytics from actual book data
      const totalItems = formattedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const totalValue = formattedItems.reduce((sum: number, item: any) => sum + (item.book.price * item.quantity), 0);
      const totalSavings = formattedItems.reduce((sum: number, item: any) => {
        const book = item.book;
        if (book?.original_price && book.original_price > book.price) {
          return sum + ((book.original_price - book.price) * item.quantity);
        }
        return sum;
      }, 0);
      
      const ebookCount = formattedItems.reduce((sum: number, item: any) => {
        if (item.book?.format === 'ebook' || item.book?.format === 'both') {
          return sum + item.quantity;
        }
        return sum;
      }, 0);
      
      const physicalCount = formattedItems.reduce((sum: number, item: any) => {
        if (item.book?.format === 'physical' || item.book?.format === 'both') {
          return sum + item.quantity;
        }
        return sum;
      }, 0);
      
      setAnalytics({
        totalItems,
        totalValue,
        totalSavings,
        itemCount: formattedItems.length,
        averageItemValue: totalValue / totalItems || 0,
        ebookCount,
        physicalCount,
        isEbookOnly: ebookCount > 0 && physicalCount === 0,
        isPhysicalOnly: physicalCount > 0 && ebookCount === 0,
        isMixedCart: ebookCount > 0 && physicalCount > 0
      });
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const addToCart = useCallback(async (bookId: number, quantity: number = 1) => {
    if (!isAuthenticated || !user?.id) {
      setError('Please log in to add items to cart');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      console.log('🛒 Adding to cart - bookId:', bookId, 'quantity:', quantity, 'token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ book_id: bookId, quantity }),
      });

      console.log('🛒 Add to cart response status:', response.status);
      const responseData = await response.json();
      console.log('🛒 Add to cart response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to add item to cart');
      }

      console.log('🛒 Item added successfully, reloading cart...');
      // Reload cart to get updated data
      await loadCartItems();
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, loadCartItems]);

  const updateQuantity = useCallback(async (bookId: number, quantity: number) => {
    if (!isAuthenticated || !user?.id) {
      setError('Please log in to update cart');
      return;
    }

    if (quantity < 1) {
      await removeFromCart(bookId);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const currentItem = cartItems.find(item => item.book_id === bookId);
      
      if (currentItem) {
        // Remove existing item first
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${currentItem.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Add with new quantity
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ book_id: bookId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update cart');
      }

      await loadCartItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, loadCartItems, cartItems]);

  const removeFromCart = useCallback(async (bookId: number) => {
    if (!isAuthenticated || !user?.id) {
      setError('Please log in to remove items from cart');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const cartItem = cartItems.find(item => item.book_id === bookId);
      if (!cartItem) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${cartItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove item from cart');
      }

      // Reload cart to get updated data
      await loadCartItems();
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, loadCartItems, cartItems]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setError('Please log in to clear cart');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to clear cart';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setCartItems([]);
      setAnalytics({
        totalItems: 0,
        totalValue: 0,
        totalSavings: 0,
        itemCount: 0,
        averageItemValue: 0,
        ebookCount: 0,
        physicalCount: 0,
        isEbookOnly: false,
        isPhysicalOnly: false,
        isMixedCart: false
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Cart type helpers - calculate directly from cart items for real-time accuracy
  const isEbookOnly = useCallback(() => {
    if (cartItems.length === 0) return false;
    console.log('📚 Cart items for ebook check:', cartItems.map(item => ({ 
      title: item.book?.title, 
      format: item.book?.format 
    })));
    const ebookCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'ebook' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    const physicalCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'physical' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    console.log('📚 Ebook count:', ebookCount, 'Physical count:', physicalCount);
    const result = ebookCount > 0 && physicalCount === 0;
    console.log('📚 isEbookOnly result:', result);
    return result;
  }, [cartItems]);

  const isPhysicalOnly = useCallback(() => {
    if (cartItems.length === 0) return false;
    const ebookCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'ebook' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    const physicalCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'physical' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    return physicalCount > 0 && ebookCount === 0;
  }, [cartItems]);

  const isMixedCart = useCallback(() => {
    if (cartItems.length === 0) return false;
    const ebookCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'ebook' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    const physicalCount = cartItems.reduce((total, item) => {
      if (item.book?.format === 'physical' || item.book?.format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);
    return ebookCount > 0 && physicalCount > 0;
  }, [cartItems]);

  // Cart calculations
  const getSubtotal = useCallback(() => {
    return analytics.totalValue;
  }, [analytics.totalValue]);

  const getTotalSavings = useCallback(() => {
    return analytics.totalSavings;
  }, [analytics.totalSavings]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const refreshCart = useCallback(async () => {
    await loadCartItems();
  }, [loadCartItems]);

  const value: CartContextType = {
    cartItems,
    isLoading,
    error,
    analytics,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotalSavings,
    getTotalItems,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 