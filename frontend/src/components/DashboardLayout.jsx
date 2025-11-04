import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: 'ri-dashboard-line' },
    { name: 'My Library', path: '/dashboard/library', icon: 'ri-book-line' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: 'ri-bar-chart-line' },
    { name: 'Activity', path: '/dashboard/activity', icon: 'ri-time-line' },
    { name: 'Orders', path: '/dashboard/orders', icon: 'ri-shopping-bag-line' },
    { name: 'Settings', path: '/dashboard/settings', icon: 'ri-settings-line' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use Header from landing page */}
      <Header />

      <div className="flex relative">
        {/* Mobile Menu Button - Floating */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          aria-label="Toggle menu"
        >
          <i className={`${sidebarOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static w-64 h-screen lg:h-auto bg-white border-r border-gray-200 transition-all duration-300 z-40 overflow-y-auto`}>
          {/* Sidebar Header */}
          <div className="lg:hidden p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
          </div>
          
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} text-xl`}></i>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
