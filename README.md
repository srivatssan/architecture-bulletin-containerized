# Architecture Bulletin - Containerized Deployment

> Production-ready containerized architecture for AWS ECS deployment

## 🏗️ Architecture Overview

This is a **microservices architecture** with separate containers for frontend and backend, designed for AWS ECS deployment with configurable storage backends.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS CLOUD                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Application Load Balancer (ALB)                        │  │
│  │  • SSL/TLS Termination                                  │  │
│  │  • Route /api/* → Backend Container                     │  │
│  │  • Route /* → Frontend Container                        │  │
│  └────────────┬─────────────────────────┬──────────────────┘  │
│               │                         │                      │
│  ┌────────────▼──────────┐  ┌──────────▼─────────────────┐   │
│  │  ECS Service:         │  │  ECS Service:              │   │
│  │  FRONTEND             │  │  BACKEND                   │   │
│  │                       │  │                            │   │
│  │  • React SPA          │  │  • Express.js API          │   │
│  │  • Nginx              │  │  • Storage Abstraction     │   │
│  │  • Static Assets      │  │  • Authentication          │   │
│  │  • Auto-scaling       │  │  • Business Logic          │   │
│  │                       │  │  • Auto-scaling            │   │
│  └───────────────────────┘  └──────────┬─────────────────┘   │
│                                        │                      │
│                                        │                      │
│  ┌─────────────────────────────────────▼──────────────────┐  │
│  │         STORAGE BACKEND (Configurable)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │  │
│  │  │   GitHub   │  │   AWS S3   │  │  Vercel Blob   │   │  │
│  │  │ Repository │  │   Bucket   │  │    Storage     │   │  │
│  │  └────────────┘  └────────────┘  └────────────────┘   │  │
│  │                                                         │  │
│  │  Switch via environment variable: STORAGE_PROVIDER     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
Architecture-Bulletin-Containerized/
├── frontend/                    # Frontend React Application
│   ├── src/                    # React source code
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Frontend container image
│   ├── nginx.conf              # Nginx configuration
│   ├── package.json
│   └── .env.example
│
├── backend/                     # Backend API Server
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── storage/           # Storage abstraction layer
│   │   ├── middleware/        # Express middleware
│   │   └── server.js          # Express server entry point
│   ├── Dockerfile             # Backend container image
│   ├── package.json
│   └── .env.example
│
├── infrastructure/              # Infrastructure as Code
│   ├── terraform/             # Terraform configs for AWS
│   ├── cloudformation/        # Alternative: CloudFormation templates
│   └── docker-compose.yml     # Local development setup
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md        # Detailed architecture design
│   ├── DEPLOYMENT.md          # AWS ECS deployment guide
│   ├── API.md                 # API documentation
│   ├── DEVELOPMENT.md         # Local development guide
│   └── STORAGE_BACKENDS.md    # Storage configuration guide
│
└── README.md                    # This file
```

---

## 🎯 Key Features

### Frontend Container
- **React 18.3** single-page application
- **Nginx** web server for production
- **Optimized build** with code splitting
- **Environment-based configuration**
- **Health checks** for ECS

### Backend Container
- **Express.js** REST API server
- **Storage abstraction layer** (GitHub/S3/Vercel Blob)
- **Authentication middleware**
- **Request validation**
- **Error handling & logging**
- **Health & readiness endpoints**
- **CORS configuration**

### Storage Backends (Configurable)
1. **GitHub Repository** - Version controlled, free, audit trail
2. **AWS S3** - Scalable, durable, integrated with AWS
3. **Vercel Blob** - Fast CDN, simple, pay-as-you-go

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Navigate to project
cd Architecture-Bulletin-Containerized

# 2. Start all services with Docker Compose
docker-compose up

# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# API Docs: http://localhost:8080/api/docs
```

### Production Deployment (AWS ECS)

```bash
# 1. Build and push Docker images
./scripts/build-and-push.sh

# 2. Deploy to AWS ECS
cd infrastructure/terraform
terraform init
terraform apply

# 3. Access application
# URL will be output by Terraform (ALB DNS name)
```

Detailed guides in `/docs/`

---

## 🔧 Configuration

### Environment Variables

**Frontend Container:**
```env
REACT_APP_API_URL=http://backend:8080
REACT_APP_ENV=production
```

**Backend Container:**
```env
# Storage Configuration
STORAGE_PROVIDER=github           # or 's3' or 'vercel-blob'

# GitHub Storage (if STORAGE_PROVIDER=github)
GITHUB_PAT=your_pat_token
GITHUB_REPO_OWNER=your_username
GITHUB_DATA_REPO=architecture-bulletin-data
GITHUB_BRANCH=main

# S3 Storage (if STORAGE_PROVIDER=s3)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Vercel Blob (if STORAGE_PROVIDER=vercel-blob)
BLOB_READ_WRITE_TOKEN=your_blob_token

# Server Configuration
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

---

## 📊 Container Specifications

### Frontend Container

**Base Image:** `node:18-alpine` (build) → `nginx:alpine` (runtime)
**Size:** ~50MB (compressed)
**Ports:** `80`
**CPU:** 256 units (0.25 vCPU)
**Memory:** 512 MB
**Auto-scaling:** 1-4 tasks based on CPU/Memory

### Backend Container

**Base Image:** `node:18-alpine`
**Size:** ~200MB (compressed)
**Ports:** `8080`
**CPU:** 512 units (0.5 vCPU)
**Memory:** 1024 MB
**Auto-scaling:** 2-8 tasks based on request count

---

## 🔐 Security

- **Secrets Management:** AWS Secrets Manager for sensitive credentials
- **IAM Roles:** Task-specific IAM roles (no hardcoded credentials)
- **Network Isolation:** Private subnets for containers
- **HTTPS Only:** ALB handles SSL/TLS termination
- **Security Groups:** Restrict traffic between containers
- **Container Scanning:** ECR image scanning enabled

---

## 📈 Monitoring & Logging

- **CloudWatch Logs:** Centralized logging from all containers
- **CloudWatch Metrics:** CPU, Memory, Request Count
- **CloudWatch Alarms:** Auto-scaling triggers & alerts
- **Health Checks:** ALB health checks on `/health` endpoint
- **X-Ray Tracing:** Distributed tracing (optional)

---

## 💰 Cost Estimate (AWS)

**Small Deployment (1 frontend, 2 backend tasks):**
- ECS Fargate: ~$30-40/month
- ALB: ~$20/month
- ECR Storage: ~$1/month
- Data Transfer: ~$5-10/month
- **Total: ~$55-70/month**

**Storage Costs:**
- GitHub: Free (public repo) or $4/month (private)
- S3: ~$0.50/month for 10GB + requests
- Vercel Blob: Pay-as-you-go, ~$1/month for small usage

---

## 🔄 CI/CD Pipeline

```
GitHub Push
    ↓
GitHub Actions
    ↓
Build Docker Images
    ↓
Push to Amazon ECR
    ↓
Update ECS Service
    ↓
Rolling Deployment
    ↓
Health Checks Pass
    ↓
✅ Deployment Complete
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Detailed system architecture
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Step-by-step AWS ECS deployment
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local development setup
- **[API.md](./docs/API.md)** - API endpoint documentation
- **[STORAGE_BACKENDS.md](./docs/STORAGE_BACKENDS.md)** - Storage configuration guide

---

## 🛠️ Technologies

**Frontend:**
- React 18.3
- React Router v6
- Tailwind CSS
- Nginx

**Backend:**
- Node.js 18
- Express.js
- Storage SDKs (Octokit, AWS SDK, Vercel Blob)

**Infrastructure:**
- AWS ECS (Fargate)
- AWS Application Load Balancer
- AWS ECR (Container Registry)
- AWS CloudWatch
- Terraform (IaC)

**Development:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

---

## 🎯 Next Steps

1. **Read Documentation:**
   - Start with `docs/ARCHITECTURE.md`
   - Then `docs/DEVELOPMENT.md` for local setup

2. **Set Up Local Development:**
   - Configure environment variables
   - Run `docker-compose up`
   - Test the application locally

3. **Deploy to AWS:**
   - Follow `docs/DEPLOYMENT.md`
   - Configure AWS credentials
   - Run Terraform to provision infrastructure

4. **Configure Storage:**
   - Choose storage backend (GitHub/S3/Vercel)
   - Follow `docs/STORAGE_BACKENDS.md` for setup

---

## 📞 Support

For issues and questions, refer to the documentation in the `/docs` folder.

---

**Built with Claude Code** 🤖

*Containerized microservices architecture designed for production AWS ECS deployment*
