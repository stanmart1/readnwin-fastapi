import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useOrders } from '../../hooks';
import { getImageUrl } from '../../lib/fileService';
import { OrderCardSkeleton } from '../../components/SkeletonLoader';

export default function Orders() {
  const { orders, loading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      <div className="max-w-6xl mx-auto px-0 sm:px-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Order History</h1>
          <p className="text-xs sm:text-base text-gray-600">View and manage your orders</p>
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
                className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden"
              >
              {/* Order Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
                {/* Top row: Order Number and Status */}
                <div className="flex justify-between items-start mb-3 sm:mb-0 sm:flex-row">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold text-xs sm:text-base text-gray-900">{order.order_number}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold ml-2 flex-shrink-0 ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                {/* Bottom row: Date and Total (stacked on mobile) */}
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-xs sm:text-base text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total</p>
                    <p className="font-semibold text-xs sm:text-base text-gray-900">₦{(order.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Items ({order.items?.length || 0})</h3>
                <div className="space-y-2 sm:space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-2 sm:p-0">
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <img 
                          src={getImageUrl(item.book?.cover_image_url || item.cover_image_url)}
                          alt={item.book_title}
                          className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/120x160?text=No+Cover';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-base text-gray-900 line-clamp-2">{item.book_title}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity} • {item.book_format}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-xs sm:text-base text-gray-900 text-right">₦{(item.price || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-purple-600 font-semibold"
                  >
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.payment_method}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <img 
                          src={getImageUrl(item.book?.cover_image_url || item.cover_image_url)} 
                          alt={item.book_title} 
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/120x160?text=No+Cover';
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{item.book_title}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity} • {item.book_format}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t mt-6 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₦{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
