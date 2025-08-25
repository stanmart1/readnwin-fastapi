'use client';

import { useState, useEffect } from 'react';
import { User, Mail, MapPin, CreditCard, Package, Calendar, DollarSign, Download, FileText, Receipt } from 'lucide-react';
import ImageViewerModal from './ImageViewerModal';

interface OrderItem {
  id: number;
  book_id: number;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
  total_price: number;
  format: string;
}

interface OrderDetailsProps {
  order: {
    id: number;
    order_number: string;
    user_id?: number;
    guest_email?: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    payment_method?: string;
    payment_status: string;
    payment_transaction_id?: string;
    shipping_address?: any;
    billing_address?: any;
    shipping_method?: string;
    tracking_number?: string;
    estimated_delivery_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    customer_name?: string;
  };
  onStatusUpdate?: (orderId: number, newStatus: string, notes?: string) => Promise<void>;
  onPaymentStatusUpdate?: (orderId: number, newPaymentStatus: string, notes?: string) => Promise<void>;
  onProofStatusUpdate?: (proofId: number, newStatus: string, notes?: string) => Promise<void>;
}

export default function OrderDetails({ 
  order, 
  onStatusUpdate, 
  onPaymentStatusUpdate, 
  onProofStatusUpdate 
}: OrderDetailsProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [imageViewerModal, setImageViewerModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    fileName: string;
  }>({
    isOpen: false,
    imageUrl: '',
    fileName: ''
  });
  const [fileAvailability, setFileAvailability] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchOrderItems();
    // Always fetch payment proofs to determine if this is a bank transfer order
    fetchPaymentProofs();
  }, [order.id]);

  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const orderDetails = await response.json();
        // Transform the items to match the expected format
        const items = orderDetails.items.map((item: any) => ({
          id: item.id,
          book_id: item.book.id,
          title: item.book.title,
          author_name: item.book.author,
          price: item.unit_price,
          quantity: item.quantity,
          total_price: item.subtotal,
          format: item.book.format || 'ebook'
        }));
        setOrderItems(items);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentProofs = async () => {
    try {
      setLoadingProofs(true);
      console.log(`🔍 Fetching payment proofs for order ${order.id}...`);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/payment-proofs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`🔍 Response status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        const proofs = result.proofs || [];
        setPaymentProofs(proofs);
        console.log(`✅ Fetched ${proofs.length} payment proofs for order ${order.id}:`, proofs);
        
        // Check file availability for each proof
        const availabilityMap: {[key: string]: boolean} = {};
        for (const proof of proofs) {
          const filename = proof.file_path.split('/').pop();
          if (filename) {
            try {
              const fileResponse = await fetch(`/uploads/proofs/${filename}`, { method: 'HEAD' });
              availabilityMap[proof.id] = fileResponse.ok;
            } catch (error) {
              console.error(`Error checking file availability for ${filename}:`, error);
              availabilityMap[proof.id] = false;
            }
          }
        }
        setFileAvailability(availabilityMap);
      } else {
        const errorData = await response.json();
        console.error('🔍 fetchPaymentProofs error:', errorData);
        // Don't set error state, just log it - this might be normal for orders without proofs
      }
    } catch (error) {
      console.error('🔍 fetchPaymentProofs exception:', error);
      // Don't set error state, just log it - this might be normal for orders without proofs
    } finally {
      setLoadingProofs(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerName = () => {
    if (order.customer_name) {
      return order.customer_name;
    }
    if (order.guest_email) {
      return `Guest (${order.guest_email})`;
    }
    return 'Unknown Customer';
  };

  const isBankTransfer = () => {
    // Check if payment method is explicitly set to bank transfer
    const explicitBankTransfer = order.payment_method === 'bank_transfer' || 
                                 order.payment_method === 'bank_transfer_manual' ||
                                 order.payment_method === 'Bank Transfer' ||
                                 order.payment_method === 'flutterwave' ||
                                 order.payment_method?.toLowerCase().includes('bank');
    
    // If explicit bank transfer, return true
    if (explicitBankTransfer) {
      return true;
    }
    
    // If no explicit payment method but we have payment proofs, treat as bank transfer
    // This handles cases where payment_method wasn't set but proofs exist
    if (!order.payment_method && paymentProofs.length > 0) {
      return true;
    }
    
    // Check if there's a bank_transfer record for this order
    // This is the most reliable way to detect bank transfer orders
    if (order.payment_transaction_id && order.payment_transaction_id.startsWith('RW')) {
      return true; // Flutterwave transaction IDs start with RW
    }
    
    // For orders without explicit payment method, we'll show proofs if they exist
    // This will be determined by the UI rendering logic
    return false;
  };

  const needsPaymentVerification = () => {
    return isBankTransfer() && order.payment_status === 'pending';
  };

  const handlePaymentVerification = async () => {
    if (!onStatusUpdate) return;
    
    setVerifyingPayment(true);
    try {
      await onStatusUpdate(order.id, order.status, 'Payment proof verified by admin');
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleOrderStatusUpdate = async (newStatus: string) => {
    if (!onStatusUpdate) return;
    
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus: string) => {
    if (!onPaymentStatusUpdate) return;
    
    setUpdatingPaymentStatus(true);
    try {
      await onPaymentStatusUpdate(order.id, newPaymentStatus);
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const handleProofStatusUpdate = async (proofId: number, newStatus: string) => {
    if (!onProofStatusUpdate) return;
    
    try {
      await onProofStatusUpdate(proofId, newStatus);
      // Refresh proofs after update
      await fetchPaymentProofs();
      console.log(`✅ Proof ${proofId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating proof status:', error);
      // Note: Error handling is done in the parent component
    }
  };

  const handleViewImage = (filePath: string, fileName: string) => {
    console.log(`🔍 handleViewImage called with filePath: "${filePath}", fileName: "${fileName}"`);
    
    // Extract filename from file path
    const filename = filePath.split('/').pop();
    if (!filename) {
      console.error('Invalid file path:', filePath);
      alert('Invalid file path. Please contact support.');
      return;
    }
    
    // Use the API endpoint to serve the image
    const imageUrl = `/uploads/proofs/${filename}`;
    console.log(`🔍 Generated imageUrl: "${imageUrl}"`);
    
    // Test if the image exists before opening the modal
    fetch(imageUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          setImageViewerModal({
            isOpen: true,
            imageUrl,
            fileName
          });
        } else {
          console.error(`Payment proof file not found: ${filename}`);
          alert(`The payment proof file "${fileName}" was not found on the server. This may indicate the file was not uploaded properly or has been deleted. Please contact support.`);
        }
      })
      .catch(error => {
        console.error('Error checking payment proof file:', error);
        alert('Error accessing payment proof file. Please try again or contact support.');
      });
  };

  const handleCloseImageViewer = () => {
    setImageViewerModal({
      isOpen: false,
      imageUrl: '',
      fileName: ''
    });
  };

  const handleDownloadReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download receipt');
        alert('Failed to download receipt. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error downloading receipt. Please try again.');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download invoice');
        alert('Failed to download invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };

  const handlePreviewReceipt = () => {
    const token = localStorage.getItem('token');
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/receipt/preview?token=${token}`;
    window.open(url, '_blank');
  };

  const handlePreviewInvoice = () => {
    const token = localStorage.getItem('token');
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.id}/invoice/preview?token=${token}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          Order #{order.order_number}
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)} break-words`}>
            {order.status.replace('_', ' ')}
          </span>
          {onStatusUpdate && (
            <select
              value={order.status}
              onChange={(e) => handleOrderStatusUpdate(e.target.value)}
              disabled={updatingStatus}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          )}
        </div>
      </div>

      {/* Document Actions */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Documents</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadReceipt}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Download Receipt
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Invoice
          </button>
          <button
            onClick={handlePreviewReceipt}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Preview Receipt
          </button>
          <button
            onClick={handlePreviewInvoice}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="break-words">Customer Information</span>
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 break-words">{getCustomerName()}</p>
            {order.guest_email && (
              <p className="text-sm text-gray-600 flex items-start mt-1 break-words">
                <Mail className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                <span className="break-all">{order.guest_email}</span>
              </p>
            )}
            {order.user_id && (
              <p className="text-sm text-gray-600 break-words">User ID: {order.user_id}</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="break-words">Order Summary</span>
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm break-words">
              <span className="break-words">Subtotal:</span>
              <span className="break-words">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm break-words">
              <span className="break-words">Tax:</span>
              <span className="break-words">{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm break-words">
              <span className="break-words">Shipping:</span>
              <span className="break-words">{formatCurrency(order.shipping_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600 break-words">
                <span className="break-words">Discount:</span>
                <span className="break-words">-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium break-words">
              <span className="break-words">Total:</span>
              <span className="break-words">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        {order.shipping_address && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="break-words">Shipping Information</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium break-words">{order.shipping_address.name}</p>
              <p className="text-sm text-gray-600 break-words">{order.shipping_address.street}</p>
              <p className="text-sm text-gray-600 break-words">
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
              </p>
              <p className="text-sm text-gray-600 break-words">{order.shipping_address.country}</p>
              {order.shipping_method && (
                <p className="text-sm text-gray-600 mt-2 break-words">
                  Method: {order.shipping_method}
                </p>
              )}
              {order.tracking_number && (
                <p className="text-sm text-gray-600 break-words">
                  Tracking: {order.tracking_number}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="break-words">Payment Information</span>
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <p className="text-sm font-medium break-words">Status: {order.payment_status}</p>
              {onPaymentStatusUpdate && (
                <select
                  value={order.payment_status}
                  onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                  disabled={updatingPaymentStatus}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              )}
            </div>
            {order.payment_method && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-900 mb-2 break-words">Payment Method:</p>
                <span className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-lg break-words ${
                  order.payment_method === 'Bank Transfer' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{order.payment_method}</span>
                </span>
              </div>
            )}
            {order.payment_transaction_id && (
              <p className="text-sm text-gray-600 break-words">Transaction ID: {order.payment_transaction_id}</p>
            )}
            <p className="text-sm text-gray-600 mt-2 break-words">
              <Calendar className="w-4 h-4 inline mr-1 flex-shrink-0" />
              Created: {formatDate(order.created_at)}
            </p>
            <p className="text-sm text-gray-600 break-words">
              <Calendar className="w-4 h-4 inline mr-1 flex-shrink-0" />
              Updated: {formatDate(order.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 break-words">Order Items</h3>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading items...</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-words">{item.title}</p>
                          <p className="text-sm text-gray-600 break-words">by {item.author_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 capitalize break-words">{item.format}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 break-words">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 break-words">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 break-words">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden">
              {orderItems.map((item) => (
                <div key={item.id} className="bg-white border-b border-gray-200 p-4 last:border-b-0">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 break-words">{item.title}</p>
                      <p className="text-sm text-gray-600 break-words">by {item.author_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-1 text-gray-900 capitalize break-words">{item.format}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-1 text-gray-900 break-words">{formatCurrency(item.price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Qty:</span>
                        <span className="ml-1 text-gray-900 break-words">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 text-gray-900 font-medium break-words">{formatCurrency(item.total_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Proofs - Show for bank transfer orders or if proofs exist */}
      {(isBankTransfer() || paymentProofs.length > 0) && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 break-words">Payment Proofs</h3>
          <p className="text-sm text-gray-600 mb-4">
            Proof of payment for this order
            {isBankTransfer() && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Bank Transfer Order
              </span>
            )}
          </p>
          {loadingProofs ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading payment proofs...</p>
            </div>
          ) : paymentProofs.length > 0 ? (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentProofs.map((proof) => (
                      <tr key={proof.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <i className="ri-file-text-line text-blue-600 flex-shrink-0"></i>
                            <span className="text-sm font-medium text-gray-900 break-words">{proof.file_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 break-words">
                          {formatDate(proof.upload_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${
                            proof.status === 'verified' ? 'bg-green-100 text-green-800' : 
                            proof.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {proof.status === 'verified' ? 'Verified' : 
                             proof.status === 'rejected' ? 'Rejected' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {fileAvailability[proof.id] === false && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                File Missing
                              </span>
                            )}
                            <button
                              onClick={() => handleViewImage(proof.file_path, proof.file_name)}
                              className={`text-sm break-words ${
                                fileAvailability[proof.id] === false 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-blue-600 hover:text-blue-900'
                              }`}
                              disabled={fileAvailability[proof.id] === false}
                            >
                              View
                            </button>
                            {onProofStatusUpdate && (
                              <select
                                value={proof.status === 'verified' ? 'verified' : 
                                       proof.status === 'rejected' ? 'rejected' :
                                       'pending'}
                                onChange={(e) => handleProofStatusUpdate(proof.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="lg:hidden">
                {paymentProofs.map((proof) => (
                  <div key={proof.id} className="bg-white border-b border-gray-200 p-4 last:border-b-0">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <i className="ri-file-text-line text-blue-600 flex-shrink-0 mt-0.5"></i>
                        <span className="text-sm font-medium text-gray-900 break-words">{proof.file_name}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Upload Date:</span>
                          <span className="ml-1 text-gray-900 break-words">{formatDate(proof.upload_date)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${
                            proof.status === 'verified' ? 'bg-green-100 text-green-800' : 
                            proof.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {proof.status === 'verified' ? 'Verified' : 
                             proof.status === 'rejected' ? 'Rejected' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        {fileAvailability[proof.id] === false && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            File Missing
                          </span>
                        )}
                        <button
                          onClick={() => handleViewImage(proof.file_path, proof.file_name)}
                          className={`text-sm break-words ${
                            fileAvailability[proof.id] === false 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                          disabled={fileAvailability[proof.id] === false}
                        >
                          View
                        </button>
                        {onProofStatusUpdate && (
                          <select
                            value={proof.status === 'verified' ? 'verified' : 
                                   proof.status === 'rejected' ? 'rejected' :
                                   'pending'}
                            onChange={(e) => handleProofStatusUpdate(proof.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                {isBankTransfer() 
                  ? "No payment proofs uploaded yet for this bank transfer order." 
                  : "No payment proofs uploaded yet."
                }
              </p>
              {isBankTransfer() && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>This order uses bank transfer payment method.</p>
                  <p className="mt-1">Payment proofs will appear here once uploaded by the customer.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2 break-words">Order Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-900 break-words whitespace-pre-wrap">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerModal.isOpen}
        onClose={handleCloseImageViewer}
        imageUrl={imageViewerModal.imageUrl}
        fileName={imageViewerModal.fileName}
      />
    </div>
  );
} 