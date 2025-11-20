# Quick Start: Vercel Deployment

> **5-minute guide** to deploy Architecture Bulletin to Vercel

---

## ✅ What's Ready

- ✅ Git repository initialized
- ✅ Initial commit created (86 files)
- ✅ Vercel configurations added
- ✅ Backend serverless function created
- ✅ All documentation complete

---

## 🚀 Next Steps (Do These Now)

### Step 1: Create GitHub Repository (2 minutes)

1. Go to https://github.com/new
2. **Repository name**: `architecture-bulletin-containerized`
3. **Description**: "Architecture Bulletin - Containerized with Vercel deployment"
4. Choose **Public** or **Private**
5. **DO NOT** check "Add README" (we already have one)
6. Click **"Create repository"**

### Step 2: Push to GitHub (1 minute)

```bash
# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/architecture-bulletin-containerized.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy Backend to Vercel (5 minutes)

#### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `architecture-bulletin-containerized` repository
4. Configure:
   - **Project Name**: `architecture-bulletin-api`
   - **Framework Preset**: Other
   - **Root Directory**: `backend` ⬅️ IMPORTANT
   - Leave Build/Output commands empty
5. Click **"Environment Variables"** and add these:

   ```
   STORAGE_PROVIDER = github
   GITHUB_PAT = your_github_pat_token_here
   GITHUB_REPO_OWNER = srivatssan
   GITHUB_DATA_REPO = architecture-bulletin-data
   GITHUB_BRANCH = main
   JWT_SECRET = your-super-secret-change-this
   CORS_ORIGIN = *
   ```

   ⚠️ **Check all three boxes** (Production, Preview, Development) for each variable

6. Click **"Deploy"**
7. **Save your backend URL**: `https://architecture-bulletin-api.vercel.app`

#### Option B: Vercel CLI

```bash
cd backend
vercel login
vercel

# Follow prompts, then set environment variables in dashboard
```

### Step 4: Deploy Frontend to Vercel (3 minutes)

1. Go to https://vercel.com/new (again)
2. Import the **same repository**
3. Configure:
   - **Project Name**: `architecture-bulletin`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ⬅️ IMPORTANT
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **"Environment Variables"** and add:

   ```
   VITE_API_URL = https://your-backend-url.vercel.app
   ```

   Replace with your actual backend URL from Step 3

   ⚠️ **Check all three boxes** (Production, Preview, Development)

5. Click **"Deploy"**
6. **Save your frontend URL**: `https://architecture-bulletin.vercel.app`

### Step 5: Update CORS (2 minutes)

1. Go to Vercel dashboard → **Backend project**
2. **Settings** → **Environment Variables**
3. Find `CORS_ORIGIN` and click **Edit**
4. Change from `*` to your frontend URL:
   ```
   https://architecture-bulletin.vercel.app
   ```
5. **Save**
6. Go to **Deployments** → Click **"Redeploy"** on latest deployment

### Step 6: Test! (1 minute)

1. Open your frontend URL
2. Login with: `admin` / `admin123`
3. Create a test post
4. ✅ Done!

---

## 📝 Environment Variables Reference

### Backend (architecture-bulletin-api)

```env
STORAGE_PROVIDER=github
GITHUB_PAT=your_github_personal_access_token
GITHUB_REPO_OWNER=srivatssan
GITHUB_DATA_REPO=architecture-bulletin-data
GITHUB_BRANCH=main
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://architecture-bulletin.vercel.app
```

### Frontend (architecture-bulletin)

```env
VITE_API_URL=https://architecture-bulletin-api.vercel.app
```

---

## ✅ Verification Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Backend health endpoint works: `/api/health`
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set
- [ ] CORS updated with frontend URL
- [ ] Can access login page
- [ ] Can login with admin/admin123
- [ ] Can create a post
- [ ] Can view posts list

---

## 🐛 Quick Troubleshooting

**Can't login?**
- Check backend `/api/health` endpoint
- Verify `JWT_SECRET` is set in backend
- Check browser console for errors

**CORS error?**
- Update backend `CORS_ORIGIN` to exact frontend URL
- Include `https://`
- No trailing slash
- Redeploy backend

**Build failed?**
- Check Root Directory is set correctly
  - Backend: `backend`
  - Frontend: `frontend`
- Check environment variables are set
- View build logs in Vercel dashboard

---

## 📚 Full Documentation

For detailed instructions, see:
- **VERCEL_DEPLOYMENT.md** - Complete deployment guide
- **backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend documentation

---

## 🎉 Success!

Once deployed:
- **Frontend**: https://architecture-bulletin.vercel.app
- **Backend**: https://architecture-bulletin-api.vercel.app
- **Auto-deploys**: Every git push
- **Free tier**: 100 GB bandwidth, unlimited deployments

---

**Total time**: ~15 minutes for complete deployment 🚀

*Created: 2025-11-19*
