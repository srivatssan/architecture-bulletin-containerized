/**
 * File Download Utilities
 * Handles downloading files from both local storage and GitHub
 */

import { APP_MODE } from './constants';
import { getLocalBinaryFile } from '../services/localDataService';

/**
 * Download a file from local storage or GitHub
 * @param {string} path - File path
 * @param {string} filename - Download filename
 * @returns {Promise<void>}
 */
export const downloadFile = async (path, filename) => {
  try {
    if (APP_MODE === 'local') {
      // Get file from localStorage
      const base64Content = await getLocalBinaryFile(path);

      // Convert base64 to blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // For GitHub mode, fetch from raw content
      const baseUrl = import.meta.env.BASE_URL || '/';
      const url = `${baseUrl}${path}`;

      const response = await fetch(url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Check if a file exists
 * @param {string} path - File path
 * @returns {Promise<boolean>}
 */
export const fileExists = async (path) => {
  try {
    if (APP_MODE === 'local') {
      const localKey = `local_data_${path}`;
      return localStorage.getItem(localKey) !== null;
    } else {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${baseUrl}${path}`, { method: 'HEAD' });
      return response.ok;
    }
  } catch (error) {
    return false;
  }
};
