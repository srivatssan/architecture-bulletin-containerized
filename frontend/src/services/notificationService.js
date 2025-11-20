/**
 * Notification Service
 * Handles admin notifications for various events
 */

import { APP_MODE } from '../utils/constants';
import { readLocalFile, writeLocalFile } from './localDataService';

/**
 * Create a notification
 * @param {Object} notificationData - { type, message, relatedPostId, createdBy }
 * @returns {Promise<Object>} - Created notification
 */
export const createNotification = async (notificationData) => {
  try {
    if (APP_MODE !== 'local') {
      // TODO: Implement GitHub mode notifications
      console.log('Notification created:', notificationData);
      return notificationData;
    }

    // Get existing notifications
    const result = await readLocalFile('notifications/admin-notifications.json');
    const notifications = result?.data?.notifications || [];

    const newNotification = {
      id: `notif-${Date.now()}`,
      type: notificationData.type,
      message: notificationData.message,
      relatedPostId: notificationData.relatedPostId || null,
      createdBy: notificationData.createdBy,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    notifications.push(newNotification);

    await writeLocalFile('notifications/admin-notifications.json', {
      notifications,
      lastUpdated: new Date().toISOString(),
    });

    return newNotification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notifications are non-critical
    return null;
  }
};

/**
 * Get all admin notifications
 * @returns {Promise<Array>} - Array of notifications
 */
export const getAdminNotifications = async () => {
  try {
    if (APP_MODE !== 'local') {
      return [];
    }

    const result = await readLocalFile('notifications/admin-notifications.json');
    return result?.data?.notifications || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    if (APP_MODE !== 'local') {
      return;
    }

    const result = await readLocalFile('notifications/admin-notifications.json');
    const notifications = result?.data?.notifications || [];

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );

    await writeLocalFile('notifications/admin-notifications.json', {
      notifications: updatedNotifications,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

/**
 * Notify admin when architect creates a post
 * @param {Object} post - Created post
 * @param {string} architectName - Architect username
 * @returns {Promise<void>}
 */
export const notifyAdminOfNewPost = async (post, architectName) => {
  await createNotification({
    type: 'new_post',
    message: `New post created by architect ${architectName}: "${post.title}"`,
    relatedPostId: post.id,
    createdBy: architectName,
  });
};

/**
 * Notify admin when work is submitted
 * @param {Object} post - Post object
 * @param {string} architectName - Architect username
 * @returns {Promise<void>}
 */
export const notifyAdminOfSubmission = async (post, architectName) => {
  await createNotification({
    type: 'work_submitted',
    message: `Work submitted for review by ${architectName} on "${post.title}"`,
    relatedPostId: post.id,
    createdBy: architectName,
  });
};

export default {
  createNotification,
  getAdminNotifications,
  markNotificationAsRead,
  notifyAdminOfNewPost,
  notifyAdminOfSubmission,
};
