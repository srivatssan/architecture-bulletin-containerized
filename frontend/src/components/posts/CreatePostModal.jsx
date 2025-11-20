/**
 * Create Post Modal Component
 * Modal dialog for creating new bulletin posts
 */

import { useState } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { validateTitle, validateDescription } from '../../utils/validators';

const CreatePostModal = ({ isOpen, onClose }) => {
  const { createPost } = usePosts();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    concernedParties: '',
  });

  const [attachments, setAttachments] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const removeFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    // Validate title
    const titleValidation = validateTitle(formData.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error;
    }

    // Validate description
    const descValidation = validateDescription(formData.description);
    if (!descValidation.valid) {
      errors.description = descValidation.error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse concerned parties (comma-separated)
      const concernedPartiesArray = formData.concernedParties
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const postData = {
        title: formData.title,
        description: formData.description,
        concernedParties: concernedPartiesArray,
        status: 'status-new',
      };

      await createPost(postData, attachments, user.username, user.role === 'architect');

      // Reset form
      setFormData({
        title: '',
        description: '',
        concernedParties: '',
      });
      setAttachments([]);

      // Close modal
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      concernedParties: '',
    });
    setAttachments([]);
    setValidationErrors({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a new task or request to the bulletin board
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., API Gateway Migration to v2"
              maxLength={200}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed information about the task, requirements, timeline, etc."
              maxLength={5000}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/5000 characters
            </p>
          </div>

          {/* Concerned Parties Field */}
          <div>
            <label htmlFor="concernedParties" className="block text-sm font-medium text-gray-700 mb-1">
              Concerned Parties (Optional)
            </label>
            <input
              type="text"
              id="concernedParties"
              name="concernedParties"
              value={formData.concernedParties}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., frontend-team, backend-team, devops (comma-separated)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter team names or departments separated by commas
            </p>
          </div>

          {/* Topic Artifacts Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Artifacts (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, TXT, Images, ZIP (Max 10MB per file)
                </span>
              </label>
            </div>

            {/* File List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <svg
                        className="w-5 h-5 text-gray-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Upload relevant documents, diagrams, or specifications for this topic
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The post will be created with status "New" and will be available
              for architects to self-assign or for admin assignment.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
