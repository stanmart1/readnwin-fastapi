# HTML E-Reader Implementation

## Overview
The ReadnWin e-reader now supports **HTML ebooks only** with full highlighting, note-taking, progress tracking, and review features.

## Changes Made

### 1. E-Reader Router (`routers/ereader.py`)
**Complete rewrite to support HTML-only ebooks:**

#### Endpoints:
- `GET /ereader/{book_id}/content` - Fetch HTML ebook content
- `POST /ereader/{book_id}/progress` - Update reading progress
- `GET /ereader/{book_id}/highlights` - Get all highlights
- `POST /ereader/{book_id}/highlights` - Create highlight
- `DELETE /ereader/{book_id}/highlights/{highlight_id}` - Delete highlight
- `GET /ereader/{book_id}/notes` - Get all notes
- `POST /ereader/{book_id}/notes` - Create note
- `PUT /ereader/{book_id}/notes/{note_id}` - Update note
- `DELETE /ereader/{book_id}/notes/{note_id}` - Delete note

### 2. Database Models (`models/reading.py`)
**New models for e-reader features:**

```python
class Highlight:
    - user_id, book_id
    - text, color
    - start_offset, end_offset
    - context (surrounding text)
    - created_at

class Note:
    - user_id, book_id
    - content
    - highlight_id (optional link to highlight)
    - position (scroll position)
    - created_at, updated_at
```

### 3. File Validation (`core/validation.py`)
**Updated to accept HTML files only:**
```python
ALLOWED_EBOOK_TYPES = {'text/html', 'application/xhtml+xml'}
```

### 4. Migration Script (`add_ereader_features.py`)
Run to create highlights and notes tables:
```bash
python add_ereader_features.py
```

## Features

### ✅ HTML Content Delivery
- Sanitized HTML rendering using bleach
- Access control (user must own the book)
- Multiple file path resolution strategies

### ✅ Progress Tracking
- Percentage-based progress (0-100%)
- Scroll position tracking
- Auto-status updates (unread → reading → completed)
- Last read timestamp

### ✅ Highlighting
- Text selection with start/end offsets
- Multiple color options
- Context preservation
- List all highlights per book
- Delete highlights

### ✅ Note-Taking
- Standalone notes or linked to highlights
- Position tracking
- Create, read, update, delete operations
- Timestamp tracking

### ✅ Reviews
- Existing review system already integrated
- Available at `/reviews` endpoints

## File Upload Requirements

### Admin Book Upload
**Only HTML files accepted:**
- File extension: `.html` or `.xhtml`
- MIME type: `text/html` or `application/xhtml+xml`
- Max size: 50MB
- Stored in: `uploads/ebooks/`

### HTML File Structure
Recommended structure for optimal e-reader experience:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Book Title</title>
</head>
<body>
    <h1>Chapter 1</h1>
    <p>Content here...</p>
    
    <h1>Chapter 2</h1>
    <p>More content...</p>
</body>
</html>
```

## API Usage Examples

### 1. Get Book Content
```javascript
GET /ereader/123/content
Authorization: Bearer {token}

Response:
{
  "success": true,
  "book_id": 123,
  "title": "Book Title",
  "author": "Author Name",
  "content": "<html>...</html>",
  "progress": 0.45
}
```

### 2. Update Progress
```javascript
POST /ereader/123/progress
{
  "progress": 45.5,
  "scrollPosition": 1200
}

Response:
{
  "success": true,
  "progress": 45.5,
  "status": "reading"
}
```

### 3. Create Highlight
```javascript
POST /ereader/123/highlights
{
  "book_id": 123,
  "text": "Selected text to highlight",
  "color": "yellow",
  "start_offset": 1500,
  "end_offset": 1550,
  "context": "...surrounding text..."
}

Response:
{
  "success": true,
  "highlight": {
    "id": 456,
    "text": "Selected text to highlight",
    "color": "yellow",
    "created_at": "2025-10-21T20:00:00Z"
  }
}
```

### 4. Create Note
```javascript
POST /ereader/123/notes
{
  "book_id": 123,
  "content": "My thoughts on this passage",
  "highlight_id": 456,  // optional
  "position": 1500
}

Response:
{
  "success": true,
  "note": {
    "id": 789,
    "content": "My thoughts on this passage",
    "created_at": "2025-10-21T20:05:00Z"
  }
}
```

## Frontend Integration

### Required Features
1. **HTML Renderer**: Display sanitized HTML content
2. **Text Selection**: Capture user text selection with offsets
3. **Highlight Overlay**: Visual highlighting with color options
4. **Note Interface**: Create/edit/delete notes
5. **Progress Bar**: Visual progress indicator
6. **Scroll Tracking**: Auto-save scroll position

### Recommended Libraries
- **HTML Rendering**: DOMPurify for additional sanitization
- **Text Selection**: Rangy or native Selection API
- **Highlighting**: CSS-based or canvas overlay
- **State Management**: React Context or Zustand

## Security

### HTML Sanitization
- Bleach library removes dangerous tags/attributes
- Allowed tags: p, br, strong, em, h1-h6, ul, ol, li, div, span, a, img, table, etc.
- Blocked: script, style, iframe, object, embed
- Attribute filtering on links and images

### Access Control
- User must own book (in user_library)
- JWT authentication required
- User-specific highlights and notes

## Database Schema

```sql
-- Highlights table
CREATE TABLE highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color VARCHAR(50) DEFAULT 'yellow',
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    highlight_id INTEGER REFERENCES highlights(id) ON DELETE SET NULL,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_highlights_user_book ON highlights(user_id, book_id);
CREATE INDEX idx_notes_user_book ON notes(user_id, book_id);
```

## Migration Steps

1. **Run migration script:**
   ```bash
   cd readnwin-backend
   python add_ereader_features.py
   ```

2. **Update existing books:**
   - Convert EPUB/PDF books to HTML format
   - Re-upload as HTML files through admin panel

3. **Test endpoints:**
   ```bash
   # Get content
   curl -H "Authorization: Bearer {token}" \
        http://localhost:8000/ereader/1/content
   
   # Create highlight
   curl -X POST -H "Authorization: Bearer {token}" \
        -H "Content-Type: application/json" \
        -d '{"book_id":1,"text":"test","color":"yellow","start_offset":0,"end_offset":10}' \
        http://localhost:8000/ereader/1/highlights
   ```

## Next Steps

### Backend (Complete ✅)
- [x] HTML-only file validation
- [x] Content delivery endpoint
- [x] Progress tracking
- [x] Highlights CRUD
- [x] Notes CRUD
- [x] Database models
- [x] Migration script

### Frontend (To Implement)
- [ ] HTML content renderer
- [ ] Text selection handler
- [ ] Highlight overlay system
- [ ] Note-taking UI
- [ ] Progress bar
- [ ] Scroll position sync
- [ ] Color picker for highlights
- [ ] Search within book
- [ ] Table of contents navigation

## Support

For issues or questions:
1. Check API documentation: `http://localhost:8000/docs`
2. Review this implementation guide
3. Test endpoints with provided examples
