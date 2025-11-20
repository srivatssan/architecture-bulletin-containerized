/**
 * Local Data Service
 * Filesystem-based data operations for local development
 * Uses localStorage for writes, fetch for reads from local-data/
 */

import { logDataOperation, logError } from '../utils/logger';

const LOCAL_DATA_PREFIX = 'local_data_';
// Use Vite's base URL for serving static files
const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}local-data`;
};

/**
 * Read JSON file from local-data directory
 * @param {string} path - Relative path from local-data/
 * @returns {Promise<Object>} - { data, lastModified }
 */
export const readLocalFile = async (path) => {
  try {
    // First check localStorage for updates
    const localKey = `${LOCAL_DATA_PREFIX}${path}`;
    const localData = localStorage.getItem(localKey);

    if (localData) {
      return JSON.parse(localData);
    }

    // Fall back to reading from file
    const basePath = getBasePath();
    const response = await fetch(`${basePath}/${path}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, lastModified: new Date().toISOString() };
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    logError(`Failed to read local file: ${path}`, error);
    throw error;
  }
};

/**
 * Write JSON file to localStorage (simulates filesystem)
 * @param {string} path - Relative path from local-data/
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
export const writeLocalFile = async (path, data) => {
  try {
    const localKey = `${LOCAL_DATA_PREFIX}${path}`;
    const payload = {
      data,
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(localKey, JSON.stringify(payload));
    logDataOperation('write', 'local_file', { path });
  } catch (error) {
    logError(`Failed to write local file: ${path}`, error);
    throw error;
  }
};

/**
 * List files in a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array>} - Array of file objects
 */
export const listLocalDirectory = async (dirPath) => {
  try {
    // For local development, we'll track files in localStorage
    const indexKey = `${LOCAL_DATA_PREFIX}index_${dirPath}`;
    const index = localStorage.getItem(indexKey);

    if (index) {
      return JSON.parse(index);
    }

    // Return empty array if no index exists
    return [];
  } catch (error) {
    logError(`Failed to list directory: ${dirPath}`, error);
    return [];
  }
};

/**
 * Add file to directory index
 * @param {string} dirPath
 * @param {string} filename
 */
const addToDirectoryIndex = (dirPath, filename) => {
  const indexKey = `${LOCAL_DATA_PREFIX}index_${dirPath}`;
  const index = JSON.parse(localStorage.getItem(indexKey) || '[]');

  if (!index.find(f => f.name === filename)) {
    index.push({
      name: filename,
      path: `${dirPath}/${filename}`,
      type: 'file',
      size: 0,
    });
    localStorage.setItem(indexKey, JSON.stringify(index));
  }
};

/**
 * Delete file from localStorage
 * @param {string} path
 * @returns {Promise<void>}
 */
export const deleteLocalFile = async (path) => {
  try {
    const localKey = `${LOCAL_DATA_PREFIX}${path}`;
    localStorage.removeItem(localKey);
    logDataOperation('delete', 'local_file', { path });
  } catch (error) {
    logError(`Failed to delete local file: ${path}`, error);
    throw error;
  }
};

/**
 * Save binary file (base64)
 * @param {string} path
 * @param {string} base64Content
 * @returns {Promise<void>}
 */
export const saveLocalBinaryFile = async (path, base64Content) => {
  try {
    const localKey = `${LOCAL_DATA_PREFIX}${path}`;
    localStorage.setItem(localKey, base64Content);

    // Update directory index
    const parts = path.split('/');
    const filename = parts.pop();
    const dirPath = parts.join('/');
    addToDirectoryIndex(dirPath, filename);

    logDataOperation('write', 'local_binary_file', { path });
  } catch (error) {
    logError(`Failed to save binary file: ${path}`, error);
    throw error;
  }
};

/**
 * Get binary file content
 * @param {string} path
 * @returns {Promise<string>} - Base64 content
 */
export const getLocalBinaryFile = async (path) => {
  try {
    const localKey = `${LOCAL_DATA_PREFIX}${path}`;
    const content = localStorage.getItem(localKey);

    if (!content) {
      throw new Error('File not found');
    }

    return content;
  } catch (error) {
    logError(`Failed to get binary file: ${path}`, error);
    throw error;
  }
};

/**
 * Get all posts
 * @returns {Promise<Array>}
 */
export const getAllLocalPosts = async () => {
  try {
    const files = await listLocalDirectory('posts');
    const posts = [];

    for (const file of files) {
      const result = await readLocalFile(file.path);
      if (result && result.data) {
        posts.push(result.data);
      }
    }

    // Sort by created date descending
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return posts;
  } catch (error) {
    logError('Failed to get all local posts', error);
    return [];
  }
};

/**
 * Save post
 * @param {Object} post
 * @returns {Promise<void>}
 */
export const saveLocalPost = async (post) => {
  try {
    const path = `posts/${post.id}.json`;
    await writeLocalFile(path, post);
    addToDirectoryIndex('posts', `${post.id}.json`);
  } catch (error) {
    logError('Failed to save local post', error);
    throw error;
  }
};

/**
 * Get single post
 * @param {string} postId
 * @returns {Promise<Object|null>}
 */
export const getLocalPost = async (postId) => {
  try {
    const result = await readLocalFile(`posts/${postId}.json`);
    return result ? result.data : null;
  } catch (error) {
    logError(`Failed to get local post: ${postId}`, error);
    return null;
  }
};

/**
 * Delete post
 * @param {string} postId
 * @returns {Promise<void>}
 */
