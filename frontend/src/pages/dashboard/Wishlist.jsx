import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useWishlist } from '../../hooks';
import { BookCardSkeleton } from '../../components/SkeletonLoader';

export default function Wishlist() {
  const { items: wishlistItems, loading, removeFromWishlist } = useWishlist();

  const handleRemove = async (bookId) => {
    await removeFromWishlist(bookId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">{wishlistItems.length} books saved for later</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => <BookCardSkeleton key={i} />)
          ) : (
            wishlistItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-600"></div>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <i className="ri-heart-fill text-red-500"></i>
                  </button>
                  {!item.inStock && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.author}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-blue-600">${item.price}</span>
                    {item.inStock && (
                      <span className="text-green-600 text-sm font-semibold">
                        <i className="ri-check-line"></i> In Stock
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={!item.inStock}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                        item.inStock
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <i className="ri-shopping-cart-line mr-2"></i>
                      Add to Cart
                    </button>
                    <Link
                      to={`/books/${item.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <i className="ri-eye-line"></i>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {!loading && wishlistItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <i className="ri-heart-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Save books you love for later</p>
            <Link
              to="/books"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Books
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
