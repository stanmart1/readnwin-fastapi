import { useState, useEffect } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import OrderFilters from './orders/OrderFilters';
import OrderTable from './orders/OrderTable';
import OrderCard from './orders/OrderCard';
import OrderDetailsModal from './orders/OrderDetailsModal';

const OrdersManagement = () => {
  const {
    orders: hookOrders,
    loading,
    fetchOrders,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    batchDeleteOrders,
    downloadReceipt,
    downloadInvoice
  } = useAdminOrders();

  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    loadOrders();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, dateFilter]);

  useEffect(() => {
    setOrders(hookOrders);
  }, [hookOrders]);

  const loadOrders = async () => {
    setRefreshing(true);
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter && { status: statusFilter }),
      ...(paymentStatusFilter && { payment_status: paymentStatusFilter }),
      ...(paymentMethodFilter && { payment_method: paymentMethodFilter }),
      ...(dateFilter !== 'all' && { dateFilter })
    };

    const result = await fetchOrders(params);
    if (result.success) {
      setTotalPages(result.pages);
      setTotalItems(result.total);
    } else {
      setErrorMessage(result.error || 'Failed to fetch orders');
      setTimeout(() => setErrorMessage(''), 5000);
    }
    setRefreshing(false);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeleteLoading(orderToDelete.id);
    const result = await deleteOrder(orderToDelete.id);
    
    if (result.success) {
      setSuccessMessage(`Order #${orderToDelete.order_number} deleted successfully`);
      setOrders(orders.filter(order => order.id !== orderToDelete.id));
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to delete order');
      setTimeout(() => setErrorMessage(''), 5000);
    }
    setDeleteLoading(null);
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
    setSelectAll(newSelected.size === orders.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
      setSelectAll(false);
    } else {
      const allOrderIds = new Set(orders.map(order => order.id));
      setSelectedOrders(allOrderIds);
      setSelectAll(true);
    }
  };

  const handleBatchDelete = () => {
    if (selectedOrders.size === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = async () => {
    if (selectedOrders.size === 0) return;

    setBatchDeleteLoading(true);
    const orderIds = Array.from(selectedOrders);
    const result = await batchDeleteOrders(orderIds);

    if (result.success) {
      setSuccessMessage(`Successfully deleted ${orderIds.length} orders`);
      setOrders(orders.filter(order => !selectedOrders.has(order.id)));
      setSelectedOrders(new Set());
      setSelectAll(false);
      setShowBatchDeleteModal(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to delete orders');
      setTimeout(() => setErrorMessage(''), 5000);
    }
    setBatchDeleteLoading(false);
  };

  const cancelBatchDelete = () => {
    setShowBatchDeleteModal(false);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCustomerName = (order) => {
    return order.user_name || 'Unknown Customer';
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPaymentStatusFilter('');
    setPaymentMethodFilter('');
    setDateFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
          <div className="flex">
            <i className="ri-check-line text-green-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and process customer orders</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <button
              onClick={loadOrders}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Refresh orders"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <i className="ri-refresh-line text-lg"></i>
              )}
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        paymentMethodFilter={paymentMethodFilter}
        setPaymentMethodFilter={setPaymentMethodFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onClearFilters={clearFilters}
        onSearch={loadOrders}
      />

      {/* Mobile Cards */}
      <div className="xl:hidden space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onView={handleViewOrder}
            onDelete={handleDeleteOrder}
            onSelect={handleSelectOrder}
            isSelected={selectedOrders.has(order.id)}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatTime={formatTime}
            getCustomerName={getCustomerName}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden xl:block">
        <OrderTable
          orders={orders}
          onView={handleViewOrder}
          onDelete={handleDeleteOrder}
          onSelect={handleSelectOrder}
          onSelectAll={handleSelectAll}
          selectedOrders={selectedOrders}
          selectAll={selectAll}
          getStatusColor={getStatusColor}
          getPaymentStatusColor={getPaymentStatusColor}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatTime={formatTime}
          getCustomerName={getCustomerName}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete order #{orderToDelete?.order_number}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteOrder}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Batch Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelBatchDelete}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBatchDelete}
                disabled={batchDeleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {batchDeleteLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={async (orderId, status) => {
          const result = await updateOrderStatus(orderId, status);
          if (result.success) {
            setSuccessMessage('Order status updated successfully');
            loadOrders();
            setTimeout(() => setSuccessMessage(''), 5000);
          } else {
            setErrorMessage(result.error || 'Failed to update order status');
            setTimeout(() => setErrorMessage(''), 5000);
          }
        }}
        onPaymentStatusUpdate={async (orderId, paymentStatus) => {
          const result = await updatePaymentStatus(orderId, paymentStatus);
          if (result.success) {
            setSuccessMessage('Payment status updated successfully');
            loadOrders();
            setTimeout(() => setSuccessMessage(''), 5000);
          } else {
            setErrorMessage(result.error || 'Failed to update payment status');
            setTimeout(() => setErrorMessage(''), 5000);
          }
        }}
      />
    </div>
  );
};

export default OrdersManagement;
