import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function FeaturedBooks() {
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'featured', name: 'Featured Books', icon: 'ri-star-line' },
    { id: 'bestsellers', name: 'Bestsellers', icon: 'ri-fire-line' },
    { id: 'new', name: 'New Releases', icon: 'ri-flashlight-line' }
  ];

  useEffect(() => {
    loadBooks();
  }, [selectedCategory]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 8 };
      
      if (selectedCategory === 'featured') params.is_featured = true;
      else if (selectedCategory === 'bestsellers') params.is_bestseller = true;
      else if (selectedCategory === 'new') params.is_new_release = true;

      const response = await axios.get('/api/books', { params });
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Books
          </h2>
          <p className="text-xl text-gray-600">
            Explore our curated collection of bestsellers and new releases
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12 flex-wrap gap-4">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
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
                className="card group cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={book.cover_image_url || 'https://picsum.photos/seed/' + book.id + '/400/600'}
                    alt={book.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{book.author_name || 'Unknown Author'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`ri-star-${i < (book.rating || 4) ? 'fill' : 'line'} text-yellow-400 text-sm`}></i>
                      ))}
                    </div>
                    <span className="text-blue-600 font-bold text-lg">
                      ${book.price?.toFixed(2) || '9.99'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
