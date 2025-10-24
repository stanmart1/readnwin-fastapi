const OrderCard = ({ 
  order, 
  onView, 
  onDelete, 
  onSelect, 
  isSelected,
  getStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  formatDate,
  formatTime,
  getCustomerName
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      {/* Order Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(order.id)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">#{order.order_number}</h3>
            <p className="text-xs text-gray-600 mt-1">{getCustomerName(order)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-600">Amount</p>
          <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
        </div>
        <div>
          <p className="text-gray-600">Items</p>
          <p className="font-semibold text-gray-900">{order.total_items || 0}</p>
        </div>
        <div>
          <p className="text-gray-600">Date</p>
          <p className="font-semibold text-gray-900">{formatDate(order.created_at)}</p>
        </div>
        <div>
          <p className="text-gray-600">Time</p>
          <p className="font-semibold text-gray-900">{formatTime(order.created_at)}</p>
        </div>
      </div>

      {/* Payment Method */}
      {order.payment_method && (
        <div className="flex items-center space-x-2 text-sm">
          <i className="ri-bank-card-line text-gray-400"></i>
          <span className="text-gray-600">{order.payment_method}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 pt-2 border-t">
        <button
          onClick={() => onView(order)}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onDelete(order)}
          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <i className="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
