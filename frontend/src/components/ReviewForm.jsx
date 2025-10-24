import { useState } from 'react';
import api from '../lib/api';

export default function ReviewForm({ bookId, bookTitle, onSuccess, onCancel }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      setError('Please write a review');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews/', {
        book_id: bookId,
        rating,
        title: title.trim() || null,
        review_text: reviewText.trim()
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border-2 border-green-200">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <i className="ri-check-line text-white text-3xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Review Published!</h3>
        <p className="text-gray-600 mb-4">Thank you for sharing your thoughts about {bookTitle}.</p>
        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <i className="ri-time-line mr-2"></i>
          Under admin review
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            <i className="ri-star-line mr-2 text-green-600"></i>
            How would you rate this book? *
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-200 transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <i className={`ri-star-${star <= rating ? 'fill' : 'line'}`}></i>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {rating} out of 5 stars
              </span>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
            <i className="ri-text mr-2 text-blue-600"></i>
            Review Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your review a catchy title..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            maxLength={100}
          />
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="reviewText" className="block text-sm font-semibold text-gray-800 mb-2">
            <i className="ri-chat-3-line mr-2 text-green-600"></i>
            Share your thoughts *
          </label>
          <div className="relative">
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think about this book? Share your experience..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white resize-none"
              maxLength={10000}
              required
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
              {reviewText.length}/10000
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <i className="ri-error-warning-line text-red-500 text-lg"></i>
              </div>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !reviewText.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                <span>Publishing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <i className="ri-send-plane-line mr-2"></i>
                <span>Publish Review</span>
              </div>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
