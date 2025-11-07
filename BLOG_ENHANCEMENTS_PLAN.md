# Blog Enhancement Implementation Plan

## Overview
This document outlines the implementation plan for 6 critical blog enhancements, prioritized by impact and complexity.

---

## 1. Content Sanitization with DOMPurify

### Priority: HIGH (Security Critical)
### Estimated Time: 2-3 hours
### Complexity: Low

### Backend Changes
**File**: `readnwin-backend/routers/blog.py`
```python
# Add to requirements.txt
bleach==6.1.0

# Add sanitization function
from bleach import clean

ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'code': ['class']
}

def sanitize_html(content: str) -> str:
    return clean(content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)

# In create_blog_post and update_blog_post
content = sanitize_html(content)
excerpt = sanitize_html(excerpt) if excerpt else ""
```

### Frontend Changes
**File**: `frontend/package.json`
```json
"dependencies": {
  "dompurify": "^3.0.6",
  "isomorphic-dompurify": "^2.9.0"
}
```

**File**: `frontend/src/utils/sanitize.js` (NEW)
```javascript
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
};
```

**Update**: `frontend/src/pages/BlogPost.jsx`
```javascript
import { sanitizeHTML } from '../utils/sanitize';

// Replace dangerouslySetInnerHTML
<div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content) }} />
```

### Testing
- [ ] Test XSS prevention with `<script>alert('xss')</script>`
- [ ] Verify allowed tags render correctly
- [ ] Ensure malicious attributes are stripped
- [ ] Test with various HTML payloads

---

## 2. Category Management System

### Priority: HIGH
### Estimated Time: 4-5 hours
### Complexity: Medium

### Database Migration
**File**: `readnwin-backend/migrations/create_blog_categories.py` (NEW)
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from core.database import Base, engine

def upgrade():
    # Create categories table
    Base.metadata.tables['blog_categories'].create(engine)
    
    # Insert default categories
    from models.blog import BlogCategory
    from core.database import SessionLocal
    db = SessionLocal()
    
    defaults = [
        {'name': 'General', 'slug': 'general', 'description': 'General posts'},
        {'name': 'Technology', 'slug': 'technology', 'description': 'Tech posts'},
        {'name': 'Books', 'slug': 'books', 'description': 'Book reviews'}
    ]
    
    for cat in defaults:
        db.add(BlogCategory(**cat, is_active=True))
    db.commit()
```

### Backend Model
**File**: `readnwin-backend/models/blog.py`
```python
class BlogCategory(Base):
    __tablename__ = "blog_categories"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    color = Column(String(7), default='#6B7280')  # Hex color
    icon = Column(String(50), default='ri-folder-line')
    is_active = Column(Boolean, default=True)
    post_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Update BlogPost model
class BlogPost(Base):
    # Change category from String to ForeignKey
    category_id = Column(Integer, ForeignKey('blog_categories.id'))
    category = relationship("BlogCategory", backref="posts")
```

### Backend Endpoints
**File**: `readnwin-backend/routers/admin_blog.py`
```python
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(BlogCategory).filter(BlogCategory.is_active == True).all()
    return {"categories": categories}

@router.post("/categories")
def create_category(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(""),
    color: str = Form("#6B7280"),
    icon: str = Form("ri-folder-line"),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    check_admin_access(current_user)
    category = BlogCategory(name=name, slug=slug, description=description, color=color, icon=icon)
    db.add(category)
    db.commit()
    return {"success": True, "category": category}

@router.put("/categories/{category_id}")
def update_category(category_id: int, ...): # Similar to create

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, ...): # Check no posts assigned
```

### Frontend Component
**File**: `frontend/src/components/admin/CategoryManagement.jsx` (NEW)
```javascript
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', color: '#6B7280', icon: 'ri-folder-line' });

  // CRUD operations
  const createCategory = async () => { /* API call */ };
  const updateCategory = async (id) => { /* API call */ };
  const deleteCategory = async (id) => { /* API call */ };

  return (
    <div>
      {/* Category list with edit/delete */}
      {/* Modal for create/edit */}
    </div>
  );
};
```

### Testing
- [ ] Create new category
- [ ] Update category details
- [ ] Delete category (prevent if posts exist)
- [ ] Filter posts by category
- [ ] Display category colors/icons

---

## 3. Engagement Tracking (Views, Likes, Comments)

### Priority: MEDIUM
### Estimated Time: 6-8 hours
### Complexity: High

### Database Models
**File**: `readnwin-backend/models/blog.py`
```python
class BlogView(Base):
    __tablename__ = "blog_views"
    
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('blog_posts.id'))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (Index('idx_post_ip_date', 'post_id', 'ip_address', 'viewed_at'),)

