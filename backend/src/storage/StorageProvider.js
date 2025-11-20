/**
 * Storage Provider Interface
 *
 * Abstract interface for all storage backends (GitHub, S3, Vercel Blob, etc.)
 * All providers must implement these methods
 */

export class StorageProvider {
  /**
   * Initialize the storage provider
   * @param {Object} config - Provider-specific configuration
   */
  constructor(config) {
    if (new.target === StorageProvider) {
      throw new Error('Cannot instantiate abstract class StorageProvider');
    }
    this.config = config;
  }

  /**
   * Get a JSON file
   * @param {string} path - File path
   * @returns {Promise<Object>} - { data: parsedJSON, sha: fileSHA }
   */
  async getJson(path) {
    throw new Error('Method getJson() must be implemented');
  }

  /**
   * Save a JSON file
   * @param {string} path - File path
   * @param {Object} data - Data to save
   * @param {string} message - Commit message (for version control backends)
   * @param {string} sha - Current file SHA (for updates)
   * @returns {Promise<Object>} - Result object
   */
  async saveJson(path, data, message, sha = null) {
    throw new Error('Method saveJson() must be implemented');
  }

  /**
   * Delete a file
   * @param {string} path - File path
   * @param {string} sha - Current file SHA
   * @param {string} message - Commit message
   * @returns {Promise<Object>} - Result object
   */
  async deleteFile(path, sha, message) {
    throw new Error('Method deleteFile() must be implemented');
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array>} - Array of file objects
   */
  async listDirectory(path) {
    throw new Error('Method listDirectory() must be implemented');
  }

  /**
   * Upload a binary file (base64 encoded)
   * @param {string} path - File path
   * @param {string} base64Content - Base64 encoded content
   * @param {string} message - Commit message
   * @returns {Promise<Object>} - Result object
   */
  async uploadBinary(path, base64Content, message) {
    throw new Error('Method uploadBinary() must be implemented');
  }

  /**
   * Get a binary file
   * @param {string} path - File path
   * @returns {Promise<string>} - Base64 encoded content
   */
  async getBinary(path) {
    throw new Error('Method getBinary() must be implemented');
  }
}
