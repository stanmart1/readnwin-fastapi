import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: 'ri-dashboard-line' },
    { name: 'Library', path: '/dashboard/library', icon: 'ri-book-line' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: 'ri-bar-chart-line' },
    { name: 'Activity', path: '/dashboard/activity', icon: 'ri-time-line' },
    { name: 'Orders', path: '/dashboard/orders', icon: 'ri-shopping-bag-line' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <Header />

      <div className="flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 h-screen sticky top-0 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-2 mt-20">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md scale-105'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} text-xl mb-1`}></i>
                <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
