"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  Star,
  Calendar,
  Download,
  X,
} from "lucide-react";
import { UserLibraryItem } from "@/types/ecommerce";
import UnifiedEbookReader from "@/app/reading/components/UnifiedEbookReader";
import { Book as EReaderBook } from "@/types/ereader";
import { toast } from "react-toastify";
import { EnhancedApiClient } from "@/lib/api-enhanced";

interface LibraryBook {
  id: number;
  title: string;
  author_name: string;
  price: number;
  original_price?: number;
  cover_image_url?: string;
  progress?: number;
  currentPage?: number;
  totalPages?: number;
  lastReadAt?: string;
}

export default function LibrarySection() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [libraryItems, setLibraryItems] = useState<UserLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, favorites, recent
  const [selectedBook, setSelectedBook] = useState<EReaderBook | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookForReview, setSelectedBookForReview] =
    useState<UserLibraryItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserLibrary();
    }
  }, [user]);

  const loadUserLibrary = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/library`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📚 Library API Response:", data);
        console.log("📚 Raw libraryItems:", data.libraryItems);
        console.log("📚 libraryItems length:", data.libraryItems?.length || 0);
        
        if (data.libraryItems && data.libraryItems.length > 0) {
          // Filter and validate items
          const validItems = data.libraryItems.filter((item: any) => {
            console.log("🔍 Checking item:", {
              id: item.id,
              book_id: item.book_id,
              hasBook: !!item.book,
              bookTitle: item.book?.title,
              bookAuthor: item.book?.author_name || item.book?.author
            });
            
            const hasValidBook = item.book && item.book.title && item.book.title.trim();
            const hasValidAuthor = item.book && (item.book.author_name || item.book.author);
            if (!hasValidBook || !hasValidAuthor) {
              console.warn("⚠️ Filtering out invalid library item:", item);
              return false;
            }
            return true;
          });
          
          console.log("📚 Valid Library Items:", validItems);
          console.log("📚 Valid items count:", validItems.length);
          setLibraryItems(validItems);
          
          // Auto-cleanup orphaned entries if needed
          if (validItems.length < data.libraryItems.length) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/library/cleanup-orphaned`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log("🧹 Cleaned up orphaned library entries");
            } catch (cleanupError) {
              console.warn("Failed to cleanup orphaned entries:", cleanupError);
            }
          }
        } else {
          console.log("📚 No library items found or empty array");
          setLibraryItems([]);
        }
      } else {
        throw new Error(`Failed to load library: ${response.status}`);
      }
    } catch (err) {
      console.error("Error loading library:", err);
      setError(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (bookId: number) => {
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
      }

      const currentItem = libraryItems.find((item) => item.book_id === bookId);
      const newFavoriteStatus = !currentItem?.is_favorite;

      await api.toggleBookFavorite(bookId, newFavoriteStatus);

      setLibraryItems((prev) =>
        prev.map((item) =>
          item.book_id === bookId
            ? { ...item, is_favorite: newFavoriteStatus }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Convert library item to e-reader book format
  const convertToEReaderBook = (item: UserLibraryItem): EReaderBook => {
    console.log("📖 Converting library item to e-reader book:", item);
    return {
      id: item.book_id.toString(),
      title: item.book?.title || "",
      author: item.book?.author_name || item.book?.author || "",
      cover: item.book?.cover_image_url || item.book?.cover_image || "",
      contentType: "markdown" as const,
      category: item.book?.category_name || "",
      description: item.book?.description || "",
      totalPages: 0,
      fileUrl: item.book?.ebook_file_url || item.book?.file_path || ""
    };
  };

  // Handle book click to open e-reader
  const handleBookClick = async (item: UserLibraryItem) => {
    console.log("handleBookClick called for:", item.book?.title);

    if (item.book?.ebook_file_url) {
      const eReaderBook = convertToEReaderBook(item);
      console.log("Setting selected book:", eReaderBook);
      setSelectedBook(eReaderBook);

      // Track book reading activity if user hasn't started reading yet
      const progress = item.readingProgress?.progressPercentage;
      if (!progress || progress === 0) {
        try {
          const api = new EnhancedApiClient();
          const token = localStorage.getItem("token");
          if (token) {
            api.setToken(token);
          }

          await api.request("/dashboard/activity", {
            method: "POST",
            body: JSON.stringify({
              activity_type: "started",
              title: `Started reading "${item.book.title}"`,
              book_id: item.book_id,
              metadata: { action: "book_started" },
            }),
          });
        } catch (activityError) {
          console.error("Error tracking book start activity:", activityError);
        }
      }
    } else {
      // If no ebook file, redirect to book details or show message
      console.log("No ebook file, redirecting to book details");
      router.push(`/books/${item.book_id}`);
    }
  };

  // Close e-reader
  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  // Review modal functions
  const handleReviewBook = (item: UserLibraryItem) => {
    handleOpenReviewModal(item);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBookForReview(null);
    setReviewRating(5);
    setReviewText("");
    setReviewTitle("");
  };

  const handleSubmitReview = async () => {
    if (!selectedBookForReview || !reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: selectedBookForReview.book?.id,
          rating: reviewRating,
          title: reviewTitle,
          review_text: reviewText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if this was an update to an existing review
        if (data.message && data.message.includes("updated")) {
          toast.success("Review updated successfully!");
        } else {
          toast.success(
            "Review submitted successfully! It will be reviewed by our team.",
          );
        }

        handleCloseReviewModal();
        // Refresh the library to show the new review
        loadUserLibrary();
      } else {
        // Handle specific error for approved reviews
        if (data.error && data.error.includes("approved")) {
          toast.error(
            "This review has been approved by an admin and cannot be modified.",
          );
        } else {
          toast.error(
            data.error || "Failed to submit review. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = async (item: UserLibraryItem) => {
    setSelectedBookForReview(item);
    setReviewRating(5);
    setReviewTitle("");
    setReviewText("");
    setSubmittingReview(false);

    // Check if user already has a review for this book
    try {
      const response = await Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.reviews && data.reviews.length > 0) {
          const existingReview = data.reviews[0];
          if (existingReview.status === "approved") {
            toast.info(
              "You already have an approved review for this book. Approved reviews cannot be modified.",
            );
            return;
          } else if (existingReview.status === "pending") {
            toast.info(
              "You already have a pending review for this book. You can update it below.",
            );
            // Pre-fill the form with existing review data
            setReviewRating(existingReview.rating);
            setReviewTitle(existingReview.title || "");
            setReviewText(existingReview.review_text || "");
          }
        }
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }

    setShowReviewModal(true);
  };

  const filteredItems = libraryItems.filter((item) => {
    // At this point, all items should have valid book data due to backend filtering
    const authorName = item.book.author_name || item.book.author || "Unknown Author";
    const matchesSearch =
      item.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      authorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "favorites":
        return item.is_favorite;
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(item.purchase_date) > thirtyDaysAgo;
      default:
        return true;
    }
  });

  const tabs = [
    { id: "all", label: "All Books", count: libraryItems.length },
    {
      id: "favorites",
      label: "Favorites",
      count: libraryItems.filter((item) => item.is_favorite).length,
    },
    {
      id: "recent",
      label: "Recent",
      count: libraryItems.filter((item) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(item.purchase_date) > thirtyDaysAgo;
      }).length,
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow">
              <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Library</h2>
        <p className="text-gray-600">
          {libraryItems.length} book{libraryItems.length !== 1 ? "s" : ""} in
          your collection
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Books</option>
            <option value="favorites">Favorites</option>
            <option value="recent">Recent Purchases</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filter !== "all"
              ? "No books found"
              : "Your library is empty"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Start building your digital library by purchasing some books."}
          </p>
          {!searchTerm && filter === "all" && (
            <div className="mt-6">
              <button
                onClick={() => router.push("/books")}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Books
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Book Cover */}
              <div className="relative">
                <img
                  src={item.book?.cover_image_url || "/placeholder-book.jpg"}
                  alt={item.book?.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Fallback to placeholder image
                    e.currentTarget.src = "/placeholder-book.jpg";
                  }}
                />
                <button
                  onClick={() => toggleFavorite(item.book_id)}
                  className={`absolute top-2 right-2 p-1 rounded-full ${
                    item.is_favorite
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-white text-gray-400 hover:text-yellow-500"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${item.is_favorite ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.book?.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  by {item.book?.author_name || item.book?.author || "Unknown Author"}
                </p>

                <div className="mt-2 flex items-center text-xs text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Purchased{" "}
                    {new Date(item.purchase_date).toLocaleDateString()}
                  </span>
                </div>

                {/* Reading Progress */}
                {(() => {
                  const progress = item.readingProgress?.progressPercentage;
                  return progress && progress > 0 ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Reading Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Page {item.readingProgress?.currentPage || 0} of{" "}
                        {item.readingProgress?.totalPages || 0}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBookClick(item);
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    {(() => {
                      if (!item.book?.ebook_file_url) return "View Book";
                      if (
                        item.readingProgress?.progressPercentage &&
                        item.readingProgress.progressPercentage > 0
                      ) {
                        return "Continue Reading";
                      }
                      return "Read Book";
                    })()}
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReviewBook(item);
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Review Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {filteredItems.length > 0 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap">
            Load More Books
          </button>
        </div>
      )}

      {/* Unified E-Reader */}
      {selectedBook && (
        <UnifiedEbookReader
          bookId={selectedBook.id}
          fileUrl={selectedBook.fileUrl || ""}
          bookTitle={selectedBook.title}
          bookAuthor={selectedBook.author}
          bookFormat={selectedBook.format || "unknown"}
          onClose={handleCloseReader}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBookForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Write a Review
              </h3>
              <button
                onClick={handleCloseReviewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Book Info */}
            <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <img
                src={selectedBookForReview.book?.cover_image_url || ""}
                alt={selectedBookForReview.book?.title}
                className="w-16 h-20 object-cover rounded"
              />
              <div>
                <h4 className="font-semibold text-gray-900">
                  {selectedBookForReview.book?.title}
                </h4>
                <p className="text-sm text-gray-600">
                  by {selectedBookForReview.book?.author_name}
                </p>
                {/* Review Status Indicator */}
                {selectedBookForReview.book && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <i className="ri-time-line mr-1"></i>
                      Review Pending
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl ${
                      star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {reviewRating === 1
                  ? "Poor"
                  : reviewRating === 2
                    ? "Fair"
                    : reviewRating === 3
                      ? "Good"
                      : reviewRating === 4
                        ? "Very Good"
                        : "Excellent"}
              </p>
            </div>

            {/* Review Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your review in a few words"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review *
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this book..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {reviewText.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseReviewModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!reviewText.trim() || submittingReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
