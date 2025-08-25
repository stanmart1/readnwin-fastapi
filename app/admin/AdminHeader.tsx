"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { user: adminUser, isAuthenticated, logout } = useAuth();

  const notifications = [
    {
      id: 1,
      type: "alert",
      message: "New user registration spike detected",
      time: "5 min ago",
    },
    {
      id: 2,
      type: "info",
      message: "System backup completed successfully",
      time: "1 hour ago",
    },
    {
      id: 3,
      type: "warning",
      message: "Server load above 80%",
      time: "2 hours ago",
    },
  ];

  const quickAddItems = [
    {
      id: "book",
      label: "Add New Book",
      icon: "ri-book-line",
      description: "Add a new book to the catalog",
    },
    {
      id: "category",
      label: "Add Category",
      icon: "ri-price-tag-3-line",
      description: "Create a new book category",
    },
    {
      id: "author",
      label: "Add Author",
      icon: "ri-user-line",
      description: "Add a new author to the system",
    },
    {
      id: "user",
      label: "Add User",
      icon: "ri-user-add-line",
      description: "Create a new user account",
    },
    {
      id: "promotion",
      label: "Create Promotion",
      icon: "ri-discount-percent-line",
      description: "Set up a new promotion",
    },
  ];

  const handleQuickAdd = (itemType: string) => {
    setShowQuickAdd(false);

    // Trigger different actions based on item type
    switch (itemType) {
      case "book":
        // Dispatch event to open book modal in ContentManagement
        window.dispatchEvent(
          new CustomEvent("openAddModal", { detail: { type: "book" } }),
        );
        break;
      case "category":
        // Dispatch event to open category modal in ContentManagement
        window.dispatchEvent(
          new CustomEvent("openAddModal", { detail: { type: "category" } }),
        );
        break;
      case "author":
        // Dispatch event to open author modal in ContentManagement
        window.dispatchEvent(
          new CustomEvent("openAddModal", { detail: { type: "author" } }),
        );
        break;
      case "user":
        // Switch to users tab and trigger add user
        window.dispatchEvent(
          new CustomEvent("switchTab", { detail: { tab: "users" } }),
        );
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("addUser"));
        }, 100);
        break;
      case "promotion":
        // Switch to orders tab
        window.dispatchEvent(
          new CustomEvent("switchTab", { detail: { tab: "orders" } }),
        );
        break;
      default:
        console.log(`Quick add: ${itemType}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfile(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your ReadnWin platform</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-notification-line text-xl"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === "alert"
                              ? "bg-red-100 text-red-600"
                              : notification.type === "warning"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <i
                            className={`${
                              notification.type === "alert"
                                ? "ri-error-warning-line"
                                : notification.type === "warning"
                                  ? "ri-alert-line"
                                  : "ri-information-line"
                            } text-sm`}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Quick Add
            </button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Quick Add</h3>
                  <p className="text-sm text-gray-600">
                    Create new content quickly
                  </p>
                </div>
                <div className="p-2">
                  {quickAddItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickAdd(item.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className={`${item.icon} text-blue-600`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.description}
                          </p>
                        </div>
                        <i className="ri-arrow-right-s-line text-gray-400"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {adminUser
                    ? `${adminUser.first_name} ${adminUser.last_name}`
                    : "Admin User"}
                </p>
                <p className="text-xs text-gray-600">
                  {adminUser?.role?.display_name || "Administrator"}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-blue-600 text-lg"></i>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <i className="ri-user-line mr-2"></i>
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <i className="ri-settings-line mr-2"></i>
                    System Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <i className="ri-shield-check-line mr-2"></i>
                    Security
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <i className="ri-logout-circle-line mr-2"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
