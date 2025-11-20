/**
 * Application Constants
 * Centralized configuration values and constants
 */

// Application Mode
export const APP_MODE = import.meta.env.VITE_APP_MODE || 'local'; // 'local' or 'github'

// GitHub OAuth Configuration
export const GITHUB_OAUTH = {
  CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
  REDIRECT_URI: import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/callback`,
  SCOPE: 'repo',
  AUTHORIZE_URL: 'https://github.com/login/oauth/authorize',
};

// GitHub Repository Configuration
export const GITHUB_REPO = {
  OWNER: import.meta.env.VITE_GITHUB_REPO_OWNER,
  DATA_REPO: import.meta.env.VITE_GITHUB_DATA_REPO || 'architecture-bulletin-data',
  BRANCH: import.meta.env.VITE_GITHUB_BRANCH || 'main',
  PAT: import.meta.env.VITE_GITHUB_PAT,
};

// Local Data Configuration
export const LOCAL_DATA = {
  BASE_PATH: '/local-data',
  CONFIG_PATH: '/local-data/config',
  POSTS_PATH: '/local-data/posts',
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CALLBACK: '/callback',
  DASHBOARD: '/dashboard',
  POST_DETAIL: '/posts/:id',
  CONTROL_PANEL: '/control-panel',
  ARCHIVE: '/archive',
  NOT_FOUND: '/404',
};

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  ARCHITECT: 'architect',
  UNAUTHORIZED: 'unauthorized',
};

// Task Statuses (IDs match data schema)
export const STATUS_IDS = {
  NEW: 'status-new',
  ASSIGNED: 'status-assigned',
  SUBMITTED: 'status-submitted',
  PENDING: 'status-pending',
  ESCALATE: 'status-escalate',
  CLOSED: 'status-closed',
};

// File Upload Constraints
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'],
  IMAGE_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
};

// Application Limits
export const APP_LIMITS = {
  MAX_ACTIVE_TASKS: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 2000,
  COMMENT_THREAD_DEPTH: 2,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'github_auth_token',
  USER: 'user',
  OAUTH_STATE: 'oauth_state',
};

// API Rate Limits
export const API_LIMITS = {
  GITHUB_RATE_LIMIT: 5000, // requests per hour
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ESCALATION: 'escalation',
  CLOSURE: 'closure',
};

// Notification Priority
export const NOTIFICATION_PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

// GitHub Paths (relative to data repository root)
export const GITHUB_PATHS = {
  CONFIG: 'config',
  ARCHITECTS: 'config/architects.json',
  STATUSES: 'config/statuses.json',
  SETTINGS: 'config/settings.json',
  POSTS: 'posts',
  ATTACHMENTS: 'attachments',
  ARTIFACTS: 'artifacts',
  CONVERSATIONS: 'conversations',
  CLOSURE_NOTES: 'closure-notes',
  NOTIFICATIONS: 'notifications/notifications.json',
  ARCHIVE: 'archive',
};

// Date/Time Formats
export const DATE_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_FULL: 'MMM DD, YYYY HH:mm',
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded. Please try again later.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.`,
  INVALID_FILE_TYPE: 'Invalid file type.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
  POST_NOT_FOUND: 'Post not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  POST_CREATED: 'Post created successfully.',
  POST_UPDATED: 'Post updated successfully.',
  POST_DELETED: 'Post deleted successfully.',
  ARTIFACT_UPLOADED: 'Artifact uploaded successfully.',
  COMMENT_ADDED: 'Comment added successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.',
  ARCHITECT_ADDED: 'Architect added successfully.',
  ARCHITECT_REMOVED: 'Architect removed successfully.',
};

// Debounce Delays (milliseconds)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  AUTO_SAVE: 1000,
};

// Export default object with all constants
export default {
  GITHUB_OAUTH,
  GITHUB_REPO,
  ROUTES,
  ROLES,
  STATUS_IDS,
  FILE_UPLOAD,
  APP_LIMITS,
  STORAGE_KEYS,
  API_LIMITS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  GITHUB_PATHS,
  DATE_FORMATS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEBOUNCE_DELAYS,
};
