import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/fileService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../lib/api';
import { useCartContext } from '../context/CartContext';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/books/${id}`);
      const bookData = response.data.book || response.data;
      setBook(bookData);
      
      // Fetch related books
      if (bookData.category_id) {
        const related = await api.get(`/api/books/?category_id=${bookData.category_id}&limit=4`);
        setRelatedBooks(related.data.books?.filter(b => b.id !== parseInt(id)) || []);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!book || !book.id) {
      alert('Book information not loaded');
      return;
    }
    
    try {
      setAddingToCart(true);
      await addToCart(book, 1);
      alert('Book added to cart!');
    } catch (error) {
      console.error('Add to cart error:', error);
      if (error.response?.status === 401) {
        alert('Please login to add items to cart');
        navigate('/login');
      } else {
        alert('Failed to add to cart');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Book not found</h2>
          <Link to="/books" className="text-blue-600 hover:text-purple-600">
            Browse all books
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Book Detail Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Book Cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={getImageUrl(book.cover_image_url || book.cover_image, 'https://via.placeholder.com/400x600?text=No+Cover')}
                alt={book.title}
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              />
            </motion.div>

            {/* Book Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-6">by {book.author_name || book.author || 'Unknown Author'}</p>

              {/* Rating */}
              {book.rating && (
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`ri-star-${i < Math.floor(book.rating) ? 'fill' : 'line'}`}></i>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">({book.rating.toFixed(1)})</span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">₦{book.price?.toLocaleString() || '0'}</span>
              </div>

              {/* Buttons */}
              <div className="mb-8">
                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? (
                    <>
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="ri-shopping-cart-line mr-2"></i>
                      Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {book.description || 'No description available.'}
                </p>
              </div>

              {/* Details */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Book Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages:</span>
                    <span className="font-semibold">{book.pages || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-semibold">{book.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publisher:</span>
                    <span className="font-semibold">{book.publisher || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISBN:</span>
                    <span className="font-semibold">{book.isbn || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Related Books */}
          {relatedBooks.length > 0 && (
            <div className="mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Books</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedBooks.map((relatedBook) => (
                  <Link
                    key={relatedBook.id}
                    to={`/books/${relatedBook.id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                  >
                    <img
                      src={getImageUrl(relatedBook.cover_image_url || relatedBook.cover_image, 'https://via.placeholder.com/300x400')}
                      alt={relatedBook.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{relatedBook.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{relatedBook.author}</p>
                      <span className="text-xl font-bold text-blue-600">₦{relatedBook.price?.toLocaleString() || '0'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
