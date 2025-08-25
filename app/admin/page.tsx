"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Header from "../../components/Header";
import AdminSidebar from "./AdminSidebar";
import { usePermissions } from "../hooks/usePermissions";
import { canAccessTab } from "../../lib/permission-mapping";
import { useAuth } from "@/hooks/useAuth";
import { useAdminPageState } from "@/hooks/useAdminPageState";


// Lazy load components for faster initial page load
const OverviewStats = lazy(() => import("./OverviewStats"));
const UserManagement = lazy(() => import("./UserManagement"));
const RoleManagement = lazy(() => import("./RoleManagement"));
const AuditLog = lazy(() => import("./AuditLog"));
const BookManagement = lazy(() => import("./BookManagement"));
const EnhancedBookManagement = lazy(() => import("./EnhancedBookManagement"));
const ReviewManagement = lazy(() => import("./ReviewManagement"));
const NotificationManagement = lazy(() => import("./NotificationManagement"));
const OrdersManagement = lazy(() => import("./OrdersManagement"));
const EnhancedShippingManagement = lazy(
  () => import("./EnhancedShippingManagement"),
);
const ReadingAnalytics = lazy(() => import("./ReadingAnalytics"));
const ReportsSection = lazy(() => import("./ReportsSection"));
const EmailTemplateManagement = lazy(() => import("./EmailTemplateManagement"));
const BlogManagement = lazy(() => import("./BlogManagement"));
const WorksManagement = lazy(() => import("./WorksManagement"));
const AboutManagement = lazy(() => import("./AboutManagement"));
const ContactManagement = lazy(() => import("./ContactManagement"));
const SystemSettings = lazy(() => import("./SystemSettings"));
const FAQManagement = lazy(() => import("./FAQManagement"));

// Loading component for lazy-loaded components
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

function AdminDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { currentTab: activeTab, setTab, replaceTab } = useAdminPageState();

  // Initialize default tab
  useEffect(() => {
    if (!activeTab || activeTab === 'overview') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (!urlTab) {
        replaceTab('overview');
      }
    }
  }, []);

  // Update page title based on active tab
  useEffect(() => {
    const tabLabels: Record<string, string> = {
      overview: 'Overview',
      users: 'User Management',
      roles: 'Role Management',
      audit: 'Audit Log',
      content: 'Content Management',
      books: 'Book Management',
      reviews: 'Review Management',
      notifications: 'Notifications',
      orders: 'Orders Management',
      shipping: 'Shipping Management',
      reading: 'Reading Analytics',
      reports: 'Reports',
      'email-templates': 'Email Templates',
      blog: 'Blog Management',
      works: 'Works Management',
      about: 'About Management',
      faq: 'FAQ Management',
      contact: 'Contact Management',
      settings: 'System Settings'
    };
    
    const tabLabel = tabLabels[activeTab] || 'Admin Dashboard';
    document.title = `${tabLabel} - ReadnWin Admin`;
  }, [activeTab]);

  // Permission validation (only when permissions change)
  useEffect(() => {
    if (permissionsLoading || !activeTab || !permissions.length) return;

    if (!canAccessTab(activeTab, permissions, user?.role?.name)) {
      replaceTab("overview");
    }
  }, [permissions, activeTab]);

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setTab(tab);
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && tabParam !== activeTab) {
        setTab(tabParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Listen for tab switch events from sidebar
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      handleTabChange(event.detail.tab);
    };

    window.addEventListener("switchTab", handleTabSwitch as EventListener);
    return () => {
      window.removeEventListener("switchTab", handleTabSwitch as EventListener);
    };
  }, []);

  const renderContent = () => {
    // Optimized permission check - show content immediately, validate in background
    if (!permissionsLoading && permissions.length > 0 && !canAccessTab(activeTab, permissions, user?.role?.name)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="ri-shield-forbid-line text-6xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this section.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OverviewStats />
          </Suspense>
        );
      case "users":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <UserManagement />
          </Suspense>
        );
      case "roles":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <RoleManagement />
          </Suspense>
        );
      case "audit":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AuditLog />
          </Suspense>
        );
      case "content":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BookManagement />
          </Suspense>
        );
      case "reviews":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ReviewManagement />
          </Suspense>
        );
      case "notifications":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <NotificationManagement />
          </Suspense>
        );
      case "orders":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrdersManagement />
          </Suspense>
        );
      case "shipping":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <EnhancedShippingManagement />
          </Suspense>
        );
      case "reading":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ReadingAnalytics />
          </Suspense>
        );
      case "reports":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ReportsSection />
          </Suspense>
        );
      case "email-templates":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <EmailTemplateManagement />
          </Suspense>
        );
      case "blog":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BlogManagement />
          </Suspense>
        );
      case "books":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <EnhancedBookManagement />
          </Suspense>
        );
      case "works":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <WorksManagement />
          </Suspense>
        );
      case "about":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AboutManagement />
          </Suspense>
        );
      case "faq":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <FAQManagement />
          </Suspense>
        );
      case "contact":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ContactManagement />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SystemSettings />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OverviewStats />
          </Suspense>
        );
    }
  };

  // Loading state handled by AuthenticatedWrapper
  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Header />

      <div className="flex h-screen">
        {" "}
        {/* Layout container - header spacing handled by sidebar positioning */}
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        {/* Main Content */}
        <div className={`admin-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <button
                id="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-menu-line text-xl"></i>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your ReadnWin platform
                </p>
              </div>
              <div className="w-8"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:pl-8 min-h-full">
              {/* Desktop Header */}
              <div className="hidden lg:block mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Admin Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage your ReadnWin platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="bg-white rounded-lg shadow-md admin-page-transition animate-slide-in">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
