import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';
import { getImageUrl } from '../lib/fileService';

const GUEST_CART_KEY = 'readnwin_guest_cart';

export const useCart = () => {
  const { isAuthenticated: isAuthenticatedFn, getUser } = useAuth();
  const hasLoadedCart = useRef(false);
  
  // Safely get authentication status
  const isAuthenticated = useMemo(() => {
    try {
      return isAuthenticatedFn();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }, [isAuthenticatedFn]);
  
  const user = useMemo(() => {
    try {
      return getUser();
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }, [getUser]);
  
  const [cartItems, setCartItems] = useState(() => {
    // Initialize from localStorage for guest users
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          const stored = localStorage.getItem(GUEST_CART_KEY);
          return stored ? JSON.parse(stored) : [];
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    return [];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalItems: 0,
    totalValue: 0,
    totalSavings: 0,
    ebookCount: 0,
    physicalCount: 0,
    isEbookOnly: true,
    isPhysicalOnly: false,
    isMixedCart: false
  });

  // Save guest cart to localStorage
  const saveGuestCart = useCallback((items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  // Load authenticated user cart from API
  const loadAuthenticatedCart = useCallback(async () => {
    // Check if token exists first
    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/cart');
      const items = Array.isArray(response.data) ? response.data : (response.data.items || []);
      
      // Transform backend format to match expected format
      const transformedItems = items.map(item => ({
        id: item.id,
        book_id: item.book_id,
        quantity: item.quantity,
        book: {
          id: item.book_id,
          title: item.book_title,
          author: item.book_author,
          author_name: item.book_author,
          price: item.book_price,
          original_price: item.book_original_price,
          cover_image_url: item.book_cover_url,
          cover_image: item.book_cover_image,
          format: item.book_format,
          category: item.book_category,
          stock_quantity: item.book_stock_quantity,
          is_active: item.book_is_active
        }
      }));
      
      setCartItems(transformedItems);
    } catch (err) {
      // Silently handle 401 errors (user not authenticated)
      if (err.response?.status === 401) {
        // Clear any stale cart data
        setCartItems([]);
        return;
      }
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Transfer guest cart to authenticated user
  const transferGuestCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (!guestCart) {
        await loadAuthenticatedCart();
        return;
      }
      
      const guestItems = JSON.parse(guestCart);
      if (guestItems.length === 0) {
        await loadAuthenticatedCart();
        return;
      }
      
      console.log('Transferring guest cart to authenticated user...', guestItems);
      
      // Use dedicated transfer endpoint if available
      try {
        await api.post('/cart/transfer-guest', {
          cartItems: guestItems.map(item => ({
            book_id: item.book_id,
            quantity: item.quantity
          }))
        });
      } catch (err) {
        // Fallback: Transfer each item individually
        console.log('Using fallback transfer method');
        for (const item of guestItems) {
          try {
            await api.post('/cart/add', {
              book_id: item.book_id,
              quantity: item.quantity
            });
          } catch (addErr) {
            console.error('Error adding item:', addErr);
          }
        }
      }
      
      // Clear guest cart
      localStorage.removeItem(GUEST_CART_KEY);
      
      // Reload authenticated cart
      await loadAuthenticatedCart();
      
      console.log('Guest cart transferred successfully');
    } catch (err) {
      console.error('Error transferring cart:', err);
      // Still load authenticated cart even if transfer fails
      await loadAuthenticatedCart();
    }
  }, [isAuthenticated, loadAuthenticatedCart]);

  // Load cart on mount and when auth changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!isAuthenticated || !token) {
      // Guest user - load from localStorage
      hasLoadedCart.current = false;
      try {
        const stored = localStorage.getItem(GUEST_CART_KEY);
        if (stored) {
          setCartItems(JSON.parse(stored));
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartItems([]);
      }
    } else {
      // Authenticated user with valid token - only load once
      if (!hasLoadedCart.current) {
        hasLoadedCart.current = true;
        
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        if (guestCart) {
          transferGuestCart();
        } else {
          loadAuthenticatedCart();
        }
      }
    }
  }, [isAuthenticated, loadAuthenticatedCart, transferGuestCart]);

  // Listen for storage events to sync cart across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === GUEST_CART_KEY && !isAuthenticated) {
        try {
          const newCart = e.newValue ? JSON.parse(e.newValue) : [];
          setCartItems(newCart);
        } catch (error) {
          console.error('Error syncing cart from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  // Update analytics when cart changes
  useEffect(() => {
    const ebookCount = cartItems.filter(item => item.book?.format === 'ebook').length;
    const physicalCount = cartItems.filter(item => item.book?.format === 'physical').length;
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
    const totalSavings = cartItems.reduce((sum, item) => {
      const savings = (item.book?.original_price || 0) - (item.book?.price || 0);
      return sum + (savings > 0 ? savings * item.quantity : 0);
    }, 0);

    setAnalytics({
      totalItems,
      totalValue,
      totalSavings,
      ebookCount,
      physicalCount,
      isEbookOnly: ebookCount > 0 && physicalCount === 0,
      isPhysicalOnly: physicalCount > 0 && ebookCount === 0,
      isMixedCart: ebookCount > 0 && physicalCount > 0
    });
  }, [cartItems]);

  // Add to cart
  const addToCart = useCallback(async (book, quantity = 1) => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        // Authenticated user - use API
        await api.post('/cart/add', {
          book_id: book.id,
          quantity
        });
        // Immediately reload cart to update UI
        await loadAuthenticatedCart();
      } else {
        // Guest user - use localStorage
        setCartItems(prevItems => {
          const existingIndex = prevItems.findIndex(item => item.book_id === book.id);
          let newCart;
          
          if (existingIndex >= 0) {
            newCart = [...prevItems];
            newCart[existingIndex].quantity += quantity;
          } else {
            newCart = [...prevItems, {
              id: Date.now(),
              book_id: book.id,
              book: book,
              quantity,
              created_at: new Date().toISOString()
            }];
          }
          
          saveGuestCart(newCart);
          return newCart;
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, loadAuthenticatedCart, saveGuestCart]);

  // Update quantity
  const updateQuantity = useCallback(async (bookId, quantity) => {
    if (quantity < 1) return;
    
    try {
      setError(null);
      
      if (isAuthenticated) {
        // Find the cart item id
        const cartItem = cartItems.find(item => item.book_id === bookId);
        if (cartItem) {
          // Delete the old item
          await api.delete(`/cart/${cartItem.id}`);
          // Add with new quantity
          await api.post('/cart/add', { book_id: bookId, quantity });
          // Immediately reload cart to update UI
          await loadAuthenticatedCart();
        }
      } else {
        setCartItems(prevItems => {
          const newCart = prevItems.map(item =>
            item.book_id === bookId ? { ...item, quantity } : item
          );
          saveGuestCart(newCart);
          return newCart;
        });
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, cartItems, loadAuthenticatedCart, saveGuestCart]);

  // Remove from cart
  const removeFromCart = useCallback(async (bookId) => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        const cartItem = cartItems.find(item => item.book_id === bookId);
        if (cartItem) {
          await api.delete(`/cart/${cartItem.id}`);
          // Immediately reload cart to update UI
          await loadAuthenticatedCart();
        }
      } else {
        setCartItems(prevItems => {
          const newCart = prevItems.filter(item => item.book_id !== bookId);
          saveGuestCart(newCart);
          return newCart;
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, cartItems, loadAuthenticatedCart, saveGuestCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        await api.delete('/cart/clear');
        setCartItems([]);
      } else {
        setCartItems([]);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  // Helper functions
  const getSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const getTotalSavings = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      const savings = (item.book?.original_price || 0) - (item.book?.price || 0);
      return sum + (savings > 0 ? savings * item.quantity : 0);
    }, 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const isEbookOnly = useCallback(() => {
    return analytics.isEbookOnly;
  }, [analytics]);

  const isPhysicalOnly = useCallback(() => {
    return analytics.isPhysicalOnly;
  }, [analytics]);

  const isMixedCart = useCallback(() => {
    return analytics.isMixedCart;
  }, [analytics]);

  return {
    cartItems,
    isLoading,
    error,
    analytics,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotalSavings,
    getTotalItems,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    refreshCart: loadAuthenticatedCart
  };
};
