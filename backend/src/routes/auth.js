import express from 'express';
import jwt from 'jsonwebtoken';
import { getStorageProvider } from '../storage/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const TOKEN_EXPIRY = '24h';

/**
 * POST /api/auth/login - Login with username/password
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const storage = getStorageProvider();

    // Fetch users from storage
    const result = await storage.getJson('config/users.json');

    if (!result || !result.data || !result.data.users) {
      // If no users file exists, use default admin user
      const defaultUser = {
        username: 'admin',
        password: 'admin123',  // In production, this should be hashed
        role: 'admin',
        fullName: 'Administrator'
      };

      if (username === defaultUser.username && password === defaultUser.password) {
        const token = jwt.sign(
          {
            username: defaultUser.username,
            role: defaultUser.role,
            fullName: defaultUser.fullName
          },
          JWT_SECRET,
          { expiresIn: TOKEN_EXPIRY }
        );

        return res.json({
          success: true,
          data: {
            token,
            user: {
              username: defaultUser.username,
              role: defaultUser.role,
              fullName: defaultUser.fullName
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Find user
    const user = result.data.users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check password (in production, use bcrypt to compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed. Please try again.'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/auth/logout - Logout (client-side token removal)
 */
router.post('/logout', authenticate, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future stateful session management
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/auth/me - Get current user info
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      username: req.user.username,
      role: req.user.role,
      fullName: req.user.fullName
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/auth/verify - Verify token validity
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token is required'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          username: decoded.username,
          role: decoded.role,
          fullName: decoded.fullName
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        valid: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
