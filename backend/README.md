# Architecture Bulletin - Backend API

> Express.js REST API with pluggable storage backends for containerized deployment

---

## 🏗️ Architecture

This backend API provides a RESTful interface for the Architecture Bulletin application with the following features:

- **Storage Abstraction**: Pluggable backends (GitHub, AWS S3, Vercel Blob)
- **JWT Authentication**: Stateless token-based authentication
- **RESTful API**: Standard HTTP methods and response formats
- **Container-Ready**: Dockerized for AWS ECS deployment
- **Production-Grade**: Security, validation, error handling, logging

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── server.js              # Express server entry point
│   ├── routes/                # API route handlers
│   │   ├── posts.js          # Posts CRUD operations
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── config.js         # Configuration endpoints
│   │   └── uploads.js        # File upload endpoints
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── validation.js     # Request validation
│   └── storage/               # Storage abstraction layer
│       ├── StorageProvider.js    # Abstract interface
│       ├── GitHubProvider.js     # GitHub implementation
│       ├── S3Provider.js         # AWS S3 (stub)
│       ├── VercelBlobProvider.js # Vercel Blob (stub)
│       └── index.js              # Factory pattern
├── Dockerfile                 # Container image definition
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env and set your configuration
# - Set GITHUB_PAT if using GitHub storage
# - Set JWT_SECRET for production

# 5. Start server
npm start

# For development with auto-reload:
npm run dev
```

Server will start on http://localhost:8080

### Docker

```bash
# Build container
docker build -t architecture-bulletin-backend .

# Run container
docker run -p 8080:8080 \
  -e STORAGE_PROVIDER=github \
  -e GITHUB_PAT=your_token \
  -e GITHUB_REPO_OWNER=your_username \
  -e GITHUB_DATA_REPO=architecture-bulletin-data \
  architecture-bulletin-backend
```

---

## 🔧 Configuration

### Environment Variables

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` or `production` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key` |
| `STORAGE_PROVIDER` | Storage backend | `github`, `s3`, or `vercel-blob` |

#### GitHub Storage (when `STORAGE_PROVIDER=github`)

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_PAT` | GitHub Personal Access Token | `github_pat_...` |
| `GITHUB_REPO_OWNER` | Repository owner username | `srivatssan` |
| `GITHUB_DATA_REPO` | Data repository name | `architecture-bulletin-data` |
| `GITHUB_BRANCH` | Branch name | `main` |

#### AWS S3 Storage (when `STORAGE_PROVIDER=s3`)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_S3_BUCKET` | S3 bucket name | `architecture-bulletin-data` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key (or use IAM role) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (or use IAM role) | - |

**Note**: For ECS deployment, use IAM task roles instead of access keys.

---

## 📡 API Endpoints

### Health & Status

```
GET  /health          - Health check (returns 200 if healthy)
GET  /ready           - Readiness check (verifies storage connectivity)
GET  /api/status      - API status and version info
```

### Authentication

```
POST /api/auth/login    - Login with username/password
POST /api/auth/logout   - Logout (client-side token removal)
GET  /api/auth/me       - Get current user info
POST /api/auth/verify   - Verify token validity
```

