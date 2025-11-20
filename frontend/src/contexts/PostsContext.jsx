/**
 * Posts Context
 * Manages bulletin posts state and operations using the backend API
 */

import { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { logDataOperation, logError } from '../utils/logger';
import { filterBySearch } from '../utils/helpers';

export const PostsContext = createContext(null);

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    architect: '',
    search: '',
    dateRange: null,
  });

  /**
   * Fetch all posts
   */
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPosts();

      if (response.success && response.data) {
        setPosts(response.data);
        setFilteredPosts(response.data);
        logDataOperation('read', 'posts', { count: response.data.length });
      }
    } catch (error) {
      logError('Failed to fetch posts', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch single post
   */
  const fetchPost = useCallback(async (postId) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPost(postId);

      if (response.success && response.data) {
        setSelectedPost(response.data);
        return response.data;
      }
    } catch (error) {
      logError(`Failed to fetch post: ${postId}`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create new post
   */
  const createPost = useCallback(async (postData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.createPost(postData);

      if (response.success && response.data) {
        setPosts(prev => [response.data, ...prev]);
        logDataOperation('create', 'posts', { postId: response.data.id });
        return response.data;
      }
    } catch (error) {
      logError('Failed to create post', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update post
   */
  const updatePost = useCallback(async (postId, updates) => {
    try {
      setIsLoading(true);
      const response = await apiClient.updatePost(postId, updates);

      if (response.success && response.data) {
        setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(response.data);
        }
        logDataOperation('update', 'posts', { postId });
        return response.data;
      }
    } catch (error) {
      logError(`Failed to update post: ${postId}`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPost]);

  /**
   * Delete post
   */
  const deletePost = useCallback(async (postId) => {
    try {
      setIsLoading(true);
      const response = await apiClient.deletePost(postId);

      if (response.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(null);
        }
        logDataOperation('delete', 'posts', { postId });
      }
    } catch (error) {
      logError(`Failed to delete post: ${postId}`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPost]);

  /**
   * Assign architects to post
   */
  const assignArchitects = useCallback(async (postId, assignedArchitects) => {
    try {
      const response = await apiClient.assignArchitects(postId, assignedArchitects);

      if (response.success && response.data) {
        setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
        logDataOperation('update', 'posts', { postId, action: 'assign_architects' });
        return response.data;
      }
    } catch (error) {
      logError('Failed to assign architects', error);
      throw error;
    }
  }, []);

  /**
   * Update post status
   */
  const updateStatus = useCallback(async (postId, newStatus) => {
    try {
      const response = await apiClient.updatePost(postId, { status: newStatus });

      if (response.success && response.data) {
        setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
        logDataOperation('update', 'posts', { postId, action: 'status_change', newStatus });
        return response.data;
      }
    } catch (error) {
      logError('Failed to update status', error);
      throw error;
    }
  }, []);

  /**
   * Archive post
   */
  const archivePost = useCallback(async (postId) => {
    try {
      const response = await apiClient.archivePost(postId, true);

      if (response.success && response.data) {
        setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
        logDataOperation('update', 'posts', { postId, action: 'archive' });
        return response.data;
      }
    } catch (error) {
      logError('Failed to archive post', error);
      throw error;
    }
  }, []);

  /**
   * Unarchive post
   */
  const unarchivePost = useCallback(async (postId) => {
    try {
      const response = await apiClient.archivePost(postId, false);

      if (response.success && response.data) {
        setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
        logDataOperation('update', 'posts', { postId, action: 'unarchive' });
        return response.data;
      }
    } catch (error) {
      logError('Failed to unarchive post', error);
      throw error;
    }
  }, []);

  /**
   * Apply filters to posts
   */
  useEffect(() => {
    let result = [...posts];

    // Filter by status
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Filter by architect
    if (filters.architect) {
      result = result.filter(p =>
        p.assignedArchitects && p.assignedArchitects.includes(filters.architect)
      );
    }

    // Filter by search query
    if (filters.search) {
      result = filterBySearch(result, filters.search, ['title', 'description', 'concernedParties']);
    }

    // Filter by date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      result = result.filter(p => {
        const postDate = new Date(p.createdAt);
        return postDate >= start && postDate <= end;
      });
    }

    setFilteredPosts(result);
  }, [posts, filters]);

  const value = {
    posts,
    filteredPosts,
    selectedPost,
    isLoading,
    filters,
    setFilters,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    assignArchitects,
    updateStatus,
    archivePost,
    unarchivePost,
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export default PostsContext;
