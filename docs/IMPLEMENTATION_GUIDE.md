# Implementation Guide - Architecture Bulletin Containerized

> Step-by-step guide to implementing the containerized architecture

---

## 📋 Overview

This guide explains how to build the Architecture Bulletin application using a containerized microservices architecture for AWS ECS deployment.

**Implementation Time Estimate:**
- Backend API: 6-8 hours
- Frontend Migration: 2-3 hours
- Docker Configuration: 2 hours
- AWS Infrastructure: 3-4 hours
- **Total: 13-17 hours**

---

## 🎯 Implementation Phases

### Phase 1: Backend API Development (6-8 hours)

#### Step 1.1: Project Setup
```bash
cd backend
npm init -y
npm install express cors dotenv helmet morgan
npm install @octokit/rest   # For GitHub storage
npm install --save-dev nodemon
```

#### Step 1.2: Create Storage Abstraction Layer

**Files to create:**
```
backend/src/storage/
├── StorageProvider.js        # Abstract interface
├── GitHubProvider.js         # GitHub implementation
├── S3Provider.js             # S3 stub (implement later)
├── VercelBlobProvider.js     # Vercel stub
└── index.js                  # Factory pattern
```

**Already created in `/api/storage/`** - Copy these files to `backend/src/storage/`

#### Step 1.3: Implement Express Server

**backend/src/server.js:**
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

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

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  // Check storage connectivity
  try {
    const storage = getStorageProvider();
    // Test connection
    res.json({ status: 'ready', storage: process.env.STORAGE_PROVIDER });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// API Routes
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import configRouter from './routes/config.js';
import uploadsRouter from './routes/uploads.js';

app.use('/api/posts', postsRouter);
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/uploads', uploadsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📦 Storage provider: ${process.env.STORAGE_PROVIDER || 'github'}`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
});
```

#### Step 1.4: Implement API Routes

**backend/src/routes/posts.js:**
```javascript
import express from 'express';
import { getStorageProvider } from '../storage/index.js';
import { authenticate } from '../middleware/auth.js';
import { validatePost } from '../middleware/validation.js';

const router = express.Router();

// GET /api/posts - List all posts
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
          const result = await storage.getJson(file.path);
          return result ? result.data : null;
        })
    );

    // Filter nulls and sort
    const validPosts = posts
      .filter(p => p !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: validPosts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// POST /api/posts - Create new post
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
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message
      }
    });
  }
});

// GET /api/posts/:id - Get single post
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
        }
      });
    }

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', authenticate, validatePost, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;

    // Get current post
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Post ${postId} not found` }
      });
    }

    // Merge updates
    const updated = {
      ...current.data,
      ...req.body,
      id: postId,  // Don't allow ID change
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
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const storage = getStorageProvider();
    const postId = req.params.id;

    // Get post to verify existence and get SHA
    const current = await storage.getJson(`posts/${postId}.json`);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Post ${postId} not found` }
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && current.data.createdBy !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own posts' }
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
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
});

function generatePostId(count) {
  return `post-${String(count + 1).padStart(4, '0')}`;
}

export default router;
```

#### Step 1.5: Implement Middleware

**backend/src/middleware/auth.js:**
```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization token provided'
      }
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }
  next();
}
```

**backend/src/middleware/validation.js:**
```javascript
export function validatePost(req, res, next) {
  const { title, description } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
  }

  if (!description || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be 5000 characters or less' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
}
```

---

### Phase 2: Frontend Migration (2-3 hours)

#### Step 2.1: Copy Existing Frontend

```bash
# Copy existing React app to frontend folder
cp -r Architecture-Bulletin/src Architecture-Bulletin-Containerized/frontend/
cp -r Architecture-Bulletin/public Architecture-Bulletin-Containerized/frontend/
cp Architecture-Bulletin/package.json Architecture-Bulletin-Containerized/frontend/
```

#### Step 2.2: Create API Service Layer

**frontend/src/services/apiClient.js:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  // Posts API
  async getPosts() {
    return this.request('/api/posts');
  }

  async getPost(id) {
    return this.request(`/api/posts/${id}`);
  }

  async createPost(postData) {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(id, updates) {
    return this.request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePost(id) {
    return this.request(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }
}

export default new ApiClient();
```

