import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../lib/api';

export default function BankTransferProof() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      
      // Get bank details from checkout response (stored in localStorage temporarily)
      const checkoutData = localStorage.getItem('bank_transfer_details');
      if (checkoutData) {
        const data = JSON.parse(checkoutData);
        setOrderData(data.order);
        setBankDetails(data.bankTransferDetails);
        localStorage.removeItem('bank_transfer_details');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/bank-transfer/upload-proof/${orderData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload proof');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 pt-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Cart
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-6">
            <i className="ri-bank-line text-blue-600 text-3xl mr-3"></i>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bank Transfer Payment</h1>
              <p className="text-gray-600">Order #{orderData?.order_number}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="ri-alert-line text-red-600 mr-2"></i>
                <p className="text-red-800">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
              </div>
            </div>
          )}

          {/* Bank Account Details */}
          {bankDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer to this account</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="font-semibold">{bankDetails.bank_account.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-semibold text-lg">{bankDetails.bank_account.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="font-semibold">{bankDetails.bank_account.account_name}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Amount to Transfer:</span>
                  <span className="font-bold text-xl text-blue-600">₦{bankDetails.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {bankDetails?.payment_instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">Payment Instructions:</h4>
              <p className="text-sm text-yellow-800 whitespace-pre-line">{bankDetails.payment_instructions}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Proof of Payment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select file (JPG, PNG, PDF - Max 5MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-file-line text-gray-600 mr-2"></i>
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="ri-check-line mr-2"></i>
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
