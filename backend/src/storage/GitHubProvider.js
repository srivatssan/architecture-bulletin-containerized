/**
 * GitHub Storage Provider
 *
 * Implements storage using GitHub repository as backend
 * Uses Octokit REST API with PAT token authentication
 */

import { Octokit } from '@octokit/rest';
import { StorageProvider } from './StorageProvider.js';

export class GitHubProvider extends StorageProvider {
  constructor(config) {
    super(config);

    // Validate required config
    if (!config.token) {
      throw new Error('GitHub PAT token is required');
    }
    if (!config.owner) {
      throw new Error('GitHub repository owner is required');
    }
    if (!config.repo) {
      throw new Error('GitHub repository name is required');
    }

    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch || 'main';

    // Initialize Octokit client
    this.octokit = new Octokit({
      auth: config.token,
      userAgent: 'Architecture-Bulletin-API v1.0',
    });
  }

  /**
   * Get file content from GitHub
   */
  async getFileContent(path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      // Decode base64 content
      const content = data.encoding === 'base64'
        ? Buffer.from(data.content, 'base64').toString('utf-8')
        : data.content;

      return {
        content,
        sha: data.sha,
        size: data.size,
      };
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get JSON file
   */
  async getJson(path) {
    const fileData = await this.getFileContent(path);

    if (!fileData) {
      return null;
    }

    try {
      const json = JSON.parse(fileData.content);
      return {
        data: json,
        sha: fileData.sha,
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${path}: ${error.message}`);
    }
  }

  /**
   * Save JSON file
   */
  async saveJson(path, data, message, sha = null) {
    try {
      const content = JSON.stringify(data, null, 2);
      const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

      const payload = {
        owner: this.owner,
        repo: this.repo,
        path,
        message: message || `Update ${path}`,
        content: contentBase64,
        branch: this.branch,
      };

      // Add SHA if updating existing file
      if (sha) {
        payload.sha = sha;
      }

      const { data: result } = await this.octokit.rest.repos.createOrUpdateFileContents(payload);

      return {
        success: true,
        sha: result.content.sha,
        commit: result.commit,
      };
    } catch (error) {
      throw new Error(`Failed to save ${path}: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path, sha, message) {
    try {
      const { data } = await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path,
        message: message || `Delete ${path}`,
        sha,
        branch: this.branch,
      });

      return {
        success: true,
        commit: data.commit,
      };
    } catch (error) {
      throw new Error(`Failed to delete ${path}: ${error.message}`);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      // Ensure we have an array
      if (!Array.isArray(data)) {
        return [data];
      }

      return data;
    } catch (error) {
      if (error.status === 404) {
        return [];
      }
      throw new Error(`Failed to list directory ${path}: ${error.message}`);
    }
  }

  /**
   * Upload binary file
   */
  async uploadBinary(path, base64Content, message) {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: message || `Upload ${path}`,
        content: base64Content,
        branch: this.branch,
      });

      return {
        success: true,
        sha: data.content.sha,
      };
    } catch (error) {
      throw new Error(`Failed to upload binary ${path}: ${error.message}`);
    }
  }

  /**
   * Get binary file
   */
  async getBinary(path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      return data.content.replace(/\n/g, '');
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw new Error(`Failed to get binary ${path}: ${error.message}`);
    }
  }
}
