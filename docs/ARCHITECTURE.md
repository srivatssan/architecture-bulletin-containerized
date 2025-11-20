# Architecture Bulletin - Detailed Architecture

> Comprehensive architectural design for containerized AWS ECS deployment

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Container Architecture](#container-architecture)
3. [Storage Abstraction Layer](#storage-abstraction-layer)
4. [API Design](#api-design)
5. [Authentication Flow](#authentication-flow)
6. [Data Flow](#data-flow)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Security Considerations](#security-considerations)
10. [Disaster Recovery](#disaster-recovery)

---

## 1. System Overview

### High-Level Architecture

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────┐
│  Application Load Balancer  │
│  • SSL Termination          │
│  • Path-based Routing       │
│  • Health Checks            │
└──────┬────────────┬─────────┘
       │            │
       │            │
┌──────▼───────┐  ┌▼────────────────┐
│  Frontend    │  │  Backend API    │
│  Container   │  │  Container      │
│              │  │                 │
│  • React SPA │  │  • Express.js   │
│  • Nginx     │  │  • REST API     │
│  • Static    │  │  • Auth Logic   │
│    Assets    │  │  • Storage      │
│              │  │    Abstraction  │
└──────────────┘  └────────┬────────┘
                           │
                  ┌────────┴────────┐
                  │  Storage Layer  │
                  │  (Pluggable)    │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │  GitHub   │  │   AWS S3    │  │   Vercel   │
    │ Repository│  │   Bucket    │  │    Blob    │
    └───────────┘  └─────────────┘  └────────────┘
```

### Design Principles

1. **Separation of Concerns:** Frontend and backend are completely decoupled
2. **Storage Agnostic:** Backend can switch storage without code changes
3. **Scalability:** Each container scales independently
4. **Stateless:** Containers are stateless for easy scaling
5. **Configuration-Driven:** Environment variables control behavior
6. **Security First:** No secrets in code, IAM roles for AWS resources

---

## 2. Container Architecture

### Frontend Container

```
┌─────────────────────────────────────────┐
│  Frontend Container (Port 80)           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Nginx Web Server                 │ │
│  │  • Serves static React build      │ │
│  │  • Reverse proxy to backend       │ │
│  │  • Gzip compression               │ │
│  │  • Caching headers                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  React Application                │ │
│  │  • Bundled JavaScript             │ │
│  │  • CSS files                      │ │
│  │  • Static assets                  │ │
│  │  • Service Worker (optional)      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Configuration:                         │
│  • REACT_APP_API_URL                   │
│  • REACT_APP_ENV                       │
│                                         │
└─────────────────────────────────────────┘
```

**Dockerfile Strategy (Multi-stage build):**

```dockerfile
# Stage 1: Build React app
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx runtime
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Benefits:**
- ✅ Small final image (~50MB)
- ✅ No Node.js in production (security)
- ✅ Nginx is production-grade
- ✅ Fast startup time

---

### Backend Container

```
┌──────────────────────────────────────────┐
│  Backend Container (Port 8080)           │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Express.js Server                 │ │
│  │  • REST API endpoints              │ │
│  │  • CORS middleware                 │ │
│  │  • Authentication                  │ │
│  │  • Request validation              │ │
│  │  • Error handling                  │ │
│  │  • Logging                         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Storage Abstraction Layer         │ │
│  │  ┌──────────┐  ┌──────────┐       │ │
│  │  │ GitHub   │  │   S3     │       │ │
│  │  │ Provider │  │ Provider │  ...  │ │
│  │  └──────────┘  └──────────┘       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Business Logic Services           │ │
│  │  • PostService                     │ │
│  │  • AuthService                     │ │
│  │  • NotificationService             │ │
│  │  • ConfigService                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Configuration:                          │
│  • STORAGE_PROVIDER (github/s3/blob)    │
│  • Storage-specific credentials         │
│  • PORT, CORS_ORIGIN, NODE_ENV          │
│                                          │
└──────────────────────────────────────────┘
```

**Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js || exit 1
CMD ["node", "src/server.js"]
```

---

## 3. Storage Abstraction Layer

### Interface Design

All storage providers implement the same interface:

```javascript
class StorageProvider {
  async getJson(path)
  async saveJson(path, data, message, sha)
  async deleteFile(path, sha, message)
  async listDirectory(path)
  async uploadBinary(path, base64Content, message)
  async getBinary(path)
}
```

### Provider Factory Pattern

```javascript
// Storage factory creates correct provider based on config
function createStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER;

  switch (provider) {
    case 'github':
      return new GitHubProvider({
        token: process.env.GITHUB_PAT,
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_DATA_REPO,
      });

    case 's3':
      return new S3Provider({
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
      });

    case 'vercel-blob':
      return new VercelBlobProvider({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
  }
}
```

### Storage Provider Comparison

| Feature | GitHub | AWS S3 | Vercel Blob |
|---------|--------|--------|-------------|
| **Version Control** | ✅ Full Git history | ❌ Versioning available | ❌ No versioning |
| **Cost** | Free (public) or $4/mo | ~$0.023/GB + requests | Pay-as-you-go |
| **Audit Trail** | ✅ Commit messages | ⚠️ CloudTrail logs | ❌ Basic logs |
| **Speed** | ⚠️ API rate limits | ✅ Very fast | ✅ CDN distributed |
| **Scalability** | ⚠️ 1GB file limit | ✅ Unlimited | ✅ Unlimited |
| **Setup** | Simple (PAT token) | Medium (IAM roles) | Simple (API token) |
| **AWS Integration** | ❌ External service | ✅ Native | ❌ External |
| **Collaboration** | ✅ GitHub PR workflow | ❌ Direct access | ❌ Direct access |

**Recommendation for AWS ECS Deployment:**
- **Production:** AWS S3 (native AWS integration, IAM roles, no external dependencies)
- **Development:** GitHub (version control, easy debugging)
- **Vercel Deployments:** Vercel Blob (fast, integrated)

---

## 4. API Design

### RESTful API Endpoints

```
BASE_URL: http://backend-api:8080/api

┌──────────────────────────────────────────────────────────┐
│  HEALTH & STATUS                                         │
├──────────────────────────────────────────────────────────┤
│  GET  /health          - Health check (for ALB)          │
│  GET  /ready           - Readiness check                 │
│  GET  /api/status      - API status & version            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  AUTHENTICATION                                          │
├──────────────────────────────────────────────────────────┤
│  POST /api/auth/login     - Login with credentials       │
│  POST /api/auth/logout    - Logout & invalidate session  │
│  GET  /api/auth/me        - Get current user info        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  POSTS (Bulletins)                                       │
├──────────────────────────────────────────────────────────┤
│  GET    /api/posts              - List all posts         │
│  POST   /api/posts              - Create new post        │
│  GET    /api/posts/:id          - Get single post        │
│  PUT    /api/posts/:id          - Update post            │
│  DELETE /api/posts/:id          - Delete post            │
│  POST   /api/posts/:id/archive  - Archive post           │
│  POST   /api/posts/:id/assign   - Assign architect       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  FILE UPLOADS                                            │
├──────────────────────────────────────────────────────────┤
│  POST /api/uploads/attachments  - Upload topic files     │
│  POST /api/uploads/proof        - Upload proof of work   │
│  GET  /api/uploads/:path        - Download file          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CONFIGURATION                                           │
├──────────────────────────────────────────────────────────┤
│  GET  /api/config/architects    - List architects        │
│  GET  /api/config/statuses      - List statuses          │
│  GET  /api/config/users         - List users (admin)     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                                           │
├──────────────────────────────────────────────────────────┤
│  GET  /api/notifications        - Get user notifications │
│  PUT  /api/notifications/:id    - Mark as read           │
└──────────────────────────────────────────────────────────┘
```

### Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-19T23:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": { "field": "title" }
  },
  "timestamp": "2025-11-19T23:00:00Z"
}
```

---

## 5. Authentication Flow

```
┌─────────┐                ┌──────────┐               ┌──────────┐
│ Client  │                │ Backend  │               │ Storage  │
└────┬────┘                └────┬─────┘               └────┬─────┘
     │                          │                          │
     │ POST /api/auth/login     │                          │
     │ { username, password }   │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ GET users.json           │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ { users: [...] }         │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Validate credentials     │
     │                          │ Create session token     │
     │                          │                          │
     │ { token, user }          │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ Store token in           │                          │
     │ localStorage             │                          │
     │                          │                          │
     │ All future requests      │                          │
     │ include token in header  │                          │
     │                          │                          │
     │ GET /api/posts           │                          │
     │ Authorization: Bearer    │                          │
     ├─────────────────────────>│                          │
     │                          │ Verify token             │
     │                          │ Extract user info        │
     │                          │ Process request          │
     │                          │                          │
```

**Session Token Format (JWT):**
```javascript
{
  "sub": "admin",           // username
  "role": "admin",          // user role
  "iat": 1700000000,        // issued at
  "exp": 1700086400         // expires at (24h)
}
```

**No database needed** - tokens are self-contained (JWT)

---

## 6. Data Flow

### Create Post Flow

```
User fills form → Frontend validates → POST /api/posts → Backend validates
                                                              ↓
                                                    Storage Provider saves
                                                              ↓
                                          ┌─────────────────┴────────────────┐
                                          │                                  │
                                    GitHub Commit                     S3 PutObject
                                 "Create post-0001"              posts/post-0001.json
                                          │                                  │
                                          └─────────────────┬────────────────┘
                                                              ↓
                                                    Return success + post ID
                                                              ↓
                                                    Frontend updates UI
                                                              ↓
                                                    User sees new post
```

### Read Posts Flow

```
User visits dashboard → Frontend requests → GET /api/posts → Backend calls storage
                                                                      ↓
                                                          Storage Provider fetches
                                                                      ↓
                                                    ┌─────────────────┴────────────┐
                                                    │                              │
                                              List directory              List S3 prefix
                                              Fetch each file             Batch get objects
                                                    │                              │
                                                    └─────────────────┬────────────┘
                                                                      ↓
                                                          Parse JSON, sort by date
                                                                      ↓
                                                          Return posts array
                                                                      ↓
                                                          Frontend renders cards
```

---

## 7. Deployment Architecture (AWS ECS)

### ECS Task Definitions

**Frontend Task:**
```json
{
  "family": "architecture-bulletin-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [{
    "name": "frontend",
    "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/arch-bulletin-frontend:latest",
    "portMappings": [{ "containerPort": 80 }],
    "environment": [
      { "name": "REACT_APP_API_URL", "value": "https://api.your-domain.com" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/architecture-bulletin-frontend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

**Backend Task:**
```json
{
  "family": "architecture-bulletin-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "taskRoleArn": "arn:aws:iam::<account>:role/ecs-task-role",
  "containerDefinitions": [{
    "name": "backend",
    "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/arch-bulletin-backend:latest",
    "portMappings": [{ "containerPort": 8080 }],
    "secrets": [
      {
        "name": "GITHUB_PAT",
        "valueFrom": "arn:aws:secretsmanager:<region>:<account>:secret:github-pat"
      }
    ],
    "environment": [
      { "name": "STORAGE_PROVIDER", "value": "s3" },
      { "name": "AWS_S3_BUCKET", "value": "architecture-bulletin-data" }
    ]
  }]
}
```

### Network Architecture

```
┌─────────────────── VPC ───────────────────┐
│                                            │
│  ┌──────── Public Subnets ──────────────┐ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │  Application Load Balancer      │ │ │
│  │  │  • Public-facing                │ │ │
│  │  │  • SSL/TLS termination          │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  └───────────────┬───────────────────────┘ │
│                  │                          │
│  ┌───────────────▼─ Private Subnets ─────┐ │
│  │                                        │ │
│  │  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │  Frontend    │  │  Backend      │  │ │
│  │  │  ECS Tasks   │  │  ECS Tasks    │  │ │
│  │  │              │  │               │  │ │
│  │  └──────────────┘  └───────┬───────┘  │ │
│  │                            │          │ │
│  └────────────────────────────┼──────────┘ │
│                               │            │
│  ┌────────────────────────────▼──────────┐ │
│  │  NAT Gateway (for outbound traffic)  │ │
│  │  • Backend → GitHub API               │ │
│  │  • Backend → AWS S3                   │ │
│  └───────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

---

## 8. Scalability & Performance

### Auto-Scaling Configuration

**Frontend:**
- **Min:** 1 task
- **Max:** 4 tasks
- **Scale up:** CPU > 70% for 2 minutes
- **Scale down:** CPU < 30% for 5 minutes

**Backend:**
- **Min:** 2 tasks (for availability)
- **Max:** 8 tasks
- **Scale up:** RequestCount > 1000/min OR CPU > 60%
- **Scale down:** RequestCount < 200/min AND CPU < 30%

### Performance Optimizations

1. **Frontend:**
   - Code splitting (React.lazy)
   - Tree shaking (Vite)
   - Gzip compression (Nginx)
   - Browser caching headers
   - Image optimization

2. **Backend:**
   - Connection pooling
   - Response caching (Redis optional)
   - Async/await patterns
   - Batch operations for storage
   - Request rate limiting

---

## 9. Security Considerations

### Data in Transit
- ✅ HTTPS only (ALB terminates SSL)
- ✅ Internal communication over private network
- ✅ TLS 1.2+ only

### Data at Rest
- ✅ S3 encryption at rest (AWS managed keys)
- ✅ Secrets stored in AWS Secrets Manager
- ✅ No secrets in container images

### Access Control
- ✅ IAM roles for ECS tasks (not access keys)
- ✅ Least privilege principle
- ✅ Security groups restrict traffic
- ✅ CORS configured properly

### Container Security
- ✅ Non-root user in containers
- ✅ Minimal base images (Alpine)
- ✅ ECR image scanning
- ✅ No sensitive data in layers

---

## 10. Disaster Recovery

### Backup Strategy

**GitHub Storage:**
- ✅ Git version control = automatic backup
- ✅ Can clone repository anytime
- ✅ Point-in-time recovery via commits

**S3 Storage:**
- ✅ S3 versioning enabled
- ✅ Cross-region replication (optional)
- ✅ Lifecycle policies for old versions

**Database (if added):**
- ✅ RDS automated backups
- ✅ Daily snapshots retained 7 days

### Recovery Procedures

**Container Failure:**
1. ECS automatically restarts failed tasks
2. Health checks detect unhealthy tasks
3. New task launched within 30 seconds

**Complete Service Outage:**
1. Restore from Terraform state
2. Redeploy containers from ECR
3. Point to backup data store
4. RTO: ~15 minutes
5. RPO: ~5 minutes (last commit/save)

---

## Summary

This architecture provides:

✅ **Production-Ready** - Battle-tested patterns
✅ **Scalable** - Auto-scaling containers
✅ **Flexible** - Pluggable storage backends
✅ **Secure** - AWS best practices
✅ **Cost-Effective** - Pay for what you use
✅ **Maintainable** - Clear separation of concerns
✅ **Observable** - CloudWatch monitoring
✅ **Recoverable** - Disaster recovery plan

**Next:** Read [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deployment guide
