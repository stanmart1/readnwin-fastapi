'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAuthorAvatar } from '@/lib/imageUtils';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch blog posts from API
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log('Fetching blog posts from:', `${apiUrl}/blog/posts`);
        
        const response = await fetch(`${apiUrl}/blog/posts`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        setBlogPosts(data || []);
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Extract unique categories from posts and format them for display
          const postCategories = [...new Set(data.map((post: any) => post.category))];
          const formattedCategories = postCategories
            .filter((cat): cat is string => typeof cat === 'string')
            .map(cat => {
              switch (cat) {
                case 'general': return 'General';
                case 'reading-tips': return 'Reading Tips';
                case 'technology': return 'Technology';
                case 'self-improvement': return 'Self-Improvement';
                case 'literature': return 'Literature';
                case 'psychology': return 'Psychology';
                case 'reviews': return 'Reviews';
                case 'author-interviews': return 'Author Interviews';
                case 'industry-news': return 'Industry News';
                default: return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
              }
            });
          setCategories(['All', ...formattedCategories]);
          console.log('Blog posts loaded successfully:', data.length, 'posts');
        } else {
          setCategories(['All']);
          console.log('No blog posts found');
        }
      } catch (error: any) {
        console.error('Error fetching blog posts:', error);
        setError(`Failed to load blog posts: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogPosts();
    
    // Listen for real-time updates from admin dashboard
    const handleBlogUpdate = () => {
      fetchBlogPosts();
    };
    
    window.addEventListener('blogPostsUpdated', handleBlogUpdate);
    
    // Check for updates from localStorage (cross-tab communication)
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('blogPostsLastUpdate');
      const currentCheck = localStorage.getItem('blogPostsLastCheck');
      
      if (lastUpdate && lastUpdate !== currentCheck) {
        localStorage.setItem('blogPostsLastCheck', lastUpdate);
        fetchBlogPosts();
      }
    };
    
    const updateInterval = setInterval(checkForUpdates, 2000);
    
    return () => {
      window.removeEventListener('blogPostsUpdated', handleBlogUpdate);
      clearInterval(updateInterval);
    };
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const getCategoryFromDisplay = (displayCategory: string) => {
      switch (displayCategory) {
        case 'General': return 'general';
        case 'Reading Tips': return 'reading-tips';
        case 'Technology': return 'technology';
        case 'Self-Improvement': return 'self-improvement';
        case 'Literature': return 'literature';
        case 'Psychology': return 'psychology';
        case 'Reviews': return 'reviews';
        case 'Author Interviews': return 'author-interviews';
        case 'Industry News': return 'industry-news';
        default: return displayCategory.toLowerCase().replace(/\s+/g, '-');
      }
    };
    const matchesCategory = selectedCategory === 'All' || post.category === getCategoryFromDisplay(selectedCategory);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (post.author_name && post.author_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts;

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

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Connection Issue</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              <i className="ri-refresh-line mr-2"></i>
              Retry
            </button>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              ReadnWin Blog
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Discover insights, tips, and stories from the world of reading
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400 text-lg"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search articles, authors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && blogPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Featured Article
            </h2>
            <Link href={`/blog/${featuredPost.slug}`} className="group cursor-pointer">
              <article className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="lg:flex">
                  <div className="lg:w-2/3">
                    <div className="relative">
                      <img
                        src={featuredPost.images && featuredPost.images.length > 0 ? featuredPost.images[0].file_path : `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop`}
                        alt={featuredPost.title}
                        className="w-full h-64 lg:h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {featuredPost.category === 'general' ? 'General' : 
                         featuredPost.category === 'reading-tips' ? 'Reading Tips' :
                         featuredPost.category.charAt(0).toUpperCase() + featuredPost.category.slice(1).replace(/-/g, ' ')}
                      </div>
                      <div className="absolute top-4 right-4 bg-white text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/3 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">
                      {featuredPost.excerpt}
                    </p>
                    
                    <div className="flex items-center mb-6">
                      <img
                        src={getAuthorAvatar(featuredPost.author_name?.toLowerCase().replace(/\s+/g, '-') || 'default')}
                        alt={featuredPost.author_name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{featuredPost.author_name}</p>
                        <p className="text-sm text-gray-500">{new Date(featuredPost.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <i className="ri-time-line"></i>
                          <span>{featuredPost.read_time} min read</span>
                        </span>
                      </div>
                      <span className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        Read Full Article →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Latest Articles
            </h2>
            <p className="text-gray-600">
              {regularPosts.length} articles found
            </p>
          </div>
          
          {regularPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group cursor-pointer">
                  <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative">
                      <img
                        src={post.images && post.images.length > 0 ? post.images[0].file_path : `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop`}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {post.category === 'general' ? 'General' : 
                         post.category === 'reading-tips' ? 'Reading Tips' :
                         post.category.charAt(0).toUpperCase() + post.category.slice(1).replace(/-/g, ' ')}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center mb-4">
                        <img
                          src={getAuthorAvatar(post.author_name?.toLowerCase().replace(/\s+/g, '-') || 'default')}
                          alt={post.author_name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{post.author_name}</p>
                          <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <i className="ri-time-line"></i>
                          <span>{post.read_time} min read</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="ri-file-text-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {blogPosts.length === 0 ? 'No blog posts available' : 'No articles found'}
              </h3>
              <p className="text-gray-600">
                {blogPosts.length === 0 
                  ? 'Blog posts will appear here once they are published by the admin.' 
                  : 'Try adjusting your search or filter criteria'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Stay Updated with Our Latest Articles
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get notified when we publish new reading insights, book recommendations, and industry updates.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-l-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-r-full hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 