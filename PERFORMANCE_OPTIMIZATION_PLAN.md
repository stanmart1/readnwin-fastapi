# Performance Optimization Plan

## Overview
Systematic plan to optimize ReadnWin application performance without breaking existing functionality.

**Estimated Timeline:** 3-4 weeks
**Risk Level:** Medium (with proper testing)
**Expected Performance Gain:** 60-80% improvement in response times, 50% reduction in bundle size

---

## Phase 1: Database Optimization (Week 1)
**Goal:** Eliminate N+1 queries, add indexes, implement eager loading
**Risk:** Low - Database changes are backward compatible

### 1.1 Add Database Indexes (Day 1)
**Files to modify:**
- `models/book.py`
- `models/order.py`
- `models/cart.py`
- `models/user_library.py`
- `models/reading_session.py`

**Changes:**
```python
# Add indexes to frequently queried columns
- book.category_id (index=True)
- book.author_id (index=True)
- book.is_active (index=True)
- order.user_id (index=True)
- order.status (index=True)
- cart.user_id (index=True)
- user_library.user_id (index=True)
- reading_session.user_id (index=True)
- reading_session.book_id (index=True)
```

**Testing:**
- Run migration
- Verify all queries still work
- Check query performance with EXPLAIN ANALYZE

### 1.2 Implement Eager Loading (Days 2-3)
**Files to modify:**
- `routers/books.py` - Add joinedload for category, author
- `routers/user_library.py` - Add joinedload for book, user
- `routers/orders_enhanced.py` - Add joinedload for items, user
- `routers/reading.py` - Add joinedload for book, user

**Pattern:**
```python
# Before
books = db.query(Book).filter(Book.is_active == True).all()

# After
from sqlalchemy.orm import joinedload
books = db.query(Book).options(
    joinedload(Book.category),
    joinedload(Book.author)
).filter(Book.is_active == True).all()
```

**Testing:**
- Test each endpoint individually
- Verify response data structure unchanged
- Monitor query count reduction (should drop 50-70%)

### 1.3 Optimize Complex Queries (Days 4-5)
**Files to modify:**
- `routers/analytics.py` - Use subqueries instead of multiple queries
- `services/reading_analytics.py` - Batch queries
- `routers/admin_stats_dashboard.py` - Combine related queries

**Testing:**
- Compare results with original queries
- Verify aggregation accuracy
- Load test with realistic data volume

---

## Phase 2: Redis Caching Layer (Week 1-2)
**Goal:** Cache frequently accessed data, reduce database load
**Risk:** Medium - Cache invalidation must be correct

### 2.1 Create Cache Service (Day 6)
**New file:** `services/cache_service.py`

**Features:**
```python
class CacheService:
    - get_or_set(key, callback, ttl)
    - invalidate(key)
    - invalidate_pattern(pattern)
    - get_books_cache(filters)
    - invalidate_books_cache()
    - get_categories_cache()
    - invalidate_categories_cache()
```

**Testing:**
- Unit tests for cache operations
- Test TTL expiration
- Test cache invalidation

### 2.2 Implement Caching in Routers (Days 7-8)
**Files to modify:**
- `routers/books.py` - Cache book listings, book details
- `routers/admin_authors_categories.py` - Cache categories, authors
- `routers/payment_settings.py` - Cache payment gateways
- `routers/shipping.py` - Cache shipping zones

**Pattern:**
```python
# Cache book listings for 5 minutes
cache_key = f"books:list:{category_id}:{page}"
books = cache_service.get_or_set(
    cache_key,
    lambda: fetch_books_from_db(category_id, page),
    ttl=300
)
```

**Cache Invalidation Points:**
- Book created/updated/deleted → invalidate books cache
- Category created/updated/deleted → invalidate categories cache
- Settings updated → invalidate settings cache

**Testing:**
- Test cache hit/miss scenarios
- Verify cache invalidation on updates
- Test concurrent access

### 2.3 Cache User-Specific Data (Day 9)
**Files to modify:**
- `routers/cart.py` - Cache cart items
- `routers/user_library.py` - Cache user library
- `routers/reading.py` - Cache reading progress

**Pattern:**
```python
cache_key = f"user:{user_id}:cart"
# Shorter TTL for user-specific data (1-2 minutes)
```

**Testing:**
- Test multi-user scenarios
- Verify user isolation
- Test cache invalidation on cart updates

---

## Phase 3: Backend Resource Management (Week 2)
**Goal:** Fix resource leaks, optimize file operations
**Risk:** Low - Mostly code cleanup

### 3.1 Fix Resource Leaks (Day 10)
**Files to modify:**
- `routers/images.py` - Use context managers for file operations
- `routers/receipts.py` - Ensure file handles closed
- `routers/ereader_enhanced.py` - Close XML parsers properly

**Pattern:**
```python
# Before
file = open(path, 'rb')
data = file.read()
# file never closed

# After
with open(path, 'rb') as file:
    data = file.read()
```

**Testing:**
- Monitor file descriptor count
- Load test file operations
- Check for memory leaks

### 3.2 Optimize Datetime Handling (Day 11)
**Files to modify:** 40+ files using naive datetime

