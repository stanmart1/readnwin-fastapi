/**
 * Offline sync queue for reading progress
 * Stores progress updates when offline and syncs when back online
 */

const QUEUE_KEY = 'readnwin_offline_queue';

/**
 * Add progress update to offline queue
 */
export const queueProgressUpdate = (bookId, progressData) => {
  try {
    const queue = getQueue();
    const key = `progress_${bookId}`;
    
    // Update or add to queue (keep only latest for each book)
    queue[key] = {
      bookId,
      ...progressData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('📦 Queued progress update for offline sync:', bookId);
  } catch (err) {
    console.error('Error queuing progress:', err);
  }
};

/**
 * Get offline queue
 */
const getQueue = () => {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Error reading queue:', err);
    return {};
  }
};

/**
 * Sync queued updates to server
 */
export const syncQueuedUpdates = async (api) => {
  try {
    const queue = getQueue();
    const keys = Object.keys(queue);
    
    if (keys.length === 0) {
      return { synced: 0, failed: 0 };
    }
    
    console.log(`🔄 Syncing ${keys.length} queued updates...`);
    
    let synced = 0;
    let failed = 0;
    
    for (const key of keys) {
      const item = queue[key];
      
      try {
        await api.post(`/ereader/${item.bookId}/progress`, {
          progress: item.progress,
          last_read_location: item.last_read_location
        });
        
        // Remove from queue on success
        delete queue[key];
        synced++;
        console.log(`✅ Synced progress for book ${item.bookId}`);
      } catch (err) {
        console.error(`❌ Failed to sync book ${item.bookId}:`, err);
        failed++;
      }
    }
    
    // Update queue
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  } catch (err) {
    console.error('Error syncing queue:', err);
    return { synced: 0, failed: 0 };
  }
};

/**
 * Check if online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Clear sync queue
 */
export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
  console.log('🗑️ Cleared offline sync queue');
};

/**
 * Get queue size
 */
export const getQueueSize = () => {
  const queue = getQueue();
  return Object.keys(queue).length;
};
