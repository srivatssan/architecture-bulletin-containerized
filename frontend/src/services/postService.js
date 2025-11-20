/**
 * Post Service
 * Manages bulletin posts CRUD operations
 * Supports both GitHub and local storage modes
 */

import { APP_MODE, GITHUB_PATHS } from '../utils/constants';
import { getJsonFile, saveJsonFile, listDirectory, uploadBinaryFile, deleteFile } from './githubDataService';
import {
  getAllLocalPosts,
  getLocalPost,
  saveLocalPost,
  deleteLocalPost,
  saveLocalBinaryFile
} from './localDataService';
import { notifyAdminOfSubmission } from './notificationService';
import { logDataOperation, logError } from '../utils/logger';
import { fileToBase64 } from '../utils/helpers';

/**
 * Generate next post ID
 * @param {Array} existingPosts - Array of existing posts
 * @returns {string} - Format: post-0001
 */
const generatePostId = (existingPosts = []) => {
  if (existingPosts.length === 0) return 'post-0001';

  const numbers = existingPosts
    .map(p => parseInt(p.id.replace('post-', ''), 10))
    .filter(n => !isNaN(n));

  const maxNumber = Math.max(0, ...numbers);
  const nextNumber = maxNumber + 1;

  return `post-${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Get all posts
 * @returns {Promise<Array>} - Array of post objects
 */
export const getAllPosts = async () => {
  try {
    logDataOperation('read', 'posts', { operation: 'list_all', mode: APP_MODE });

    // Use local storage in local mode
    if (APP_MODE === 'local') {
      return await getAllLocalPosts();
    }

    // Use GitHub API in github mode
    const files = await listDirectory(GITHUB_PATHS.POSTS);

    // Filter only JSON files
    const postFiles = files.filter(f => f.name.endsWith('.json'));

    // Fetch all posts in parallel
    const posts = await Promise.all(
      postFiles.map(async (file) => {
        try {
          const result = await getJsonFile(file.path);
          return result ? result.data : null;
        } catch (error) {
          logError(`Failed to fetch post: ${file.path}`, error);
          return null;
        }
      })
    );

    // Filter out nulls and sort by createdAt descending
    const validPosts = posts.filter(p => p !== null);
    validPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return validPosts;
  } catch (error) {
    logError('Failed to fetch all posts', error);
    throw error;
  }
};

/**
 * Get single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object|null>} - Post object or null
 */
export const getPost = async (postId) => {
  try {
    logDataOperation('read', 'post', { postId, mode: APP_MODE });

    // Use local storage in local mode
    if (APP_MODE === 'local') {
      return await getLocalPost(postId);
    }

    // Use GitHub API in github mode
    const path = `${GITHUB_PATHS.POSTS}/${postId}.json`;
    const result = await getJsonFile(path);

    return result ? { ...result.data, _sha: result.sha } : null;
  } catch (error) {
    logError(`Failed to fetch post: ${postId}`, error);
    throw error;
  }
};

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @param {FileList} attachments - Attachment files
 * @param {string} createdBy - Username
 * @returns {Promise<Object>} - Created post
 */
export const createPost = async (postData, attachments = [], createdBy) => {
  try {
    // Get all existing posts to generate ID
    const existingPosts = await getAllPosts();
    const postId = generatePostId(existingPosts);

    logDataOperation('create', 'post', { postId, mode: APP_MODE });

    // Upload attachments first
    const attachmentMetadata = await uploadAttachments(postId, attachments, createdBy);

    // Create post object
    const post = {
      id: postId,
      title: postData.title,
      description: postData.description,
      concernedParties: postData.concernedParties || [],
      status: postData.status || 'status-new',
      assignedArchitects: postData.assignedArchitects || [],
      adminAssigned: postData.adminAssigned || false,
      attachments: attachmentMetadata,
      conversations: [],
      createdAt: new Date().toISOString(),
      createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: createdBy,
      submittedAt: null,
      submittedBy: null,
      closedAt: null,
      closedBy: null,
      approvedBy: null,
      isArchived: false,
      archivedAt: null,
    };

    // Save post
    if (APP_MODE === 'local') {
      await saveLocalPost(post);
    } else {
      const path = `${GITHUB_PATHS.POSTS}/${postId}.json`;
      await saveJsonFile(path, post, `Create post ${postId} by ${createdBy}`);
    }

    return post;
  } catch (error) {
    logError('Failed to create post', error);
    throw error;
  }
};

/**
 * Update an existing post
 * @param {string} postId - Post ID
 * @param {Object} updates - Fields to update
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>} - Updated post
 */
export const updatePost = async (postId, updates, updatedBy) => {
  try {
    logDataOperation('update', 'post', { postId, mode: APP_MODE });

    // Get current post
    const currentPost = await getPost(postId);

    if (!currentPost) {
      throw new Error(`Post ${postId} not found`);
    }

    // Merge updates
    const updatedPost = {
      ...currentPost,
      ...updates,
      id: postId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    // Remove internal _sha field
    delete updatedPost._sha;

    // Save updated post
    if (APP_MODE === 'local') {
      await saveLocalPost(updatedPost);
    } else {
      const path = `${GITHUB_PATHS.POSTS}/${postId}.json`;
      await saveJsonFile(
        path,
        updatedPost,
        `Update post ${postId} by ${updatedBy}`,
        currentPost._sha
      );
    }

    return updatedPost;
  } catch (error) {
    logError(`Failed to update post: ${postId}`, error);
    throw error;
  }
};

/**
 * Delete a post and all associated files
 * @param {string} postId - Post ID
 * @param {string} deletedBy - Username
 * @returns {Promise<Object>}
 */
export const deletePost = async (postId, deletedBy) => {
  try {
    logDataOperation('delete', 'post', { postId, mode: APP_MODE });

    // Get post to get SHA and check attachments
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // Delete post
    if (APP_MODE === 'local') {
      await deleteLocalPost(postId);
    } else {
      const postPath = `${GITHUB_PATHS.POSTS}/${postId}.json`;
      await deleteFile(postPath, post._sha, `Delete post ${postId} by ${deletedBy}`);
    }

    // TODO: Delete attachments, artifacts, conversations, etc.
    // This would require deleting entire directories, which is more complex with GitHub API
    // For now, we'll leave these files orphaned (can be cleaned up with GitHub Actions later)

    return { success: true, postId };
  } catch (error) {
    logError(`Failed to delete post: ${postId}`, error);
    throw error;
  }
};

/**
 * Upload attachments for a post
 * @param {string} postId - Post ID
 * @param {FileList|File[]} files - Files to upload
 * @param {string} uploadedBy - Username
 * @returns {Promise<Array>} - Array of attachment metadata
 */
export const uploadAttachments = async (postId, files, uploadedBy) => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    const fileArray = Array.from(files);
    const attachmentMetadata = [];

    for (const file of fileArray) {
      try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);

        // Upload based on mode
        const path = `${APP_MODE === 'local' ? 'attachments' : GITHUB_PATHS.ATTACHMENTS}/${postId}/${file.name}`;

        if (APP_MODE === 'local') {
          await saveLocalBinaryFile(path, base64Content);
        } else {
          await uploadBinaryFile(
            path,
            base64Content,
            `Upload attachment ${file.name} for post ${postId} by ${uploadedBy}`
          );
        }

        // Create metadata
        attachmentMetadata.push({
          filename: file.name,
          path,
          size: file.size,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          type: file.type,
        });

        logDataOperation('create', 'attachment', { postId, filename: file.name, mode: APP_MODE });
      } catch (error) {
        logError(`Failed to upload attachment: ${file.name}`, error);
        // Continue with other files even if one fails
      }
    }

    return attachmentMetadata;
  } catch (error) {
    logError('Failed to upload attachments', error);
    throw error;
  }
};

/**
 * Upload proof of work files for a post
 * @param {string} postId - Post ID
 * @param {FileList|File[]} files - Files to upload
 * @param {string} uploadedBy - Username
 * @returns {Promise<Array>} - Array of file metadata with paths
 */
export const uploadProofOfWork = async (postId, files, uploadedBy) => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    const fileArray = Array.from(files);
    const fileMetadata = [];

    for (const file of fileArray) {
      try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);

        // Create path for proof of work files
        const timestamp = Date.now();
        const path = `${APP_MODE === 'local' ? 'attachments' : GITHUB_PATHS.ATTACHMENTS}/${postId}/proof/${timestamp}-${file.name}`;

        if (APP_MODE === 'local') {
          await saveLocalBinaryFile(path, base64Content);
        } else {
          await uploadBinaryFile(
            path,
            base64Content,
            `Upload proof of work ${file.name} for post ${postId} by ${uploadedBy}`
          );
        }

        // Create metadata
        fileMetadata.push({
          name: file.name,
          path,
          size: file.size,
          type: file.type,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
        });

        logDataOperation('create', 'proof_file', { postId, filename: file.name, mode: APP_MODE });
      } catch (error) {
        logError(`Failed to upload proof file: ${file.name}`, error);
        // Continue with other files even if one fails
      }
    }

    return fileMetadata;
  } catch (error) {
    logError('Failed to upload proof of work files', error);
    throw error;
  }
};

/**
 * Assign architect to post
 * @param {string} postId - Post ID
 * @param {string} architectUsername - GitHub username
 * @param {string} updatedBy - Username
 * @param {boolean} adminAssigned - Whether assignment is by admin (locks it)
 * @returns {Promise<Object>} - Updated post
 */
export const assignArchitect = async (postId, architectUsername, updatedBy, adminAssigned = false) => {
  try {
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // Check if already assigned
    if (post.assignedArchitects.includes(architectUsername)) {
      throw new Error(`Architect ${architectUsername} already assigned to post ${postId}`);
    }

    // Add architect to list
    const assignedArchitects = [...post.assignedArchitects, architectUsername];

    const updates = {
      assignedArchitects,
      adminAssigned: adminAssigned || post.adminAssigned,
    };

    // If status is "New", change to "Assigned-InProgress"
    if (post.status === 'status-new') {
      updates.status = 'status-assigned';
    }

    return await updatePost(postId, updates, updatedBy);
  } catch (error) {
    logError(`Failed to assign architect to post: ${postId}`, error);
    throw error;
  }
};

/**
 * Unassign architect from post
 * @param {string} postId - Post ID
 * @param {string} architectUsername - GitHub username
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>} - Updated post
 */
export const unassignArchitect = async (postId, architectUsername, updatedBy) => {
  try {
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const assignedArchitects = post.assignedArchitects.filter(a => a !== architectUsername);

    // If no architects left and status is "Assigned-InProgress", change back to "New"
    const updates = { assignedArchitects };
    if (assignedArchitects.length === 0 && post.status === 'status-assigned') {
      updates.status = 'status-new';
    }

    return await updatePost(postId, updates, updatedBy);
  } catch (error) {
    logError(`Failed to unassign architect from post: ${postId}`, error);
    throw error;
  }
};

/**
 * Update post status
 * @param {string} postId - Post ID
 * @param {string} newStatus - New status ID
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>} - Updated post
 */
export const updateStatus = async (postId, newStatus, updatedBy) => {
  try {
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const updates = { status: newStatus };

    // Handle special status transitions
    if (newStatus === 'status-submitted') {
      updates.submittedAt = new Date().toISOString();
      updates.submittedBy = updatedBy;

      // Notify admin of submission
      await notifyAdminOfSubmission(post, updatedBy);
    }

    if (newStatus === 'status-closed') {
      updates.closedAt = new Date().toISOString();
      updates.closedBy = updatedBy;
      updates.approvedBy = updatedBy;
    }

    return await updatePost(postId, updates, updatedBy);
  } catch (error) {
    logError(`Failed to update post status: ${postId}`, error);
    throw error;
  }
};

/**
 * Archive a post (removes from active posts, frees up slot)
 * @param {string} postId - Post ID
 * @param {string} archivedBy - Username
 * @returns {Promise<Object>} - Updated post
 */
export const archivePost = async (postId, archivedBy) => {
  try {
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.isArchived) {
      throw new Error('Post is already archived');
    }

    const updates = {
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedBy,
    };

    return await updatePost(postId, updates, archivedBy);
  } catch (error) {
    logError(`Failed to archive post: ${postId}`, error);
    throw error;
  }
};

/**
 * Unarchive a post (restores to active posts)
 * @param {string} postId - Post ID
 * @param {string} unarchivedBy - Username
 * @returns {Promise<Object>} - Updated post
 */
export const unarchivePost = async (postId, unarchivedBy) => {
  try {
    const post = await getPost(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (!post.isArchived) {
      throw new Error('Post is not archived');
    }

    const updates = {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
    };

    return await updatePost(postId, updates, unarchivedBy);
  } catch (error) {
    logError(`Failed to unarchive post: ${postId}`, error);
    throw error;
  }
};

export default {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  uploadAttachments,
  uploadProofOfWork,
  assignArchitect,
  unassignArchitect,
  updateStatus,
  archivePost,
  unarchivePost,
};
