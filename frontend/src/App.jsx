import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import { APP_MODE, GITHUB_REPO, ROUTES } from './utils/constants';
import { initializeOctokit } from './services/githubDataService';

// Page components (will be created)
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import PostDetailPage from './pages/PostDetailPage';
import ControlPanelPage from './pages/ControlPanelPage';
import ArchivePage from './pages/ArchivePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route component
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  // Use dynamic basename from Vite config
  const basename = import.meta.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash

  // Initialize GitHub Octokit if in GitHub mode
  useEffect(() => {
    if (APP_MODE === 'github' && GITHUB_REPO.PAT) {
      try {
        initializeOctokit(GITHUB_REPO.PAT);
        console.log('GitHub Octokit initialized successfully');
      } catch (error) {
        console.error('Failed to initialize GitHub Octokit:', error);
      }
    }
  }, []);

  return (
    <Router basename={basename}>
      <AuthProvider>
        <PostsProvider>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.CALLBACK} element={<CallbackPage />} />

            {/* Protected routes - require authentication */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.POST_DETAIL}
              element={
                <ProtectedRoute>
                  <PostDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path={ROUTES.CONTROL_PANEL}
              element={
                <ProtectedRoute requireAdmin>
                  <ControlPanelPage />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.ARCHIVE}
              element={
                <ProtectedRoute requireAdmin>
                  <ArchivePage />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard or login */}
            <Route
              path={ROUTES.HOME}
              element={<Navigate to={ROUTES.DASHBOARD} replace />}
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PostsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
