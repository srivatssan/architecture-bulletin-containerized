/**
 * Archive Page (Admin Only)
 * View and manage archived posts
 * TODO: Implement full functionality
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const ArchivePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Archive</h1>
          <p className="text-gray-600 mb-4">Archived Posts</p>
          <p className="text-sm text-gray-500">
            Full implementation pending - will include archived post viewing, unarchiving, and export functionality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
