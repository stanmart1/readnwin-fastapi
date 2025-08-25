'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedApiClient } from '@/lib/api-enhanced';
import WelcomeHeader from './WelcomeHeader';
import QuickActions from './QuickActions';
import ReadingProgress from './ReadingProgress';
import ActivityFeed from './ActivityFeed';
import ReadingGoals from './ReadingGoals';
import LibrarySection from './LibrarySection';
import PurchaseHistory from './PurchaseHistory';
import ReviewStats from './ReviewStats';
import NotificationCenter from './NotificationCenter';
import ReadingAnalyticsDashboard from './ReadingAnalyticsDashboard';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const api = new EnhancedApiClient();

  // Handle tab changes from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'library', 'activity', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user?.email || !isInitialLoad) return;
      
      try {
        await Promise.all([
          // Send welcome email if needed
          api.request('/auth/welcome-email', {
            method: 'POST',
          }),
          // Initialize dashboard data
          api.request('/dashboard/initialize')
        ]);
        
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
      }
    };

    if (isAuthenticated && user?.email) {
      initializeDashboard();
    }
  }, [isAuthenticated, user?.email, isInitialLoad, api]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadingProgress />
              <ReadingGoals />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActivityFeed />
              <NotificationCenter />
            </div>
          </>
        );
      case 'library':
        return <LibrarySection />;
      case 'activity':
        return (
          <>
            <PurchaseHistory />
            <ReviewStats />
          </>
        );
      case 'analytics':
        return <ReadingAnalyticsDashboard />;
      default:
        return null;
    }
  };

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <WelcomeHeader user={user} />
          <QuickActions />
          
          <div className="mt-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`${
                    activeTab === 'library'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Library
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Analytics
                </button>
              </nav>
            </div>
            
            <div className="mt-6">
              {renderActiveTab()}
            </div>
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}
