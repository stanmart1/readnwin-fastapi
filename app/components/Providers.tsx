"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/contexts/CartContextNew";
import { GuestCartProvider } from "@/contexts/GuestCartContext";
import { NotificationContainer } from "@/components/ui/Notification";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { AuthProvider } from "@/hooks/useAuth";
import { useGuestCartTransfer } from "@/hooks/useGuestCartTransfer";

interface ProvidersProps {
  children: ReactNode;
}

function CartTransferHandler() {
  useGuestCartTransfer();
  return null;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <GuestCartProvider>
          <CartTransferHandler />
          {children}
          <Toaster position="top-right" />
          <ClientOnly>
            <NotificationContainer />
          </ClientOnly>
        </GuestCartProvider>
      </CartProvider>
    </AuthProvider>
  );
}
