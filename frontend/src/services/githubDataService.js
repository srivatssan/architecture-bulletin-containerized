/**
 * GitHub Data Service
 * Low-level GitHub API operations using Octokit
 * Provides CRUD operations for files in the data repository
 */

import { Octokit } from '@octokit/rest';
import { GITHUB_REPO } from '../utils/constants';
import { logApiCall, logApiError, logRateLimitWarning, logError } from '../utils/logger';
import { retryWithBackoff } from '../utils/helpers';

let octokitInstance = null;

/**
 * Initialize Octokit client with auth token
 * @param {string} token - GitHub access token
 * @returns {Octokit}
 */
export const initializeOctokit = (token) => {
  if (!token) {
    throw new Error('GitHub token is required to initialize Octokit');
  }

  octokitInstance = new Octokit({
    auth: token,
    userAgent: 'Architecture-Bulletin v1.0',
  });

  return octokitInstance;
};

/**
 * Get Octokit instance (must be initialized first)
 * @returns {Octokit}
 */
export const getOctokit = () => {
  if (!octokitInstance) {
    throw new Error('Octokit not initialized. Call initializeOctokit() first.');
  }

  return octokitInstance;
};

/**
 * Check GitHub API rate limit
 * @returns {Promise<Object>} - { limit, remaining, reset }
 */
export const checkRateLimit = async () => {
  try {
    const octokit = getOctokit();

    const { data } = await octokit.rest.rateLimit.get();

    const rateLimit = {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: data.rate.reset,
    };

    // Log warning if rate limit is low
    if (rateLimit.remaining < 100) {
      logRateLimitWarning(rateLimit);
    }

    return rateLimit;
  } catch (error) {
    logError('Failed to check rate limit', error);
    throw error;
  }
};

/**
 * Get file content from repository
 * @param {string} path - File path in repository
 * @param {string} ref - Branch/ref (default: main)
 * @returns {Promise<Object>} - { content, sha, size }
 */
export const getFileContent = async (path, ref = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.getContent(${path})`, 'GET');

    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      ref,
    });

    // Decode base64 content
    const content = data.encoding === 'base64'
      ? atob(data.content.replace(/\n/g, ''))
      : data.content;

    return {
      content,
      sha: data.sha,
      size: data.size,
      encoding: data.encoding,
    };
  } catch (error) {
    if (error.status === 404) {
      // File not found is not an error in some cases
      return null;
    }

    logApiError(`repos.getContent(${path})`, 'GET', error);
    throw error;
  }
};

/**
 * Get directory contents
 * @param {string} path - Directory path in repository
 * @param {string} ref - Branch/ref (default: main)
 * @returns {Promise<Array>} - Array of file/directory objects
 */
export const listDirectory = async (path, ref = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.getContent(${path})`, 'GET');

    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      ref,
    });

    // data is an array when path is a directory
    if (!Array.isArray(data)) {
      return [data];
    }

    return data;
  } catch (error) {
    if (error.status === 404) {
      return [];
    }

    logApiError(`repos.getContent(${path})`, 'GET', error);
    throw error;
  }
};

/**
 * Create a new file in repository
 * @param {string} path - File path
 * @param {string} content - File content (will be base64 encoded)
 * @param {string} message - Commit message
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Object>} - { content, commit }
 */
export const createFile = async (path, content, message, branch = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.createOrUpdateFileContents(${path})`, 'PUT');

    // Encode content to base64
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      message,
      content: contentBase64,
      branch,
    });

    return data;
  } catch (error) {
    logApiError(`repos.createOrUpdateFileContents(${path})`, 'PUT', error);
    throw error;
  }
};

/**
 * Update an existing file in repository
 * @param {string} path - File path
 * @param {string} content - New file content
 * @param {string} sha - Current file SHA (for conflict detection)
 * @param {string} message - Commit message
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Object>} - { content, commit }
 */
export const updateFile = async (path, content, sha, message, branch = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.createOrUpdateFileContents(${path})`, 'PUT');

    // Encode content to base64
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      message,
      content: contentBase64,
      sha,
      branch,
    });

    return data;
  } catch (error) {
    logApiError(`repos.createOrUpdateFileContents(${path})`, 'PUT', error);
    throw error;
  }
};

/**
 * Delete a file from repository
 * @param {string} path - File path
 * @param {string} sha - Current file SHA
 * @param {string} message - Commit message
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Object>} - { commit }
 */
export const deleteFile = async (path, sha, message, branch = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.deleteFile(${path})`, 'DELETE');

    const { data } = await octokit.rest.repos.deleteFile({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      message,
      sha,
      branch,
    });

    return data;
  } catch (error) {
    logApiError(`repos.deleteFile(${path})`, 'DELETE', error);
    throw error;
  }
};

/**
 * Upload binary file (base64 encoded)
 * @param {string} path - File path
 * @param {string} base64Content - Base64 encoded file content
 * @param {string} message - Commit message
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Object>}
 */
export const uploadBinaryFile = async (path, base64Content, message, branch = GITHUB_REPO.BRANCH) => {
  try {
    const octokit = getOctokit();

    logApiCall(`repos.createOrUpdateFileContents(${path})`, 'PUT');

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.OWNER,
      repo: GITHUB_REPO.DATA_REPO,
      path,
      message,
      content: base64Content,
      branch,
    });

    return data;
  } catch (error) {
    logApiError(`repos.createOrUpdateFileContents(${path})`, 'PUT', error);
    throw error;
  }
};

/**
 * Get JSON file and parse content
 * @param {string} path - Path to JSON file
 * @returns {Promise<Object>} - Parsed JSON object
 */
export const getJsonFile = async (path) => {
  try {
    const fileData = await getFileContent(path);

    if (!fileData) {
      return null;
    }

    const json = JSON.parse(fileData.content);

    return { data: json, sha: fileData.sha };
  } catch (error) {
    logError(`Failed to parse JSON file: ${path}`, error);
    throw error;
  }
};

/**
 * Create or update JSON file
 * @param {string} path - Path to JSON file
 * @param {Object} data - JavaScript object to stringify
 * @param {string} message - Commit message
 * @param {string} sha - Current file SHA (for updates)
 * @returns {Promise<Object>}
 */
export const saveJsonFile = async (path, data, message, sha = null) => {
  try {
    const content = JSON.stringify(data, null, 2);

    if (sha) {
      return await updateFile(path, content, sha, message);
    } else {
      return await createFile(path, content, message);
    }
  } catch (error) {
    logError(`Failed to save JSON file: ${path}`, error);
    throw error;
  }
};

/**
 * Batch operation with retry logic
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>}
 */
export const withRetry = async (operation, maxRetries = 3) => {
  return await retryWithBackoff(operation, maxRetries);
};

export default {
  initializeOctokit,
  getOctokit,
  checkRateLimit,
  getFileContent,
  listDirectory,
  createFile,
  updateFile,
  deleteFile,
  uploadBinaryFile,
  getJsonFile,
  saveJsonFile,
  withRetry,
};
