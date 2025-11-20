/**
 * Control Panel Page (Admin Only)
 * Manage architects, view users, and configure application settings
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { ROUTES, APP_MODE } from '../utils/constants';
import AddArchitectModal from '../components/admin/AddArchitectModal';
import { getLocalUsers, addLocalArchitect, removeLocalArchitect } from '../services/localDataService';
import { getArchitects } from '../services/configService';
import apiClient from '../services/apiClient';

const ControlPanelPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { posts, fetchPosts, archivePost, unarchivePost } = usePosts();
  const [activeTab, setActiveTab] = useState('posts');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [postsView, setPostsView] = useState('active'); // 'active' or 'archived'

  // Data state
  const [users, setUsers] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [newCredentials, setNewCredentials] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
    fetchPosts();
  }, [fetchPosts]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (APP_MODE === 'local') {
        // Load users from local storage
        const usersResult = await getLocalUsers();
        setUsers(usersResult.data.users || []);
      }

      // Load architects
      const architectsResult = await getArchitects();
      setArchitects(architectsResult.data.architects || []);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArchitect = async (formData) => {
    try {
      setError('');
      setSuccess('');

      if (APP_MODE === 'local') {
        // Add architect to local storage
        const result = await addLocalArchitect(formData);

        // Show credentials
        setNewCredentials({
          username: result.user.username,
          password: result.password,
          displayName: result.user.displayName,
        });

        setSuccess(`Architect "${result.user.displayName}" added successfully!`);

        // Reload data
        await loadData();

        // Close modal after a delay
        setTimeout(() => {
          setIsAddModalOpen(false);
        }, 500);
      } else {
        // Add architect via backend API
        console.log('Adding architect via backend API...');

        const currentArchitects = await apiClient.getArchitects();
        console.log('Current architects response:', currentArchitects);
        const existingArchitects = currentArchitects.data.architects || [];

        // Create new architect object
        const newArchitect = {
          id: `arch-${Date.now()}`,
          githubUsername: formData.githubUsername,
          displayName: formData.displayName,
          email: formData.email || '',
          specialization: formData.specialization || '',
          status: 'active',
          addedAt: new Date().toISOString(),
          addedBy: user.username,
          deactivatedAt: null,
          deactivatedBy: null,
        };

        console.log('New architect to add:', newArchitect);

        // Check if architect already exists
        const exists = existingArchitects.some(
          a => a.githubUsername === formData.githubUsername
        );

        if (exists) {
          throw new Error(`Architect ${formData.githubUsername} already exists`);
        }

        const updatedArchitects = [...existingArchitects, newArchitect];
        console.log('Sending architects to backend:', updatedArchitects);

        // Update architects list via API
        const updateResponse = await apiClient.updateArchitects(updatedArchitects);
        console.log('Backend update response:', updateResponse);

        setSuccess(`Architect "${formData.displayName}" added successfully!`);

        // Reload data
        await loadData();

        // Close modal after a delay
        setTimeout(() => {
          setIsAddModalOpen(false);
        }, 500);
      }
    } catch (err) {
      console.error('Error adding architect:', err);
      setError(`Failed to add architect: ${err.message}`);
      throw err; // Re-throw to be handled by modal
    }
  };

  const handleRemoveArchitect = async (username) => {
    if (!confirm(`Are you sure you want to deactivate architect "${username}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      if (APP_MODE === 'local') {
        await removeLocalArchitect(username);
        setSuccess(`Architect "${username}" has been deactivated.`);
        await loadData();
      } else {
        // Remove architect via backend API
        const currentArchitects = await apiClient.getArchitects();
        const existingArchitects = currentArchitects.data.architects || [];

        // Find and deactivate the architect
        const updatedArchitects = existingArchitects.map(arch => {
          if (arch.githubUsername === username) {
            return {
              ...arch,
              status: 'inactive',
              deactivatedAt: new Date().toISOString(),
              deactivatedBy: user.username,
            };
          }
          return arch;
        });

        // Update architects list via API
        await apiClient.updateArchitects(updatedArchitects);

        setSuccess(`Architect "${username}" has been deactivated.`);
        await loadData();
      }
    } catch (err) {
      setError('Failed to remove architect: ' + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const closeCredentialsModal = () => {
    setNewCredentials(null);
  };

  const handleArchivePost = async (postId) => {
    if (!confirm('Archive this post? It will be removed from active posts and free up a slot.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await archivePost(postId, user.username);
      setSuccess('Post archived successfully!');
      await fetchPosts();
    } catch (err) {
      setError('Failed to archive post: ' + err.message);
    }
  };

  const handleUnarchivePost = async (postId) => {
    if (!confirm('Restore this post to active posts?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await unarchivePost(postId, user.username);
      setSuccess('Post restored successfully!');
      await fetchPosts();
    } catch (err) {
      setError('Failed to unarchive post: ' + err.message);
    }
  };

  const getStatusDisplay = (statusId) => {
    const statusMap = {
      'status-new': { label: 'New', color: 'bg-blue-100 text-blue-800' },
      'status-assigned': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      'status-submitted': { label: 'Submitted', color: 'bg-purple-100 text-purple-800' },
      'status-pending': { label: 'Pending Review', color: 'bg-orange-100 text-orange-800' },
      'status-escalate': { label: 'Escalated', color: 'bg-red-100 text-red-800' },
      'status-closed': { label: 'Closed', color: 'bg-green-100 text-green-800' },
    };
    return statusMap[statusId] || { label: statusId, color: 'bg-gray-100 text-gray-800' };
  };

  // Filter posts
  const activePosts = posts.filter(p => !p.isArchived);
  const archivedPosts = posts.filter(p => p.isArchived);
  const displayedPosts = postsView === 'active' ? activePosts : archivedPosts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control Panel</h1>
              <p className="text-sm text-gray-600 mt-1">Manage application settings and users</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name} (Admin)
              </span>
              <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'posts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Posts Management
              </button>
              <button
                onClick={() => setActiveTab('architects')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'architects'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Architects Management
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                All Users
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Posts Management Tab */}
                {activeTab === 'posts' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Posts Management</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage and archive posts. Active posts count: {activePosts.length}/50
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPostsView('active')}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            postsView === 'active'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Active ({activePosts.length})
                        </button>
                        <button
                          onClick={() => setPostsView('archived')}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            postsView === 'archived'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Archived ({archivedPosts.length})
                        </button>
                      </div>
                    </div>

                    {displayedPosts.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No {postsView} posts found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayedPosts.map((post) => {
                          const status = getStatusDisplay(post.status);
                          return (
                            <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 truncate">
                                      {post.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} whitespace-nowrap`}>
                                      {status.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {post.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>ID: {post.id}</span>
                                    <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                                    {post.assignedArchitects && post.assignedArchitects.length > 0 && (
                                      <span>Assigned to: {post.assignedArchitects.join(', ')}</span>
                                    )}
                                    {post.isArchived && (
                                      <span className="text-orange-600 font-medium">
                                        Archived on {new Date(post.archivedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                                  <button
                                    onClick={() => navigate(`/posts/${post.id}`)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  >
                                    View
                                  </button>
                                  {postsView === 'active' ? (
                                    <button
                                      onClick={() => handleArchivePost(post.id)}
                                      className="px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                                    >
                                      Archive
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnarchivePost(post.id)}
                                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {postsView === 'active' && activePosts.length >= 50 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Warning:</strong> You have reached the 50 active posts limit.
                          Archive old posts to create new ones.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Architects Tab */}
                {activeTab === 'architects' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Architect Users</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage architect accounts who can work on tasks
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        + Add Architect
                      </button>
                    </div>

                    {architects.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No architects found.</p>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                          Add your first architect
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {architects.map((architect) => (
                          <div
                            key={architect.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${architect.githubUsername}`}
                                  alt={architect.displayName}
                                  className="w-12 h-12 rounded-full bg-gray-200"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {architect.displayName}
                                    </h3>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        architect.status === 'active'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {architect.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Username:</strong> {architect.githubUsername}
                                  </p>
                                  {architect.email && (
                                    <p className="text-sm text-gray-600">
                                      <strong>Email:</strong> {architect.email}
                                    </p>
                                  )}
                                  {architect.specialization && (
                                    <p className="text-sm text-gray-600">
                                      <strong>Specialization:</strong> {architect.specialization}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    Added: {new Date(architect.addedAt).toLocaleDateString()} by {architect.addedBy}
                                  </p>
                                </div>
                              </div>
                              {architect.status === 'active' && (
                                <button
                                  onClick={() => handleRemoveArchitect(architect.githubUsername)}
                                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && APP_MODE === 'local' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        View all user accounts in the system
                      </p>
                    </div>

                    {users.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No users found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Username
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                              <tr key={u.username} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <img
                                      src={u.avatar}
                                      alt={u.displayName}
                                      className="w-10 h-10 rounded-full bg-gray-200"
                                    />
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {u.displayName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{u.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      u.role === 'admin'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {u.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      u.active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {u.active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Add Architect Modal */}
      <AddArchitectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onArchitectAdded={handleAddArchitect}
      />

      {/* Credentials Display Modal */}
      {newCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h2 className="text-xl font-bold text-green-900">✓ Architect Created Successfully!</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Save these credentials securely. The password will not be shown again.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {newCredentials.displayName}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono text-gray-900">
                      {newCredentials.username}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newCredentials.username)}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-300">
                  <label className="block text-sm font-medium text-yellow-900 mb-1">
                    Password (Generated)
                  </label>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono text-yellow-900 font-bold">
                      {newCredentials.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newCredentials.password)}
                      className="ml-2 text-yellow-700 hover:text-yellow-900 text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Important:</strong> Share these credentials securely with the new architect.
                  They can use them to login at the login page.
                </p>
              </div>

              <button
                onClick={closeCredentialsModal}
                className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanelPage;
