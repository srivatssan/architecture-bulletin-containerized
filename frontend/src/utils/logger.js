/**
 * Logging Utility
 * Centralized logging for errors, warnings, and info messages
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

/**
 * Get current user info for logging context
 * @returns {Object}
 */
const getCurrentUser = () => {
  try {
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Create log entry object
 * @param {string} level
 * @param {string} message
 * @param {Object} context
 * @returns {Object}
 */
const createLogEntry = (level, message, context = {}) => {
  const user = getCurrentUser();

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    user: user ? user.username : 'anonymous',
    userRole: user ? user.role : null,
    ...context,
  };
};

/**
 * Send log to external logging service (placeholder)
 * @param {Object} logEntry
 */
const sendToLoggingService = (logEntry) => {
  // In production, send logs to external service
  // Examples: Sentry, LogRocket, Datadog, etc.
  //
  // For now, this is a placeholder
  // Uncomment when ready to integrate:
  //
  // if (window.Sentry) {
  //   window.Sentry.captureMessage(logEntry.message, {
  //     level: logEntry.level,
  //     extra: logEntry,
  //   });
  // }
};

/**
 * Log error
 * @param {string} message
 * @param {Error|Object} error
 * @param {Object} context
 */
export const logError = (message, error = null, context = {}) => {
  const logEntry = createLogEntry(LOG_LEVELS.ERROR, message, {
    error: error ? {
      message: error.message || String(error),
      stack: error.stack,
      ...error,
    } : null,
    ...context,
  });

  console.error(`[ERROR] ${message}`, logEntry);

  if (isProduction) {
    sendToLoggingService(logEntry);
  }
};

/**
 * Log warning
 * @param {string} message
 * @param {Object} context
 */
export const logWarning = (message, context = {}) => {
  const logEntry = createLogEntry(LOG_LEVELS.WARN, message, context);

  console.warn(`[WARN] ${message}`, logEntry);

  if (isProduction) {
    sendToLoggingService(logEntry);
  }
};

/**
 * Log info
 * @param {string} message
 * @param {Object} context
 */
export const logInfo = (message, context = {}) => {
  const logEntry = createLogEntry(LOG_LEVELS.INFO, message, context);

  if (isDevelopment) {
    console.info(`[INFO] ${message}`, logEntry);
  }

  // Optionally send to logging service in production
  // (typically only errors and warnings are sent to reduce costs)
};

/**
 * Log debug (development only)
 * @param {string} message
 * @param {Object} context
 */
export const logDebug = (message, context = {}) => {
  if (isDevelopment) {
    const logEntry = createLogEntry(LOG_LEVELS.DEBUG, message, context);
    console.log(`[DEBUG] ${message}`, logEntry);
  }
};

/**
 * Log authentication event
 * @param {string} event - 'login' | 'logout' | 'token_refresh' | 'auth_failed'
 * @param {Object} context
 */
export const logAuthEvent = (event, context = {}) => {
  logInfo(`Authentication: ${event}`, {
    eventType: 'auth',
    event,
    ...context,
  });
};

/**
 * Log data operation
 * @param {string} operation - 'create' | 'read' | 'update' | 'delete'
 * @param {string} resource - 'post' | 'artifact' | 'comment' | etc.
 * @param {Object} context
 */
export const logDataOperation = (operation, resource, context = {}) => {
  logInfo(`Data: ${operation} ${resource}`, {
    eventType: 'data',
    operation,
    resource,
    ...context,
  });
};

/**
 * Log API call
 * @param {string} endpoint
 * @param {string} method
 * @param {Object} context
 */
export const logApiCall = (endpoint, method, context = {}) => {
  logDebug(`API: ${method} ${endpoint}`, {
    eventType: 'api',
    endpoint,
    method,
    ...context,
  });
};

/**
 * Log API error
 * @param {string} endpoint
 * @param {string} method
 * @param {Error} error
 * @param {Object} context
 */
export const logApiError = (endpoint, method, error, context = {}) => {
  logError(`API Error: ${method} ${endpoint}`, error, {
    eventType: 'api_error',
    endpoint,
    method,
    statusCode: error.status || error.statusCode,
    ...context,
  });
};

/**
 * Log GitHub rate limit warning
 * @param {Object} rateLimit - { remaining, limit, reset }
 */
export const logRateLimitWarning = (rateLimit) => {
  const { remaining, limit, reset } = rateLimit;
  const resetDate = new Date(reset * 1000);

  logWarning('GitHub API rate limit low', {
    eventType: 'rate_limit',
    remaining,
    limit,
    resetAt: resetDate.toISOString(),
  });
};

/**
 * Log performance metric
 * @param {string} operation
 * @param {number} durationMs
 * @param {Object} context
 */
export const logPerformance = (operation, durationMs, context = {}) => {
  logDebug(`Performance: ${operation} took ${durationMs}ms`, {
    eventType: 'performance',
    operation,
    durationMs,
    ...context,
  });
};

/**
 * Create performance timer
 * @param {string} operation
 * @returns {Function} - Call to stop timer and log
 */
export const startPerformanceTimer = (operation) => {
  const startTime = performance.now();

  return (context = {}) => {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    logPerformance(operation, durationMs, context);
  };
};

/**
 * Log user action
 * @param {string} action
 * @param {Object} context
 */
export const logUserAction = (action, context = {}) => {
  logInfo(`User action: ${action}`, {
    eventType: 'user_action',
    action,
    ...context,
  });
};

export default {
  logError,
  logWarning,
  logInfo,
  logDebug,
  logAuthEvent,
  logDataOperation,
  logApiCall,
  logApiError,
  logRateLimitWarning,
  logPerformance,
  startPerformanceTimer,
  logUserAction,
  LOG_LEVELS,
};
