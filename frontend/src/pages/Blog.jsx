import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useBlog } from '../hooks';

export default function Blog() {
  const { posts, loading } = useBlog(20);

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section - Purple-Blue Gradient */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              ReadnWin Blog
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Insights, tips, and stories from the world of reading
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-48">
                    <img
                      src={post.featured_image ? `/storage/${post.featured_image}` : post.cover_image || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'}
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                        {post.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <i className="ri-calendar-line mr-1"></i>
                      <span>{formatDate(post.created_at)}</span>
                      <span className="mx-2">•</span>
                      <i className="ri-time-line mr-1"></i>
                      <span>{post.read_time || 5} min read</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt || post.content?.substring(0, 150) + '...'}
                    </p>

                    <Link
                      to={`/blog/${post.slug || post.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-purple-600 font-semibold"
                    >
                      Read More
                      <i className="ri-arrow-right-line ml-2"></i>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <i className="ri-article-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">No blog posts yet</h3>
              <p className="text-gray-500">Check back soon for new content</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
