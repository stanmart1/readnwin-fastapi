import { useState } from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/fileService';
import { Link } from 'react-router-dom';
import { useBooks } from '../hooks';
import { useCartContext } from '../context/CartContext';

export default function FeaturedBooks() {
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [addedToCart, setAddedToCart] = useState(new Set());
  const { addToCart } = useCartContext();
  
  const params = { 
    page: 1, 
    limit: 8, 
    status: 'published',
    ...(selectedCategory === 'featured' && { is_featured: true }),
    ...(selectedCategory === 'bestsellers' && { is_bestseller: true }),
    ...(selectedCategory === 'new' && { is_new_release: true })
  };
  
  const { books, loading } = useBooks(params);

  const handleAddToCart = (book, e) => {
    e.preventDefault();
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author_name,
      price: book.price,
      cover_image: book.cover_image_url || book.cover_image,
      quantity: 1
    });
    
    setAddedToCart(prev => new Set(prev).add(book.id));
    setTimeout(() => {
      setAddedToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }, 2000);
  };

  const categories = [
    { id: 'featured', name: 'Featured Books', icon: 'ri-star-line' },
    { id: 'bestsellers', name: 'Bestsellers', icon: 'ri-fire-line' },
    { id: 'new', name: 'New Releases', icon: 'ri-flashlight-line' }
  ];

  const getBookImage = (book) => {
    return getImageUrl(book.cover_image_url || book.cover_image, `https://picsum.photos/seed/${book.id}/400/600`);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            <i className="ri-book-line mr-2"></i>
            Our Collection
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Books
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of bestsellers, new releases, and featured titles
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12 flex-wrap gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              }`}
            >
              <i className={category.icon}></i>
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-xl text-gray-500">No books found in this category</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl shadow-md overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300"
              >
                {/* Book Image */}
                <div className="relative overflow-hidden h-64">
                  <img
                    src={getBookImage(book)}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <Link
                        to={`/books/${book.id}`}
                        className="flex-1 bg-white text-gray-900 py-2 rounded-lg font-semibold text-center hover:bg-gray-100 transition-all text-sm"
                      >
                        View Details
                      </Link>
                      <button 
                        onClick={(e) => handleAddToCart(book, e)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-white ${
                          addedToCart.has(book.id)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {addedToCart.has(book.id) ? (
                          <>
                            <i className="ri-check-line"></i>
                            <span className="hidden sm:inline ml-1">Added</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-shopping-cart-line"></i>
                            <span className="hidden sm:inline ml-1">Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Badge */}
                  {book.is_featured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}
                  {book.is_bestseller && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Bestseller
                    </div>
                  )}
                  {book.is_new_release && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      New
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                    {book.author_name || 'Unknown Author'}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`ri-star-${i < Math.floor(book.rating || 4) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                        ></i>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        ({book.review_count || 0})
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-blue-600 font-bold text-xl">
                        ₦{(book.price || 9.99).toLocaleString('en-NG')}
                      </span>
                      {book.original_price && book.original_price > book.price && (
                        <span className="text-gray-400 text-sm line-through ml-2">
                          ₦{book.original_price.toLocaleString('en-NG')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {book.format || 'eBook'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All Button */}
        {books.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/books"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>View All Books</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
