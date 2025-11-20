/**
 * Form Validation Functions
 * Input validation for all forms in the application
 */

import { APP_LIMITS, FILE_UPLOAD } from './constants';

/**
 * Validate post title
 * @param {string} title
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (title.length > APP_LIMITS.MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Title must be less than ${APP_LIMITS.MAX_TITLE_LENGTH} characters`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate post description
 * @param {string} description
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }

  if (description.length > APP_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description must be less than ${APP_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate concerned parties list
 * @param {string[]} parties
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateConcernedParties = (parties) => {
  if (!parties || !Array.isArray(parties) || parties.length === 0) {
    return { valid: false, error: 'At least one concerned party is required' };
  }

  const hasEmpty = parties.some(party => !party || party.trim().length === 0);
  if (hasEmpty) {
    return { valid: false, error: 'Concerned parties cannot be empty' };
  }

  return { valid: true, error: null };
};

/**
 * Validate file upload
 * @param {File} file
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate multiple file uploads
 * @param {FileList|File[]} files
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFiles = (files) => {
  if (!files || files.length === 0) {
    return { valid: true, error: null }; // Files are optional
  }

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true, error: null };
};

/**
 * Check if file is an image
 * @param {File|string} file - File object or filename
 * @returns {boolean}
 */
export const isImageFile = (file) => {
  if (file instanceof File) {
    return FILE_UPLOAD.IMAGE_TYPES.includes(file.type);
  }

  if (typeof file === 'string') {
    const extension = file.toLowerCase().substring(file.lastIndexOf('.'));
    return FILE_UPLOAD.IMAGE_EXTENSIONS.includes(extension);
  }

  return false;
};

/**
 * Validate comment text
 * @param {string} text
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateComment = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Comment cannot be empty' };
  }

  if (text.length > APP_LIMITS.MAX_COMMENT_LENGTH) {
    return {
      valid: false,
      error: `Comment must be less than ${APP_LIMITS.MAX_COMMENT_LENGTH} characters`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate GitHub username format
 * @param {string} username
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateGitHubUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'GitHub username is required' };
  }

  // GitHub username rules: alphanumeric + hyphens, cannot start/end with hyphen
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

  if (!githubUsernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Invalid GitHub username format'
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate email format
 * @param {string} email
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, error: null };
};

/**
 * Validate status ID
 * @param {string} statusId
 * @param {Array} availableStatuses - Array of status objects
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateStatus = (statusId, availableStatuses = []) => {
  if (!statusId) {
    return { valid: false, error: 'Status is required' };
  }

  if (availableStatuses.length > 0) {
    const statusExists = availableStatuses.some(status => status.id === statusId);
    if (!statusExists) {
      return { valid: false, error: 'Invalid status' };
    }
  }

  return { valid: true, error: null };
};

/**
 * Validate entire post form
 * @param {Object} formData
 * @param {Object} config - Optional config with statuses
 * @returns {{valid: boolean, errors: Object}}
 */
export const validatePostForm = (formData, config = {}) => {
  const errors = {};

  const titleResult = validateTitle(formData.title);
  if (!titleResult.valid) {
    errors.title = titleResult.error;
  }

  const descriptionResult = validateDescription(formData.description);
  if (!descriptionResult.valid) {
    errors.description = descriptionResult.error;
  }

  const partiesResult = validateConcernedParties(formData.concernedParties);
  if (!partiesResult.valid) {
    errors.concernedParties = partiesResult.error;
  }

  if (config.statuses && formData.status) {
    const statusResult = validateStatus(formData.status, config.statuses);
    if (!statusResult.valid) {
      errors.status = statusResult.error;
    }
  }

  if (formData.files) {
    const filesResult = validateFiles(formData.files);
    if (!filesResult.valid) {
      errors.files = filesResult.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize string to prevent XSS
 * Basic sanitization - for complex HTML, use DOMPurify
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (!str) return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize search query
 * @param {string} query
 * @returns {string}
 */
export const sanitizeSearchQuery = (query) => {
  if (!query) return '';

  // Remove special regex characters to prevent regex injection
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default {
  validateTitle,
  validateDescription,
  validateConcernedParties,
  validateFile,
  validateFiles,
  isImageFile,
  validateComment,
  validateGitHubUsername,
  validateEmail,
  validateStatus,
  validatePostForm,
  sanitizeString,
  sanitizeSearchQuery,
};
