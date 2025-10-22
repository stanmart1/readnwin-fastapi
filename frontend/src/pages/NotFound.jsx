import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
  const popularPages = [
    { name: 'Home', path: '/', icon: 'ri-home-line' },
    { name: 'Books', path: '/books', icon: 'ri-book-line' },
    { name: 'Blog', path: '/blog', icon: 'ri-article-line' },
    { name: 'Contact', path: '/contact', icon: 'ri-mail-line' }
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
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="inline-block relative">
                <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  404
                </div>
                <div className="absolute -top-4 -right-4">
                  <i className="ri-emotion-sad-line text-6xl text-blue-600"></i>
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
                Page Not Found
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for books, blog posts..."
                    className="w-full px-6 py-4 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700">
                    <i className="ri-search-line"></i>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Popular Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Try these popular pages instead:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popularPages.map((page, index) => (
                  <Link
                    key={index}
                    to={page.path}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group"
                  >
                    <i className={`${page.icon} text-4xl text-blue-600 group-hover:text-purple-600 transition-colors mb-3`}></i>
                    <p className="font-semibold text-gray-900">{page.name}</p>
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
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
