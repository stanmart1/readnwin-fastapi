import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';

export default function Orders() {
  const orders = [
    {
      id: 'ORD-001',
      date: '2025-01-15',
      total: 29.99,
      status: 'completed',
      items: [
        { title: 'The Great Gatsby', price: 14.99 },
        { title: '1984', price: 15.00 }
      ]
    },
    {
      id: 'ORD-002',
      date: '2025-01-10',
      total: 19.99,
      status: 'completed',
      items: [
        { title: 'To Kill a Mockingbird', price: 19.99 }
      ]
    },
    {
      id: 'ORD-003',
      date: '2025-01-05',
      total: 45.97,
      status: 'processing',
      items: [
        { title: 'Pride and Prejudice', price: 12.99 },
        { title: 'The Catcher in the Rye', price: 14.99 },
        { title: 'Brave New World', price: 17.99 }
      ]
    }
  ];

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
          {orders.map((order, index) => (
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
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold text-gray-900">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Items ({order.items.length})</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">Digital Book</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">${item.price.toFixed(2)}</p>
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
          ))}
        </div>

        {orders.length === 0 && (
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