#### Step 2.3: Update Services to Use API

Replace direct storage calls with API calls:

**Before (old):**
```javascript
const posts = await getAllPosts(); // Direct storage access
```

**After (new):**
```javascript
const response = await apiClient.getPosts();
const posts = response.data;
```

---

### Phase 3: Docker Configuration (2 hours)

#### Step 3.1: Backend Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/server.js"]
```

#### Step 3.2: Frontend Dockerfile

**frontend/Dockerfile:**
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**frontend/nginx.conf:**
```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Logging
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log;

  # Performance
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;

  # Gzip
  gzip on;
  gzip_vary on;
  gzip_min_length 1000;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

  server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
      access_log off;
      return 200 "healthy\n";
      add_header Content-Type text/plain;
    }

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

#### Step 3.3: Docker Compose for Local Development

**infrastructure/docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - PORT=8080
      - STORAGE_PROVIDER=github
      - GITHUB_PAT=${GITHUB_PAT}
      - GITHUB_REPO_OWNER=${GITHUB_REPO_OWNER}
      - GITHUB_DATA_REPO=architecture-bulletin-data
      - CORS_ORIGIN=http://localhost:3000
    volumes:
      - ../backend/src:/app/src
    restart: unless-stopped

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    depends_on:
      - backend
    restart: unless-stopped
```

---

### Phase 4: AWS Infrastructure (3-4 hours)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed AWS setup instructions.

**High-level steps:**
1. Create ECR repositories
2. Build and push Docker images
3. Create ECS cluster
4. Create task definitions
5. Create ALB
6. Create ECS services
7. Configure auto-scaling

---

## 📝 Environment Variables Reference

### Backend

```env
# Required
STORAGE_PROVIDER=github                    # or 's3' or 'vercel-blob'
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secret-jwt-key

# GitHub Storage (if STORAGE_PROVIDER=github)
GITHUB_PAT=your_github_pat_token
GITHUB_REPO_OWNER=your_username
GITHUB_DATA_REPO=architecture-bulletin-data
GITHUB_BRANCH=main

# S3 Storage (if STORAGE_PROVIDER=s3)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
# AWS credentials via IAM role (preferred) or env vars
```

### Frontend

```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENV=production
```

---

## ✅ Testing Checklist

### Local Testing (Docker Compose)

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Health endpoints respond
- [ ] API authentication works
- [ ] Create post works
- [ ] List posts works
- [ ] Update post works
- [ ] Delete post works
- [ ] Storage provider connection works

### AWS Testing

- [ ] Containers deploy to ECS
- [ ] ALB routes traffic correctly
- [ ] Auto-scaling triggers work
- [ ] CloudWatch logs appear
- [ ] Health checks pass
- [ ] SSL certificate works
- [ ] CORS configured correctly

---

## 🚀 Next Steps

1. **Implement remaining API endpoints:**
   - Auth routes
   - Config routes
   - Upload routes
   - Notification routes

2. **Add features:**
   - File upload handling (multipart)
   - WebSocket support for real-time chat
   - Rate limiting
   - Request caching

3. **Enhance monitoring:**
   - CloudWatch dashboards
   - Custom metrics
   - Alarms for errors

4. **Production readiness:**
   - Load testing
   - Security audit
   - Backup verification
   - Disaster recovery testing

---

## 📚 Additional Resources

- **Express.js:** https://expressjs.com/
- **AWS ECS:** https://docs.aws.amazon.com/ecs/
- **Docker:** https://docs.docker.com/
- **Terraform:** https://www.terraform.io/docs
- **GitHub API:** https://docs.github.com/rest
- **AWS SDK:** https://aws.amazon.com/sdk-for-javascript/

---

**Ready to start implementing?** Begin with Phase 1 (Backend API) and test each step before moving on!