export const deleteLocalPost = async (postId) => {
  try {
    await deleteLocalFile(`posts/${postId}.json`);

    // Remove from index
    const indexKey = `${LOCAL_DATA_PREFIX}index_posts`;
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
    const updatedIndex = index.filter(f => f.name !== `${postId}.json`);
    localStorage.setItem(indexKey, JSON.stringify(updatedIndex));
  } catch (error) {
    logError(`Failed to delete local post: ${postId}`, error);
    throw error;
  }
};

/**
 * Clear all local data (for testing/reset)
 */
export const clearAllLocalData = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(LOCAL_DATA_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  logDataOperation('clear', 'all_local_data');
};

/**
 * Get users from config
 * @returns {Promise<Object>} - { data: { users: [] }, lastModified }
 */
export const getLocalUsers = async () => {
  try {
    const result = await readLocalFile('config/users.json');
    if (!result) {
      return {
        data: { users: [] },
        lastModified: new Date().toISOString(),
      };
    }
    return result;
  } catch (error) {
    logError('Failed to get local users', error);
    throw error;
  }
};

/**
 * Save users to config
 * @param {Array} users - Array of user objects
 * @returns {Promise<void>}
 */
export const saveLocalUsers = async (users) => {
  try {
    await writeLocalFile('config/users.json', { users });
    logDataOperation('write', 'users_config', { count: users.length });
  } catch (error) {
    logError('Failed to save local users', error);
    throw error;
  }
};

/**
 * Add a new architect user
 * @param {Object} architect - { username, displayName, email, specialization }
 * @returns {Promise<Object>} - { user, password }
 */
export const addLocalArchitect = async (architect) => {
  try {
    // Generate password
    const password = `arch${Math.random().toString(36).substring(2, 8)}`;

    // Get current users
    const usersResult = await getLocalUsers();
    const users = usersResult.data.users || [];

    // Check if username already exists
    const exists = users.some(u => u.username === architect.username);
    if (exists) {
      throw new Error(`Username ${architect.username} already exists`);
    }

    // Create new user
    const newUser = {
      username: architect.username,
      password,
      role: 'architect',
      displayName: architect.displayName,
      email: architect.email || `${architect.username}@example.com`,
      avatar: architect.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${architect.username}`,
      active: true,
    };

    // Add to users array
    users.push(newUser);

    // Save users
    await saveLocalUsers(users);

    // Also update architects.json
    const architectsResult = await readLocalFile('config/architects.json');
    const architectsData = architectsResult?.data || { version: '1.0', architects: [] };

    const newArchitectEntry = {
      id: `arch-${Date.now()}`,
      githubUsername: architect.username,
      displayName: architect.displayName,
      email: newUser.email,
      specialization: architect.specialization || '',
      status: 'active',
      addedAt: new Date().toISOString(),
      addedBy: 'admin',
      deactivatedAt: null,
      deactivatedBy: null,
    };

    architectsData.architects.push(newArchitectEntry);
    architectsData.lastUpdated = new Date().toISOString();
    architectsData.updatedBy = 'admin';

    await writeLocalFile('config/architects.json', architectsData);

    logDataOperation('create', 'architect', { username: architect.username });

    return { user: newUser, password };
  } catch (error) {
    logError('Failed to add local architect', error);
    throw error;
  }
};

/**
 * Remove architect user
 * @param {string} username
 * @returns {Promise<void>}
 */
export const removeLocalArchitect = async (username) => {
  try {
    // Get current users
    const usersResult = await getLocalUsers();
    const users = usersResult.data.users || [];

    // Find and deactivate user
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
      throw new Error(`User ${username} not found`);
    }

    // Set to inactive instead of removing
    users[userIndex].active = false;

    // Save users
    await saveLocalUsers(users);

    // Also update architects.json
    const architectsResult = await readLocalFile('config/architects.json');
    const architectsData = architectsResult?.data || { version: '1.0', architects: [] };

    const architectIndex = architectsData.architects.findIndex(
      a => a.githubUsername === username
    );

    if (architectIndex !== -1) {
      architectsData.architects[architectIndex].status = 'inactive';
      architectsData.architects[architectIndex].deactivatedAt = new Date().toISOString();
      architectsData.architects[architectIndex].deactivatedBy = 'admin';
      architectsData.lastUpdated = new Date().toISOString();
      architectsData.updatedBy = 'admin';

      await writeLocalFile('config/architects.json', architectsData);
    }

    logDataOperation('update', 'architect', { username, action: 'deactivate' });
  } catch (error) {
    logError('Failed to remove local architect', error);
    throw error;
  }
};

/**
 * Get all architects
 * @returns {Promise<Array>} - Array of architect objects
 */
export const getLocalArchitects = async () => {
  try {
    const result = await readLocalFile('config/architects.json');
    if (!result || !result.data) {
      return [];
    }

    // Return only active architects
    return result.data.architects.filter(arch => arch.status === 'active');
  } catch (error) {
    logError('Failed to get local architects', error);
    return [];
  }
};

export default {
  readLocalFile,
  writeLocalFile,
  listLocalDirectory,
  deleteLocalFile,
  saveLocalBinaryFile,
  getLocalBinaryFile,
  getAllLocalPosts,
  saveLocalPost,
  getLocalPost,
  deleteLocalPost,
  clearAllLocalData,
  getLocalUsers,
  saveLocalUsers,
  addLocalArchitect,
  removeLocalArchitect,
  getLocalArchitects,
};
