import { useState } from 'react';
import api from '../lib/api';

export const useAdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    by_category: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/admin/blog/posts?${params}`);
      const data = response.data;
      setPosts(data.posts || []);
      return { success: true, data: data.posts };
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/blog/categories');
      const data = response.data;
      setCategories(data.categories || []);
      return { success: true, data: data.categories };
    } catch (err) {
      console.error('Error fetching categories:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/blog/stats');
      const data = response.data;
      setStats(data.stats || {
        total_posts: 0,
        published_posts: 0,
        draft_posts: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        by_category: {}
      });
      return { success: true, data: data.stats };
    } catch (err) {
      console.error('Error fetching stats:', err);
      return { success: false, error: err.message };
    }
  };

  const createPost = async (data) => {
    try {
      await api.post('/api/blog/posts', data);
      return { success: true };
    } catch (err) {
      console.error('Error creating post:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePost = async (id, data) => {
    try {
      await api.put(`/api/blog/posts/${id}`, data);
      return { success: true };
    } catch (err) {
      console.error('Error updating post:', err);
      return { success: false, error: err.message };
    }
  };

  const deletePost = async (id) => {
    try {
      await api.delete(`/admin/blog/${id}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting post:', err);
      return { success: false, error: err.message };
    }
  };

  const uploadImage = async (postId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('post_id', postId);

      const response = await api.post('/admin/blog/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error uploading image:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    posts,
    categories,
    stats,
    loading,
    error,
    fetchPosts,
    fetchCategories,
    fetchStats,
    createPost,
    updatePost,
    deletePost,
    uploadImage
  };
};
