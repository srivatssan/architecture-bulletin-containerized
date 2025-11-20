/**
 * useLocalStorage Hook
 * Store and retrieve values from localStorage with React state
 */

import { useState, useEffect } from 'react';
import { logError } from '../utils/logger';

/**
 * useLocalStorage hook
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function]} - [value, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logError(`Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logError(`Error setting localStorage key "${key}"`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useLocalStorage;
