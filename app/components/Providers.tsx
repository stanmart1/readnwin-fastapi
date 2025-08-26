"use client";

import React from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { GuestCartProvider } from "@/contexts/GuestCartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GuestCartProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </GuestCartProvider>
    </AuthProvider>
  );
}

export default Providers;
