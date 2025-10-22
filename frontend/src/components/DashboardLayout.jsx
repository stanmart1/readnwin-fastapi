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

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r min-h-screen`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
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
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