class BlogLike(Base):
    __tablename__ = "blog_likes"
    
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('blog_posts.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (UniqueConstraint('post_id', 'user_id'),)

class BlogComment(Base):
    __tablename__ = "blog_comments"
    
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('blog_posts.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    parent_id = Column(Integer, ForeignKey('blog_comments.id'), nullable=True)  # For replies
    content = Column(Text, nullable=False)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Backend Endpoints
**File**: `readnwin-backend/routers/blog.py`
```python
@router.post("/posts/{slug}/view")
def track_view(slug: str, request: Request, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404)
    
    # Check if already viewed today (prevent spam)
    ip = request.client.host
    today = datetime.now().date()
    existing = db.query(BlogView).filter(
        BlogView.post_id == post.id,
        BlogView.ip_address == ip,
        func.date(BlogView.viewed_at) == today
    ).first()
    
    if not existing:
        view = BlogView(post_id=post.id, ip_address=ip, user_agent=request.headers.get('user-agent'))
        db.add(view)
        db.commit()
    
    return {"success": True}

@router.post("/posts/{slug}/like")
def toggle_like(slug: str, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404)
    
    existing = db.query(BlogLike).filter(BlogLike.post_id == post.id, BlogLike.user_id == current_user.id).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"success": True, "liked": False}
    else:
        like = BlogLike(post_id=post.id, user_id=current_user.id)
        db.add(like)
        db.commit()
        return {"success": True, "liked": True}

@router.post("/posts/{slug}/comments")
def add_comment(slug: str, content: str = Form(...), parent_id: int = Form(None), 
                current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404)
    
    comment = BlogComment(post_id=post.id, user_id=current_user.id, content=content, parent_id=parent_id)
    db.add(comment)
    db.commit()
    return {"success": True, "comment": comment}

@router.get("/posts/{slug}/comments")
def get_comments(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404)
    
    comments = db.query(BlogComment).filter(
        BlogComment.post_id == post.id,
        BlogComment.is_approved == True
    ).order_by(BlogComment.created_at.desc()).all()
    
    return {"comments": comments}

# Update get_blog_posts to include counts
def get_blog_posts(...):
    # Add subqueries for counts
    views_count = db.query(func.count(BlogView.id)).filter(BlogView.post_id == post.id).scalar()
    likes_count = db.query(func.count(BlogLike.id)).filter(BlogLike.post_id == post.id).scalar()
    comments_count = db.query(func.count(BlogComment.id)).filter(
        BlogComment.post_id == post.id, 
        BlogComment.is_approved == True
    ).scalar()
```

### Frontend Components
**File**: `frontend/src/components/BlogEngagement.jsx` (NEW)
```javascript
const BlogEngagement = ({ slug, initialCounts }) => {
  const [liked, setLiked] = useState(false);
  const [counts, setCounts] = useState(initialCounts);

  const handleLike = async () => {
    const response = await api.post(`/api/blog/posts/${slug}/like`);
    setLiked(response.data.liked);
    setCounts(prev => ({ ...prev, likes: prev.likes + (response.data.liked ? 1 : -1) }));
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <i className="ri-eye-line"></i>
        <span>{counts.views}</span>
      </div>
      <button onClick={handleLike} className={liked ? 'text-red-500' : ''}>
        <i className={`ri-heart-${liked ? 'fill' : 'line'}`}></i>
        <span>{counts.likes}</span>
      </button>
      <div className="flex items-center gap-2">
        <i className="ri-chat-3-line"></i>
        <span>{counts.comments}</span>
      </div>
    </div>
  );
};
```

**File**: `frontend/src/components/BlogComments.jsx` (NEW)
```javascript
const BlogComments = ({ slug }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const submitComment = async () => {
    await api.post(`/api/blog/posts/${slug}/comments`, { content: newComment });
    setNewComment('');
    fetchComments();
  };

  return (
    <div>
      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} />
      <button onClick={submitComment}>Post Comment</button>
      
      {comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          <small>{comment.user.name} - {comment.created_at}</small>
        </div>
      ))}
    </div>
  );
};
```

### Testing
- [ ] Track unique views per day
- [ ] Toggle like/unlike
- [ ] Post comments
- [ ] Reply to comments
- [ ] Admin approve/reject comments
- [ ] Display accurate counts

---

## 4. Draft Auto-Save

### Priority: MEDIUM
### Estimated Time: 3-4 hours
### Complexity: Low

### Frontend Implementation
**File**: `frontend/src/hooks/useAutoSave.js` (NEW)
```javascript
import { useEffect, useRef } from 'react';

export const useAutoSave = (data, key, interval = 30000) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('Draft auto-saved');
    }, interval);

    return () => clearTimeout(timeoutRef.current);
  }, [data, key, interval]);

  const loadDraft = () => {
    const saved = localStorage.getItem(key);
    if (saved) {
      const { data, timestamp } = JSON.parse(saved);
      // Only load if less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  };

  const clearDraft = () => {
    localStorage.removeItem(key);
  };

  return { loadDraft, clearDraft };
};
```

**Update**: `frontend/src/components/admin/BlogManagement.jsx`
```javascript
import { useAutoSave } from '../../hooks/useAutoSave';

const BlogManagement = () => {
  const { loadDraft, clearDraft } = useAutoSave(formData, 'blog-draft-autosave');

  useEffect(() => {
    // On mount, check for draft
    const draft = loadDraft();
    if (draft && confirm('Found unsaved draft. Restore?')) {
      setFormData(draft);
    }
  }, []);

  const handleCreatePost = async () => {
    // ... existing code
    if (result.success) {
      clearDraft(); // Clear after successful save
      // ... rest of code
    }
  };

  // Auto-save triggers automatically via useAutoSave hook
};
```

### Testing
- [ ] Draft saves every 30 seconds
- [ ] Draft loads on page refresh
- [ ] Draft clears after successful publish
- [ ] Old drafts (>24h) are ignored
- [ ] Multiple drafts don't conflict

---

## 5. Full-Text Search

### Priority: MEDIUM
### Estimated Time: 4-5 hours
### Complexity: Medium

### Backend Implementation
**File**: `readnwin-backend/routers/blog.py`
```python
from sqlalchemy import or_, func

@router.get("/posts/search")
def search_posts(
    q: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    if not q or len(q) < 3:
        raise HTTPException(400, "Search query must be at least 3 characters")
    
    search_term = f"%{q}%"
    
    # PostgreSQL full-text search (if available)
    # posts = db.query(BlogPost).filter(
    #     BlogPost.is_published == True,
    #     func.to_tsvector('english', BlogPost.title + ' ' + BlogPost.content).match(q)
    # ).limit(limit).offset(offset).all()
    
    # Simple LIKE search (works on all databases)
    posts = db.query(BlogPost).filter(
        BlogPost.is_published == True,
        or_(
            BlogPost.title.ilike(search_term),
            BlogPost.content.ilike(search_term),
            BlogPost.excerpt.ilike(search_term),
            BlogPost.tags.contains([q])  # JSON array search
        )
    ).limit(limit).offset(offset).all()
    
    return {"results": posts, "count": len(posts)}
```

### Database Index (PostgreSQL)
**File**: `readnwin-backend/migrations/add_search_index.py` (NEW)
```python
def upgrade():
    # Add GIN index for full-text search
    op.execute("""
        CREATE INDEX idx_blog_posts_search 
        ON blog_posts 
        USING GIN(to_tsvector('english', title || ' ' || content || ' ' || excerpt))
    """)
```

### Frontend Component
**File**: `frontend/src/components/BlogSearch.jsx` (NEW)
```javascript
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

const BlogSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      searchPosts(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchPosts = async (q) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/blog/posts/search?q=${encodeURIComponent(q)}`);
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search blog posts..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {loading && <div className="absolute right-3 top-3">Loading...</div>}
      
      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg max-h-96 overflow-y-auto">
          {results.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="block p-4 hover:bg-gray-50">
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-gray-600">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Testing
- [ ] Search by title
- [ ] Search by content
- [ ] Search by tags
- [ ] Debounced search (no spam)
- [ ] Minimum 3 characters
- [ ] Display results with highlighting

---

## 6. Comprehensive Testing Suite

### Priority: LOW (but important)
### Estimated Time: 8-10 hours
### Complexity: High

### Backend Tests
**File**: `readnwin-backend/tests/test_blog.py` (NEW)
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_blog_post():
    response = client.post("/api/blog/posts", json={
        "title": "Test Post",
        "slug": "test-post",
        "content": "Test content"
    })
    assert response.status_code == 200
    assert response.json()["success"] == True

def test_get_blog_posts():
    response = client.get("/api/blog/posts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_sanitization():
    response = client.post("/api/blog/posts", json={
        "title": "XSS Test",
        "slug": "xss-test",
        "content": "<script>alert('xss')</script><p>Safe content</p>"
    })
    # Verify script tag is removed
    post = client.get(f"/api/blog/posts/xss-test").json()
    assert "<script>" not in post["content"]
    assert "<p>Safe content</p>" in post["content"]

def test_category_management():
    # Create category
    response = client.post("/admin/blog/categories", json={"name": "Test", "slug": "test"})
    assert response.status_code == 200
    
    # Get categories
    response = client.get("/admin/blog/categories")
    assert len(response.json()["categories"]) > 0

def test_engagement_tracking():
    # Track view
    response = client.post("/api/blog/posts/test-post/view")
    assert response.status_code == 200
    
    # Like post
    response = client.post("/api/blog/posts/test-post/like")
    assert response.json()["liked"] == True
    
    # Unlike post
    response = client.post("/api/blog/posts/test-post/like")
    assert response.json()["liked"] == False

def test_search():
    response = client.get("/api/blog/posts/search?q=test")
    assert response.status_code == 200
    assert "results" in response.json()
```

### Frontend Tests
**File**: `frontend/src/components/__tests__/BlogManagement.test.jsx` (NEW)
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlogManagement from '../admin/BlogManagement';

describe('BlogManagement', () => {
  test('renders blog management page', () => {
    render(<BlogManagement />);
    expect(screen.getByText('Blog Management')).toBeInTheDocument();
  });

  test('creates new blog post', async () => {
    render(<BlogManagement />);
    
    fireEvent.click(screen.getByText('Create Post'));
    fireEvent.change(screen.getByPlaceholderText('Enter post title'), {
      target: { value: 'Test Post' }
    });
    fireEvent.click(screen.getByText('Create Post'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });

  test('auto-saves draft', async () => {
    render(<BlogManagement />);
    
    fireEvent.click(screen.getByText('Create Post'));
    fireEvent.change(screen.getByPlaceholderText('Enter post title'), {
      target: { value: 'Draft Post' }
    });
    
    // Wait for auto-save
    await waitFor(() => {
      const saved = localStorage.getItem('blog-draft-autosave');
      expect(saved).toBeTruthy();
    }, { timeout: 31000 });
  });
});
```

### Setup Testing Environment
**File**: `readnwin-backend/pytest.ini` (NEW)
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

**File**: `frontend/package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### Testing Checklist
- [ ] Unit tests for all CRUD operations
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests
- [ ] E2E tests for critical flows
- [ ] Security tests (XSS, SQL injection)
- [ ] Performance tests (load testing)
- [ ] Accessibility tests

---

## Implementation Order

### Phase 1: Security & Core (Week 1)
1. **Content Sanitization** (Day 1-2)
2. **Category Management** (Day 3-5)

### Phase 2: Engagement (Week 2)
3. **Engagement Tracking** (Day 1-5)

### Phase 3: UX Improvements (Week 3)
4. **Draft Auto-Save** (Day 1-2)
5. **Full-Text Search** (Day 3-5)

### Phase 4: Quality Assurance (Week 4)
6. **Testing Suite** (Day 1-5)

---

## Dependencies to Install

### Backend
```bash
pip install bleach==6.1.0
pip install pytest==7.4.3
pip install pytest-asyncio==0.21.1
```

### Frontend
```bash
npm install dompurify isomorphic-dompurify
npm install -D @testing-library/react @testing-library/jest-dom vitest @vitest/ui
```

---

## Success Metrics

### Security
- [ ] Zero XSS vulnerabilities
- [ ] All user content sanitized
- [ ] Security audit passed

### Functionality
- [ ] Category CRUD working
- [ ] View tracking accurate
- [ ] Like/unlike functional
- [ ] Comments system working
- [ ] Auto-save reliable
- [ ] Search returns relevant results

### Performance
- [ ] Search response < 500ms
- [ ] View tracking doesn't slow page load
- [ ] Auto-save doesn't block UI

### Testing
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] Zero failing tests in CI/CD

---

## Risk Mitigation

### High Risk Items
1. **Engagement tracking** - Could impact performance
   - Mitigation: Use background jobs, cache counts
   
2. **Full-text search** - Database-dependent
   - Mitigation: Implement fallback LIKE search

3. **Testing suite** - Time-consuming
   - Mitigation: Prioritize critical paths first

### Rollback Plan
- Each feature behind feature flag
- Database migrations reversible
- Frontend changes in separate branches
- Staged rollout to production

---

## Post-Implementation

### Monitoring
- Track search query performance
- Monitor engagement metrics
- Watch for sanitization bypasses
- Check auto-save success rate

### Documentation
- Update API documentation
- Create user guides
- Document testing procedures
- Update deployment guide

### Optimization
- Add Redis caching for counts
- Implement search result caching
- Optimize database queries
- Add CDN for static assets
