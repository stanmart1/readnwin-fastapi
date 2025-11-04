import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-green-600 text-4xl"></i>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          
          <p className="text-gray-600 mb-2">Order Number: <span className="font-semibold text-gray-900">#{orderId}</span></p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
            <p className="text-yellow-800">
              <i className="ri-time-line mr-2"></i>
              Your order is awaiting confirmation from admin. You will be notified once it's confirmed.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-dashboard-line mr-2"></i>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
