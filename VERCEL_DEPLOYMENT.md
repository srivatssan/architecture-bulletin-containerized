# Vercel Deployment Guide

> Step-by-step guide to deploy Architecture Bulletin to Vercel as two separate apps

---

## 📋 Overview

You'll deploy two separate Vercel apps:
1. **Backend API** - Serverless functions for the REST API
2. **Frontend** - React SPA served by Vercel's CDN

---

## 🚀 Deployment Steps

### Prerequisites

✅ Vercel account (sign up at https://vercel.com)
✅ Vercel CLI installed: `npm install -g vercel`
✅ GitHub repository created (we'll do this next)

---

## Step 1: Push to GitHub

### 1.1 Create .gitignore

First, let's create a root .gitignore (already created in subdirectories):

```bash
cd /Users/srivatssan/Agentic-Workspace/Personal-App-Builder/Architecture-Bulletin-Containerized
```

### 1.2 Initialize Git Repository

```bash
# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Architecture Bulletin Containerized

- Backend API with Express.js
- Frontend React app with Vite
- Storage abstraction layer (GitHub/S3/Vercel Blob)
- Vercel deployment configuration
- Docker configuration for container deployment"
```

### 1.3 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `architecture-bulletin-containerized` (or your choice)
3. Description: "Architecture Bulletin - Containerized microservices with Vercel deployment"
4. Choose Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 1.4 Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/architecture-bulletin-containerized.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend API to Vercel

### 2.1 Navigate to Backend

```bash
cd backend
```

### 2.2 Deploy to Vercel

```bash
# Login to Vercel (if not already)
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: architecture-bulletin-api (or your choice)
# - Directory: ./
# - Override settings? N
```

### 2.3 Set Environment Variables

After deployment, set environment variables in Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select your backend project (e.g., `architecture-bulletin-api`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `STORAGE_PROVIDER` | `github` | Production, Preview, Development |
| `GITHUB_PAT` | `your_github_pat_token` | Production, Preview, Development |
| `GITHUB_REPO_OWNER` | `srivatssan` | Production, Preview, Development |
| `GITHUB_DATA_REPO` | `architecture-bulletin-data` | Production, Preview, Development |
| `GITHUB_BRANCH` | `main` | Production, Preview, Development |
| `JWT_SECRET` | `your-super-secret-jwt-key` | Production, Preview, Development |
| `CORS_ORIGIN` | `*` (temporary, update after frontend deploy) | Production, Preview, Development |

**Important**: Click "Add" for each variable, and check all three environment boxes (Production, Preview, Development).

### 2.4 Redeploy with Environment Variables

```bash
# Redeploy to apply environment variables
vercel --prod
```

### 2.5 Note Your Backend URL

After deployment, you'll get a URL like:
```
https://architecture-bulletin-api.vercel.app
```

**Save this URL** - you'll need it for the frontend configuration.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Navigate to Frontend

```bash
cd ../frontend
```

### 3.2 Update Environment Variable

Create `.env.production`:

```env
VITE_API_URL=https://your-backend-url.vercel.app
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Step 2.5.

### 3.3 Deploy to Vercel

```bash
# Deploy
vercel

# When prompted:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: architecture-bulletin (or your choice)
# - Directory: ./
# - Override settings? N
```

### 3.4 Set Environment Variables

1. Go to Vercel dashboard → Select frontend project
2. Go to **Settings** → **Environment Variables**
3. Add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app` | Production, Preview, Development |

### 3.5 Deploy to Production

```bash
vercel --prod
```

### 3.6 Note Your Frontend URL

You'll get a URL like:
```
https://architecture-bulletin.vercel.app
```

---

## Step 4: Update CORS Configuration

Now that you have your frontend URL, update backend CORS:

### 4.1 Update Backend Environment Variable

1. Go to Vercel dashboard → Backend project
2. Go to **Settings** → **Environment Variables**
3. Find `CORS_ORIGIN` variable
4. Edit and change from `*` to your frontend URL:
   ```
   https://architecture-bulletin.vercel.app
   ```
5. Save

### 4.2 Redeploy Backend

```bash
cd ../backend
vercel --prod
```

---

## Step 5: Test Your Deployment

### 5.1 Test Backend API

```bash
# Health check
curl https://your-backend-url.vercel.app/api/health

# Status
curl https://your-backend-url.vercel.app/api/status
```

### 5.2 Test Frontend

1. Open your frontend URL in browser
2. You should see the login page
3. Login with: `admin` / `admin123`
4. Test creating a post
5. Test all features

---

## 🔧 Configuration Files Reference

### Backend (`backend/vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### Frontend (`frontend/vercel.json`)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 📝 Environment Variables Summary

### Backend Required Variables

```env
STORAGE_PROVIDER=github
GITHUB_PAT=your_token
GITHUB_REPO_OWNER=srivatssan
GITHUB_DATA_REPO=architecture-bulletin-data
GITHUB_BRANCH=main
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend Required Variables

```env
VITE_API_URL=https://your-backend-url.vercel.app
```

---

## 🚀 Alternative: Deploy via Vercel Dashboard

Instead of CLI, you can deploy via the Vercel dashboard:

### Backend Deployment (Dashboard)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
5. Add environment variables (same as Step 2.3)
6. Click "Deploy"

### Frontend Deployment (Dashboard)

1. Go to https://vercel.com/new (again)
2. Import the same GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (same as Step 3.4)
5. Click "Deploy"

---

## 🔄 Continuous Deployment

Both apps will auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys both apps
```

**Preview Deployments**: Every git push to non-main branches creates preview deployments.

---

## 🎯 Custom Domains (Optional)

### Add Custom Domain to Frontend

1. Go to Vercel dashboard → Frontend project
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `bulletin.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update backend `CORS_ORIGIN` to match

### Add Custom Domain to Backend

1. Go to Vercel dashboard → Backend project
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update frontend `VITE_API_URL` to match
5. Redeploy frontend

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Module not found"**
- Check that `api/index.js` exists
- Verify vercel.json is correctly configured
- Check build logs in Vercel dashboard

**Error: "Storage provider not working"**
- Verify environment variables are set
- Check `GITHUB_PAT` is valid
- Test locally first: `vercel dev`

**CORS Errors**
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Include protocol (https://)
- No trailing slash

### Frontend Issues

**Error: "Failed to fetch"**
- Check `VITE_API_URL` is correct
- Verify backend is deployed and healthy
- Check browser console for exact error

**Blank Page**
- Check build logs in Vercel dashboard
- Verify `dist` directory is being created
- Check for console errors in browser

**Routes Not Working**
- Verify `vercel.json` has rewrite rules
- Check that it's redirecting to index.html

### Environment Variables Not Working

- Environment variables must be set in Vercel dashboard
- Changes require redeployment
- Check all three environments are selected
- For Vite variables, must start with `VITE_`

---

## 💰 Cost Estimate

### Vercel Hobby Plan (Free)

- ✅ 2 projects (frontend + backend)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function executions: 100 GB-Hrs
- ✅ Custom domains supported

**For small usage**: $0/month

### Vercel Pro Plan ($20/month)

If you exceed free tier:
- 1 TB bandwidth/month
- 1000 GB-Hrs serverless
- Team collaboration features

---

## 📊 Monitoring

### View Logs

**Backend Logs**:
1. Vercel dashboard → Backend project
2. Click on deployment
3. View "Functions" tab
4. Click on any function to see logs

**Frontend Logs**:
1. Vercel dashboard → Frontend project
2. View build logs

### Analytics

Vercel provides:
- Request analytics
- Function execution time
- Error rates
- Bandwidth usage

Access in: Dashboard → Project → Analytics

---

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Set specific CORS_ORIGIN (not `*`)
- [ ] Use environment variables for all secrets
- [ ] Enable Vercel's security headers
- [ ] Use HTTPS only (automatic on Vercel)
- [ ] Rotate GitHub PAT regularly
- [ ] Review Vercel access logs periodically

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] Environment variables documented
- [ ] GitHub repository created
- [ ] Code pushed to GitHub

### Backend Deployment
- [ ] Backend deployed to Vercel
- [ ] Environment variables set
- [ ] Health endpoint working
- [ ] API endpoints responding
- [ ] Storage provider connected

### Frontend Deployment
- [ ] Frontend deployed to Vercel
- [ ] VITE_API_URL configured
- [ ] Login page loads
- [ ] Can authenticate
- [ ] Can create/read/update/delete posts

### Post-Deployment
- [ ] CORS configured correctly
- [ ] Custom domains added (if applicable)
- [ ] Monitoring set up
- [ ] Team access configured
- [ ] Documentation updated with URLs

---

## 📞 Support

### Vercel Documentation
- General: https://vercel.com/docs
- Node.js: https://vercel.com/docs/functions/serverless-functions/runtimes/node-js
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

### Project Documentation
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Backend API: `https://your-backend.vercel.app`
- ✅ Frontend App: `https://your-frontend.vercel.app`
- ✅ Automatic deployments on git push
- ✅ Preview deployments for branches
- ✅ SSL/HTTPS by default
- ✅ Global CDN distribution

**Your Architecture Bulletin is now live!** 🚀

---

*Last Updated: 2025-11-19*
