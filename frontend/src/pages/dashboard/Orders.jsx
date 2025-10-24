import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useOrders } from '../../hooks';
import { OrderCardSkeleton } from '../../components/SkeletonLoader';

export default function Orders() {
  const { orders, loading } = useOrders();

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">View and manage your orders</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            [...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)
          ) : (
            orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-semibold text-gray-900">₦{(order.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Items ({order.order_items?.length || 0})</h3>
                <div className="space-y-3">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img 
                          src={item.book?.cover_image_url || item.book?.cover_image || '/placeholder-book.jpg'} 
                          alt={item.book_title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{item.book_title}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">₦{(item.price || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <button className="text-blue-600 hover:text-purple-600 font-semibold">
                    View Details
                  </button>
                  {order.status === 'completed' && (
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-md">
                      Download Invoice
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>

        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <i className="ri-shopping-bag-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <a
              href="/books"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Books
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
