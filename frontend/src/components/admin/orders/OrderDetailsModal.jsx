import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { getImageUrl } from '../../../lib/fileService';

const OrderDetailsModal = ({ order, isOpen, onClose, onStatusUpdate, onPaymentStatusUpdate }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
    }
  }, [isOpen, order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/orders/${order.id}`);
      setOrderData(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    if (onStatusUpdate) {
      await onStatusUpdate(order.id, newStatus);
    }
    setUpdatingStatus(false);
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus) => {
    setUpdatingPaymentStatus(true);
    if (onPaymentStatusUpdate) {
      await onPaymentStatusUpdate(order.id, newPaymentStatus);
    }
    setUpdatingPaymentStatus(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      awaiting_approval: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = () => {
    if (!orderData) return 'Unknown Customer';
    if (orderData.user) {
      return `${orderData.user.first_name || ''} ${orderData.user.last_name || ''}`.trim() || orderData.user.email;
    }
    if (orderData.guest_email) return `Guest (${orderData.guest_email})`;
    return 'Unknown Customer';
  };

  if (!isOpen || !order) return null;
  const displayOrder = orderData || order;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Order #{displayOrder.order_number}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(displayOrder.status)}`}>
                  {displayOrder.status}
                </span>
                <select
                  value={displayOrder.status}
                  onChange={(e) => handleOrderStatusUpdate(e.target.value)}
                  disabled={updatingStatus}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(displayOrder.payment_status)}`}>
                  {displayOrder.payment_status}
                </span>
                <select
                  value={displayOrder.payment_status}
                  onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                  disabled={updatingPaymentStatus}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="awaiting_approval">Awaiting Approval</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <i className="ri-user-line mr-2"></i>
              Customer Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Name:</span> {getCustomerName()}</p>
              {displayOrder.guest_email && (
                <p className="text-sm"><span className="font-medium">Email:</span> {displayOrder.guest_email}</p>
              )}
              {displayOrder.user_id && (
                <p className="text-sm"><span className="font-medium">User ID:</span> {displayOrder.user_id}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <i className="ri-shopping-bag-line mr-2"></i>
              Order Items
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading items...</p>
              </div>
            ) : !displayOrder.items || displayOrder.items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items found</p>
            ) : (
              <div className="space-y-3">
                {displayOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.book?.title}</h4>
                      <p className="text-sm text-gray-600">{item.book?.author}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <i className="ri-file-list-line mr-2"></i>
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(displayOrder.subtotal)}</span>
              </div>
              {displayOrder.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatCurrency(displayOrder.tax_amount)}</span>
                </div>
              )}
              {displayOrder.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>{formatCurrency(displayOrder.shipping_cost)}</span>
                </div>
              )}
              {displayOrder.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(displayOrder.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(displayOrder.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <i className="ri-bank-card-line mr-2"></i>
              Payment Information
            </h3>
            <div className="space-y-2">
              {displayOrder.payment_method && (
                <p className="text-sm"><span className="font-medium">Method:</span> {displayOrder.payment_method}</p>
              )}
              {displayOrder.payment_transaction_id && (
                <p className="text-sm"><span className="font-medium">Transaction ID:</span> {displayOrder.payment_transaction_id}</p>
              )}
              <p className="text-sm"><span className="font-medium">Currency:</span> {displayOrder.currency || 'NGN'}</p>
              
              {/* Proof of Payment for Bank Transfer */}
              {displayOrder.payment_method === 'bank_transfer' && displayOrder.payment_proof_url && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowProofModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className="ri-image-line mr-2"></i>
                    View Payment Proof
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          {displayOrder.shipping_address && displayOrder.shipping_address.street && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <i className="ri-truck-line mr-2"></i>
                Shipping Information
              </h3>
              <div className="space-y-2">
                {displayOrder.shipping_method && (
                  <p className="text-sm"><span className="font-medium">Method:</span> {displayOrder.shipping_method}</p>
                )}
                {displayOrder.tracking_number && (
                  <p className="text-sm"><span className="font-medium">Tracking:</span> {displayOrder.tracking_number}</p>
                )}
                {displayOrder.estimated_delivery_date && (
                  <p className="text-sm"><span className="font-medium">Est. Delivery:</span> {formatDate(displayOrder.estimated_delivery_date)}</p>
                )}
                {displayOrder.shipping_address && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Shipping Address:</p>
                    <p className="text-sm text-gray-600">
                      {displayOrder.shipping_address.name}<br />
                      {displayOrder.shipping_address.street}<br />
                      {displayOrder.shipping_address.city}, {displayOrder.shipping_address.state} {displayOrder.shipping_address.zip}<br />
                      {displayOrder.shipping_address.country}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {displayOrder.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <i className="ri-sticky-note-line mr-2"></i>
                Notes
              </h3>
              <p className="text-sm text-gray-700">{displayOrder.notes}</p>
            </div>
          )}

          {/* Order Dates */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <i className="ri-calendar-line mr-2"></i>
              Order Timeline
            </h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Created:</span> {formatDate(displayOrder.created_at)}</p>
              <p className="text-sm"><span className="font-medium">Last Updated:</span> {formatDate(displayOrder.updated_at)}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Proof of Payment Modal */}
      {showProofModal && displayOrder.payment_proof_url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Payment Proof</h3>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-100">
              <img
                src={getImageUrl(displayOrder.payment_proof_url)}
                alt="Payment Proof"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsModal;