**Pattern:**
```python
# Before
from datetime import datetime
created_at = datetime.now()

# After
from datetime import datetime, timezone
created_at = datetime.now(timezone.utc)
```

**Testing:**
- Test timezone conversions
- Verify datetime comparisons still work
- Test with different timezones

---

## Phase 4: Uvicorn Production Config (Week 2)
**Goal:** Optimize server configuration for production
**Risk:** Low - Configuration changes

### 4.1 Update Dockerfile (Day 12)
**File:** `readnwin-backend/Dockerfile`

**Changes:**
```dockerfile
# Calculate workers based on CPU cores
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --workers $((2 * $(nproc) + 1)) --log-level warning --no-access-log --proxy-headers"]
```

**Environment Variables:**
- `WORKERS` - Override worker count
- `LOG_LEVEL` - Control logging verbosity

**Testing:**
- Test with different worker counts
- Monitor memory usage per worker
- Load test with concurrent requests

### 4.2 Add Gunicorn Alternative (Day 12)
**File:** `requirements.txt`

**Add:**
```
gunicorn==21.2.0
```

**Alternative CMD:**
```dockerfile
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Testing:**
- Compare Uvicorn vs Gunicorn performance
- Test graceful shutdown
- Monitor worker restart behavior

---

## Phase 5: Frontend Bundle Optimization (Week 3)
**Goal:** Reduce bundle size by 50%, implement code splitting
**Risk:** Medium - Build configuration changes

### 5.1 Implement Code Splitting (Days 13-14)
**File:** `frontend/vite.config.js`

**Changes:**
```javascript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['framer-motion', '@headlessui/react'],
          'admin': [
            './src/pages/admin/Dashboard.jsx',
            './src/pages/admin/Books.jsx',
            // ... other admin pages
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
}
```

**Testing:**
- Verify all routes load correctly
- Test lazy loading behavior
- Check bundle sizes

### 5.2 Lazy Load Routes (Day 15)
**File:** `frontend/src/App.jsx`

**Pattern:**
```javascript
// Before
import AdminDashboard from './pages/admin/Dashboard';

// After
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Suspense>
```

**Routes to lazy load:**
- All admin pages
- BookDetail page
- Dashboard pages
- EpubReader component

**Testing:**
- Test route navigation
- Verify loading states
- Test error boundaries

### 5.3 Optimize Component Re-renders (Days 16-17)
**Files to modify:**
- `components/BookCard.jsx` - Wrap with React.memo
- `components/Header.jsx` - Memoize cart count
- `components/EpubReader.jsx` - Remove inline arrow functions
- `pages/admin/Dashboard.jsx` - Memoize callbacks

**Pattern:**
```javascript
// Before
export default function BookCard({ book }) {
  return <div onClick={() => handleClick(book.id)}>...</div>
}

// After
export default React.memo(function BookCard({ book }) {
  const handleClick = useCallback(() => {
    // handle click
  }, [book.id]);
  
  return <div onClick={handleClick}>...</div>
});
```

**Testing:**
- Use React DevTools Profiler
- Measure render count reduction
- Verify functionality unchanged

---

## Phase 6: API Request Optimization (Week 3)
**Goal:** Reduce redundant API calls, implement request batching
**Risk:** Medium - Changes to data fetching logic

### 6.1 Implement Request Deduplication (Day 18)
**File:** `frontend/src/lib/api.js`

**Add:**
```javascript
const pendingRequests = new Map();

function deduplicateRequest(url, config) {
  const key = `${url}:${JSON.stringify(config)}`;
  
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = axios(url, config).finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
```

**Testing:**
- Test concurrent identical requests
- Verify only one network call made
- Test error handling

### 6.2 Add Response Caching (Day 19)
**File:** `frontend/src/hooks/useCache.js`

**Create:**
```javascript
const cache = new Map();

export function useCache(key, fetcher, ttl = 60000) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return;
    }
    
    fetcher().then(result => {
      cache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
    });
  }, [key]);
  
  return data;
}
```

**Apply to:**
- `hooks/useBooks.js`
- `hooks/useCategories.js`
- `hooks/useAuthors.js`

**Testing:**
- Test cache expiration
- Test cache invalidation
- Monitor network request reduction

### 6.3 Batch Related Requests (Day 20)
**Files to modify:**
- `pages/Books.jsx` - Fetch books + categories in parallel
- `pages/admin/Dashboard.jsx` - Batch stats requests
- `pages/BookDetail.jsx` - Fetch book + related books together

**Pattern:**
```javascript
// Before
const books = await api.get('/api/books');
const categories = await api.get('/api/categories');

// After
const [books, categories] = await Promise.all([
  api.get('/api/books'),
  api.get('/api/categories')
]);
```

**Testing:**
- Verify parallel execution
- Test error handling for partial failures
- Measure time savings

---

## Phase 7: Image Optimization (Week 4)
**Goal:** Implement lazy loading, optimize image delivery
**Risk:** Low - Progressive enhancement

### 7.1 Implement Lazy Loading (Day 21)
**Files to modify:**
- `components/BookCard.jsx`
- `pages/Books.jsx`
- `pages/BookDetail.jsx`

**Pattern:**
```javascript
<img 
  src={imageUrl}
  loading="lazy"
  decoding="async"
  alt={book.title}
