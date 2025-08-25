'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, handleApiError } from './utils/api';

// Dynamically import the rich text editor to avoid SSR issues
const SecureQuill = dynamic(() => import('@/components/SecureQuill'), { ssr: false });

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_id?: number;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
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
}

interface BlogCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at?: string;
}

interface BlogImage {
  id?: number;
  post_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  caption?: string;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
}

export default function BlogManagement() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [stats, setStats] = useState({
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    by_category: {} as Record<string, number>
  });

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    category: 'general',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    seo_keywords: [] as string[]
  });

  // Image management state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<BlogImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/posts/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      setError('Error fetching posts');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getBlogCategories();
      
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminApi.getBlogStats();
      
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPostImages = async (postId: number) => {
    try {
      setImageLoading(true);
      setImageError('');
      
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      const data = await response.json();
      
      if (data.success) {
        setExistingImages(data.data || []);
      } else {
        setImageError('Failed to fetch images');
      }
    } catch (error) {
      setImageError('Error fetching images');
      console.error('Error:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      const postData = {
        ...formData,
        author_id: user?.id,
        author_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Admin',
        read_time: Math.ceil(formData.content.split(' ').length / 200)
      };
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        resetForm();
        fetchPosts();
        fetchStats();
        setError('');
        
        // Trigger real-time update for public blog page
        window.dispatchEvent(new CustomEvent('blogPostsUpdated'));
        localStorage.setItem('blogPostsLastUpdate', Date.now().toString());
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (error) {
      setError('Error creating post');
      console.error('Error:', error);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost?.id) return;

    try {
      const postData = {
        ...formData,
        read_time: Math.ceil(formData.content.split(' ').length / 200)
      };
      
      const data = await adminApi.updateBlogPost(selectedPost.id, postData);
      
      if (data.success) {
        setShowEditModal(false);
        resetForm();
        fetchPosts();
        fetchStats();
        setError('');
        
        // Trigger real-time update for public blog page
        window.dispatchEvent(new CustomEvent('blogPostsUpdated'));
        localStorage.setItem('blogPostsLastUpdate', Date.now().toString());
      } else {
        setError(data.error || 'Failed to update post');
      }
    } catch (error) {
      setError(handleApiError(error));
      console.error('Error:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const data = await adminApi.deleteBlogPost(postId);
      
      if (data.success) {
        fetchPosts();
        fetchStats();
        setError('');
        
        // Trigger real-time update for public blog page
        window.dispatchEvent(new CustomEvent('blogPostsUpdated'));
        localStorage.setItem('blogPostsLastUpdate', Date.now().toString());
      } else {
        setError(data.error || 'Failed to delete post');
      }
    } catch (error) {
      setError(handleApiError(error));
      console.error('Error:', error);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      status: post.status,
      featured: post.featured,
      category: post.category,
      tags: post.tags,
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      seo_keywords: post.seo_keywords || []
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async () => {
    if (!selectedPost?.id || uploadedImages.length === 0) return;

    try {
      setImageUploading(true);
      setImageError('');
      
      const formData = new FormData();
      
      uploadedImages.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const data = await adminApi.uploadBlogImages(selectedPost.id, formData);
      
      if (data.success) {
        setUploadedImages([]);
        fetchPostImages(selectedPost.id);
        setError('');
      } else {
        setImageError(data.error || 'Failed to upload images');
      }
    } catch (error) {
      setImageError(handleApiError(error));
      console.error('Error:', error);
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedPost?.id) return;
    
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const data = await adminApi.deleteBlogImage(selectedPost.id, imageId.toString());
      
      if (data.success) {
        fetchPostImages(selectedPost.id);
        setError('');
      } else {
        setImageError(data.error || 'Failed to delete image');
      }
    } catch (error) {
      setImageError(handleApiError(error));
      console.error('Error:', error);
    }
  };

  const openImageModal = async (post: BlogPost) => {
    setSelectedPost(post);
    setShowImageModal(true);
    setUploadedImages([]);
    setImageError('');
    await fetchPostImages(post.id!);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      featured: false,
      category: 'general',
      tags: [],
      seo_title: '',
      seo_description: '',
      seo_keywords: []
    });
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading blog posts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
            <p className="text-gray-600 mt-1">Create and manage blog posts</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            <i className="ri-add-line mr-2"></i>
            Create Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-file-text-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_posts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.published_posts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-eye-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_views.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-heart-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_likes.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search posts..."
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.slug}</div>
                      {post.excerpt && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{post.excerpt}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        By {post.author_name} • {new Date(post.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                        style={{ backgroundColor: getCategoryColor(post.category) }}
                      >
                        <i className="ri-book-open-line text-white text-sm"></i>
                      </div>
                      <span className="text-sm text-gray-900 capitalize">{post.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    {post.featured && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>👁️ {post.views_count.toLocaleString()}</div>
                      <div>❤️ {post.likes_count.toLocaleString()}</div>
                      <div>💬 {post.comments_count.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                        title="Edit post"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => openImageModal(post)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors duration-200"
                        title="Manage images"
                      >
                        <i className="ri-image-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id!)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
                        title="Delete post"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="ri-file-text-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No blog posts found</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Post
          </button>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      {(showCreateModal || showEditModal) && (
        <PostModal
          title={showCreateModal ? "Create Blog Post" : "Edit Blog Post"}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSubmit={showCreateModal ? handleCreatePost : handleUpdatePost}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          quillModules={quillModules}
          quillFormats={quillFormats}
        />
      )}

      {/* Image Upload Modal */}
      {showImageModal && selectedPost && (
        <ImageModal
          post={selectedPost}
          onClose={() => {
            setShowImageModal(false);
            setSelectedPost(null);
            setUploadedImages([]);
            setExistingImages([]);
            setImageError('');
          }}
          onUpload={handleImageUpload}
          onDeleteImage={handleDeleteImage}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          existingImages={existingImages}
          imageUploading={imageUploading}
          imageLoading={imageLoading}
          imageError={imageError}
          fileInputRef={fileInputRef}
        />
      )}
    </div>
  );
}

// Post Modal Component
function PostModal({ 
  title, 
  formData, 
  setFormData, 
  categories, 
  onSubmit, 
  onClose,
  quillModules,
  quillFormats
}: {
  title: string;
  formData: any;
  setFormData: (data: any) => void;
  categories: BlogCategory[];
  onSubmit: () => void;
  onClose: () => void;
  quillModules: any;
  quillFormats: string[];
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="post-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the post..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <SecureQuill
                value={formData.content}
                onChange={(content) => setFormData({...formData, content})}
                className="h-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Mark as featured</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO optimized title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
                <input
                  type="text"
                  value={formData.seo_keywords.join(', ')}
                  onChange={(e) => setFormData({...formData, seo_keywords: e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="SEO meta description..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {title.includes('Create') ? 'Create Post' : 'Update Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Modal Component
function ImageModal({ 
  post, 
  onClose, 
  onUpload, 
  onDeleteImage,
  uploadedImages, 
  setUploadedImages, 
  existingImages,
  imageUploading, 
  imageLoading,
  imageError,
  fileInputRef 
}: {
  post: BlogPost;
  onClose: () => void;
  onUpload: () => void;
  onDeleteImage: (imageId: number) => void;
  uploadedImages: File[];
  setUploadedImages: (images: File[]) => void;
  existingImages: BlogImage[];
  imageUploading: boolean;
  imageLoading: boolean;
  imageError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages([...uploadedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Manage Images: {post.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="space-y-6">
            {/* Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Images</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Supported formats: JPEG, PNG, GIF, WebP (max 5MB each)</p>
            </div>

            {/* Selected Images for Upload */}
            {uploadedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images to Upload ({uploadedImages.length})</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200"
                        title="Remove from upload"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                        <p className="truncate">{file.name}</p>
                        <p className="text-gray-300">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Images Section */}
            {imageLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading existing images...</p>
              </div>
            )}

            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Images ({existingImages.length})</label>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group flex-shrink-0 w-48">
                        <div className="relative">
                          <img
                            src={image.file_path}
                            alt={image.alt_text || image.original_name}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
                            }}
                          />
                          <button
                            onClick={() => onDeleteImage(image.id!)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                            title="Delete image"
                          >
                            <i className="ri-delete-bin-line text-xs"></i>
                          </button>
                          {image.is_featured && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              Featured
                            </div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600 truncate font-medium">{image.original_name}</p>
                          <p className="text-xs text-gray-400">{(image.file_size / 1024 / 1024).toFixed(2)} MB</p>
                          {image.caption && (
                            <p className="text-xs text-gray-500 line-clamp-2">{image.caption}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Scroll indicators */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-white to-transparent w-8 h-16 pointer-events-none"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-8 h-16 pointer-events-none"></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {imageError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <i className="ri-error-warning-line text-red-400 text-xl"></i>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{imageError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!imageLoading && existingImages.length === 0 && uploadedImages.length === 0 && (
              <div className="text-center py-8">
                <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">No images uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload images to enhance your blog post</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            <button
              onClick={onUpload}
              disabled={imageUploading || uploadedImages.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {imageUploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="ri-upload-line mr-2"></i>
                  Upload Images ({uploadedImages.length})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 