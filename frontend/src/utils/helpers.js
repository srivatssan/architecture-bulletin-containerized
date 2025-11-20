/**
 * General Helper Functions
 * Miscellaneous utility functions used throughout the application
 */

import { STORAGE_KEYS } from './constants';

/**
 * Generate random string for OAuth state parameter
 * @param {number} length
 * @returns {string}
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

/**
 * Parse URL query parameters
 * @param {string} search - window.location.search
 * @returns {Object}
 */
export const parseQueryParams = (search) => {
  const params = new URLSearchParams(search);
  const result = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
};

/**
 * Build URL with query parameters
 * @param {string} baseUrl
 * @param {Object} params
 * @returns {string}
 */
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);

  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

/**
 * Deep clone an object
 * @param {Object} obj
 * @returns {Object}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj
 * @returns {boolean}
 */
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Get file icon class based on file type
 * @param {string} filename
 * @returns {string}
 */
export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename);

  const iconMap = {
    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    // Documents
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    ppt: 'powerpoint',
    pptx: 'powerpoint',
    // Code
    js: 'code',
    jsx: 'code',
    ts: 'code',
    tsx: 'code',
    json: 'code',
    html: 'code',
    css: 'code',
    // Archives
    zip: 'archive',
    rar: 'archive',
    tar: 'archive',
    gz: 'archive',
    // Text
    txt: 'text',
    md: 'text',
    // Default
    default: 'file',
  };

  return iconMap[ext] || iconMap.default;
};

/**
 * Sort array of objects by property
 * @param {Array} arr
 * @param {string} property
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array}
 */
export const sortBy = (arr, property, order = 'asc') => {
  if (!arr || !Array.isArray(arr)) return [];

  const sorted = [...arr].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];

    if (aVal === bVal) return 0;

    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return sorted;
};

/**
 * Group array of objects by property
 * @param {Array} arr
 * @param {string} property
 * @returns {Object}
 */
export const groupBy = (arr, property) => {
  if (!arr || !Array.isArray(arr)) return {};

  return arr.reduce((acc, item) => {
    const key = item[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
};

/**
 * Filter array by search query (searches multiple fields)
 * @param {Array} arr
 * @param {string} query
 * @param {string[]} fields
 * @returns {Array}
 */
export const filterBySearch = (arr, query, fields = []) => {
  if (!arr || !Array.isArray(arr)) return [];
  if (!query || query.trim().length === 0) return arr;

  const lowerQuery = query.toLowerCase();

  return arr.filter(item => {
    return fields.some(field => {
      const value = item[field];

      if (Array.isArray(value)) {
        return value.some(v =>
          String(v).toLowerCase().includes(lowerQuery)
        );
      }

      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
};

/**
 * Debounce function execution
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Throttle function execution
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Check if user is admin based on role
 * @param {Object} user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user && user.role === 'admin';
};

/**
 * Check if user is architect based on role
 * @param {Object} user
 * @returns {boolean}
 */
export const isArchitect = (user) => {
  return user && user.role === 'architect';
};

/**
 * Check if user is assigned to post
 * @param {Object} post
 * @param {Object} user
 * @returns {boolean}
 */
export const isAssignedToPost = (post, user) => {
  if (!post || !user) return false;
  return post.assignedArchitects && post.assignedArchitects.includes(user.username);
};

/**
 * Check if post can be self-assigned
 * @param {Object} post
 * @returns {boolean}
 */
export const canSelfAssign = (post) => {
  if (!post) return false;
  return !post.adminAssigned;
};

/**
 * Get next version number from existing versions
 * @param {Array} versions - Array of version strings like ['v1', 'v2']
 * @returns {string}
 */
export const getNextVersion = (versions = []) => {
  if (!versions || versions.length === 0) return 'v1';

  const versionNumbers = versions
    .map(v => {
      const num = parseInt(v.replace('v', ''), 10);
      return isNaN(num) ? 0 : num;
    })
    .filter(n => n > 0);

  const maxVersion = Math.max(0, ...versionNumbers);
  return `v${maxVersion + 1}`;
};

/**
 * Convert file to base64 string
 * @param {File} file
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Download file from base64 string
 * @param {string} base64
 * @param {string} filename
 * @param {string} mimeType
 */
export const downloadBase64File = (base64, filename, mimeType = 'application/octet-stream') => {
  const link = document.createElement('a');
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Get error message from error object
 * @param {Error|Object} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'string') return error;

  if (error.message) return error.message;

  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }

  return 'An error occurred';
};

/**
 * Sleep for specified milliseconds (for async operations)
 * @param {number} ms
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries
 * @param {number} initialDelay
 * @returns {Promise}
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Clear all application storage (logout cleanup)
 */
export const clearAppStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export default {
  generateRandomString,
  parseQueryParams,
  buildUrl,
  deepClone,
  isEmptyObject,
  getFileExtension,
  getFileIcon,
  sortBy,
  groupBy,
  filterBySearch,
  debounce,
  throttle,
  isAdmin,
  isArchitect,
  isAssignedToPost,
  canSelfAssign,
  getNextVersion,
  fileToBase64,
  downloadBase64File,
  copyToClipboard,
  getErrorMessage,
  sleep,
  retryWithBackoff,
  clearAppStorage,
};
