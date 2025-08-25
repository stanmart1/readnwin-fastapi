import { User } from '@/types';

declare module '@/hooks/useAuth' {
  interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  }

  export function useAuth(): UseAuthReturn;
}
