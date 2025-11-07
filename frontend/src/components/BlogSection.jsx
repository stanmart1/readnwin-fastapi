import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useBlog } from '../hooks';
import ProgressiveImage from './ProgressiveImage';
import { stripHTML } from '../utils/htmlUtils';

export default function BlogSection() {
  const { posts, loading } = useBlog(6);
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Self-Improvement': 'bg-green-100 text-green-800',
      'Literature': 'bg-purple-100 text-purple-800',
      'Reviews': 'bg-red-100 text-red-800',
      'Reading Tips': 'bg-cyan-100 text-cyan-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800 mb-4">
            <i className="ri-article-line mr-2"></i>
            Latest Insights
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            From Our Blog
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover reading tips, book reviews, and insights from our community
          </p>
        </motion.div>

        {/* Blog Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-all"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-all"
            >
              <i className="ri-arrow-right-line text-xl text-gray-700"></i>
            </button>

            {/* Carousel */}
            <div
              ref={carouselRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-12 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-80 md:w-96 bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 snap-center"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <ProgressiveImage
                      src={
                        (post.featured_image_url || post.cover_image)?.startsWith('http') 
                          ? (post.featured_image_url || post.cover_image)
                          : post.featured_image_url || post.cover_image
                            ? `${import.meta.env.VITE_API_BASE_URL}${post.featured_image_url || post.cover_image}`
                            : 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'
                      }
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                        {post.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <i className="ri-calendar-line mr-1"></i>
                      <span>{formatDate(post.created_at)}</span>
                      <span className="mx-2">•</span>
                      <i className="ri-time-line mr-1"></i>
                      <span>{post.read_time || 5} min read</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {stripHTML(post.excerpt || post.content)?.substring(0, 150) + '...'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {post.author_name?.[0] || 'A'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {post.author_name || 'Admin'}
                        </span>
                      </div>

                      <Link
                        to={`/blog/${post.slug || post.id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1"
                      >
                        <span>Read More</span>
                        <i className="ri-arrow-right-line"></i>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/blog"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>View All Posts</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </motion.div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
