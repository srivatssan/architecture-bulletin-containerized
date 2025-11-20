# Architecture Bulletin - Frontend

> React 18 single-page application with Vite, Tailwind CSS, and backend API integration

---

## 🏗️ Architecture

This frontend is a React SPA that communicates with the backend REST API. Key features:

- **React 18.3** with modern hooks and context API
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **React Router** for client-side routing
- **API Client** for backend communication
- **Docker** multi-stage build for production
- **Nginx** for production serving

---

## 📦 Project Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── apiClient.js          # Backend API client
│   ├── contexts/
│   │   ├── AuthContext.jsx       # Authentication state
│   │   └── PostsContext.jsx      # Posts state management
│   ├── pages/
│   │   ├── LoginPage.jsx         # Login page
│   │   ├── DashboardPage.jsx     # Main dashboard
│   │   └── ...                   # Other pages
│   ├── components/               # Reusable components
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── App.jsx                   # Root component
│   └── main.jsx                  # Application entry
├── public/                       # Static assets
├── Dockerfile                    # Production container
├── nginx.conf                    # Nginx configuration
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── package.json                 # Dependencies
```

---

## 🚀 Quick Start

### Local Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Application will run at http://localhost:3000
```

**Note**: Make sure the backend API is running on http://localhost:8080

### Docker Build

```bash
# Build container
docker build -t architecture-bulletin-frontend .

# Run container
docker run -p 3000:80 \
  -e VITE_API_URL=http://localhost:8080 \
  architecture-bulletin-frontend
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:8080
```

**Important**: Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

### API Client

The API client (`src/services/apiClient.js`) automatically:
- Adds JWT token to requests
- Handles authentication headers
- Provides consistent error handling
- Stores/retrieves tokens from localStorage

---

## 🔐 Authentication

### Login Flow

1. User enters username/password
2. Frontend calls `/api/auth/login`
3. Backend returns JWT token
4. Token stored in localStorage
5. Token included in all subsequent API requests

### Default Credentials

**Username**: `admin`
**Password**: `admin123`

---

## 📡 API Integration

### API Client Usage

```javascript
import apiClient from '../services/apiClient';

// Get all posts
const response = await apiClient.getPosts();
const posts = response.data;

// Create post
const newPost = await apiClient.createPost({
  title: 'New Topic',
  description: 'Description here',
  concernedParties: ['Team A', 'Team B']
});

// Update post
await apiClient.updatePost(postId, { status: 'status-resolved' });
```

### Available Methods

**Authentication:**
- `login(username, password)`
- `logout()`
- `getCurrentUser()`

**Posts:**
- `getPosts()`
- `getPost(id)`
- `createPost(postData)`
- `updatePost(id, updates)`
- `deletePost(id)`
- `archivePost(id, isArchived)`
- `assignArchitects(id, architects)`

**Configuration:**
- `getArchitects()`
- `getStatuses()`
- `getUsers()` (admin only)

**File Uploads:**
- `uploadAttachment(postId, filename, content)`
- `uploadProof(postId, filename, content)`
- `downloadFile(type, postId, filename)`
- `deleteFile(type, postId, filename)`

---

## 🎨 Styling

### Tailwind CSS

The application uses Tailwind CSS for styling:

```javascript
// Example component
<div className="bg-white rounded-lg shadow-lg p-6">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <p className="text-gray-600 mt-2">Description</p>
</div>
```

### Custom Styles

Additional custom styles can be added in `src/index.css`.

---

## 🐳 Docker Deployment

### Multi-Stage Build

The Dockerfile uses a multi-stage build:

**Stage 1 - Builder:**
- Uses Node.js to build the React app
- Runs `npm run build`
- Creates optimized production bundle

**Stage 2 - Production:**
- Uses Nginx Alpine (minimal size)
- Copies built files from Stage 1
- Serves static files efficiently

### Build Arguments

```bash
docker build \
  --build-arg VITE_API_URL=https://api.your-domain.com \
  -t architecture-bulletin-frontend .
```

