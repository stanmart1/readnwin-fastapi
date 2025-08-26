"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  bookId: number;
  book?: {
    id: number;
    title: string;
    price: number;
    format?: string;
    is_active?: boolean;
    inventory_enabled?: boolean;
    stock_quantity?: number;
    [key: string]: any;
  };
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function AddToCartButton({ 
  bookId, 
  book,
  quantity = 1, 
  className = "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
  children = "Add to Cart",
  disabled = false
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart: addToUserCart } = useCart();
  const { addToCart: addToGuestCart } = useGuestCart();
  const [isLoading, setIsLoading] = useState(false);

  // Early return if contexts are not available (SSR safety)
  if (!addToUserCart || !addToGuestCart) {
    return (
      <button className={className} disabled>
        Loading...
      </button>
    );
  }

  const handleAddToCart = async () => {
    // Check if book is active
    if (book && book.is_active === false) {
      toast.error("This book is currently unavailable");
      return;
    }
    
    // Check stock only for physical books with inventory enabled
    if (book && book.format && ['physical', 'both'].includes(book.format) && 
        book.inventory_enabled && book.stock_quantity !== undefined) {
      if (book.stock_quantity < quantity) {
        toast.error(`Only ${book.stock_quantity} copies available`);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // User is authenticated - use regular cart
        const success = await addToUserCart(bookId, quantity);
        if (success) {
          toast.success("Item added to cart successfully!");
        } else {
          toast.error("Failed to add item to cart");
        }
      } else {
        // User is not authenticated - use guest cart
        if (!book) {
          // If book object is not provided, fetch it
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${bookId}`);
          if (response.ok) {
            const bookData = await response.json();
            console.log('📦 Fetched book data for guest cart:', bookData);
            
            // Check if fetched book is active
            if (bookData.book?.is_active === false) {
              toast.error("This book is currently unavailable");
              return;
            }
            
            await addToGuestCart(bookData.book, quantity);
            toast.success(
              (t) => (
                <div className="flex items-center justify-between w-full">
                  <span>Item added to cart! Sign in at checkout to complete your purchase.</span>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label="Close notification"
                  >
                    ✕
                  </button>
                </div>
              )
            );
          } else {
            toast.error("Failed to add item to cart");
          }
        } else {
          // Use provided book object
          console.log('📦 Adding book to guest cart:', book);
          await addToGuestCart(book, quantity);
          toast.success(
            (t) => (
              <div className="flex items-center justify-between w-full">
                <span>Item added to cart! Sign in at checkout to complete your purchase.</span>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
            )
          );
        }
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      
      // Handle specific error messages from backend
      if (error.message && error.message.includes('unavailable')) {
        toast.error("This book is currently unavailable");
      } else if (error.message && error.message.includes('stock')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add item to cart");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if button should be disabled
  const isDisabled = disabled || isLoading || 
    (book && book.is_active === false) ||
    (book && book.format && ['physical', 'both'].includes(book.format) && 
     book.inventory_enabled && book.stock_quantity !== undefined && book.stock_quantity < quantity);
  
  // Determine button text
  let buttonText = children;
  if (isLoading) {
    buttonText = 'Adding...';
  } else if (book && book.is_active === false) {
    buttonText = 'Unavailable';
  } else if (book && book.format && ['physical', 'both'].includes(book.format) && 
             book.inventory_enabled && book.stock_quantity !== undefined && book.stock_quantity === 0) {
    buttonText = 'Out of Stock';
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {buttonText}
    </button>
  );
}