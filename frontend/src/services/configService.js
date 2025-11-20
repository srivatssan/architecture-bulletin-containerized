/**
 * Configuration Service
 * Manages architects, statuses, and settings configuration
 * Supports both GitHub and local storage modes
 */

import { APP_MODE, GITHUB_PATHS } from '../utils/constants';
import { getJsonFile, saveJsonFile } from './githubDataService';
import { readLocalFile, writeLocalFile } from './localDataService';
import { logDataOperation, logError } from '../utils/logger';

/**
 * Get architects configuration
 * @returns {Promise<Object>} - { data, sha }
 */
export const getArchitects = async () => {
  try {
    logDataOperation('read', 'architects_config', { mode: APP_MODE });

    let result;

    if (APP_MODE === 'local') {
      result = await readLocalFile('config/architects.json');
    } else {
      result = await getJsonFile(GITHUB_PATHS.ARCHITECTS);
    }

    if (!result) {
      // Return empty config if file doesn't exist
      return {
        data: {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system',
          architects: [],
        },
        sha: null,
      };
    }

    return result;
  } catch (error) {
    logError('Failed to fetch architects config', error);
    throw error;
  }
};

/**
 * Update architects configuration
 * @param {Array} architects - Updated architects array
 * @param {string} updatedBy - Username of user making the change
 * @param {string} sha - Current file SHA
 * @returns {Promise<Object>}
 */
export const updateArchitects = async (architects, updatedBy, sha = null) => {
  try {
    logDataOperation('update', 'architects_config', { count: architects.length, mode: APP_MODE });

    const config = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      updatedBy,
      architects,
    };

    if (APP_MODE === 'local') {
      await writeLocalFile('config/architects.json', config);
      return { data: config, sha: null };
    } else {
      const result = await saveJsonFile(
        GITHUB_PATHS.ARCHITECTS,
        config,
        `Update architects config by ${updatedBy}`,
        sha
      );
      return result;
    }
  } catch (error) {
    logError('Failed to update architects config', error);
    throw error;
  }
};

/**
 * Add a new architect
 * @param {Object} architect - Architect object
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>}
 */
export const addArchitect = async (architect, updatedBy) => {
  try {
    const { data, sha } = await getArchitects();

    // Check if architect already exists
    const exists = data.architects.some(
      a => a.githubUsername === architect.githubUsername
    );

    if (exists) {
      throw new Error(`Architect ${architect.githubUsername} already exists`);
    }

    // Add new architect
    const newArchitect = {
      id: `arch-${Date.now()}`,
      githubUsername: architect.githubUsername,
      displayName: architect.displayName,
      email: architect.email || '',
      specialization: architect.specialization || '',
      status: 'active',
      addedAt: new Date().toISOString(),
      addedBy: updatedBy,
      deactivatedAt: null,
      deactivatedBy: null,
    };

    data.architects.push(newArchitect);

    await updateArchitects(data.architects, updatedBy, sha);

    logDataOperation('create', 'architect', { username: architect.githubUsername });

    return newArchitect;
  } catch (error) {
    logError('Failed to add architect', error);
    throw error;
  }
};

/**
 * Remove an architect
 * @param {string} architectId - Architect ID
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>}
 */
export const removeArchitect = async (architectId, updatedBy) => {
  try {
    const { data, sha } = await getArchitects();

    const updatedArchitects = data.architects.filter(a => a.id !== architectId);

    if (updatedArchitects.length === data.architects.length) {
      throw new Error(`Architect ${architectId} not found`);
    }

    await updateArchitects(updatedArchitects, updatedBy, sha);

    logDataOperation('delete', 'architect', { architectId });

    return { success: true };
  } catch (error) {
    logError('Failed to remove architect', error);
    throw error;
  }
};

/**
 * Deactivate an architect (soft delete)
 * @param {string} architectId - Architect ID
 * @param {string} updatedBy - Username
 * @returns {Promise<Object>}
 */
export const deactivateArchitect = async (architectId, updatedBy) => {
  try {
    const { data, sha } = await getArchitects();

    const architect = data.architects.find(a => a.id === architectId);

    if (!architect) {
      throw new Error(`Architect ${architectId} not found`);
    }

    architect.status = 'inactive';
    architect.deactivatedAt = new Date().toISOString();
    architect.deactivatedBy = updatedBy;

    await updateArchitects(data.architects, updatedBy, sha);

    logDataOperation('update', 'architect', { architectId, action: 'deactivate' });

    return architect;
  } catch (error) {
    logError('Failed to deactivate architect', error);
    throw error;
  }
};

