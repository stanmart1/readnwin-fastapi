'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, CartAnalytics, Book } from '@/types/ecommerce';

interface GuestCartContextType {
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
  addToCart: (book: Book, quantity?: number) => Promise<void>;
  updateQuantity: (bookId: number, quantity: number) => Promise<void>;
  removeFromCart: (bookId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Cart calculations
  getSubtotal: () => number;
  getTotalSavings: () => number;
  getTotalItems: () => number;
  
  // Refresh cart
  refreshCart: () => Promise<void>;
  
  // Transfer cart to user account
  transferCartToUser: (userId: number) => Promise<boolean>;
}

const GuestCartContext = createContext<GuestCartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'readnwin_guest_cart';

export function GuestCartProvider({ children }: { children: ReactNode }) {
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

  // Load cart from localStorage on mount and listen for storage changes
  useEffect(() => {
    loadCartFromStorage();
    
    // Listen for storage changes (from other tabs or manual updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GUEST_CART_KEY) {
        console.log('🔄 Guest cart storage changed, reloading...');
        loadCartFromStorage();
      }
    };
    
    // Listen for custom cart update events
    const handleCartUpdate = () => {
      console.log('🔄 Guest cart update event received, reloading...');
      loadCartFromStorage();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('guest-cart-updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('guest-cart-updated', handleCartUpdate);
    };
  }, []);

  // Update analytics when cart items change
  useEffect(() => {
    updateAnalytics();
  }, [cartItems]);

  const saveCartToStorage = (items: CartItem[]) => {
    try {
      console.log('🛒 Saving guest cart to localStorage:', items);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      console.log('✅ Guest cart saved successfully');
    } catch (error) {
      console.error('❌ Error saving guest cart to storage:', error);
    }
  };

  const loadCartFromStorage = () => {
    try {
      console.log('🛒 Loading guest cart from localStorage...');
      const storedCart = localStorage.getItem(GUEST_CART_KEY);
      console.log('📦 Stored cart data:', storedCart);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        console.log('✅ Parsed cart items:', parsedCart);
        setCartItems(parsedCart);
      } else {
        console.log('📭 No stored cart found');
        setCartItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading guest cart from storage:', error);
      setCartItems([]);
    }
  };

  const updateAnalytics = () => {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const totalValue = cartItems.reduce((total, item) => {
      const price = item.book?.price || 0;
      return total + (price * item.quantity);
    }, 0);
    
    const totalSavings = cartItems.reduce((total, item) => {
      const book = item.book;
      if (book?.original_price && book.original_price > book.price) {
        return total + ((book.original_price - book.price) * item.quantity);
      }
      return total;
    }, 0);

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

    const isEbookOnly = ebookCount > 0 && physicalCount === 0;
    const isPhysicalOnly = physicalCount > 0 && ebookCount === 0;
    const isMixedCart = ebookCount > 0 && physicalCount > 0;

    setAnalytics({
      totalItems,
      totalValue,
      totalSavings,
      itemCount: cartItems.length,
      averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
      ebookCount,
      physicalCount,
      isEbookOnly,
      isPhysicalOnly,
      isMixedCart
    });
  };

  const addToCart = async (book: Book, quantity: number = 1) => {
    console.log('🛒 Adding to guest cart:', { book: book.title, quantity, format: book.format });
    setIsLoading(true);
    setError(null);

    try {
      setCartItems(prev => {
        console.log('📦 Current cart items:', prev);
        const existingItem = prev.find(item => item.book_id === book.id);
        let newItems: CartItem[];

        if (existingItem) {
          console.log('🔄 Updating existing item quantity');
          newItems = prev.map(item => 
            item.book_id === book.id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          console.log('🆕 Adding new item to cart');
          const newItem: CartItem = {
            id: Date.now(),
            user_id: 0,
            book_id: book.id,
            quantity,
            added_at: new Date().toISOString(),
            book: {
              id: book.id,
              title: book.title,
              author_name: book.author_name,
              price: book.price,
              original_price: book.original_price,
              cover_image_url: book.cover_image_url,
              category_name: book.category_name,
              format: book.format || 'ebook',
              // Add required fields with default values
              author_id: book.author_id,
              category_id: book.category_id,
              language: book.language,
              stock_quantity: book.stock_quantity,
              low_stock_threshold: book.low_stock_threshold,
              is_featured: book.is_featured,
              is_bestseller: book.is_bestseller,
              is_new_release: book.is_new_release,
              status: book.status,
              view_count: book.view_count,
              created_at: book.created_at,
              updated_at: book.updated_at
            }
          };
          console.log('🆕 New cart item created:', newItem);
          newItems = [...prev, newItem];
        }

        console.log('📦 New cart items:', newItems);
        saveCartToStorage(newItems);
        
        // Trigger custom events to notify other components
        window.dispatchEvent(new Event('guest-cart-updated'));
        window.dispatchEvent(new Event('cart-refresh'));
        
        return newItems;
      });
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      setError('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (bookId: number, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (quantity < 1) {
        await removeFromCart(bookId);
        return;
      }

      setCartItems(prev => {
        const newItems = prev.map(item => 
          item.book_id === bookId 
            ? { ...item, quantity }
            : item
        );
        saveCartToStorage(newItems);
        return newItems;
      });
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (bookId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      setCartItems(prev => {
        const newItems = prev.filter(item => item.book_id !== bookId);
        saveCartToStorage(newItems);
        return newItems;
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCartItems([]);
      saveCartToStorage([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  const transferCartToUser = async (userId: number): Promise<boolean> => {
    if (cartItems.length === 0) return true;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required for cart transfer');
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/transfer-guest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems.map(item => ({
            book_id: item.book_id,
            quantity: item.quantity
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Guest cart transferred successfully:', result);
        
        // Clear guest cart after successful transfer
        await clearCart();
        
        // Trigger cart refresh event
        window.dispatchEvent(new Event('cart-refresh'));
        
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.error || 'Failed to transfer cart');
        return false;
      }
    } catch (err) {
      console.error('Error transferring cart:', err);
      setError('Failed to transfer cart to account');
      return false;
    }
  };

  // Cart type helpers - calculate directly from cart items for real-time accuracy
  const isEbookOnly = useCallback(() => {
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
    return ebookCount > 0 && physicalCount === 0;
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
    loadCartFromStorage();
  }, []);

  const value: GuestCartContextType = {
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
    transferCartToUser,
  };

  return (
    <GuestCartContext.Provider value={value}>
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (context === undefined) {
    throw new Error('useGuestCart must be used within a GuestCartProvider');
  }
  return context;
} 