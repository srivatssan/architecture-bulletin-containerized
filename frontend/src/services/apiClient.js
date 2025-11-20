/**
 * API Client for Architecture Bulletin Backend
 *
 * Provides a centralized interface for all API calls to the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get current token
   */
  getToken() {
    return this.token;
  }

  /**
   * Make HTTP request to API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== Health & Status ====================

  async healthCheck() {
    return this.request('/health');
  }

  async getStatus() {
    return this.request('/api/status');
  }

  // ==================== Authentication ====================

  async login(username, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async verifyToken(token) {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ==================== Posts ====================

  async getPosts() {
    return this.request('/api/posts');
  }

  async getPost(id) {
    return this.request(`/api/posts/${id}`);
  }

  async createPost(postData) {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(id, updates) {
    return this.request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePost(id) {
    return this.request(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async archivePost(id, isArchived) {
    return this.request(`/api/posts/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ isArchived }),
    });
  }

  async assignArchitects(id, assignedArchitects) {
    return this.request(`/api/posts/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedArchitects }),
    });
  }

  // ==================== Configuration ====================

  async getArchitects() {
    return this.request('/api/config/architects');
  }

  async getStatuses() {
    return this.request('/api/config/statuses');
  }

  async getUsers() {
    return this.request('/api/config/users');
  }

  async updateArchitects(architects) {
    return this.request('/api/config/architects', {
      method: 'PUT',
      body: JSON.stringify({ architects }),
    });
  }

  async updateStatuses(statuses) {
    return this.request('/api/config/statuses', {
      method: 'PUT',
      body: JSON.stringify({ statuses }),
    });
  }

  // ==================== File Uploads ====================

  async uploadAttachment(postId, filename, content) {
    return this.request('/api/uploads/attachments', {
      method: 'POST',
      body: JSON.stringify({ postId, filename, content }),
    });
  }

  async uploadProof(postId, filename, content) {
    return this.request('/api/uploads/proof', {
      method: 'POST',
      body: JSON.stringify({ postId, filename, content }),
    });
  }

  async downloadFile(type, postId, filename) {
    return this.request(`/api/uploads/${type}/${postId}/${filename}`);
  }

  async deleteFile(type, postId, filename) {
    return this.request(`/api/uploads/${type}/${postId}/${filename}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;
