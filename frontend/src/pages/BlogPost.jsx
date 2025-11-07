import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../lib/api';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/blog/posts/${slug}`);

      // Backend returns { success: true, post: {...} }
      const postData = response.data.post || response.data;
      setPost(postData);

      // Fetch related posts
      const related = await api.get('/api/blog/posts?limit=3');
      const relatedData = Array.isArray(related.data) ? related.data : [];
      setRelatedPosts(relatedData.filter(p => p.slug !== slug));
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
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

  const sharePost = (platform) => {
    const url = window.location.href;
    const text = post?.title;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
          <Link to="/blog" className="text-blue-600 hover:text-purple-600">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Image */}
      <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600">
        {(post.featured_image_url || post.cover_image) && (
          <img
            src={(post.featured_image_url || post.cover_image)?.startsWith('http') ? (post.featured_image_url || post.cover_image) : `${import.meta.env.VITE_API_BASE_URL}${post.featured_image_url || post.cover_image}`}
            alt={post.title}
            className="w-full h-full object-cover opacity-50"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
        >
          {/* Meta Info */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <i className="ri-calendar-line mr-2"></i>
            <span>{formatDate(post.created_at)}</span>
            <span className="mx-3">•</span>
            <i className="ri-time-line mr-2"></i>
            <span>{post.read_time || 5} min read</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center mb-8 pb-8 border-b">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {post.author_name?.[0] || 'A'}
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900">{post.author_name || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">Author</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-8">
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6 italic border-l-4 border-blue-600 pl-4">
                {post.excerpt.replace(/<[^>]*>/g, '')}
              </p>
            )}
            <div
              className="text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4 prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4 prose-li:mb-2 prose-strong:font-semibold prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Share Buttons */}
          <div className="pt-8 border-t">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Share this post</h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => sharePost('twitter')}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm sm:text-base"
              >
                <i className="ri-twitter-fill text-lg"></i>
                <span>Twitter</span>
              </button>
              <button
                onClick={() => sharePost('facebook')}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                <i className="ri-facebook-fill text-lg"></i>
                <span>Facebook</span>
              </button>
              <button
                onClick={() => sharePost('linkedin')}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm sm:text-base"
              >
                <i className="ri-linkedin-fill text-lg"></i>
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug || relatedPost.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                >
                  <img
                    src={(relatedPost.featured_image_url || relatedPost.cover_image)?.startsWith('http') ? (relatedPost.featured_image_url || relatedPost.cover_image) : `${import.meta.env.VITE_API_BASE_URL}${relatedPost.featured_image_url || relatedPost.cover_image || ''}` || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'}
                    alt={relatedPost.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'}
                  />
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{relatedPost.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{relatedPost.excerpt?.replace(/<[^>]*>/g, '') || ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
}
