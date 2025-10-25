/**
 * IndexedDB cache for EPUB files and locations
 * Improves performance by caching downloaded EPUBs locally
 */

const DB_NAME = 'readnwin-epubs';
const DB_VERSION = 1;
const STORE_NAME = 'books';

/**
 * Open IndexedDB connection
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
        objectStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });
};

/**
 * Cache EPUB blob in IndexedDB
 * @param {number|string} bookId - Book ID
 * @param {Blob} blob - EPUB file blob
 * @returns {Promise<void>}
 */
export const cacheEpub = async (bookId, blob) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const data = {
      bookId: bookId.toString(),
      blob: blob,
      cachedAt: Date.now(),
      size: blob.size
    };
    
    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Cached EPUB for book ${bookId} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error('Error caching EPUB:', err);
    // Don't throw - caching is optional
  }
};

/**
 * Get cached EPUB from IndexedDB
 * @param {number|string} bookId - Book ID
 * @returns {Promise<Object|null>} Cached data or null if not found
 */
export const getCachedEpub = async (bookId) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return await new Promise((resolve, reject) => {
      const request = store.get(bookId.toString());
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`✅ Found cached EPUB for book ${bookId}`);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error getting cached EPUB:', err);
    return null; // Return null on error, will fetch from server
  }
};

/**
 * Cache EPUB locations data
 * @param {number|string} bookId - Book ID
 * @param {string} locationsData - Serialized locations from epub.locations.save()
 * @returns {Promise<void>}
 */
export const cacheLocations = async (bookId, locationsData) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Get existing data
    const existing = await new Promise((resolve, reject) => {
      const request = store.get(bookId.toString());
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (existing) {
      existing.locations = locationsData;
      existing.locationsGeneratedAt = Date.now();
      
      await new Promise((resolve, reject) => {
        const request = store.put(existing);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log(`✅ Cached locations for book ${bookId}`);
    }
  } catch (err) {
    console.error('Error caching locations:', err);
    // Don't throw - caching is optional
  }
};

/**
 * Remove cached EPUB from IndexedDB
 * @param {number|string} bookId - Book ID
 * @returns {Promise<void>}
 */
export const removeCachedEpub = async (bookId) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(bookId.toString());
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Removed cached EPUB for book ${bookId}`);
  } catch (err) {
    console.error('Error removing cached EPUB:', err);
  }
};

/**
 * Clear all cached EPUBs
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Cleared all cached EPUBs');
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export const getCacheStats = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const allBooks = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const totalSize = allBooks.reduce((sum, book) => sum + (book.size || 0), 0);
    
    return {
      count: allBooks.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      books: allBooks.map(b => ({
        bookId: b.bookId,
        size: b.size,
        cachedAt: new Date(b.cachedAt).toLocaleString(),
        hasLocations: !!b.locations
      }))
    };
  } catch (err) {
    console.error('Error getting cache stats:', err);
    return { count: 0, totalSize: 0, totalSizeMB: '0', books: [] };
  }
};

/**
 * Check if IndexedDB is supported
 * @returns {boolean}
 */
export const isIndexedDBSupported = () => {
  return 'indexedDB' in window;
};
