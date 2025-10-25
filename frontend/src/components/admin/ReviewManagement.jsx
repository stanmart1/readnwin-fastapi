import { useState, useEffect } from 'react';
import { useReviews } from '../../hooks/useReviews';
import { getImageUrl } from '../../lib/fileService';

const ReviewManagement = () => {
  const {
    reviews: hookReviews,
    stats,
    loading,
    fetchReviews,
    fetchStats,
    updateReviewStatus,
    toggleFeatured,
    deleteReview
  } = useReviews();

  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('approve');
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadReviews();
    fetchStats();
  }, [currentPage, filterStatus, searchQuery]);

  useEffect(() => {
    setReviews(hookReviews);
  }, [hookReviews]);

  const loadReviews = async () => {
    const params = {
      page: currentPage,
      limit: 12,
      ...(filterStatus !== 'all' && { status: filterStatus }),
      ...(searchQuery && { search: searchQuery })
    };

    const result = await fetchReviews(params);
    if (result.success) {
      setTotalPages(result.pages);
    }
  };

  const handleAction = (review, action) => {
    setSelectedReview(review);
    setModalAction(action);
    setShowModal(true);
  };

  const handleReviewClick = (review) => {
    setSelectedReviewDetail(review);
    setShowReviewDetail(true);
  };

  const confirmAction = async () => {
    if (!selectedReview) return;

    setIsProcessing(true);
    try {
      let result;
      
      if (modalAction === 'delete') {
        result = await deleteReview(selectedReview.id);
      } else if (modalAction === 'feature' || modalAction === 'unfeature') {
        result = await toggleFeatured(selectedReview.id, modalAction === 'feature');
      } else {
        const statusMap = {
          'approve': 'approved',
          'reject': 'rejected',
          'unapprove': 'pending'
        };
        
        result = await updateReviewStatus(selectedReview.id, statusMap[modalAction] || modalAction);
      }

      if (result.success) {
        alert(`Review ${modalAction}d successfully!`);
        setShowModal(false);
        setSelectedReview(null);
        loadReviews();
        fetchStats();
      } else {
        alert(result.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status, isFeatured) => {
    if (isFeatured) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center">
          <i className="ri-star-fill mr-1"></i>Featured
        </span>
      );
    }
    
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getBookImage = (review) => {
    return getImageUrl(review.book_cover);
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
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

  const ReviewCard = ({ review }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleReviewClick(review)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <img
            src={getBookImage(review)}
            alt={review.book_title}
            className="w-12 h-16 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {review.book_title}
            </h3>
            {review.book_author && (
              <p className="text-xs text-gray-600 truncate">by {review.book_author}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
          {getStatusBadge(review.status, review.is_featured)}
          <div className="flex-shrink-0">
            {getRatingStars(review.rating)}
          </div>
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

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <i className="ri-star-line text-2xl text-gray-400"></i>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <i className="ri-time-line text-2xl text-yellow-400"></i>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <i className="ri-check-line text-2xl text-green-400"></i>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <i className="ri-close-line text-2xl text-red-400"></i>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
            </div>
            <i className="ri-star-fill text-2xl text-purple-400"></i>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-blue-600">{stats.averageRating?.toFixed(1) || '0.0'}</p>
            </div>
            <i className="ri-star-half-line text-2xl text-blue-400"></i>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="featured">Featured</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <i className="ri-grid-line"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <i className="ri-list-check"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="h-20 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <i className="ri-star-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm {modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {modalAction} this review?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing && <i className="ri-loader-4-line animate-spin"></i>}
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {showReviewDetail && selectedReviewDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Review Details</h3>
              <button
                onClick={() => setShowReviewDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
              <img
                src={getBookImage(selectedReviewDetail)}
                alt={selectedReviewDetail.book_title}
                className="w-24 h-32 object-cover rounded"
              />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedReviewDetail.book_title}</h4>
                  {selectedReviewDetail.book_author && (
                    <p className="text-gray-600">by {selectedReviewDetail.book_author}</p>
                  )}
                  <div className="mt-2">
                    {getRatingStars(selectedReviewDetail.rating)}
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(selectedReviewDetail.status, selectedReviewDetail.is_featured)}
                  </div>
                </div>
              </div>

              {selectedReviewDetail.title && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Review Title</h5>
                  <p className="text-gray-700">{selectedReviewDetail.title}</p>
                </div>
              )}

              {selectedReviewDetail.review_text && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Review</h5>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReviewDetail.review_text}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-2">Reviewer Information</h5>
                <p className="text-gray-700">
                  {selectedReviewDetail.first_name} {selectedReviewDetail.last_name}
                </p>
                <p className="text-gray-600 text-sm">{selectedReviewDetail.user_email}</p>
                <p className="text-gray-500 text-sm mt-1">
                  Reviewed on {new Date(selectedReviewDetail.created_at).toLocaleDateString()}
                </p>
                {selectedReviewDetail.is_verified_purchase && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
