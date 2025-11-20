import express from 'express';
import { getStorageProvider } from '../storage/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/config/architects - Get list of architects
 */
router.get('/architects', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const result = await storage.getJson('config/architects.json');

    if (!result || !result.data) {
      // Return default architects if file doesn't exist
      return res.json({
        success: true,
        data: {
          architects: []
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
    console.error('Error fetching architects:', error);
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
 * GET /api/config/statuses - Get list of post statuses
 */
router.get('/statuses', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const result = await storage.getJson('config/statuses.json');

    if (!result || !result.data) {
      // Return default statuses if file doesn't exist
      const defaultStatuses = {
        statuses: [
          { id: 'status-new', label: 'New', color: 'blue' },
          { id: 'status-in-progress', label: 'In Progress', color: 'yellow' },
          { id: 'status-resolved', label: 'Resolved', color: 'green' },
          { id: 'status-closed', label: 'Closed', color: 'gray' }
        ]
      };

      return res.json({
        success: true,
        data: defaultStatuses,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching statuses:', error);
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
 * GET /api/config/users - Get list of users (admin only)
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const result = await storage.getJson('config/users.json');

    if (!result || !result.data) {
      // Return default users if file doesn't exist
      const defaultUsers = {
        users: [
          {
            username: 'admin',
            role: 'admin',
            fullName: 'Administrator',
            // Don't return passwords in the response
          }
        ]
      };

      return res.json({
        success: true,
        data: defaultUsers,
        timestamp: new Date().toISOString()
      });
    }

    // Remove passwords from response
    const sanitizedData = {
      ...result.data,
      users: result.data.users.map(user => ({
        username: user.username,
        role: user.role,
        fullName: user.fullName
      }))
    };

    res.json({
      success: true,
      data: sanitizedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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
 * PUT /api/config/architects - Update architects list (admin only)
 */
router.put('/architects', authenticate, requireAdmin, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const { architects } = req.body;

    if (!Array.isArray(architects)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'architects must be an array'
        },
        timestamp: new Date().toISOString()
      });
    }

    const data = { architects };

    // Get current SHA if file exists
    const current = await storage.getJson('config/architects.json');

    await storage.saveJson(
      'config/architects.json',
      data,
      `Update architects by ${req.user.username}`,
      current?.sha
    );

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating architects:', error);
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
 * PUT /api/config/statuses - Update statuses list (admin only)
 */
router.put('/statuses', authenticate, requireAdmin, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const { statuses } = req.body;

    if (!Array.isArray(statuses)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'statuses must be an array'
        },
        timestamp: new Date().toISOString()
      });
    }

    const data = { statuses };

    // Get current SHA if file exists
    const current = await storage.getJson('config/statuses.json');

    await storage.saveJson(
      'config/statuses.json',
      data,
      `Update statuses by ${req.user.username}`,
      current?.sha
    );

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating statuses:', error);
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

export default router;
