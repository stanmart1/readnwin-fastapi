'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  id: number;
  book_id: number;
  quantity: number;
  book_title?: string;
  book_author?: string;
  book_price?: number;
  book_original_price?: number;
  book_cover?: string;
  book_format?: string;
  book_category?: string;
  book_stock_quantity?: number;
  book_is_active?: boolean;
  book_inventory_enabled?: boolean;
  book?: {
    id: number;
    title: string;
    author_name: string;
    price: number;
    original_price?: number;
    cover_image_url: string;
    category_name?: string;
    format?: 'ebook' | 'physical' | 'both';
    is_active?: boolean;
    inventory_enabled?: boolean;
    stock_quantity?: number;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  // Cart type detection functions
  hasPhysicalBooks: () => boolean;
  hasEbooks: () => boolean;
  isEbookOnly: () => boolean;
  isPhysicalOnly: () => boolean;
  isMixedCart: () => boolean;
  // Cart analytics
  getCartAnalytics: () => {
    totalItems: number;
    totalValue: number;
    totalSavings: number;
    ebookCount: number;
    physicalCount: number;
    cartType: 'ebook-only' | 'physical-only' | 'mixed' | 'empty';
  };
  loadCart: () => Promise<void>;
  addToCart: (bookId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (bookId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (bookId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user, isAuthenticated, status } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Cart type detection functions
  const hasPhysicalBooks = useCallback(() => {
    return cartItems.some(item => {
      const format = item.book_format || item.book?.format;
      return format === 'physical' || format === 'both';
    });
  }, [cartItems]);

  const hasEbooks = useCallback(() => {
    return cartItems.some(item => {
      const format = item.book_format || item.book?.format;
      return format === 'ebook' || format === 'both';
    });
  }, [cartItems]);

  const isEbookOnly = useCallback(() => {
    return hasEbooks() && !hasPhysicalBooks();
  }, [hasEbooks, hasPhysicalBooks]);

  const isPhysicalOnly = useCallback(() => {
    return hasPhysicalBooks() && !hasEbooks();
  }, [hasPhysicalBooks, hasEbooks]);

  const isMixedCart = useCallback(() => {
    return hasEbooks() && hasPhysicalBooks();
  }, [hasEbooks, hasPhysicalBooks]);

  const getCartAnalytics = useCallback(() => {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const totalValue = cartItems.reduce((total, item) => {
      const price = item.book_price || item.book?.price || 0;
      return total + (price * item.quantity);
    }, 0);
    
    const totalSavings = cartItems.reduce((total, item) => {
      const originalPrice = item.book_original_price || item.book?.original_price;
      const currentPrice = item.book_price || item.book?.price || 0;
      if (originalPrice && typeof originalPrice === 'number' && originalPrice > currentPrice) {
        return total + ((originalPrice - currentPrice) * item.quantity);
      }
      return total;
    }, 0);

    const ebookCount = cartItems.reduce((total, item) => {
      const format = item.book_format || item.book?.format;
      if (format === 'ebook' || format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);

    const physicalCount = cartItems.reduce((total, item) => {
      const format = item.book_format || item.book?.format;
      if (format === 'physical' || format === 'both') {
        return total + item.quantity;
      }
      return total;
    }, 0);

    let cartType: 'ebook-only' | 'physical-only' | 'mixed' | 'empty' = 'empty';
    if (cartItems.length === 0) {
      cartType = 'empty';
    } else if (isEbookOnly()) {
      cartType = 'ebook-only';
    } else if (isPhysicalOnly()) {
      cartType = 'physical-only';
    } else {
      cartType = 'mixed';
    }

    return {
      totalItems,
      totalValue,
      totalSavings,
      ebookCount,
      physicalCount,
      cartType
    };
  }, [cartItems, isEbookOnly, isPhysicalOnly]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || status !== 'authenticated') {
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/cart');
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cartItems || []);
      } else {
        console.error('Failed to load cart items');
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, status]);

  const addToCart = async (bookId: number, quantity: number = 1): Promise<boolean> => {
    if (!isAuthenticated || status !== 'authenticated') {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: bookId,
          quantity: quantity
        }),
      });

      if (response.ok) {
        // Optimistically update the cart count immediately
        const newItem = { id: Date.now(), book_id: bookId, quantity: quantity };
        setCartItems(prev => {
          const existingItem = prev.find(item => item.book_id === bookId);
          if (existingItem) {
            return prev.map(item => 
              item.book_id === bookId 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            return [...prev, newItem];
          }
        });
        
        // Then refresh from server to get complete data
        await loadCart();
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to add to cart:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const updateQuantity = async (bookId: number, quantity: number): Promise<boolean> => {
    if (!isAuthenticated || status !== 'authenticated') {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        // Optimistically update the cart immediately
        setCartItems(prev => {
          if (quantity === 0) {
            return prev.filter(item => item.book_id !== bookId);
          } else {
            return prev.map(item => 
              item.book_id === bookId 
                ? { ...item, quantity: quantity }
                : item
            );
          }
        });
        
        // Then refresh from server to get complete data
        await loadCart();
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to update cart:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      return false;
    }
  };

  const removeFromCart = async (bookId: number): Promise<boolean> => {
    if (!isAuthenticated || status !== 'authenticated') {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Optimistically update the cart immediately
        setCartItems(prev => prev.filter(item => item.book_id !== bookId));
        
        // Then refresh from server to get complete data
        await loadCart();
        return true;
      } else {
        console.error('Failed to remove from cart');
        return false;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated || status !== 'authenticated') {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCartItems([]);
        return true;
      } else {
        console.error('Failed to clear cart');
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Load cart when auth status changes
  useEffect(() => {
    if (status === 'authenticated' && isAuthenticated) {
      loadCart();
    } else {
      // Clear cart for unauthenticated users or loading state
      setCartItems([]);
    }
  }, [isAuthenticated, status, loadCart]);

  // Periodic refresh to keep cart in sync (every 30 seconds)
  useEffect(() => {
    if (status === 'authenticated' && isAuthenticated) {
      const interval = setInterval(() => {
        loadCart();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, status, loadCart]);

  const value: CartContextType = {
    cartItems,
    cartCount,
    isLoading,
    // Cart type detection functions
    hasPhysicalBooks,
    hasEbooks,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    // Cart analytics
    getCartAnalytics,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
} 