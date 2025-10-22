import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useBlog = (limit = 6) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [limit]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/blog/posts?limit=${limit}`);
      setPosts(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, error, refetch: fetchPosts };
};
