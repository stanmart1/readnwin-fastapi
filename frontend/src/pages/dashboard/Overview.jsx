import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth, useDashboard } from '../../hooks';
import { StatCardSkeleton, BookCardSkeleton } from '../../components/SkeletonLoader';
import { getImageUrl } from '../../lib/fileService';

export default function Overview() {
  const { getUser } = useAuth();
  const { stats, currentlyReading, loading } = useDashboard();
  const user = getUser();

  const statsData = [
    { label: 'Books Read', value: stats?.books_read || 0, icon: 'ri-book-open-line', color: 'blue' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: 'ri-shopping-bag-line', color: 'purple' },
    { label: 'Reviews', value: stats?.reviews_count || 0, icon: 'ri-star-line', color: 'yellow' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your reading journey</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            [...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                    <i className={`${stat.icon} text-2xl text-${stat.color}-600`}></i>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Currently Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Currently Reading</h2>
            {currentlyReading.length > 3 && (
              <a href="/dashboard/library" className="text-blue-600 hover:text-purple-600 text-sm font-medium flex items-center gap-1">
                View All <i className="ri-arrow-right-line"></i>
              </a>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-16 h-20 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentlyReading.length > 0 ? (
            <div className="space-y-4">
              {currentlyReading.slice(0, 3).map((book) => (
                <div key={book.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Book Cover */}
                  <div className="relative w-16 h-20 flex-shrink-0">
                    <img
                      src={getImageUrl(book.cover_image)}
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  </div>
                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{book.author}</p>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${book.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{Math.round(book.progress || 0)}% complete</p>
                  </div>
                  {/* Continue Reading Button */}
                  <a
                    href={`/reading/${book.book_id}`}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm whitespace-nowrap"
                  >
                    Continue
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="ri-book-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-600 mb-4">No books in progress</p>
              <a href="/dashboard/library" className="text-blue-600 hover:text-purple-600 font-medium">
                Browse Your Library
              </a>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          <a
            href="/books"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <i className="ri-book-line text-3xl mb-2"></i>
            <h3 className="font-semibold mb-1">Browse Books</h3>
            <p className="text-sm text-blue-100">Discover new titles</p>
          </a>
          <a
            href="/dashboard/library"
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border-2 border-gray-200"
          >
            <i className="ri-book-open-line text-3xl text-blue-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900 mb-1">My Library</h3>
            <p className="text-sm text-gray-600">View your collection</p>
          </a>
          <a
            href="/dashboard/orders"
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border-2 border-gray-200"
          >
            <i className="ri-shopping-bag-line text-3xl text-purple-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900 mb-1">Order History</h3>
            <p className="text-sm text-gray-600">Track your purchases</p>
          </a>
          <a
            href="/dashboard/settings"
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border-2 border-gray-200"
          >
            <i className="ri-settings-line text-3xl text-green-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-600">Manage your account</p>
          </a>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