/>
```

**Testing:**
- Test scroll behavior
- Verify images load on viewport entry
- Test with slow network

### 7.2 Add Image Optimization Service (Days 22-23)
**Backend file:** `routers/images.py`

**Add WebP conversion:**
```python
from PIL import Image

def convert_to_webp(image_path, quality=85):
    img = Image.open(image_path)
    webp_path = image_path.rsplit('.', 1)[0] + '.webp'
    img.save(webp_path, 'webp', quality=quality)
    return webp_path
```

**Frontend changes:**
```javascript
<picture>
  <source srcSet={`${imageUrl}.webp`} type="image/webp" />
  <img src={imageUrl} alt={book.title} />
</picture>
```

**Testing:**
- Test WebP support detection
- Verify fallback to original format
- Measure file size reduction

### 7.3 Implement Responsive Images (Day 24)
**Pattern:**
```javascript
<img 
  srcSet={`
    ${imageUrl}?w=300 300w,
    ${imageUrl}?w=600 600w,
    ${imageUrl}?w=900 900w
  `}
  sizes="(max-width: 640px) 300px, (max-width: 1024px) 600px, 900px"
  src={imageUrl}
  alt={book.title}
/>
```

**Backend:** Add image resizing endpoint

**Testing:**
- Test different viewport sizes
- Verify correct image loaded
- Measure bandwidth savings

---

## Phase 8: Testing & Monitoring (Week 4)
**Goal:** Ensure optimizations work, measure improvements
**Risk:** Low - Validation phase

### 8.1 Performance Testing (Day 25)
**Tools:**
- Lighthouse (frontend)
- Apache Bench (backend)
- k6 (load testing)

**Metrics to measure:**
- Page load time (target: <2s)
- Time to Interactive (target: <3s)
- API response time (target: <200ms)
- Database query time (target: <50ms)
- Bundle size (target: <1MB)

**Testing scenarios:**
- 100 concurrent users
- 1000 books in database
- 50 concurrent API requests

### 8.2 Add Performance Monitoring (Day 26)
**Backend:**
```python
# middleware/performance.py
import time
from fastapi import Request

async def performance_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = str(duration)
    return response
```

**Frontend:**
```javascript
// lib/performance.js
export function measurePageLoad() {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
}
```

**Testing:**
- Monitor metrics in production
- Set up alerts for slow queries
- Track performance over time

### 8.3 Rollback Plan (Day 27)
**Preparation:**
- Tag current version in git
- Document all changes
- Create rollback scripts
- Test rollback procedure

**Rollback triggers:**
- Performance degradation >20%
- Error rate increase >5%
- User complaints
- Critical bugs

---

## Implementation Order

### Week 1: Backend Foundation
- Day 1: Database indexes
- Days 2-3: Eager loading
- Days 4-5: Query optimization
- Day 6: Cache service
- Days 7-9: Implement caching

### Week 2: Backend Polish + Server Config
- Day 10: Fix resource leaks
- Day 11: Datetime optimization
- Day 12: Uvicorn/Gunicorn config
- Days 13-14: Frontend code splitting

### Week 3: Frontend Optimization
- Day 15: Lazy loading routes
- Days 16-17: Component optimization
- Day 18: Request deduplication
- Day 19: Response caching
- Day 20: Batch requests

### Week 4: Images + Testing
- Day 21: Image lazy loading
- Days 22-23: Image optimization
- Day 24: Responsive images
- Days 25-27: Testing & monitoring

---

## Risk Mitigation

### High-Risk Changes
1. **Database indexes** - Test on staging first, monitor query performance
2. **Caching layer** - Implement cache invalidation carefully, test edge cases
3. **Code splitting** - Test all routes thoroughly, verify lazy loading

### Rollback Strategy
- Keep feature flags for major changes
- Deploy incrementally (10% → 50% → 100%)
- Monitor error rates closely
- Have database backup before index changes

### Testing Requirements
- Unit tests for all new functions
- Integration tests for caching
- E2E tests for critical user flows
- Load testing before production deploy

---

## Success Metrics

### Performance Targets
- **Page Load Time:** 4s → 1.5s (62% improvement)
- **API Response Time:** 500ms → 150ms (70% improvement)
- **Bundle Size:** 1.9MB → 900KB (53% reduction)
- **Database Queries:** 50 per request → 10 per request (80% reduction)
- **Cache Hit Rate:** 0% → 70%+

### Monitoring
- Set up Lighthouse CI for frontend
- Monitor API response times
- Track database query performance
- Monitor cache hit rates
- Track error rates

---

## Post-Optimization Maintenance

### Weekly
- Review performance metrics
- Check cache hit rates
- Monitor error logs

### Monthly
- Analyze slow queries
- Review bundle size
- Update dependencies
- Performance regression testing

### Quarterly
- Full performance audit
- Update optimization plan
- Review and adjust cache TTLs
- Capacity planning
