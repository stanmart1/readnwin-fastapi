'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const GUEST_CART_KEY = 'readnwin_guest_cart';

export function useGuestCartTransfer() {
  const { user, isAuthenticated } = useAuth();

  const transferGuestCartToUser = useCallback(async (guestCartItems: any[]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found for cart transfer');
        return;
      }

      console.log('🛒 Starting guest cart transfer...', guestCartItems);

      const response = await fetch(`${apiUrl}/cart/transfer-guest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartItems: guestCartItems.map(item => ({
            book_id: item.book_id,
            quantity: item.quantity
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Guest cart transferred successfully:', result);
        
        localStorage.removeItem(GUEST_CART_KEY);
        window.dispatchEvent(new Event('cart-refresh'));
      } else {
        const error = await response.json();
        console.error('❌ Failed to transfer guest cart:', error);
      }
      
    } catch (error) {
      console.error('❌ Error transferring guest cart to user:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const transferData = localStorage.getItem('transferredCheckoutData');
      
      if (transferData) {
        try {
          const checkoutData = JSON.parse(transferData);
          
          if (checkoutData.cartItems && checkoutData.cartItems.length > 0) {
            transferGuestCartToUser(checkoutData.cartItems);
          }
          
          if (checkoutData.shippingAddress) {
            localStorage.setItem('checkoutShippingAddress', JSON.stringify(checkoutData.shippingAddress));
          }
          
          if (checkoutData.selectedShippingMethod) {
            localStorage.setItem('checkoutShippingMethod', JSON.stringify(checkoutData.selectedShippingMethod));
          }
          
          localStorage.removeItem('transferredCheckoutData');
          
        } catch (error) {
          console.error('Error processing transferred checkout data:', error);
          localStorage.removeItem('transferredCheckoutData');
        }
      } else {
        const guestCartData = localStorage.getItem(GUEST_CART_KEY);
        if (guestCartData) {
          try {
            const guestCartItems = JSON.parse(guestCartData);
            if (guestCartItems && guestCartItems.length > 0) {
              console.log('🔄 Transferring guest cart to user account:', guestCartItems.length, 'items');
              transferGuestCartToUser(guestCartItems);
            }
          } catch (error) {
            console.error('Error parsing guest cart data:', error);
            localStorage.removeItem(GUEST_CART_KEY);
          }
        }
      }
    }
  }, [isAuthenticated, user, transferGuestCartToUser]);
}