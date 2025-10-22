import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks';

export default function Overview() {
  const { getUser } = useAuth();
  const user = getUser();

  const stats = [
    { label: 'Books Read', value: '12', icon: 'ri-book-open-line', color: 'blue' },
    { label: 'Total Orders', value: '8', icon: 'ri-shopping-bag-line', color: 'purple' },
    { label: 'Wishlist', value: '15', icon: 'ri-heart-line', color: 'pink' },
    { label: 'Reviews', value: '5', icon: 'ri-star-line', color: 'yellow' }
  ];

  const recentBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', progress: 75 },
    { id: 2, title: '1984', author: 'George Orwell', progress: 45 },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', progress: 90 }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
          ))}
        </div>

        {/* Currently Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Currently Reading</h2>
          <div className="space-y-4">
            {recentBooks.map((book) => (
              <div key={book.id} className="flex items-center gap-4">
                <div className="w-16 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${book.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{book.progress}% complete</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
