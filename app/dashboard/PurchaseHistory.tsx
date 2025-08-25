"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  title: string;
  author_name: string;
  price: number;
  cover_image_url?: string;
}

interface WishlistItem {
  id: number;
  title: string;
  author_name: string;
  price: number;
  original_price?: number;
  cover_image_url?: string;
  dateAdded: string;
}

export default function PurchaseHistory() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("recent");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Fetch orders
        const ordersResponse = await fetch(
          `${apiUrl}/dashboard/orders?type=orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }

        // Fetch wishlist
        const wishlistResponse = await fetch(
          `${apiUrl}/dashboard/orders?type=wishlist`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setWishlist(wishlistData.wishlist || []);
        }
      } catch (error) {
        console.error("Error loading purchase history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user?.id]);

  const displayOrders = orders;
  const displayWishlist = wishlistItems;

  const tabs = [
    { id: "recent", label: "Recent Purchases" },
    { id: "wishlist", label: "Wishlist" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Purchase History & Wishlist
        </h2>
        <a
          href="/dashboard/orders"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All Orders →
        </a>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase History */}
      {activeTab === "recent" && (
        <div className="space-y-4">
          {displayOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Order {order.order_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${order.total_amount}
                  </p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <img
                      src={item.cover_image_url || "/placeholder-book.jpg"}
                      alt={item.title}
                      className="w-12 h-18 object-cover object-top rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {item.author_name}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${item.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist */}
      {activeTab === "wishlist" && (
        <div className="space-y-4">
          {displayWishlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
            >
              <img
                src={item.cover_image_url || "/placeholder-book.jpg"}
                alt={item.title}
                className="w-12 h-18 object-cover object-top rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600">{item.author_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added{" "}
                  {formatDistanceToNow(new Date(item.dateAdded), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    ${item.price}
                  </span>
                  {item.original_price && (
                    <span className="text-xs text-gray-500 line-through">
                      ${item.original_price}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2 mt-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                    Add to Cart
                  </button>
                  <button className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
