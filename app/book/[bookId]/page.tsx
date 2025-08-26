"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AddToCartButton from "@/components/AddToCartButton";
import Header from "@/components/Header";
import { formatNumber } from "@/lib/dateUtils";
import { useCart } from "@/contexts/CartContext";
import { constructImageUrl } from "@/lib/imageUtils";

interface BookDetails {
  id: number;
  title: string;
  subtitle?: string;
  author_name: string;
  category_name: string;
  price: number;
  original_price?: number;
  rating?: number;
  review_count?: number;
  cover_image_url: string;
  stock_quantity: number;
  description?: string;
  short_description?: string;
  pages?: number;
  language: string;
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  format: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  status: string;
}

export default function BookDetailsPage({
  params,
}: {
  params: { bookId: string };
}) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [book, setBook] = useState<BookDetails | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // Load book data from API
  useEffect(() => {
    loadBookData();
  }, [params.bookId]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${params.bookId}`);

      if (response.ok) {
        const data = await response.json();
        setBook(data.book);

        // Load related books from the same category
        if (data.book?.category_id) {
          const relatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?category_id=${data.book.category_id}&limit=4`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            // Filter out the current book from related books
            const filteredRelatedBooks =
              relatedData.books?.filter(
                (relatedBook: any) => relatedBook.id !== data.book.id,
              ) || [];
            setRelatedBooks(filteredRelatedBooks.slice(0, 3));
          }
        }

        // Load reviews
        const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${params.bookId}/reviews`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews);
          setReviewStats({ total: reviewsData.total, average_rating: reviewsData.average_rating });
        }
      } else {
        setError("Book not found");
      }
    } catch (error) {
      console.error("Error loading book:", error);
      setError("Failed to load book details");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (!book) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: book.id,
          quantity: book.format === 'ebook' ? 1 : quantity
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(result.message || "Item added to cart successfully!");
        // Trigger cart refresh
        window.dispatchEvent(new CustomEvent('cart-refresh'));
      } else {
        alert(result.detail || "Failed to add item to cart");
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert("Failed to add item to cart");
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`ri-star-${i <= rating ? "fill" : "line"} text-yellow-400 text-lg`}
        ></i>,
      );
    }
    return stars;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "ri-file-text-line" },
    { id: "reviews", label: "Reviews", icon: "ri-star-line" },
    { id: "details", label: "Details", icon: "ri-information-line" },
    { id: "related", label: "Related Books", icon: "ri-book-line" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Book Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                {error || "The book you are looking for does not exist."}
              </p>
              <Link
                href="/books"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Books
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Home
          </Link>
          <i className="ri-arrow-right-s-line"></i>
          <Link
            href="/books"
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Books
          </Link>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-gray-900 font-medium">{book.title}</span>
        </nav>

        {/* Book Details Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <img
                  src={constructImageUrl(book.cover_image_url)}
                  alt={book.title}
                  className="w-full rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-book.jpg';
                  }}
                />
                {book.format === 'physical' && book.stock_quantity <= 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-2 rounded-full font-medium shadow-lg">
                    Out of Stock
                  </div>
                )}
                {/* Hover overlay with quick actions */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                  <button
                    onClick={handleWishlist}
                    className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    title={
                      isAuthenticated
                        ? isWishlisted
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                        : "Login to Wishlist"
                    }
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i
                        className={`ri-heart-${isWishlisted ? "fill text-red-500" : "line text-gray-600"} text-lg`}
                      ></i>
                    </div>
                  </button>
                  <button className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className="ri-share-line text-gray-600 text-lg"></i>
                    </div>
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                    disabled={book.stock_quantity <= 0}
                    title={isAuthenticated ? "Add to Cart" : "Login to Add to Cart"}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className="ri-shopping-cart-line text-lg"></i>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Book Info */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="text-5xl font-bold text-gray-900 mb-3 leading-tight">
                  {book.title}
                </h1>
                <p className="text-2xl text-gray-600 mb-6">
                  by{" "}
                  <span className="font-semibold text-blue-600">
                    {book.author_name}
                  </span>
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      {renderStars(book.rating || 0)}
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {book.rating || 0}
                    </span>
                  </div>
                  <span className="text-gray-500 text-lg">
                    ({formatNumber(book.review_count || 0)} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4 mb-8">
                  <span className="text-4xl font-bold gradient-text">
                    ₦{book.price.toLocaleString()}
                  </span>
                  {book.original_price && (
                    <span className="text-2xl text-gray-500 line-through">
                      ₦{book.original_price.toLocaleString()}
                    </span>
                  )}
                  {book.original_price && (
                    <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-lg">
                      {Math.round(
                        ((book.original_price - book.price) /
                          book.original_price) *
                          100,
                      )}
                      % OFF
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center space-x-6 mb-8">
                  {isAuthenticated && book.format === 'physical' && (
                    <div className="flex items-center space-x-3">
                      <label className="text-lg font-medium text-gray-700">
                        Quantity:
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="border-2 border-gray-300 rounded-lg px-4 py-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <AddToCartButton
                    bookId={book.id}
                    book={{
                      id: book.id,
                      title: book.title,
                      author_name: book.author_name,
                      price: book.price,
                      original_price: book.original_price,
                      cover_image_url: book.cover_image_url,
                      category_name: book.category_name,
                      format: book.format as 'ebook' | 'physical' | 'both',
                      author_id: 0,
                      category_id: 0,
                      language: book.language,
                      stock_quantity: book.stock_quantity,
                      low_stock_threshold: 5,
                      is_featured: book.is_featured,
                      is_bestseller: book.is_bestseller,
                      is_new_release: book.is_new_release,
                      status: book.status as 'draft' | 'published' | 'archived' | 'out_of_stock',
                      view_count: 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }}
                    quantity={book.format === 'ebook' ? 1 : quantity}
                    className="btn-primary text-lg px-10 py-4"
                  >
                    <i className="ri-shopping-cart-line mr-2"></i>
                    {!isAuthenticated
                      ? "Add to Cart"
                      : (book.format === 'physical' && book.stock_quantity <= 0)
                        ? "Out of Stock"
                        : "Add to Cart"}
                  </AddToCartButton>
                  <button
                    onClick={handleWishlist}
                    className={`p-4 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-110 ${
                      isWishlisted
                        ? "border-red-500 text-red-500 bg-red-50 hover:bg-red-100"
                        : "border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                    }`}
                    title={
                      isAuthenticated
                        ? isWishlisted
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                        : "Login to Wishlist"
                    }
                  >
                    <i
                      className={`ri-heart-${isWishlisted ? "fill" : "line"} text-2xl`}
                    ></i>
                  </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                    <span className="text-gray-500 text-sm font-medium">
                      Category
                    </span>
                    <p className="font-semibold text-gray-900 text-lg">
                      {book.category_name}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl border border-green-100">
                    <span className="text-gray-500 text-sm font-medium">
                      Pages
                    </span>
                    <p className="font-semibold text-gray-900 text-lg">
                      {book.pages ? formatNumber(book.pages) : "Not specified"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <span className="text-gray-500 text-sm font-medium">
                      Format
                    </span>
                    <p className="font-semibold text-gray-900 text-lg">
                      {book.format}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100">
                    <span className="text-gray-500 text-sm font-medium">
                      Language
                    </span>
                    <p className="font-semibold text-gray-900 text-lg">
                      {book.language}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-3 py-6 px-1 border-b-2 font-semibold text-base whitespace-nowrap cursor-pointer transition-all duration-300 ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className={`${tab.icon} text-xl`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {selectedTab === "overview" && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  About this book
                </h3>
                <div className="prose prose-lg max-w-none">
                  {book.description ? (
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {book.description}
                    </p>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-file-text-line text-gray-400 text-2xl"></i>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        No Description Available
                      </h4>
                      <p className="text-gray-600 text-lg">
                        This book doesn't have a description yet. Check back
                        later for more details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === "reviews" && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Customer Reviews
                </h3>
                <div className="space-y-8">
                  {book.review_count && book.review_count > 0 ? (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="flex space-x-1">
                          {renderStars(book.rating || 0)}
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {book.rating || 0}
                        </span>
                        <span className="text-gray-500">
                          ({book.review_count} reviews)
                        </span>
                      </div>
                      <p className="text-gray-600 text-lg">
                        Reviews are loaded from the database. Real customer
                        reviews will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-star-line text-gray-400 text-2xl"></i>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        No Reviews Yet
                      </h4>
                      <p className="text-gray-600 text-lg">
                        No reviews available for this book yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === "details" && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Book Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Publisher
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.publisher || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl border border-green-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Publication Date
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.publication_date || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                      <span className="text-gray-500 text-sm font-medium">
                        ISBN
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.isbn || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Format
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.format}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Pages
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.pages
                          ? formatNumber(book.pages)
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Language
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.language}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-rose-50 to-red-50 p-6 rounded-2xl border border-rose-100">
                      <span className="text-gray-500 text-sm font-medium">
                        Category
                      </span>
                      <p className="font-semibold text-gray-900 text-xl">
                        {book.category_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "related" && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Related Books
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedBooks.map((relatedBook) => (
                    <Link
                      key={relatedBook.id}
                      href={`/book/${relatedBook.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                        <div className="relative">
                          <img
                            src={constructImageUrl(relatedBook.cover_image_url)}
                            alt={relatedBook.title}
                            className="w-full h-56 object-cover object-top"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-book.jpg';
                            }}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <i className="ri-eye-line text-gray-600 text-lg"></i>
                              </div>
                            </button>
                            <button className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <i className="ri-heart-line text-gray-600 text-lg"></i>
                              </div>
                            </button>
                            <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <i className="ri-shopping-cart-line text-lg"></i>
                              </div>
                            </button>
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg">
                            {relatedBook.title}
                          </h4>
                          <p className="text-gray-600 mb-3">
                            {relatedBook.author_name}
                          </p>
                          <span className="text-xl font-bold gradient-text">
                            ₦{relatedBook.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
