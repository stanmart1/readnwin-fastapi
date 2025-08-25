"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { getVisibleTabs, canAccessTab } from "@/lib/permission-mapping";
import { authService } from "@/lib/auth-service";
import { 
  formatNotificationTime, 
  getNotificationDotColor, 
  handleNotificationClick,
  isMobileDevice,
  updateLastNotificationCheck
} from "@/lib/notification-utils";

interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  } | null;
  permissions: string[];
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user } = useAuth();
  const adminUser = user as unknown as AuthUser | null;
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { 
    notifications, 
    loading: loadingNotifications, 
    fetchNotifications,
    markAsRead,
    markAllAsRead 
  } = useNotifications();
  
  // Use dedicated hook for dynamic count updates
  const { count: notificationCount } = useNotificationCount();

  // Get visible tabs based on user permissions
  const visibleTabs = getVisibleTabs(permissions);

  // Handle notification click to mark as read
  const handleNotificationItemClick = async (notification: any) => {
    if (!notification.is_read) {
      // Dispatch event immediately for instant UI update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-read', { 
          detail: { notificationId: notification.id } 
        }));
      }
    }
    
    handleNotificationClick(
      notification,
      markAsRead,
      () => setShowNotifications(false)
    );
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    // Dispatch event for instant UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-updated', { 
        detail: { type: 'mark-all-read' } 
      }));
    }
    
    await markAllAsRead();
    updateLastNotificationCheck();
  };

  // Handle notification panel open
  const handleNotificationToggle = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    if (newState) {
      // Refresh count when opening
      fetchNotifications();
      updateLastNotificationCheck();
      
      // Dispatch event to refresh count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
    }
  };

  // Close notification panel when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showNotifications || !isMobileDevice()) return;
      
      const target = event.target as Element;
      const notificationPanel = document.getElementById('notification-panel');
      const notificationButton = document.getElementById('notification-button');
      
      if (
        notificationPanel &&
        !notificationPanel.contains(target) &&
        notificationButton &&
        !notificationButton.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = async () => {
    await authService.logout();
    setShowProfile(false);
    window.location.href = "/login";
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("admin-sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="admin-mobile-overlay" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        id="admin-sidebar"
        className={`admin-sidebar flex flex-col ${
          isOpen ? "admin-sidebar-open" : "admin-sidebar-closed"
        } ${isCollapsed ? "collapsed" : ""}`}
      >
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-blue-600 text-lg"></i>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {adminUser
                      ? `${adminUser.first_name || ""} ${adminUser.last_name || ""}`.trim() ||
                        adminUser.username
                      : "Admin User"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {adminUser?.role?.display_name || "Administrator"}
                  </p>
                </div>
              )}
            </div>
            {/* Collapse Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i
                className={`ri-arrow-left-s-line text-lg transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
              ></i>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin">
          {permissionsLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-xs text-gray-500">
                Loading permissions...
              </p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {visibleTabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title={tab.description}
                  >
                    <i className={`${tab.icon} mr-3 text-lg`}></i>
                    {!isCollapsed && <span>{tab.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Bottom Section - Fixed at bottom */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            {/* Notifications */}
            <div className="relative">
              <button
                id="notification-button"
                onClick={handleNotificationToggle}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 relative touch-manipulation"
                title="Admin Notifications"
                disabled={loadingNotifications}
              >
                <i className={`ri-notification-line text-lg ${loadingNotifications ? 'animate-pulse' : ''}`}></i>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium transition-all duration-200 animate-pulse">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Mobile-Optimized Notifications Dropdown */}
              {showNotifications && (
                <>
                  {/* Mobile Overlay */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  
                  {/* Notification Panel */}
                  <div 
                    id="notification-panel"
                    className={`
                      fixed lg:absolute 
                      inset-x-4 top-4 lg:inset-x-auto lg:top-auto 
                      lg:bottom-full lg:left-0 lg:mb-2 lg:w-80 
                      w-auto max-w-sm mx-auto lg:max-w-none
                      bg-white rounded-lg shadow-xl border border-gray-200 
                      z-50 max-h-[80vh] lg:max-h-96 
                      overflow-hidden flex flex-col
                      animate-fade-in
                    `}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <i className="ri-notification-line text-blue-600 text-lg"></i>
                          <h3 className="text-sm font-medium text-gray-900">
                            Admin Notifications
                          </h3>
                          {notificationCount > 0 && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              {notificationCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={fetchNotifications}
                            className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded"
                            disabled={loadingNotifications}
                            title="Refresh notifications"
                          >
                            <i className={`ri-refresh-line ${loadingNotifications ? 'animate-spin' : ''}`}></i>
                          </button>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded lg:hidden"
                            title="Close notifications"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">Loading...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <i className="ri-notification-off-line text-3xl text-gray-400 mb-3"></i>
                          <p className="text-sm font-medium text-gray-900 mb-1">No new notifications</p>
                          <p className="text-xs text-gray-500">All caught up! Check back later.</p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto scrollbar-thin h-full">
                          <div className="p-2 space-y-1">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer notification-item-mobile ${
                                  !notification.is_read ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                                }`}
                                onClick={() => handleNotificationItemClick(notification)}
                              >
                                <div className="flex-shrink-0 mt-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${getNotificationDotColor(notification.type)}`}
                                  ></div>
                                  {!notification.is_read && (
                                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-1 mx-auto animate-pulse"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <p className={`text-sm font-medium line-clamp-2 ${
                                      !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {notification.created_at ? 
                                      formatNotificationTime(notification.created_at) : 
                                      'Unknown time'
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 flex-shrink-0 space-y-2">
                        {notificationCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="w-full text-center text-xs text-gray-600 hover:text-gray-800 font-medium py-1 px-3 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Mark All as Read
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onTabChange('notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          View All Notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Profile"
              >
                <i className="ri-user-settings-line text-lg"></i>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <i className="ri-logout-box-r-line mr-2"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
