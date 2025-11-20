/**
 * Authentication Context
 * Manages user authentication state using the backend API
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { logAuthEvent, logError } from '../utils/logger';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize authentication from stored token
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');

        if (storedToken) {
          // Set token in API client
          apiClient.setToken(storedToken);

          // Verify token with backend
          const response = await apiClient.getCurrentUser();

          if (response.success && response.data) {
            setToken(storedToken);
            setUser(response.data);
            setIsAuthenticated(true);

            logAuthEvent('session_restored', { username: response.data.username });
          } else {
            // Token invalid, clear it
            apiClient.clearToken();
            logAuthEvent('session_expired');
          }
        }
      } catch (error) {
        logError('Failed to initialize authentication', error);
        apiClient.clearToken();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with username/password
   * @param {string} username
   * @param {string} password
   */
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);

      // Call backend login API
      const response = await apiClient.login(username, password);

      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;

        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);

        logAuthEvent('login_success', { username: userData.username, role: userData.role });

        return userData;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      logError('Login failed', error);
      apiClient.clearToken();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout and clear authentication
   */
  const logout = useCallback(async () => {
    try {
      const username = user?.username;

      // Call backend logout API
      await apiClient.logout();

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      logAuthEvent('logout', { username });
    } catch (error) {
      logError('Logout failed', error);
      // Clear local state even if API call fails
      apiClient.clearToken();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [user]);

  /**
   * Check if user has admin role
   */
  const isAdmin = useCallback(() => {
    return user && user.role === 'admin';
  }, [user]);

  /**
   * Check if user has architect role
   */
  const isArchitect = useCallback(() => {
    return user && user.role === 'architect';
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    isArchitect,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
