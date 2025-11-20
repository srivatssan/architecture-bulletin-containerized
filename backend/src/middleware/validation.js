/**
 * Validation middleware for API requests
 */

/**
 * Validate post creation/update request
 */
export function validatePost(req, res, next) {
  const { title, description } = req.body;
  const errors = [];

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
  }

  // Description validation
  if (!description || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be 5000 characters or less' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Validate login request
 */
export function validateLogin(req, res, next) {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  if (!password || password.trim().length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Validate file upload
 */
export function validateFileUpload(req, res, next) {
  if (!req.body.filename) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Filename is required'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (!req.body.content) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File content is required'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}
