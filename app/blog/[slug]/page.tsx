'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_name: string;
  status: string;
  featured: boolean;
  category: string;
  tags: string[];
  read_time: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  images?: any[];
}

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/posts/${params.slug}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPost(data.post);
          } else {
            setError('Post not found');
          }
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Social media sharing functions
  const shareToWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post?.title || '');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    const summary = encodeURIComponent(post?.excerpt || '');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };

  const shareViaEmail = () => {
    const url = encodeURIComponent(window.location.href);
    const subject = encodeURIComponent(post?.title || '');
    const body = encodeURIComponent(`${post?.title}\n\n${post?.excerpt}\n\nRead more: ${window.location.href}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section with Gradient Background */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-blue-100">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <i className="ri-arrow-right-s-line"></i>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              </li>
              <li>
                <i className="ri-arrow-right-s-line"></i>
              </li>
              <li className="text-white font-medium">{post.title}</li>
            </ol>
          </nav>

          {/* Article Meta */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100 mb-4">
              <span className="flex items-center">
                <i className="ri-user-line mr-2"></i>
                {post.author_name}
              </span>
              <span className="flex items-center">
                <i className="ri-calendar-line mr-2"></i>
                {post.published_at ? formatDate(post.published_at) : (post.created_at ? formatDate(post.created_at) : 'Unknown date')}
              </span>
              <span className="flex items-center">
                <i className="ri-time-line mr-2"></i>
                {post.read_time} min read
              </span>
              <span className="flex items-center">
                <i className="ri-eye-line mr-2"></i>
                {post.views_count} views
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                {post.category === 'general' ? 'General' : 
                 post.category === 'reading-tips' ? 'Reading Tips' :
                 post.category.charAt(0).toUpperCase() + post.category.slice(1).replace(/-/g, ' ')}
              </span>
              {post.featured && (
                <span className="px-4 py-2 bg-yellow-500 bg-opacity-20 text-yellow-100 rounded-full text-sm font-medium backdrop-blur-sm">
                  <i className="ri-star-line mr-1"></i>
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Article Title */}
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Article Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">



        {/* Featured Image */}
        {post.images && post.images.length > 0 && (
          <div className="mb-12">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={post.images[0].file_path}
                alt={post.images[0].alt_text || post.title}
                className="w-full h-64 lg:h-96 object-cover transform hover:scale-105 transition-transform duration-700"
              />
              {post.images[0].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-white text-sm text-center">
                    {post.images[0].caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none mb-12 prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Image Gallery - Horizontal Scrollable */}
        {post.images && post.images.length > 1 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <i className="ri-image-line mr-2 text-blue-600"></i>
              Article Images ({post.images.length})
            </h3>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {post.images.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-80 group">
                    <div className="relative">
                      <img
                        src={image.file_path}
                        alt={image.alt_text || image.original_name || `${post.title} - Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          // Open image in lightbox or new tab
                          window.open(image.file_path, '_blank');
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/320x192?text=Image+Not+Found';
                        }}
                      />
                      {image.is_featured && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          <i className="ri-star-fill mr-1"></i>
                          Featured
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <i className="ri-zoom-in-line text-white text-2xl"></i>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {image.caption && (
                        <p className="text-sm text-gray-700 font-medium line-clamp-2">
                          {image.caption}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {image.original_name && (
                          <span className="truncate block">{image.original_name}</span>
                        )}
                        <span className="text-gray-400">
                          {(image.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Scroll indicators */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-white to-transparent w-8 h-32 pointer-events-none"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-8 h-32 pointer-events-none"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              <i className="ri-information-line mr-1"></i>
              Click on any image to view it in full size • Scroll horizontally to see all images
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <i className="ri-price-tag-3-line mr-2 text-blue-600"></i>
              Tags
            </h3>
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Sharing Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Share this article
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-whatsapp-line text-xl"></i>
              <span className="font-medium">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareToFacebook}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-facebook-fill text-xl"></i>
              <span className="font-medium">Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={shareToLinkedIn}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-linkedin-fill text-xl"></i>
              <span className="font-medium">LinkedIn</span>
            </button>

            {/* Email */}
            <button
              onClick={shareViaEmail}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-mail-line text-xl"></i>
              <span className="font-medium">Email</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-link text-xl"></i>
              <span className="font-medium">Copy Link</span>
            </button>
          </div>
        </div>

        {/* Article Stats */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <i className="ri-heart-line text-xl"></i>
                <span className="font-medium">{post.likes_count} likes</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <i className="ri-message-2-line text-xl"></i>
                <span className="font-medium">{post.comments_count} comments</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <i className="ri-eye-line text-xl"></i>
                <span className="font-medium">{post.views_count} views</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Published on {post.published_at ? formatDate(post.published_at) : (post.created_at ? formatDate(post.created_at) : 'Unknown date')}
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Related Articles</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover more insights and tips from our reading community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This would be populated with related posts */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <i className="ri-book-open-line text-white text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      More posts coming soon...
                    </h3>
                    <p className="text-sm text-gray-500">Stay tuned for updates</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Related posts will be displayed here based on category and tags to help you discover more great content.
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/blog"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="ri-article-line mr-2"></i>
              Explore All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Share Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <div className="relative group">
          <button className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center">
            <i className="ri-share-line text-xl"></i>
          </button>
          
          {/* Floating Share Menu */}
          <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-white rounded-2xl shadow-xl p-4 space-y-3 min-w-[200px]">
              <button
                onClick={shareToWhatsApp}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i className="ri-whatsapp-line text-green-500 text-xl"></i>
                <span className="font-medium">WhatsApp</span>
              </button>
              
              <button
                onClick={shareToFacebook}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i className="ri-facebook-fill text-blue-600 text-xl"></i>
                <span className="font-medium">Facebook</span>
              </button>
              
              <button
                onClick={shareToLinkedIn}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i className="ri-linkedin-fill text-blue-700 text-xl"></i>
                <span className="font-medium">LinkedIn</span>
              </button>
              
              <button
                onClick={shareViaEmail}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i className="ri-mail-line text-gray-600 text-xl"></i>
                <span className="font-medium">Email</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i className="ri-link text-purple-600 text-xl"></i>
                <span className="font-medium">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 