/**
 * GitHub Authentication Service
 * Handles GitHub OAuth 2.0 authentication flow
 */

import { GITHUB_OAUTH, STORAGE_KEYS } from '../utils/constants';
import { generateRandomString, buildUrl } from '../utils/helpers';
import { logAuthEvent, logError } from '../utils/logger';

/**
 * Initiate GitHub OAuth flow
 * Redirects user to GitHub authorization page
 */
export const initiateOAuth = () => {
  try {
    // Generate random state for CSRF protection
    const state = generateRandomString(32);
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state);

    // Build authorization URL
    const authUrl = buildUrl(GITHUB_OAUTH.AUTHORIZE_URL, {
      client_id: GITHUB_OAUTH.CLIENT_ID,
      redirect_uri: GITHUB_OAUTH.REDIRECT_URI,
      scope: GITHUB_OAUTH.SCOPE,
      state,
    });

    logAuthEvent('oauth_initiated', { redirectUri: GITHUB_OAUTH.REDIRECT_URI });

    // Redirect to GitHub
    window.location.href = authUrl;
  } catch (error) {
    logError('Failed to initiate OAuth', error);
    throw error;
  }
};

/**
 * Handle OAuth callback
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from GitHub
 * @param {string} state - State parameter for CSRF validation
 * @returns {Promise<string>} - Access token
 */
export const handleCallback = async (code, state) => {
  try {
    // Validate state parameter (CSRF protection)
    const storedState = sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE);

    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Clean up stored state
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE);

    // Note: GitHub OAuth token exchange requires a server-side component
    // because client_secret cannot be exposed in client-side code.
    //
    // Option 1: Use GitHub OAuth App with a backend proxy
    // Option 2: Use GitHub Apps with OAuth (no client_secret needed for device flow)
    // Option 3: Use a serverless function (AWS Lambda, Netlify Functions, etc.)
    //
    // For now, we'll document this requirement and use a proxy endpoint

    const proxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL;

    if (!proxyUrl) {
      throw new Error('VITE_OAUTH_PROXY_URL environment variable not configured');
    }

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: GITHUB_OAUTH.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error('No access token received from GitHub');
    }

    logAuthEvent('oauth_completed', { hasToken: true });

    return accessToken;
  } catch (error) {
    logError('OAuth callback handling failed', error);
    throw error;
  }
};

/**
 * Get GitHub user profile using access token
 * @param {string} token - GitHub access token
 * @returns {Promise<Object>} - User profile
 */
export const getUserProfile = async (token) => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const profile = await response.json();

    logAuthEvent('profile_fetched', { username: profile.login });

    return {
      username: profile.login,
      name: profile.name || profile.login,
      email: profile.email,
      avatar: profile.avatar_url,
    };
  } catch (error) {
    logError('Failed to fetch user profile', error);
    throw error;
  }
};

/**
 * Store authentication data in session/localStorage
 * @param {string} token
 * @param {Object} user
 * @param {boolean} remember - Use localStorage instead of sessionStorage
 */
export const storeAuth = (token, user, remember = false) => {
  try {
    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    logAuthEvent('auth_stored', {
      username: user.username,
      storage: remember ? 'localStorage' : 'sessionStorage'
    });
  } catch (error) {
    logError('Failed to store authentication', error);
    throw error;
  }
};

/**
 * Retrieve stored authentication data
 * @returns {{token: string|null, user: Object|null}}
 */
export const getStoredAuth = () => {
  try {
    // Check sessionStorage first, then localStorage
    let token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userJson = sessionStorage.getItem(STORAGE_KEYS.USER);

    if (!token) {
      token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      userJson = localStorage.getItem(STORAGE_KEYS.USER);
    }

    const user = userJson ? JSON.parse(userJson) : null;

    return { token, user };
  } catch (error) {
    logError('Failed to retrieve stored authentication', error);
    return { token: null, user: null };
  }
};

/**
 * Clear authentication data (logout)
 */
export const clearAuth = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    logAuthEvent('logout');
  } catch (error) {
    logError('Failed to clear authentication', error);
  }
};

/**
 * Validate stored token by making a test API call
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const validateToken = async (token) => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    return response.ok;
  } catch (error) {
    logError('Token validation failed', error);
    return false;
  }
};

export default {
  initiateOAuth,
  handleCallback,
  getUserProfile,
  storeAuth,
  getStoredAuth,
  clearAuth,
  validateToken,
};
