/**
 * Add Architect Modal Component
 * Modal for adding new architect users to the system
 */

import { useState } from 'react';

const AddArchitectModal = ({ isOpen, onClose, onArchitectAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    specialization: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate username
    if (!formData.username || formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    // Validate display name
    if (!formData.displayName || formData.displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }

    // Validate email (optional, but if provided must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
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
      await onArchitectAdded(formData);

      // Reset form
      setFormData({
        username: '',
        displayName: '',
        email: '',
        specialization: '',
      });
      setValidationErrors({});
    } catch (err) {
      setError(err.message || 'Failed to add architect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: '',
      displayName: '',
      email: '',
      specialization: '',
    });
    setValidationErrors({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Architect</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create a new architect user account
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

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., architect3"
              autoComplete="off"
            />
            {validationErrors.username && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will be used for login. Use lowercase letters, numbers, hyphens, or underscores.
            </p>
          </div>

          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., John Smith"
            />
            {validationErrors.displayName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.displayName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Full name that will be displayed in the application
            </p>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., john.smith@company.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Specialization Field */}
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
              Specialization (Optional)
            </label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Backend Architecture, Cloud Infrastructure"
            />
            <p className="mt-1 text-xs text-gray-500">
              Technical area of expertise
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A secure password will be automatically generated and shown after creation.
              The user will have "architect" role with permissions to view and work on assigned tasks.
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
              {isSubmitting ? 'Adding...' : 'Add Architect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddArchitectModal;
