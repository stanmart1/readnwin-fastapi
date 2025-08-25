"use client";

import { useState, useEffect } from "react";
import OrderDetails from "@/components/admin/OrderDetails";
import OrderStatusManager from "@/components/admin/OrderStatusManager";
import Pagination from "@/components/Pagination";
import { adminApi, handleApiError } from "./utils/api";
import { useAuth } from "../../hooks/useAuth";

interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  item_count?: number;
  notes?: string;
  payment_transaction_id?: string;
  shipping_address?: any;
  billing_address?: any;
  tracking_number?: string;
  estimated_delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  currency: string;
  shipping_method?: string;
  updated_at: string;
}

export default function OrdersManagement() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // New state for improved user feedback
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Batch delete states
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [
    isAuthenticated,
    user,
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    dateFilter,
  ]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setErrorMessage("");

      const response = await adminApi.getOrders();
      const ordersData = response?.orders || response || [];

      if (Array.isArray(ordersData)) {
        // Transform the data to match the expected format
        const transformedOrders = ordersData.map((order: any) => ({
          id: order.id,
          order_number: order.id.toString(),
          user_id: order.user_id,
          guest_email: order.user_email,
          status: order.status,
          payment_status: order.status === "completed" ? "paid" : "pending",
          payment_method: order.payment_method || "unknown",
          total_amount: order.total_amount,
          created_at: order.created_at,
          customer_name: order.user_name || "Guest User",
          item_count: order.total_items || 0,
          tracking_number: order.tracking_number,
          subtotal: order.total_amount * 0.93, // Estimate before tax
          tax_amount: order.total_amount * 0.07, // 7% tax
          shipping_amount: 1500, // Default shipping
          discount_amount: 0,
          currency: "NGN",
          updated_at: order.created_at,
        }));

        setOrders(transformedOrders);
        setTotalPages(Math.ceil(transformedOrders.length / itemsPerPage));
        setTotalItems(transformedOrders.length);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      const errorMessage = handleApiError(error);
      setErrorMessage(errorMessage);
      setErrorMessage(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (
    orderId: number,
    newStatus: string,
    notes?: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Status update response:", responseData);

        // Update the order in the list
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );

        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        setSuccessMessage(`Order status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to update order status");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setErrorMessage("Network error. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handlePaymentStatusUpdate = async (
    orderId: number,
    newPaymentStatus: string,
    notes?: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${orderId}/payment-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_status: newPaymentStatus,
            notes: notes,
          }),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Payment status update response:", responseData);

        // Update the order in the list
        setOrders(
          orders.map((order) =>
            order.id === orderId
              ? { ...order, payment_status: newPaymentStatus }
              : order,
          ),
        );

        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            payment_status: newPaymentStatus,
          });
        }
        
        setSuccessMessage(`Payment status updated to ${newPaymentStatus}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to update payment status");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      setErrorMessage("Network error. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleProofStatusUpdate = async (
    proofId: number,
    newStatus: string,
    notes?: string,
  ) => {
    try {
      const response = await fetch(
        `/api/payment/bank-transfer/proofs/${proofId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            notes: notes,
          }),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Proof status update response:", responseData);

        // Refresh orders to get updated payment status
        fetchOrders();
      } else {
        const errorData = await response.json();
        console.error("❌ Proof status update failed:", errorData);
        setErrorMessage("Failed to update proof status. Please try again.");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating proof status:", error);
      setErrorMessage("Failed to update proof status. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDeleteOrder = async (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDownloadReceipt = async (order: Order) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to generate receipt PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage("Receipt downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      setErrorMessage("Failed to download receipt. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage("Invoice downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      setErrorMessage("Failed to download invoice. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setDeleteLoading(orderToDelete.id);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${orderToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(
          `Order #${orderToDelete.order_number} deleted successfully`,
        );

        // Remove the order from the list
        setOrders(orders.filter((order) => order.id !== orderToDelete.id));

        // Close modal and reset state
        setShowDeleteModal(false);
        setOrderToDelete(null);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to delete order");

        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      setErrorMessage("Network error. Please try again.");

      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  // Batch delete functions
  const handleSelectOrder = (orderId: number) => {
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
      const allOrderIds = new Set(orders.map((order) => order.id));
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

    try {
      setBatchDeleteLoading(true);
      const orderIds = Array.from(selectedOrders);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/bulk-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "delete",
          order_ids: orderIds
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Successfully deleted ${data.affected_count} orders`);

        // Remove deleted orders from the list
        setOrders(orders.filter((order) => !selectedOrders.has(order.id)));

        // Clear selection
        setSelectedOrders(new Set());
        setSelectAll(false);
        setShowBatchDeleteModal(false);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to delete orders");

        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error batch deleting orders:", error);
      setErrorMessage("Network error. Please try again.");

      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const cancelBatchDelete = () => {
    setShowBatchDeleteModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCustomerName = (order: Order) => {
    if (order.customer_name) {
      return order.customer_name;
    }
    if (order.guest_email) {
      return `Guest (${order.guest_email})`;
    }
    return "Unknown Customer";
  };

  const isBankTransfer = (order: Order) => {
    return order.payment_method === "bank_transfer";
  };

  const needsPaymentVerification = (order: Order) => {
    return isBankTransfer(order) && order.payment_status === "pending";
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentStatusFilter("");
    setPaymentMethodFilter("");
    setDateFilter("all");
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
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
              onClick={() => setSuccessMessage("")}
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
              onClick={() => setErrorMessage("")}
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage and process customer orders
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {totalItems}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Refresh orders"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <i className="ri-refresh-line text-lg"></i>
              )}
              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search orders by number, customer, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchOrders()}
              className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <i className={`ri-${showFilters ? "eye-off" : "eye"}-line`}></i>
              <span>{showFilters ? "Hide" : "Show"} Filters</span>
            </button>
          </div>

          {/* Filter Grid */}
          {showFilters && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">All Payment Statuses</option>
                    <option value="pending">Payment Pending</option>
                    <option value="paid">Payment Paid</option>
                    <option value="failed">Payment Failed</option>
                    <option value="refunded">Payment Refunded</option>
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">All Payment Methods</option>
                    <option value="flutterwave">Flutterwave</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders - Mobile Cards */}
      <div className="xl:hidden space-y-4">
        {orders
          .filter(
            (order) =>
              order.order_number
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              getCustomerName(order)
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              (order.guest_email &&
                order.guest_email
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())),
          )
          .map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 break-words">
                      #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 break-words">
                      {getCustomerName(order)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1 ml-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-1 font-medium text-gray-900 break-words">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-1 font-medium text-gray-900 break-words">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-1 font-medium text-gray-900 break-words">
                    {formatTime(order.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <span className="ml-1 font-medium text-gray-900 break-words">
                    {order.item_count || 0}
                  </span>
                </div>
                {order.payment_method && (
                  <div>
                    <span className="text-gray-500">Payment:</span>
                    <span className="ml-1 font-medium text-gray-900 break-words capitalize">
                      {order.payment_method.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleViewOrder(order)}
                  className="text-blue-600 hover:text-blue-900 flex items-center text-sm whitespace-nowrap"
                >
                  <svg
                    className="w-4 h-4 mr-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Details
                </button>
                <button
                  onClick={() => handleDeleteOrder(order)}
                  disabled={deleteLoading === order.id}
                  className="text-red-600 hover:text-red-900 flex items-center text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading === order.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600 mr-1"></div>
                  ) : (
                    <i className="ri-delete-bin-line mr-1"></i>
                  )}
                  {deleteLoading === order.id ? "Deleting..." : "Delete"}
                </button>
                {needsPaymentVerification(order) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full whitespace-nowrap">
                    Payment Proof Needed
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Batch Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedOrders.size} order
                {selectedOrders.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={handleBatchDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="ri-delete-bin-line"></i>
              <span>Delete Selected ({selectedOrders.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders - Desktop Table */}
      <div className="hidden xl:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders
                  .filter(
                    (order) =>
                      order.order_number
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      getCustomerName(order)
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      (order.guest_email &&
                        order.guest_email
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())),
                  )
                  .map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm font-medium text-gray-900 break-words">
                            #{order.order_number}
                          </div>
                          <div className="text-sm text-gray-500 break-words">
                            {order.item_count || 0} items
                          </div>
                          {isBankTransfer(order) && (
                            <div className="text-xs text-blue-600 font-medium break-words">
                              Bank Transfer
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {getCustomerName(order)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}
                          >
                            {order.payment_status}
                          </span>
                          {order.payment_method && (
                            <div className="text-xs text-gray-500 capitalize break-words">
                              {order.payment_method.replace("_", " ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words">
                          {formatTime(order.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-900 flex items-center text-sm whitespace-nowrap"
                            title="View order details"
                          >
                            <svg
                              className="w-4 h-4 mr-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(order)}
                            className="text-green-600 hover:text-green-900 flex items-center text-sm whitespace-nowrap"
                            title="Download receipt"
                          >
                            <i className="ri-download-line mr-1"></i>
                            <span>Receipt</span>
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="text-purple-600 hover:text-purple-900 flex items-center text-sm whitespace-nowrap"
                            title="Download invoice"
                          >
                            <i className="ri-file-text-line mr-1"></i>
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deleteLoading === order.id}
                            className="text-red-600 hover:text-red-900 flex items-center text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete order"
                          >
                            {deleteLoading === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600 mr-1"></div>
                            ) : (
                              <i className="ri-delete-bin-line mr-1"></i>
                            )}
                            <span>
                              {deleteLoading === order.id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                          {needsPaymentVerification(order) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full whitespace-nowrap">
                              Payment Proof Needed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
        />
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Order Details
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Details */}
                <div className="lg:col-span-2">
                  <OrderDetails
                    order={selectedOrder}
                    onStatusUpdate={handleStatusUpdate}
                    onPaymentStatusUpdate={handlePaymentStatusUpdate}
                    onProofStatusUpdate={handleProofStatusUpdate}
                  />
                </div>

                {/* Status Management */}
                <div className="lg:col-span-1">
                  <OrderStatusManager
                    orderId={selectedOrder.id}
                    currentStatus={selectedOrder.status}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Order
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete order{" "}
                  <span className="font-semibold">
                    #{orderToDelete.order_number}
                  </span>
                  ? This action cannot be undone and will permanently remove the
                  order from the system.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Order Details:
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Customer:</span>{" "}
                      {getCustomerName(orderToDelete)}
                    </p>
                    <p>
                      <span className="font-medium">Total:</span>{" "}
                      {formatCurrency(orderToDelete.total_amount)}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {orderToDelete.status}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(orderToDelete.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteOrder}
                  disabled={deleteLoading === orderToDelete.id}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  disabled={deleteLoading === orderToDelete.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleteLoading === orderToDelete.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line"></i>
                      <span>Delete Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Multiple Orders
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {selectedOrders.size} order
                    {selectedOrders.size !== 1 ? "s" : ""}
                  </span>
                  ? This action cannot be undone and will permanently remove
                  these orders from the system.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Selected Orders:
                  </h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Count:</span>{" "}
                      {selectedOrders.size} order
                      {selectedOrders.size !== 1 ? "s" : ""}
                    </p>
                    <p>
                      <span className="font-medium">Action:</span> Permanent
                      deletion
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelBatchDelete}
                  disabled={batchDeleteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBatchDelete}
                  disabled={batchDeleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {batchDeleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line"></i>
                      <span>
                        Delete {selectedOrders.size} Order
                        {selectedOrders.size !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
