/**
 * Artifact Service
 * Manages deliverable artifacts with version control
 */

import { GITHUB_PATHS } from '../utils/constants';
import { getJsonFile, saveJsonFile, uploadBinaryFile, listDirectory } from './githubDataService';
import { logDataOperation, logError } from '../utils/logger';
import { fileToBase64, getNextVersion } from '../utils/helpers';

/**
 * Get all artifact versions for a post
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} - Array of version metadata
 */
export const getArtifacts = async (postId) => {
  try {
    logDataOperation('read', 'artifacts', { postId });

    const artifactsPath = `${GITHUB_PATHS.ARTIFACTS}/${postId}`;
    const versionDirs = await listDirectory(artifactsPath);

    // Get metadata for each version
    const versions = await Promise.all(
      versionDirs
        .filter(dir => dir.type === 'dir' && dir.name.startsWith('v'))
        .map(async (dir) => {
          try {
            const metadataPath = `${dir.path}/metadata.json`;
            const result = await getJsonFile(metadataPath);
            return result ? result.data : null;
          } catch (error) {
            logError(`Failed to fetch artifact metadata: ${dir.path}`, error);
            return null;
          }
        })
    );

    // Filter nulls and sort by version descending
    const validVersions = versions.filter(v => v !== null);
    validVersions.sort((a, b) => {
      const aNum = parseInt(a.version.replace('v', ''), 10);
      const bNum = parseInt(b.version.replace('v', ''), 10);
      return bNum - aNum;
    });

    return validVersions;
  } catch (error) {
    if (error.status === 404) {
      return []; // No artifacts yet
    }
    logError(`Failed to fetch artifacts for post: ${postId}`, error);
    throw error;
  }
};

/**
 * Upload artifact version
 * @param {string} postId - Post ID
 * @param {FileList|File[]} files - Files to upload
 * @param {string} notes - Version notes
 * @param {string} uploadedBy - Username
 * @returns {Promise<Object>} - Version metadata
 */
export const uploadArtifact = async (postId, files, notes, uploadedBy) => {
  try {
    logDataOperation('create', 'artifact', { postId });

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Get existing versions to determine next version number
    const existingVersions = await getArtifacts(postId);
    const versionNumbers = existingVersions.map(v => v.version);
    const nextVersion = getNextVersion(versionNumbers);

    const fileArray = Array.from(files);
    const uploadedFiles = [];

    // Upload each file
    for (const file of fileArray) {
      try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);

        // Upload to GitHub
        const path = `${GITHUB_PATHS.ARTIFACTS}/${postId}/${nextVersion}/${file.name}`;
        const result = await uploadBinaryFile(
          path,
          base64Content,
          `Upload artifact ${file.name} (${nextVersion}) for post ${postId} by ${uploadedBy}`
        );

        uploadedFiles.push({
          filename: file.name,
          path,
          size: file.size,
          type: file.type,
          sha: result.content.sha,
          description: '',
        });

        logDataOperation('create', 'artifact_file', { postId, version: nextVersion, filename: file.name });
      } catch (error) {
        logError(`Failed to upload artifact file: ${file.name}`, error);
        throw error;
      }
    }

    // Create metadata
    const metadata = {
      version: nextVersion,
      postId,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      files: uploadedFiles,
      notes,
      isCurrent: true,
    };

    // Save metadata
    const metadataPath = `${GITHUB_PATHS.ARTIFACTS}/${postId}/${nextVersion}/metadata.json`;
    await saveJsonFile(
      metadataPath,
      metadata,
      `Create artifact metadata ${nextVersion} for post ${postId} by ${uploadedBy}`
    );

    // Update previous version's isCurrent flag
    if (existingVersions.length > 0) {
      // This would require updating all previous versions' metadata
      // For simplicity, we'll mark current version and check it in the UI
    }

    return metadata;
  } catch (error) {
    logError(`Failed to upload artifact for post: ${postId}`, error);
    throw error;
  }
};

/**
 * Download artifact file (returns base64 content)
 * @param {string} postId - Post ID
 * @param {string} version - Version number (e.g., 'v1')
 * @param {string} filename - File name
 * @returns {Promise<Object>} - { content, type, size }
 */
export const downloadArtifact = async (postId, version, filename) => {
  try {
    logDataOperation('read', 'artifact_file', { postId, version, filename });

    const path = `${GITHUB_PATHS.ARTIFACTS}/${postId}/${version}/${filename}`;
    const { content, size } = await getFileContent(path);

    // Get file type from metadata
    const metadataPath = `${GITHUB_PATHS.ARTIFACTS}/${postId}/${version}/metadata.json`;
    const metadataResult = await getJsonFile(metadataPath);

    const fileMetadata = metadataResult?.data.files.find(f => f.filename === filename);

    return {
      content, // base64
      type: fileMetadata?.type || 'application/octet-stream',
      size,
      filename,
    };
  } catch (error) {
    logError(`Failed to download artifact: ${postId}/${version}/${filename}`, error);
    throw error;
  }
};

export default {
  getArtifacts,
  uploadArtifact,
  downloadArtifact,
};
