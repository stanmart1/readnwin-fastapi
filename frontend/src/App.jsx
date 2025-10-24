import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';

{ /* Scroll to top on route change*/}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}


import { AdminRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BankTransferProof from './pages/BankTransferProof';
import OrderConfirmation from './pages/OrderConfirmation';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Dashboard Pages
import DashboardOverview from './pages/dashboard/Overview';
import DashboardLibrary from './pages/dashboard/Library';
import DashboardAnalytics from './pages/dashboard/Analytics';
import DashboardActivity from './pages/dashboard/Activity';
import DashboardOrders from './pages/dashboard/Orders';
import DashboardSettings from './pages/dashboard/Settings';
import Reading from './pages/Reading';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import AdminRoles from './pages/admin/Roles';
import AdminAudit from './pages/admin/Audit';
import AdminBooks from './pages/admin/Books';
import AdminReviews from './pages/admin/Reviews';
import AdminOrders from './pages/admin/Orders';
import AdminShipping from './pages/admin/Shipping';
import AdminReading from './pages/admin/Reading';
import AdminReports from './pages/admin/Reports';
import AdminEmailTemplates from './pages/admin/EmailTemplates';
import AdminBlog from './pages/admin/Blog';
import AdminWorks from './pages/admin/Works';
import AdminAbout from './pages/admin/About';
import AdminContact from './pages/admin/Contact';
import AdminFAQ from './pages/admin/FAQ';
import AdminSettings from './pages/admin/Settings';

import './styles/index.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/bank-transfer/:orderId" element={<BankTransferProof />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/dashboard/library" element={<DashboardLibrary />} />
        <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
        <Route path="/dashboard/activity" element={<DashboardActivity />} />
        <Route path="/dashboard/orders" element={<DashboardOrders />} />
        <Route path="/dashboard/settings" element={<DashboardSettings />} />
        <Route path="/reading/:bookId" element={<Reading />} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/roles" element={<AdminRoute><Roles /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
        <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/shipping" element={<AdminRoute><AdminShipping /></AdminRoute>} />
        <Route path="/admin/reading" element={<AdminRoute><AdminReading /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/email-templates" element={<AdminRoute><AdminEmailTemplates /></AdminRoute>} />
        <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
        <Route path="/admin/works" element={<AdminRoute><AdminWorks /></AdminRoute>} />
        <Route path="/admin/about" element={<AdminRoute><AdminAbout /></AdminRoute>} />
        <Route path="/admin/contact" element={<AdminRoute><AdminContact /></AdminRoute>} />
        <Route path="/admin/faq" element={<AdminRoute><AdminFAQ /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </CartProvider>
  );
}

export default App;
