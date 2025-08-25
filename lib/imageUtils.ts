/**
 * Utility functions for handling images (book covers, author avatars, etc.)
 */

/**
 * Constructs a proper image URL from various path formats
 * @param imagePath - The image path from the API
 * @param apiUrl - The API base URL
 * @returns Properly formatted image URL or empty string if no valid path
 */
export function constructImageUrl(imagePath: string | null | undefined, apiUrl?: string): string {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
    return '';
  }

  const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Already a full URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Backend API path - prepend API URL
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }

  // Absolute path - prepend API URL
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }

  // Handle uploads path without leading slash
  if (imagePath.startsWith('uploads/')) {
    return `${baseUrl}/${imagePath}`;
  }

  // Relative path - construct full path
  return `${baseUrl}/uploads/covers/${imagePath}`;
}

/**
 * Validates if an image path is valid and not empty
 * @param imagePath - The image path to validate
 * @returns True if the path is valid
 */
export function isValidImagePath(imagePath: string | null | undefined): boolean {
  return !!(imagePath && 
           imagePath.trim() !== '' && 
           imagePath !== 'null' && 
           imagePath !== 'undefined');
}

/**
 * Filters books that have valid cover images
 * @param books - Array of books to filter
 * @returns Books with valid cover images
 */
export function filterBooksWithCovers<T extends { cover_image_url?: string; cover_image?: string; cover?: string }>(
  books: T[]
): T[] {
  return books.filter(book => {
    const coverPath = book.cover_image_url || book.cover_image || book.cover;
    return isValidImagePath(coverPath);
  });
}

/**
 * Gets author avatar URL based on author name
 * @param authorSlug - The author name slug (lowercase, hyphenated)
 * @returns Author avatar URL
 */
export function getAuthorAvatar(authorSlug: string): string {
  // Default avatar for unknown authors
  if (!authorSlug || authorSlug === 'default') {
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
  }
  
  // Generate avatar based on author name
  return `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`;
}