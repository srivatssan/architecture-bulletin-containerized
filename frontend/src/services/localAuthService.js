/**
 * Local Authentication Service
 * Simple username/password authentication for local development
 */

import { STORAGE_KEYS } from '../utils/constants';
import { logAuthEvent, logError } from '../utils/logger';

// In-memory user database (loaded from local-data/config/users.json)
let usersData = null;

/**
 * Load users from local JSON file
 * @returns {Promise<Array>}
 */
const loadUsers = async () => {
  if (usersData) return usersData;

  try {
    // Use base URL from Vite config
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}local-data/config/users.json`);
    const data = await response.json();
    usersData = data.users;
    return usersData;
  } catch (error) {
    logError('Failed to load users config', error);
    throw new Error('Failed to load user configuration');
  }
};

/**
 * Authenticate user with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} User object with token
 */
export const loginWithPassword = async (username, password) => {
  try {
    const users = await loadUsers();

    // Find user
    const user = users.find(
      u => u.username === username && u.active
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password (in production, this would be hashed)
    if (user.password !== password) {
      throw new Error('Invalid username or password');
    }

    // Generate a simple token (in production, use JWT)
    const token = btoa(`${username}:${Date.now()}`);

    // Create user profile
    const userProfile = {
      username: user.username,
      name: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };

    logAuthEvent('local_login', { username, role: user.role });

    return { token, user: userProfile };
  } catch (error) {
    logError('Local authentication failed', error);
    throw error;
  }
};

/**
 * Validate local auth token
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const validateLocalToken = async (token) => {
  try {
    if (!token) return false;

    // Decode token to get username
    const decoded = atob(token);
    const username = decoded.split(':')[0];

    // Check if user still exists and is active
    const users = await loadUsers();
    const user = users.find(u => u.username === username && u.active);

    return !!user;
  } catch (error) {
    logError('Token validation failed', error);
    return false;
  }
};

/**
 * Get user profile from token
 * @param {string} token
 * @returns {Promise<Object>}
 */
export const getUserFromToken = async (token) => {
  try {
    const decoded = atob(token);
    const username = decoded.split(':')[0];

    const users = await loadUsers();
    const user = users.find(u => u.username === username && u.active);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      username: user.username,
      name: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };
  } catch (error) {
    logError('Failed to get user from token', error);
    throw error;
  }
};

/**
 * Store local auth data
 * @param {string} token
 * @param {Object} user
 */
export const storeLocalAuth = (token, user) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    sessionStorage.setItem('auth_mode', 'local');

    logAuthEvent('local_auth_stored', { username: user.username });
  } catch (error) {
    logError('Failed to store local authentication', error);
    throw error;
  }
};

/**
 * Clear local auth data
 */
export const clearLocalAuth = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem('auth_mode');

    logAuthEvent('local_logout');
  } catch (error) {
    logError('Failed to clear local authentication', error);
  }
};

/**
 * Check if user has admin role
 * @param {Object} user
 * @returns {boolean}
 */
export const isAdminUser = (user) => {
  return user && user.role === 'admin';
};

/**
 * Check if user has architect role
 * @param {Object} user
 * @returns {boolean}
 */
export const isArchitectUser = (user) => {
  return user && user.role === 'architect';
};

export default {
  loginWithPassword,
  validateLocalToken,
  getUserFromToken,
  storeLocalAuth,
  clearLocalAuth,
  isAdminUser,
  isArchitectUser,
};