**Login Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "username": "admin",
      "role": "admin",
      "fullName": "Administrator"
    }
  },
  "timestamp": "2025-11-20T00:00:00Z"
}
```

### Posts (all require authentication)

```
GET    /api/posts              - List all posts
POST   /api/posts              - Create new post
GET    /api/posts/:id          - Get single post
PUT    /api/posts/:id          - Update post
DELETE /api/posts/:id          - Delete post
POST   /api/posts/:id/archive  - Archive/unarchive post
POST   /api/posts/:id/assign   - Assign architects to post
```

**Create Post Request:**
```json
{
  "title": "New Architecture Decision",
  "description": "We need to decide on the database technology",
  "concernedParties": ["Backend Team", "DevOps Team"]
}
```

### Configuration (require authentication)

```
GET  /api/config/architects    - Get architects list
GET  /api/config/statuses      - Get status options
GET  /api/config/users         - Get users (admin only)
PUT  /api/config/architects    - Update architects (admin only)
PUT  /api/config/statuses      - Update statuses (admin only)
```

### File Uploads (require authentication)

```
POST   /api/uploads/attachments  - Upload topic attachment
POST   /api/uploads/proof        - Upload proof of work
GET    /api/uploads/:type/:postId/:filename - Download file
DELETE /api/uploads/:type/:postId/:filename - Delete file
```

---

## 🔐 Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for stateless authentication.

**Token Lifetime**: 24 hours

**Token Structure**:
```json
{
  "username": "admin",
  "role": "admin",
  "fullName": "Administrator",
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Using Tokens**:

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example with curl**:
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# Use token for authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/posts
```

---

## 📦 Storage Providers

### GitHub Provider (Default)

**Pros**:
- ✅ Version control built-in
- ✅ Free for public repos
- ✅ Easy to inspect data
- ✅ Audit trail via commit history

**Cons**:
- ⚠️ API rate limits
- ⚠️ External dependency
- ⚠️ 1GB file size limit

**Setup**:
1. Create GitHub repository (e.g., `architecture-bulletin-data`)
2. Generate Personal Access Token with `repo` scope
3. Set environment variables:
   ```env
   STORAGE_PROVIDER=github
   GITHUB_PAT=your_token
   GITHUB_REPO_OWNER=your_username
   GITHUB_DATA_REPO=architecture-bulletin-data
   ```

### AWS S3 Provider (Production)

**Pros**:
- ✅ Native AWS integration
- ✅ IAM role support
- ✅ High availability
- ✅ Unlimited scalability

**Cons**:
- ❌ No built-in version control
- ❌ Requires AWS account

**Setup**:
1. Create S3 bucket
2. Set environment variables:
   ```env
   STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   ```
3. For ECS: Use IAM task role (no access keys needed)
4. For local: Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

**Note**: S3Provider implementation is stubbed. See `src/storage/S3Provider.js` for implementation guide.

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t architecture-bulletin-backend:latest .
```

### Run Container

```bash
docker run -d \
  --name backend-api \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e STORAGE_PROVIDER=github \
  -e GITHUB_PAT=$GITHUB_PAT \
  -e GITHUB_REPO_OWNER=srivatssan \
  -e GITHUB_DATA_REPO=architecture-bulletin-data \
  -e JWT_SECRET=$JWT_SECRET \
  -e CORS_ORIGIN=https://your-frontend-url.com \
  architecture-bulletin-backend:latest
```

### Health Check

```bash
docker exec backend-api node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

---

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:8080/health

# Status
curl http://localhost:8080/api/status

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get posts (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/posts
```

---

## 🔒 Security

### Production Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong passwords for users
- [ ] Enable HTTPS/TLS (handled by ALB in ECS)
- [ ] Set CORS_ORIGIN to specific domain
- [ ] Use IAM roles instead of access keys (ECS)
- [ ] Enable ECR image scanning
- [ ] Rotate secrets regularly
- [ ] Review and limit file upload sizes
- [ ] Enable rate limiting (add middleware)
- [ ] Use environment-specific .env files

### Security Features

- ✅ JWT authentication
- ✅ Input validation
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Non-root container user
- ✅ Error handling without stack traces in production
- ✅ Request logging

---

## 📊 Monitoring

### Logs

Logs are written to stdout/stderr and captured by:
- **Local**: Terminal output
- **Docker**: `docker logs <container>`
- **ECS**: CloudWatch Logs

### Metrics

Monitor these endpoints:
- `/health` - Returns 200 if healthy
- `/ready` - Returns 200 if storage is accessible

### CloudWatch (ECS Deployment)

Automatic metrics:
- CPU utilization
- Memory utilization
- Request count
- Response times
- Error rates

---

## 🚀 Deployment

### AWS ECS Fargate

See main project [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for full deployment guide.

**Quick steps**:
1. Push image to ECR
2. Create ECS task definition
3. Create ECS service
4. Configure ALB
5. Set environment variables via Secrets Manager

---

## 🛠️ Development

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Import and use in `src/server.js`
3. Add authentication middleware if needed
4. Add validation middleware if needed

**Example**:
```javascript
// src/routes/example.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  res.json({ success: true, data: { message: 'Hello' } });
});

export default router;
```

```javascript
// src/server.js
import exampleRouter from './routes/example.js';
app.use('/api/example', exampleRouter);
```

---

## 📚 Dependencies

### Production

- `express` - Web framework
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `helmet` - Security headers
- `jsonwebtoken` - JWT authentication
- `morgan` - HTTP request logger
- `@octokit/rest` - GitHub API client

### Development

- `nodemon` - Auto-reload on file changes

---

## 📝 Default Users

**Username**: `admin`
**Password**: `admin123`
**Role**: `admin`

**⚠️ IMPORTANT**: Change the default password in production by creating a `config/users.json` file in your storage backend.

---

## ❓ Troubleshooting

### Server won't start

- Check `.env` file exists and has required variables
- Verify GITHUB_PAT is valid (if using GitHub storage)
- Check port 8080 is not already in use

### Storage errors

- **GitHub**: Verify PAT token has `repo` scope
- **GitHub**: Check repository exists and is accessible
- **S3**: Verify bucket exists and IAM permissions are correct

### Authentication errors

- Verify JWT_SECRET is set and consistent
- Check token hasn't expired (24h lifetime)
- Ensure `Authorization: Bearer TOKEN` header is correct

### CORS errors

- Set CORS_ORIGIN to match your frontend URL
- Include protocol (http:// or https://)

---

## 🎯 Next Steps

1. **Implement S3 Provider**: Complete `src/storage/S3Provider.js`
2. **Add Tests**: Unit and integration tests
3. **Rate Limiting**: Add rate limiting middleware
4. **Caching**: Add Redis for response caching
5. **WebSockets**: Add real-time features
6. **Pagination**: Add pagination to list endpoints
7. **Search**: Add search functionality

---

**Built with Claude Code** 🤖

For the complete containerized architecture, see the main [README](../README.md).
