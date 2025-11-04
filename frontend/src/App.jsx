import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import { useSessionTimeout } from './hooks/useSessionTimeout';

{ /* Scroll to top on route change*/}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

import { AdminRoute } from './components/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const BankTransferProof = lazy(() => import('./pages/BankTransferProof'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Dashboard Pages
const DashboardOverview = lazy(() => import('./pages/dashboard/Overview'));
const DashboardLibrary = lazy(() => import('./pages/dashboard/Library'));
const DashboardAnalytics = lazy(() => import('./pages/dashboard/Analytics'));
const DashboardActivity = lazy(() => import('./pages/dashboard/Activity'));
const DashboardOrders = lazy(() => import('./pages/dashboard/Orders'));
const DashboardSettings = lazy(() => import('./pages/dashboard/Settings'));
const Reading = lazy(() => import('./pages/Reading'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const Roles = lazy(() => import('./pages/admin/Roles'));
const AdminAudit = lazy(() => import('./pages/admin/Audit'));
const AdminBooks = lazy(() => import('./pages/admin/Books'));
const AdminLibrary = lazy(() => import('./pages/admin/Library'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminShipping = lazy(() => import('./pages/admin/Shipping'));
const AdminReading = lazy(() => import('./pages/admin/Reading'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const AdminBlog = lazy(() => import('./pages/admin/Blog'));
const AdminWorks = lazy(() => import('./pages/admin/Works'));
const AdminAbout = lazy(() => import('./pages/admin/About'));
const AdminContact = lazy(() => import('./pages/admin/Contact'));
const AdminFAQ = lazy(() => import('./pages/admin/FAQ'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

import './styles/index.css';

function App() {
  const { showWarning, timeRemaining, extendSession, handleLogout } = useSessionTimeout();

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <SessionTimeoutWarning
          show={showWarning}
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/bank-transfer/:orderId" element={<BankTransferProof />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/admin/library" element={<AdminRoute><AdminLibrary /></AdminRoute>} />
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
      </Suspense>
    </Router>
    </CartProvider>
  );
}

export default App;
