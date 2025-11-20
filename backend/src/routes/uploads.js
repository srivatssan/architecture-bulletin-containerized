import express from 'express';
import { getStorageProvider } from '../storage/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateFileUpload } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/uploads/attachments - Upload topic attachment
 */
router.post('/attachments', authenticate, validateFileUpload, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const { filename, content, postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'postId is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `uploads/attachments/${postId}/${timestamp}-${sanitizedFilename}`;

    // Upload file (content should be base64)
    await storage.uploadBinary(
      filePath,
      content,
      `Upload attachment ${sanitizedFilename} for post ${postId} by ${req.user.username}`
    );

    res.status(201).json({
      success: true,
      data: {
        filename: sanitizedFilename,
        path: filePath,
        postId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.username
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/uploads/proof - Upload proof of work
 */
router.post('/proof', authenticate, validateFileUpload, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const { filename, content, postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'postId is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `uploads/proof/${postId}/${timestamp}-${sanitizedFilename}`;

    // Upload file (content should be base64)
    await storage.uploadBinary(
      filePath,
      content,
      `Upload proof ${sanitizedFilename} for post ${postId} by ${req.user.username}`
    );

    res.status(201).json({
      success: true,
      data: {
        filename: sanitizedFilename,
        path: filePath,
        postId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.username
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/uploads/:type/:postId/:filename - Download file
 */
router.get('/:type/:postId/:filename', authenticate, async (req, res) => {
  try {
    const { type, postId, filename } = req.params;

    // Validate type
    if (!['attachments', 'proof'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid upload type. Must be "attachments" or "proof"'
        },
        timestamp: new Date().toISOString()
      });
    }

    const storage = getStorageProvider();
    const filePath = `uploads/${type}/${postId}/${filename}`;

    const fileData = await storage.getBinary(filePath);

    if (!fileData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Return file data (base64)
    res.json({
      success: true,
      data: {
        filename,
        content: fileData,
        path: filePath
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/uploads/:type/:postId/:filename - Delete file
 */
router.delete('/:type/:postId/:filename', authenticate, async (req, res) => {
  try {
    const { type, postId, filename } = req.params;

    // Validate type
    if (!['attachments', 'proof'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid upload type. Must be "attachments" or "proof"'
        },
        timestamp: new Date().toISOString()
      });
    }

    const storage = getStorageProvider();
    const filePath = `uploads/${type}/${postId}/${filename}`;

    // Get file to get SHA
    const fileData = await storage.getBinary(filePath);
    if (!fileData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete file (SHA will be determined by storage provider)
    await storage.deleteFile(
      filePath,
      null,  // SHA will be fetched by provider if needed
      `Delete file ${filename} from post ${postId} by ${req.user.username}`
    );

    res.json({
      success: true,
      data: {
        filename,
        path: filePath,
        deleted: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting file:', error);
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

export default router;
