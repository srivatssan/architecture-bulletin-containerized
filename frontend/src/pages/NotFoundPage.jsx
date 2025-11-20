/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mt-2 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
