'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Review {
  id: number;
  book_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  rating: number;
  title?: string;
  review_text?: string;
  is_verified_purchase: boolean;
  is_helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  book_title: string;
  book_cover?: string;
  book_author?: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
  averageRating: number;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'featured';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'delete' | 'feature' | 'unfeature' | 'unapprove'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [currentPage, filterStatus, searchQuery]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        status: filterStatus === 'all' ? '' : filterStatus,
        search: searchQuery
      });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalPages(data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/reviews/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAction = async (review: Review, action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature' | 'unapprove') => {
    setSelectedReview(review);
    setModalAction(action);
    setShowModal(true);
    setAdminNotes('');
  };

  const handleReviewClick = (review: Review) => {
    setSelectedReviewDetail(review);
    setShowReviewDetail(true);
  };

  const confirmAction = async () => {
    if (!selectedReview) return;

    try {
      let response;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      if (modalAction === 'delete') {
        response = await fetch(`${apiUrl}/admin/reviews?id=${selectedReview.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else if (modalAction === 'feature' || modalAction === 'unfeature') {
        response = await fetch(`${apiUrl}/admin/reviews/feature`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reviewId: selectedReview.id,
            isFeatured: modalAction === 'feature'
          })
        });
      } else {
        // Map action to correct status value
        const statusMap: { [key: string]: string } = {
          'approve': 'approved',
          'reject': 'rejected',
          'unapprove': 'pending'
        };
        
        response = await fetch(`${apiUrl}/admin/reviews`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reviewId: selectedReview.id,
            status: statusMap[modalAction] || modalAction,
            adminNotes
          })
        });
      }

      if (response.ok) {
        toast.success(`Review ${modalAction}d successfully`);
        fetchReviews();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${modalAction} review`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(`Failed to ${modalAction} review`);
    } finally {
      setShowModal(false);
      setSelectedReview(null);
      setAdminNotes('');
    }
  };

  const getStatusBadge = (status: string, isFeatured: boolean = false) => {
    const baseStyles = "px-2 py-1 text-xs font-medium rounded-full";
    
    if (isFeatured) {
      return <span className={`${baseStyles} bg-purple-100 text-purple-800`}>Featured</span>;
    }

    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`${baseStyles} ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`ri-star-fill text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleReviewClick(review)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {review.book_cover && (
            <img
              src={review.book_cover}
              alt={review.book_title}
              className="w-12 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {review.book_title}
            </h3>
            {review.book_author && (
              <p className="text-xs text-gray-600 truncate">by {review.book_author}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {getStatusBadge(review.status, review.is_featured)}
          {getRatingStars(review.rating)}
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-3">
        {review.title && (
          <h4 className="text-sm font-medium text-gray-900 mb-1">{review.title}</h4>
        )}
        {review.review_text && (
          <p className="text-sm text-gray-600 line-clamp-3">{review.review_text}</p>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span>{review.first_name} {review.last_name}</span>
        <span>{new Date(review.created_at).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {review.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction(review, 'approve')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(review, 'reject')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              Reject
            </button>
          </>
        )}
        {review.status === 'approved' && (
          <>
            <button
              onClick={() => handleAction(review, 'unapprove')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Unapprove
            </button>
            {!review.is_featured && (
              <button
                onClick={() => handleAction(review, 'feature')}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                Feature
              </button>
            )}
          </>
        )}
        {review.status === 'rejected' && (
          <button
            onClick={() => handleAction(review, 'approve')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Approve
          </button>
        )}
        {review.is_featured && (
          <button
            onClick={() => handleAction(review, 'unfeature')}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Unfeature
          </button>
        )}
        <button
          onClick={() => handleAction(review, 'delete')}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const ReviewListItem = ({ review }: { review: Review }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleReviewClick(review)}
    >
      <div className="flex items-start space-x-4">
        {/* Book Cover */}
        {review.book_cover && (
          <img
            src={review.book_cover}
            alt={review.book_title}
            className="w-16 h-20 object-cover rounded flex-shrink-0"
          />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {review.book_title}
              </h3>
              {review.book_author && (
                <p className="text-xs text-gray-600">by {review.book_author}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1 ml-2">
              {getStatusBadge(review.status, review.is_featured)}
              {getRatingStars(review.rating)}
            </div>
          </div>
          
          {review.title && (
            <h4 className="text-sm font-medium text-gray-900 mb-1">{review.title}</h4>
          )}
          {review.review_text && (
            <p className="text-sm text-gray-600 line-clamp-2">{review.review_text}</p>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{review.first_name} {review.last_name}</span>
            <span>{new Date(review.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        {review.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction(review, 'approve')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(review, 'reject')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              Reject
            </button>
          </>
        )}
        {review.status === 'approved' && (
          <>
            <button
              onClick={() => handleAction(review, 'unapprove')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Unapprove
            </button>
            {!review.is_featured && (
              <button
                onClick={() => handleAction(review, 'feature')}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                Feature
              </button>
            )}
          </>
        )}
        {review.status === 'rejected' && (
          <button
            onClick={() => handleAction(review, 'approve')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Approve
          </button>
        )}
        {review.is_featured && (
          <button
            onClick={() => handleAction(review, 'unfeature')}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Unfeature
          </button>
        )}
        <button
          onClick={() => handleAction(review, 'delete')}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600">Manage and moderate book reviews</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <i className="ri-filter-line mr-2"></i>
            Filters
          </button>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <i className="ri-grid-line"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <i className="ri-list-check"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-star-line text-blue-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-time-line text-yellow-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-check-line text-green-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Approved</p>
              <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="ri-close-line text-red-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-star-smile-line text-purple-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Featured</p>
              <p className="text-xl font-bold text-gray-900">{stats.featured}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="ri-star-fill text-orange-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Avg Rating</p>
              <p className="text-xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="featured">Featured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search reviews, books, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-star-line text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {reviews.map((review) => 
            viewMode === 'grid' ? (
              <ReviewCard key={review.id} review={review} />
            ) : (
              <ReviewListItem key={review.id} review={review} />
            )
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalAction === 'approve' && 'Approve Review'}
              {modalAction === 'reject' && 'Reject Review'}
              {modalAction === 'delete' && 'Delete Review'}
              {modalAction === 'feature' && 'Feature Review'}
              {modalAction === 'unfeature' && 'Unfeature Review'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to {modalAction} this review?
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedReview.book_title}</p>
                <p className="text-xs text-gray-600 mb-2">by {selectedReview.first_name} {selectedReview.last_name}</p>
                {selectedReview.title && (
                  <p className="text-sm font-medium text-gray-900 mb-1">{selectedReview.title}</p>
                )}
                {selectedReview.review_text && (
                  <p className="text-sm text-gray-600 line-clamp-3">{selectedReview.review_text}</p>
                )}
              </div>
              
              {(modalAction === 'approve' || modalAction === 'reject') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this action..."
                  />
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReview(null);
                  setAdminNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : modalAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modalAction === 'unapprove'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : modalAction === 'feature'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : modalAction === 'unfeature'
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalAction === 'approve' && 'Approve'}
                {modalAction === 'reject' && 'Reject'}
                {modalAction === 'unapprove' && 'Unapprove'}
                {modalAction === 'delete' && 'Delete'}
                {modalAction === 'feature' && 'Feature'}
                {modalAction === 'unfeature' && 'Unfeature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {showReviewDetail && selectedReviewDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
              <button
                onClick={() => {
                  setShowReviewDetail(false);
                  setSelectedReviewDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Book Information */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                {selectedReviewDetail.book_cover && (
                  <img
                    src={selectedReviewDetail.book_cover}
                    alt={selectedReviewDetail.book_title}
                    className="w-20 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedReviewDetail.book_title}</h4>
                  {selectedReviewDetail.book_author && (
                    <p className="text-sm text-gray-600">by {selectedReviewDetail.book_author}</p>
                  )}
                  <div className="flex items-center mt-2">
                    {getRatingStars(selectedReviewDetail.rating)}
                    <span className="ml-2">{getStatusBadge(selectedReviewDetail.status, selectedReviewDetail.is_featured)}</span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-3">
                {selectedReviewDetail.title && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Review Title</h5>
                    <p className="text-base font-semibold text-gray-900">{selectedReviewDetail.title}</p>
                  </div>
                )}
                
                {selectedReviewDetail.review_text && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Review Text</h5>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedReviewDetail.review_text}</p>
                  </div>
                )}
              </div>

              {/* User Information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Reviewer Information</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedReviewDetail.first_name} {selectedReviewDetail.last_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedReviewDetail.user_email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">{new Date(selectedReviewDetail.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Verified Purchase:</span>
                    <span className="ml-2 font-medium">{selectedReviewDetail.is_verified_purchase ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {selectedReviewDetail.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowReviewDetail(false);
                        setSelectedReviewDetail(null);
                        handleAction(selectedReviewDetail, 'approve');
                      }}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewDetail(false);
                        setSelectedReviewDetail(null);
                        handleAction(selectedReviewDetail, 'reject');
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <i className="ri-close-line mr-2"></i>
                      Reject
                    </button>
                  </>
                )}
                
                {selectedReviewDetail.status === 'approved' && !selectedReviewDetail.is_featured && (
                  <button
                    onClick={() => {
                      setShowReviewDetail(false);
                      setSelectedReviewDetail(null);
                      handleAction(selectedReviewDetail, 'feature');
                    }}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <i className="ri-star-line mr-2"></i>
                    Feature
                  </button>
                )}
                
                {selectedReviewDetail.is_featured && (
                  <button
                    onClick={() => {
                      setShowReviewDetail(false);
                      setSelectedReviewDetail(null);
                      handleAction(selectedReviewDetail, 'unfeature');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <i className="ri-star-fill mr-2"></i>
                    Unfeature
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowReviewDetail(false);
                    setSelectedReviewDetail(null);
                    handleAction(selectedReviewDetail, 'delete');
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 