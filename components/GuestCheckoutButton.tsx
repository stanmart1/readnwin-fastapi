'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface GuestCheckoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function GuestCheckoutButton({ className, children }: GuestCheckoutButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push('/checkout-new');
    } else {
      router.push('/checkout-guest');
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className={className || "w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"}
    >
      {children || 'Proceed to Checkout'}
    </button>
  );
}