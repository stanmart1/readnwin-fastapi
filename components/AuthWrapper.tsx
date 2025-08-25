'use client';

import { useEffect } from 'react';
import { useGuestCartTransfer } from '@/hooks/useGuestCartTransfer';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  // This hook will automatically handle guest cart transfer when user logs in
  useGuestCartTransfer();

  return <>{children}</>;
} 