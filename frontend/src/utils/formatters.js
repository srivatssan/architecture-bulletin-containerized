/**
 * Formatting Utility Functions
 * Date, time, text, and other data formatting functions
 */

/**
 * Format date to readable string
 * @param {string|Date} date - ISO 8601 string or Date object
 * @param {string} format - Format type: 'full', 'date', 'time', 'relative'
 * @returns {string}
 */
export const formatDate = (date, format = 'full') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const options = {
    full: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    date: { year: 'numeric', month: 'short', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
  };

  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }

  return dateObj.toLocaleDateString('en-US', options[format] || options.full);
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {string|Date} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text to specified length
 * @param {string} text
 * @param {number} maxLength
 * @param {string} suffix
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter of string
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert string to title case
 * @param {string} str
 * @returns {string}
 */
export const toTitleCase = (str) => {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Format GitHub username for display
 * @param {string} username
 * @returns {string}
 */
export const formatUsername = (username) => {
  if (!username) return '';
  return `@${username}`;
};

/**
 * Format array as comma-separated list
 * @param {Array} arr
 * @param {string} conjunction - 'and' or 'or'
 * @returns {string}
 */
export const formatList = (arr, conjunction = 'and') => {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} ${conjunction} ${arr[1]}`;

  const last = arr[arr.length - 1];
  const rest = arr.slice(0, -1);
  return `${rest.join(', ')}, ${conjunction} ${last}`;
};

/**
 * Pluralize word based on count
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export const pluralize = (count, singular, plural = null) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Format count with plural word
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export const formatCount = (count, singular, plural = null) => {
  return `${count} ${pluralize(count, singular, plural)}`;
};

/**
 * Strip HTML tags from string
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Convert newlines to <br> tags
 * @param {string} text
 * @returns {string}
 */
export const nl2br = (text) => {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
};

/**
 * Extract initials from name
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Format version number
 * @param {number|string} version
 * @returns {string}
 */
export const formatVersion = (version) => {
  if (!version) return 'v1';
  if (typeof version === 'number') return `v${version}`;
  if (version.startsWith('v')) return version;
  return `v${version}`;
};

/**
 * Generate color from string (for avatars, badges)
 * @param {string} str
 * @returns {string} - Hex color code
 */
export const stringToColor = (str) => {
  if (!str) return '#6B7280';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // green
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Format notification message
 * @param {Object} notification
 * @returns {string}
 */
export const formatNotificationMessage = (notification) => {
  if (!notification) return '';

  const { type, postTitle, escalatedBy, closedBy } = notification;

  if (type === 'escalation') {
    return `Task "${postTitle}" was escalated by ${formatUsername(escalatedBy)}`;
  }

  if (type === 'closure') {
    return `Task "${postTitle}" was closed by ${formatUsername(closedBy)}`;
  }

  return notification.message || '';
};

/**
 * Format ISO 8601 date to input[type="datetime-local"] value
 * @param {string|Date} date
 * @returns {string}
 */
export const toDateTimeLocalValue = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Generate unique ID
 * @param {string} prefix
 * @returns {string}
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
};

export default {
  formatDate,
  formatRelativeTime,
  formatFileSize,
  truncateText,
  capitalize,
  toTitleCase,
  formatUsername,
  formatList,
  pluralize,
  formatCount,
  stripHtml,
  nl2br,
  getInitials,
  formatVersion,
  stringToColor,
  formatNotificationMessage,
  toDateTimeLocalValue,
  generateId,
};