### Container Size

- **Final Image**: ~50MB (compressed)
- **Nginx Alpine**: Very lightweight
- **No Node.js** in production image

---

## 📊 Build & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build

# Output in dist/ directory
```

### Preview Production Build

```bash
npm run preview
```

---

## 🔒 Security

### Client-Side Security

- ✅ JWT tokens stored in localStorage
- ✅ Tokens automatically included in API requests
- ✅ Automatic token refresh on page load
- ✅ Expired tokens handled gracefully
- ✅ Protected routes require authentication
- ✅ HTTPS enforced in production (via nginx)

### Headers

Nginx adds security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

---

## 🧪 Testing

### Manual Testing

1. Start backend API: `cd ../backend && npm start`
2. Start frontend: `npm run dev`
3. Open http://localhost:3000
4. Login with admin/admin123
5. Test CRUD operations

### E2E Testing

Integration tests can be added using:
- Playwright
- Cypress
- Vitest + Testing Library

---

## 🚀 Performance

### Optimizations

- ✅ Code splitting with React.lazy
- ✅ Tree shaking (Vite)
- ✅ Gzip compression (Nginx)
- ✅ Asset caching (1 year for static assets)
- ✅ No cache for index.html
- ✅ Minified production build

### Bundle Size

Target bundle sizes:
- Main bundle: <200KB (gzipped)
- Vendor bundle: <150KB (gzipped)
- CSS: <50KB (gzipped)

---

## 🔄 State Management

### Context API

The app uses React Context for state management:

**AuthContext** - Authentication state:
- `user` - Current user object
- `token` - JWT token
- `isAuthenticated` - Boolean auth status
- `login()` - Login function
- `logout()` - Logout function

**PostsContext** - Posts state:
- `posts` - All posts array
- `filteredPosts` - Filtered posts
- `selectedPost` - Current post
- `fetchPosts()` - Fetch all posts
- `createPost()` - Create new post
- `updatePost()` - Update post
- `deletePost()` - Delete post

---

## 🛠️ Development

### Hot Module Replacement

Vite provides instant HMR during development:
- Changes reflect immediately
- No full page refresh needed
- State preserved across updates

### ESLint

Code linting:
```bash
npm run lint
```

### Format Code

```bash
npm run format
```

---

## 📦 Dependencies

### Production Dependencies

```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.20.0"
}
```

### Development Dependencies

```json
{
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "@vitejs/plugin-react": "^4.2.0"
}
```

---

## 🚦 Routes

```javascript
/ - Login page
/dashboard - Main dashboard (protected)
/posts/:id - Post detail page (protected)
/control-panel - Admin panel (protected, admin only)
/archive - Archived posts (protected)
```

---

## 🎯 Next Steps

1. **Add Tests**: Write unit and integration tests
2. **Error Boundary**: Add React error boundaries
3. **Loading States**: Improve loading UX
4. **Offline Support**: Add service worker
5. **Analytics**: Add usage tracking
6. **Accessibility**: ARIA labels and keyboard navigation
7. **Internationalization**: Multi-language support

---

## 📞 Troubleshooting

### CORS Errors

If you see CORS errors:
1. Check backend `CORS_ORIGIN` is set correctly
2. Ensure frontend URL matches CORS origin
3. Check browser console for exact error

### API Connection Failed

1. Verify backend is running on port 8080
2. Check `VITE_API_URL` in `.env`
3. Test backend health: `curl http://localhost:8080/health`

### Login Not Working

1. Check network tab in browser dev tools
2. Verify credentials (admin/admin123)
3. Check backend logs for errors
4. Ensure JWT_SECRET is set in backend

### Build Errors

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf .vite`
3. Check Node.js version (requires 18+)

---

## 📚 Resources

- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Router**: https://reactrouter.com/
- **Nginx**: https://nginx.org/en/docs/

---

**Built with Claude Code** 🤖

For the complete containerized architecture, see the main [README](../README.md).
