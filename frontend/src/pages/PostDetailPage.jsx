/**
 * Post Detail Page
 * Shows full post details, artifacts, conversations, and proof of work
 * Allows status updates and file uploads
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { ROUTES, APP_MODE } from '../utils/constants';
import { getLocalArchitects } from '../services/localDataService';
import { downloadFile } from '../utils/fileDownload';
import EditPostModal from '../components/posts/EditPostModal';
import ChatPanel from '../components/chat/ChatPanel';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { fetchPost, updatePost, updateStatus, assignArchitect, deletePost } = usePosts();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [selectedArchitect, setSelectedArchitect] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load post data and architects
  useEffect(() => {
    loadPost();
    loadArchitects();
  }, [id]);

  const loadArchitects = async () => {
    try {
      if (APP_MODE === 'local') {
        const architectsList = await getLocalArchitects();
        setArchitects(architectsList);
      }
      // TODO: Add GitHub mode support for fetching architects
    } catch (err) {
      console.error('Failed to load architects:', err);
    }
  };

  const loadPost = async () => {
    try {
      setIsLoading(true);
      setError('');
      const postData = await fetchPost(id);
      if (!postData) {
        setError('Post not found');
      } else {
        setPost(postData);
      }
    } catch (err) {
      setError('Failed to load post: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm('Are you sure you want to change the status?')) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setError('');
      await updateStatus(id, newStatus, user.username);
      setSuccess('Status updated successfully!');
      await loadPost();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProofFileChange = (e) => {
    const files = Array.from(e.target.files);
    setProofFiles(files);
  };

  const removeProofFile = (index) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadProof = async () => {
    if (proofFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    try {
      setIsUploadingProof(true);
      setError('');

      // Import uploadProofOfWork dynamically
      const { uploadProofOfWork } = await import('../services/postService');

      // Upload files first
      const uploadedFiles = await uploadProofOfWork(id, proofFiles, user.username);

      // Get existing proof of work or initialize
      const existingProof = post.proofOfWork || [];

      // Add new proof entry with uploaded file info
      const newProofEntry = {
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.username,
        files: uploadedFiles,
        notes: '',
      };

      const updatedProof = [...existingProof, newProofEntry];

      // Update post with new proof
      await updatePost(id, { proofOfWork: updatedProof }, user.username);

      setSuccess('Proof of work uploaded successfully!');
      setProofFiles([]);
      await loadPost();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload proof: ' + err.message);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleAssignArchitect = async () => {
    if (!selectedArchitect) {
      setError('Please select an architect');
      return;
    }

    try {
      setIsAssigning(true);
      setError('');

      await assignArchitect(id, selectedArchitect, user.username, isAdmin());
      setSuccess(`Architect ${selectedArchitect} assigned successfully!`);
      setSelectedArchitect('');
      await loadPost();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign architect: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDownloadFile = async (filepath, filename) => {
    try {
      await downloadFile(filepath, filename);
    } catch (err) {
      setError('Failed to download file: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditPost = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = async () => {
    setIsEditModalOpen(false);
    await loadPost();
  };

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this work for review? The admin will be notified.')) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await updateStatus(id, 'status-submitted', user.username);
      setSuccess('Work submitted for review successfully!');
      await loadPost();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit for review: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeletePost = async () => {
    const confirmMsg = isAdmin()
      ? 'Are you sure you want to delete this post? This action cannot be undone.'
      : 'Are you sure you want to delete your post? This action cannot be undone.';

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await deletePost(id, user.username);
      setSuccess('Post deleted successfully!');
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1500);
    } catch (err) {
      setError('Failed to delete post: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeletePost = () => {
    if (isAdmin()) return true;
    if (post && post.createdBy === user.username) return true;
    return false;
  };

  const handleSendMessage = async (message) => {
    try {
      const conversations = post.conversations || [];
      const newConversation = {
        author: user.username,
        message,
        timestamp: new Date().toISOString(),
      };

      const updatedConversations = [...conversations, newConversation];
      await updatePost(id, { conversations: updatedConversations }, user.username);
      await loadPost();
    } catch (err) {
      throw new Error('Failed to send message: ' + err.message);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusDisplay(post.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Actions */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center space-x-3">
            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat</span>
            </button>

            {/* Delete Button */}
            {canDeletePost() && (
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex-1">{post.title}</h1>
                <div className="flex items-center space-x-3 ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} whitespace-nowrap`}>
                    {status.label}
                  </span>
                  {isAdmin() && post.status !== 'status-closed' && (
                    <button
                      onClick={handleEditPost}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                <span>Created by {post.createdBy}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                {post.updatedAt !== post.createdAt && (
                  <>
                    <span>•</span>
                    <span>Updated {new Date(post.updatedAt).toLocaleString()}</span>
                  </>
                )}
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
              </div>

              {post.concernedParties && post.concernedParties.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Concerned Parties</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.concernedParties.map((party, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Topic Artifacts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Topic Artifacts</h2>
              {post.attachments && post.attachments.length > 0 ? (
                <div className="space-y-3">
                  {post.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(1)} KB • Uploaded by {attachment.uploadedBy}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(attachment.path, attachment.filename)}
                        className="ml-3 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded flex-shrink-0 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No artifacts uploaded for this topic</p>
                  {isAdmin() && post.status !== 'status-closed' && (
                    <p className="text-xs text-gray-400 mt-1">Use the Edit button to add artifacts</p>
                  )}
                </div>
              )}
            </div>

            {/* Proof of Work Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proof of Work</h2>

              {/* Existing Proof of Work */}
              {post.proofOfWork && post.proofOfWork.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {post.proofOfWork.map((proof, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                          Uploaded by <span className="font-medium">{proof.uploadedBy}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(proof.uploadedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {proof.files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => handleDownloadFile(file.path, file.name)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">No proof of work uploaded yet.</p>
              )}

              {/* Upload Proof of Work (Architects Only) */}
              {!isAdmin() && post.status !== 'status-closed' && post.status !== 'status-submitted' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Your Proof of Work</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleProofFileChange}
                      className="hidden"
                      id="proof-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600">Click to upload deliverables</span>
                      <span className="text-xs text-gray-500 mt-1">PDF, DOC, TXT, Images, ZIP (Max 10MB)</span>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {proofFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {proofFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProofFile(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleUploadProof}
                        disabled={isUploadingProof}
                        className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingProof ? 'Uploading...' : 'Upload Proof of Work'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit for Review (Architects with Proof) */}
              {!isAdmin() && post.proofOfWork && post.proofOfWork.length > 0 &&
               post.status !== 'status-submitted' && post.status !== 'status-closed' && post.status !== 'status-pending' && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-green-900 mb-1">Ready to Submit?</h4>
                        <p className="text-sm text-green-800 mb-3">
                          You've uploaded proof of work. When you're ready, submit this task for admin review.
                        </p>
                        <button
                          onClick={handleSubmitForReview}
                          disabled={isUpdatingStatus}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isUpdatingStatus ? 'Submitting...' : 'Submit for Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Status
                </label>
                <select
                  value={post.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="status-new">New</option>
                  <option value="status-assigned">In Progress</option>
                  <option value="status-submitted">Submitted</option>
                  <option value="status-pending">Pending Review</option>
                  <option value="status-escalate">Escalated</option>
                  {isAdmin() && <option value="status-closed">Closed</option>}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {isAdmin() ? 'Admin can change to any status' : 'Architects can update task progress'}
                </p>
              </div>
            </div>

            {/* Assigned Architects */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned To</h3>

              {/* Current Assignments */}
              {post.assignedArchitects && post.assignedArchitects.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {post.assignedArchitects.map((architect, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-700">{architect}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Not assigned yet</p>
              )}

              {/* Assignment Dropdown (Admin Only) */}
              {isAdmin() && post.status !== 'status-closed' && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Architect
                  </label>
                  <select
                    value={selectedArchitect}
                    onChange={(e) => setSelectedArchitect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    disabled={isAssigning}
                  >
                    <option value="">Select an architect...</option>
                    {architects
                      .filter(arch => !(post.assignedArchitects || []).includes(arch.githubUsername))
                      .map((architect) => (
                        <option key={architect.id} value={architect.githubUsername}>
                          {architect.displayName} ({architect.specialization})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAssignArchitect}
                    disabled={isAssigning || !selectedArchitect}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Architect'}
                  </button>
                </div>
              )}
            </div>

            {/* Post Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Post ID:</span>
                  <code className="ml-2 text-gray-900 font-mono">{post.id}</code>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {post.submittedAt && (
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(post.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        post={post}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        post={post}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default PostDetailPage;
