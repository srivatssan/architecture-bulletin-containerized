/**
 * Dashboard Page
 * Main bulletin board view
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { ROUTES } from '../utils/constants';
import CreatePostModal from '../components/posts/CreatePostModal';

const DashboardPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const { posts, filteredPosts, isLoading, fetchPosts } = usePosts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    // Refresh posts after creating
    fetchPosts();
  };

  // Helper function to format status display
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

  // Filter posts based on search and status (exclude archived posts)
  const displayedPosts = filteredPosts.filter(post => {
    // Exclude archived posts from dashboard
    if (post.isArchived) {
      return false;
    }

    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Architecture Bulletin
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                + Create Post
              </button>
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role})
              </span>
              {isAdmin() && (
                <Link
                  to={ROUTES.CONTROL_PANEL}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Control Panel
                </Link>
              )}
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
        {/* Stats Summary */}
        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600">Active Posts</div>
              <div className="text-2xl font-bold text-gray-900">{posts.filter(p => !p.isArchived).length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="text-2xl font-bold text-gray-900">
                {posts.filter(p => !p.isArchived && p.status === 'status-assigned').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600">Submitted</div>
              <div className="text-2xl font-bold text-gray-900">
                {posts.filter(p => !p.isArchived && p.status === 'status-submitted').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-600">Closed</div>
              <div className="text-2xl font-bold text-gray-900">
                {posts.filter(p => !p.isArchived && p.status === 'status-closed').length}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        {!isLoading && posts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search posts by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-64">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="status-new">New</option>
                  <option value="status-assigned">In Progress</option>
                  <option value="status-submitted">Submitted</option>
                  <option value="status-pending">Pending Review</option>
                  <option value="status-escalate">Escalated</option>
                  <option value="status-closed">Closed</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {displayedPosts.length} of {posts.filter(p => !p.isArchived).length} active posts
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found.</p>
            {isAdmin() && (
              <button
                onClick={handleCreatePost}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedPosts.map((post) => {
              const status = getStatusDisplay(post.status);
              return (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {post.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ml-4 whitespace-nowrap`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-sm border-t pt-4">
                    <div className="flex items-center space-x-4 text-gray-500">
                      <span>
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.assignedArchitects && post.assignedArchitects.length > 0 && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {post.assignedArchitects.join(', ')}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/posts/${post.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default DashboardPage;
