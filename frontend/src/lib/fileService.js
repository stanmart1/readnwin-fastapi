import { API_BASE_URL } from './api';

/**
 * Get full URL for file serving
 * @param {string} filePath - File path from backend (e.g., 'uploads/covers/image.png' or '/uploads/covers/image.png')
 * @returns {string} Full URL to access the file
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Return full URL
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Get image URL with fallback
 * @param {string} filePath - File path from backend
 * @param {string} fallback - Fallback image path (default: '/placeholder-book.png')
 * @returns {string} Image URL or fallback
 */
export const getImageUrl = (filePath, fallback = '/placeholder-book.png') => {
  return getFileUrl(filePath) || fallback;
};
