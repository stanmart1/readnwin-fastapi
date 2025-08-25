"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  item_count: number;
  shipping_address?: any;
  tracking_number?: string;
}

export default function OrdersSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "ri-time-line";
      case "processing":
        return "ri-settings-line";
      case "shipped":
        return "ri-truck-line";
      case "delivered":
        return "ri-check-line";
      case "cancelled":
        return "ri-close-line";
      default:
        return "ri-question-line";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-blue-600";
      case "processing":
        return "text-blue-600";
      case "shipped":
        return "text-blue-600";
      case "delivered":
        return "text-blue-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-gray-600";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        My Orders
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-shopping-bag-line text-blue-600 text-xl"></i>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-xs text-gray-600 mb-4">
            Start shopping to see your orders here
          </p>
          <button
            onClick={() => router.push("/books")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Browse Books
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className={`${getStatusIcon(order.status)} text-blue-600`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order #{order.order_number}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <p className={`text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="ri-book-line text-blue-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{order.item_count} items</p>
                    <p className="text-xs text-gray-600">Books ordered</p>
                  </div>
                </div>
                {order.tracking_number && (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="ri-truck-line text-blue-600 text-xs"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{order.tracking_number}</p>
                      <p className="text-xs text-gray-600">Tracking number</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View Details
                </button>
                {order.status === "delivered" && (
                  <button
                    onClick={() => router.push("/books")}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Order Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}