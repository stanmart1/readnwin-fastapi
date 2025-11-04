import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import api from '../lib/api';
import Header from './Header';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, getUser, getPermissions } = useAuth();
  const user = getUser();
  const { hasPermission, isAdmin } = usePermissions();
  const [permissions, setPermissions] = useState(getPermissions());

  // Fetch permissions if not cached
  useEffect(() => {
    const fetchPermissions = async () => {
      if (permissions.length === 0 && user) {
        try {
          const response = await api.get('/auth/permissions');
          if (response.data.permissions) {
            localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
            setPermissions(response.data.permissions);
          }
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        }
      }
    };
    fetchPermissions();
  }, [user]);

  const menuItems = [
    { path: '/admin', icon: 'ri-dashboard-line', label: 'Overview', permission: 'analytics.view' },
    { path: '/admin/users', icon: 'ri-user-line', label: 'Users', permission: 'users.view' },
    { path: '/admin/roles', icon: 'ri-shield-user-line', label: 'Roles', permission: 'roles.view' },
    { path: '/admin/audit', icon: 'ri-file-list-line', label: 'Audit Log', permission: 'audit_logs.view' },
    { path: '/admin/books', icon: 'ri-book-line', label: 'Books', permission: 'books.view' },
    { path: '/admin/library', icon: 'ri-book-shelf-line', label: 'Library Management', permission: 'books.view' },
    { path: '/admin/reviews', icon: 'ri-star-line', label: 'Reviews', permission: 'reviews.view' },
    { path: '/admin/orders', icon: 'ri-shopping-cart-line', label: 'Orders', permission: 'orders.view' },
    { path: '/admin/shipping', icon: 'ri-truck-line', label: 'Shipping', permission: 'shipping.view' },
    { path: '/admin/reading', icon: 'ri-line-chart-line', label: 'Reading Analytics', permission: 'reading.view_analytics' },
    { path: '/admin/reports', icon: 'ri-file-text-line', label: 'Reports', permission: 'reports.view' },
    { path: '/admin/email-templates', icon: 'ri-mail-line', label: 'Email Templates', permission: 'email_templates.view' },
    { path: '/admin/blog', icon: 'ri-file-text-line', label: 'Blog', permission: 'blog.view' },
    { path: '/admin/works', icon: 'ri-image-line', label: 'Works', permission: 'works.view' },
    { path: '/admin/about', icon: 'ri-information-line', label: 'About', permission: 'about.view' },
    { path: '/admin/contact', icon: 'ri-customer-service-line', label: 'Contact', permission: 'contact.view' },
    { path: '/admin/faq', icon: 'ri-question-line', label: 'FAQ', permission: 'faq.view' },
    { path: '/admin/settings', icon: 'ri-settings-line', label: 'Settings', permission: 'settings.view' },
  ];

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter(item => hasPermission(item.permission));
  }, [hasPermission, menuItems]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu Button - Fixed position */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 p-3 z-30 shadow-sm">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className={`ri-${mobileOpen ? 'close' : 'menu'}-line text-xl`}></i>
          <span className="text-sm font-medium">Admin Menu</span>
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 288 }}
        className={`fixed left-0 bg-white shadow-lg z-50 transform transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 overflow-y-auto overflow-x-hidden border-r border-gray-200`}
        style={{ top: '64px', height: 'calc(100vh - 64px)' }}
      >
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-blue-600 text-lg"></i>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">Administrator</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`ri-arrow-left-s-line text-lg transition-transform ${collapsed ? 'rotate-180' : ''}`}></i>
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close sidebar"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="p-2 space-y-1">
            {visibleMenuItems.length > 0 ? (
              visibleMenuItems.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={!collapsed ? '' : item.label}
                  >
                    <i className={`${item.icon} mr-3 text-lg`}></i>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-3 py-2">
                <p className="text-xs text-gray-500 text-center">
                  No access to menu items
                </p>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <i className="ri-logout-box-r-line mr-3 text-lg"></i>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 80 : 288 }}
        className="flex-1 transition-all duration-300 hidden lg:block lg:ml-0"
        style={{ paddingTop: '80px' }}
      >
        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </motion.main>

      {/* Mobile Main Content */}
      <div className="lg:hidden" style={{ paddingTop: '132px' }}>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
