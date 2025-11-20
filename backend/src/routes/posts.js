import express from 'express';
import { getStorageProvider } from '../storage/index.js';
import { authenticate } from '../middleware/auth.js';
import { validatePost } from '../middleware/validation.js';

const router = express.Router();

/**
 * Helper function to generate post ID
 */
function generatePostId(count) {
  return `post-${String(count + 1).padStart(4, '0')}`;
}

/**
 * GET /api/posts - List all posts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();

    // List posts directory
    const files = await storage.listDirectory('posts');

    // Fetch all posts in parallel
    const posts = await Promise.all(
      files
        .filter(f => f.name.endsWith('.json'))
        .map(async (file) => {
          try {
            const result = await storage.getJson(file.path);
            return result ? result.data : null;
          } catch (error) {
            console.error(`Error fetching post ${file.path}:`, error);
            return null;
          }
        })
    );

    // Filter nulls and sort by creation date
    const validPosts = posts
      .filter(p => p !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: validPosts,
      count: validPosts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing posts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/posts - Create new post
 */
router.post('/', authenticate, validatePost, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const { title, description, concernedParties } = req.body;

    // Generate post ID
    const files = await storage.listDirectory('posts');
    const postId = generatePostId(files.length);

    // Create post object
    const post = {
      id: postId,
      title,
      description,
      concernedParties: concernedParties || [],
      status: 'status-new',
      assignedArchitects: [],
      attachments: [],
      conversations: [],
      createdAt: new Date().toISOString(),
      createdBy: req.user.username,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username,
      isArchived: false
    };

    // Save to storage
    await storage.saveJson(
      `posts/${postId}.json`,
      post,
      `Create post ${postId} by ${req.user.username}`
    );

    res.status(201).json({
      success: true,
      data: post,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/posts/:id - Get single post
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const result = await storage.getJson(`posts/${req.params.id}.json`);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Post ${req.params.id} not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/posts/:id - Update post
 */
router.put('/:id', authenticate, validatePost, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;

    // Get current post
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Post ${postId} not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Merge updates
    const updated = {
      ...current.data,
      ...req.body,
      id: postId,  // Don't allow ID change
      createdAt: current.data.createdAt,  // Don't allow created date change
      createdBy: current.data.createdBy,  // Don't allow creator change
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username
    };

    // Save
    await storage.saveJson(
      `posts/${postId}.json`,
      updated,
      `Update post ${postId} by ${req.user.username}`,
      current.sha
    );

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/posts/:id - Delete post
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;

    // Get post to verify existence and get SHA
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Post ${postId} not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check permissions - only admin or creator can delete
    if (req.user.role !== 'admin' && current.data.createdBy !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete
    await storage.deleteFile(
      `posts/${postId}.json`,
      current.sha,
      `Delete post ${postId} by ${req.user.username}`
    );

    res.json({
      success: true,
      data: { id: postId, deleted: true },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/posts/:id/archive - Archive/unarchive post
 */
router.post('/:id/archive', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;
    const { isArchived } = req.body;

    // Get current post
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Post ${postId} not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update archive status
    const updated = {
      ...current.data,
      isArchived: isArchived !== undefined ? isArchived : !current.data.isArchived,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username
    };

    await storage.saveJson(
      `posts/${postId}.json`,
      updated,
      `${updated.isArchived ? 'Archive' : 'Unarchive'} post ${postId} by ${req.user.username}`,
      current.sha
    );

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error archiving post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ARCHIVE_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/posts/:id/assign - Assign architects to post
 */
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;
    const { assignedArchitects } = req.body;

    if (!Array.isArray(assignedArchitects)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'assignedArchitects must be an array'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get current post
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Post ${postId} not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update assigned architects
    const updated = {
      ...current.data,
      assignedArchitects,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username
    };

    await storage.saveJson(
      `posts/${postId}.json`,
      updated,
      `Assign architects to post ${postId} by ${req.user.username}`,
      current.sha
    );

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error assigning architects:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