/**
 * Get statuses configuration
 * @returns {Promise<Object>} - { data, sha }
 */
export const getStatuses = async () => {
  try {
    logDataOperation('read', 'statuses_config', { mode: APP_MODE });

    let result;

    if (APP_MODE === 'local') {
      result = await readLocalFile('config/statuses.json');
    } else {
      result = await getJsonFile(GITHUB_PATHS.STATUSES);
    }

    if (!result) {
      // Return default statuses if file doesn't exist
      return {
        data: {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system',
          statuses: [],
        },
        sha: null,
      };
    }

    return result;
  } catch (error) {
    logError('Failed to fetch statuses config', error);
    throw error;
  }
};

/**
 * Update statuses configuration
 * @param {Array} statuses - Updated statuses array
 * @param {string} updatedBy - Username
 * @param {string} sha - Current file SHA
 * @returns {Promise<Object>}
 */
export const updateStatuses = async (statuses, updatedBy, sha = null) => {
  try {
    logDataOperation('update', 'statuses_config', { count: statuses.length, mode: APP_MODE });

    const config = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      updatedBy,
      statuses,
    };

    if (APP_MODE === 'local') {
      await writeLocalFile('config/statuses.json', config);
      return { data: config, sha: null };
    } else {
      const result = await saveJsonFile(
        GITHUB_PATHS.STATUSES,
        config,
        `Update statuses config by ${updatedBy}`,
        sha
      );
      return result;
    }
  } catch (error) {
    logError('Failed to update statuses config', error);
    throw error;
  }
};

/**
 * Get application settings
 * @returns {Promise<Object>} - { data, sha }
 */
export const getSettings = async () => {
  try {
    logDataOperation('read', 'settings_config', { mode: APP_MODE });

    let result;

    if (APP_MODE === 'local') {
      result = await readLocalFile('config/settings.json');
    } else {
      result = await getJsonFile(GITHUB_PATHS.SETTINGS);
    }

    if (!result) {
      // Return default settings if file doesn't exist
      return {
        data: {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system',
          taskLimit: {
            maxActiveTasks: 50,
            bannerMessage: "We've reached our task capacity of 50 items. Please consider archiving completed tasks to free up space.",
            showBanner: true,
          },
          adminUsers: [],
          repositoryConfig: {
            owner: '',
            dataRepo: 'architecture-bulletin-data',
          },
          features: {
            allowSelfAssignment: true,
            requireApprovalForClosure: true,
            enableNotifications: true,
            enableArchive: true,
            enableExport: true,
          },
        },
        sha: null,
      };
    }

    return result;
  } catch (error) {
    logError('Failed to fetch settings config', error);
    throw error;
  }
};

/**
 * Update application settings
 * @param {Object} settings - Updated settings object
 * @param {string} updatedBy - Username
 * @param {string} sha - Current file SHA
 * @returns {Promise<Object>}
 */
export const updateSettings = async (settings, updatedBy, sha = null) => {
  try {
    logDataOperation('update', 'settings_config', { mode: APP_MODE });

    const config = {
      ...settings,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };

    if (APP_MODE === 'local') {
      await writeLocalFile('config/settings.json', config);
      return { data: config, sha: null };
    } else {
      const result = await saveJsonFile(
        GITHUB_PATHS.SETTINGS,
        config,
        `Update settings by ${updatedBy}`,
        sha
      );
      return result;
    }
  } catch (error) {
    logError('Failed to update settings', error);
    throw error;
  }
};

/**
 * Get user role from configuration
 * @param {string} username - GitHub username
 * @returns {Promise<string>} - 'admin' | 'architect' | 'unauthorized'
 */
export const getUserRole = async (username) => {
  try {
    const [settingsResult, architectsResult] = await Promise.all([
      getSettings(),
      getArchitects(),
    ]);

    const settings = settingsResult.data;
    const architects = architectsResult.data;

    // Check if user is admin
    if (settings.adminUsers && settings.adminUsers.includes(username)) {
      return 'admin';
    }

    // Check if user is active architect
    const isArchitect = architects.architects.some(
      a => a.githubUsername === username && a.status === 'active'
    );

    if (isArchitect) {
      return 'architect';
    }

    return 'unauthorized';
  } catch (error) {
    logError('Failed to determine user role', error);
    throw error;
  }
};

export default {
  getArchitects,
  updateArchitects,
  addArchitect,
  removeArchitect,
  deactivateArchitect,
  getStatuses,
  updateStatuses,
  getSettings,
  updateSettings,
  getUserRole,
};
