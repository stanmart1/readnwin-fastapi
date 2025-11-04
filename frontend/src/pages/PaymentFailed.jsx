import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'cancelled';
  const message = searchParams.get('message');
  const orderId = searchParams.get('order');

  const statusConfig = {
    cancelled: {
      icon: 'ri-close-circle-line',
      title: 'Payment Cancelled',
      description: 'You cancelled the payment process. Your order is still pending.'
    },
    failed: {
      icon: 'ri-error-warning-line',
      title: 'Payment Failed',
      description: message || 'We couldn\'t process your payment. Please try again.'
    },
    error: {
      icon: 'ri-alert-line',
      title: 'Payment Error',
      description: message || 'An error occurred during payment processing.'
    }
  };

  const config = statusConfig[status] || statusConfig.cancelled;

  const quickActions = [
    { name: 'Try Again', path: '/checkout', icon: 'ri-refresh-line' },
    { name: 'View Cart', path: '/cart', icon: 'ri-shopping-cart-line' },
    { name: 'Browse Books', path: '/books', icon: 'ri-book-line' },
    { name: 'Contact Support', path: '/contact', icon: 'ri-customer-service-line' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon Illustration */}
            <div className="mb-8">
              <div className="inline-block relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center">
                  <i className={`${config.icon} text-6xl text-red-600`}></i>
                </div>
              </div>
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {config.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {config.description}
              </p>
            </motion.div>

            {/* Order Info */}
            {orderId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Order Reference</p>
                  <p className="text-2xl font-bold text-gray-900">{orderId}</p>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                What would you like to do?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group"
                  >
                    <i className={`${action.icon} text-4xl text-blue-600 group-hover:text-purple-600 transition-colors mb-3`}></i>
                    <p className="font-semibold text-gray-900">{action.name}</p>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <i className="ri-home-line"></i>
                Back to Home
              </Link>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <p className="text-sm text-gray-600">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@readnwin.com" className="text-blue-600 hover:underline font-medium">
                  support@readnwin.com
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
