'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { CartProvider } from '@/contexts/CartContext'
import { GuestCartProvider } from '@/contexts/GuestCartContext'
import { Toaster } from 'react-hot-toast'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GuestCartProvider>
        <CartProvider>
          {children}
          <Toaster position="top-right" />
        </CartProvider>
      </GuestCartProvider>
    </AuthProvider>
  )
}