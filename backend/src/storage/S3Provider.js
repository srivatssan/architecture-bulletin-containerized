/**
 * AWS S3 Storage Provider
 *
 * Implements storage using AWS S3 bucket as backend
 * Uses AWS SDK for JavaScript v3
 *
 * TODO: Implement when S3 storage is needed
 * Required setup:
 * 1. npm install @aws-sdk/client-s3
 * 2. Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import { StorageProvider } from './StorageProvider.js';

export class S3Provider extends StorageProvider {
  constructor(config) {
    super(config);

    // Validate required config
    if (!config.bucket) {
      throw new Error('S3 bucket name is required');
    }
    if (!config.region) {
      throw new Error('AWS region is required');
    }

    this.bucket = config.bucket;
    this.region = config.region;

    // TODO: Initialize S3 client
    // this.s3Client = new S3Client({ region: this.region });
  }

  async getJson(path) {
    // TODO: Implement S3 getObject → parse JSON
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }

  async saveJson(path, data, message, sha = null) {
    // TODO: Implement S3 putObject with JSON.stringify(data)
    // Note: S3 doesn't have SHA/version control - handle differently
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }

  async deleteFile(path, sha, message) {
    // TODO: Implement S3 deleteObject
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }

  async listDirectory(path) {
    // TODO: Implement S3 listObjectsV2 with prefix
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }

  async uploadBinary(path, base64Content, message) {
    // TODO: Implement S3 putObject with Buffer.from(base64Content, 'base64')
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }

  async getBinary(path) {
    // TODO: Implement S3 getObject → convert to base64
    throw new Error('S3Provider not yet implemented. Use GitHubProvider or VercelBlobProvider.');
  }
}

/**
 * Implementation Guide for S3Provider:
 *
 * 1. Install dependencies:
 *    npm install @aws-sdk/client-s3
 *
 * 2. Import S3 client:
 *    import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
 *
 * 3. Initialize client in constructor:
 *    this.s3Client = new S3Client({
 *      region: this.region,
 *      credentials: {
 *        accessKeyId: config.accessKeyId,
 *        secretAccessKey: config.secretAccessKey,
 *      }
 *    });
 *
 * 4. Implement getJson:
 *    const command = new GetObjectCommand({ Bucket: this.bucket, Key: path });
 *    const response = await this.s3Client.send(command);
 *    const body = await response.Body.transformToString();
 *    return { data: JSON.parse(body), sha: response.ETag };
 *
 * 5. Implement saveJson:
 *    const command = new PutObjectCommand({
 *      Bucket: this.bucket,
 *      Key: path,
 *      Body: JSON.stringify(data, null, 2),
 *      ContentType: 'application/json',
 *    });
 *    const response = await this.s3Client.send(command);
 *    return { success: true, sha: response.ETag };
 *
 * 6. Similar patterns for other methods
 */
