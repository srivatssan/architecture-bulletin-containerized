import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getStorageProvider } from './storage/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'architecture-bulletin-backend'
  });
});

app.get('/ready', async (req, res) => {
  try {
    const storage = getStorageProvider();
    res.json({
      status: 'ready',
      storage: process.env.STORAGE_PROVIDER || 'github',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Architecture Bulletin API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      storage: process.env.STORAGE_PROVIDER || 'github',
      timestamp: new Date().toISOString()
    }
  });
});

// API Routes (will be imported)
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import configRouter from './routes/config.js';
import uploadsRouter from './routes/uploads.js';

app.use('/api/posts', postsRouter);
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/uploads', uploadsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: message
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📦 Storage provider: ${process.env.STORAGE_PROVIDER || 'github'}`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});
