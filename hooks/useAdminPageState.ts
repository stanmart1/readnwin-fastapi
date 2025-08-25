import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for managing admin page state with URL parameters
 * Ensures page state is maintained across refreshes
 */
export function useAdminPageState(defaultTab: string = 'overview') {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get('tab') || defaultTab;

  const setTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const replaceTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return {
    currentTab,
    setTab,
    replaceTab
  };
}