/**
 * Storage Provider Factory
 *
 * Creates the appropriate storage provider based on environment configuration
 * Supports: GitHub, AWS S3, Vercel Blob
 */

import { GitHubProvider } from './GitHubProvider.js';
import { S3Provider } from './S3Provider.js';
import { VercelBlobProvider } from './VercelBlobProvider.js';

/**
 * Create storage provider instance based on configuration
 * @returns {StorageProvider} - Configured storage provider
 */
export function createStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'github';

  console.log(`Initializing storage provider: ${provider}`);

  switch (provider.toLowerCase()) {
    case 'github':
      return new GitHubProvider({
        token: process.env.GITHUB_PAT,
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_DATA_REPO || 'architecture-bulletin-data',
        branch: process.env.GITHUB_BRANCH || 'main',
      });

    case 's3':
      return new S3Provider({
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

    case 'vercel-blob':
    case 'blob':
      return new VercelBlobProvider({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

    default:
      throw new Error(
        `Unknown storage provider: ${provider}. ` +
        `Supported providers: github, s3, vercel-blob`
      );
  }
}

/**
 * Get storage provider instance (singleton pattern)
 * Creates provider once and reuses it for better performance
 */
let storageInstance = null;

export function getStorageProvider() {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}

/**
 * Reset storage provider (useful for testing)
 */
export function resetStorageProvider() {
  storageInstance = null;
}

export default {
  createStorageProvider,
  getStorageProvider,
  resetStorageProvider,
};
