# Blog Featured Image Upload Implementation

## Summary
Implemented file upload functionality for blog featured images using the same pattern as book cover images. The system now supports actual file uploads instead of requiring URL strings.

## Changes Made

### Backend Changes

#### 1. `/readnwin-backend/routers/blog.py`
- **Added imports**: `Form`, `File`, `UploadFile` from FastAPI, `storage` from core, and `json` module
- **Updated `create_blog_post` endpoint**:
  - Changed from accepting `dict` to using `Form` parameters for all text fields
  - Added `featured_image: Optional[UploadFile] = File(None)` parameter
  - Implemented file upload handling with size validation (max 10MB via `storage.MAX_IMAGE_SIZE`)
  - Files are saved using `storage.save_cover()` method (same as book covers)
  - Parse JSON fields (tags, seo_keywords) from string to list
  - Returns file path in database

- **Updated `update_blog_post` endpoint**:
  - Changed from accepting `dict` to using `Form` parameters
  - Added file upload support with old file deletion
  - Handles partial updates (only updates provided fields)

- **Updated `get_blog_posts` endpoint**:
  - Added `featured_image_url` field using `storage.get_url()`
  - Updated `cover_image` to use proper URL
  - Updated `images` array to use proper URL

- **Updated `get_blog_post` endpoint**:
  - Added `featured_image_url` field using `storage.get_url()`
  - Updated `cover_image` to use proper URL
  - Updated `images` array to use proper URL

#### 2. `/readnwin-backend/routers/admin_blog.py`
- **Added import**: `storage` from core
- **Updated `get_admin_blog_posts` endpoint**:
  - Added `featured_image_url` field using `storage.get_url()`
  - Ensures admin panel displays proper image URLs

### Frontend Changes

#### 3. `/frontend/src/hooks/useAdminBlog.js`
- **Updated `createPost` function**:
  - Changed from sending JSON to using `FormData`
  - Properly handles file upload with `multipart/form-data` header
  - Converts arrays (tags, seo_keywords) to JSON strings
  - Checks if `featured_image` is a File instance before appending

- **Updated `updatePost` function**:
  - Changed from sending JSON to using `FormData`
  - Same file handling as create
  - Supports partial updates

#### 4. `/frontend/src/components/admin/BlogManagement.jsx`
- **Updated `handleEditPost` function**:
  - Constructs proper image URL from `featured_image` path
  - Falls back to `featured_image_url` if available
  - Uses `/storage/` prefix for local files

- **Updated posts table display**:
  - Added thumbnail image display in post list
  - Shows 48x48px preview of featured image
  - Includes error handling to hide broken images
  - Maintains responsive layout

#### 5. `/frontend/src/pages/Blog.jsx`
- **Updated blog post cards**:
  - Uses `featured_image` path with `/storage/` prefix
  - Falls back to `cover_image` or placeholder
  - Added error handler to show fallback image

#### 6. `/frontend/src/pages/BlogPost.jsx`
- **Updated hero image**:
  - Uses `featured_image` path with `/storage/` prefix
  - Falls back to `cover_image`
  - Hides image on error instead of showing broken image

- **Updated related posts**:
  - Uses proper image URLs with fallback
  - Consistent error handling

## How It Works

### Upload Flow
1. Admin selects image file in BlogManagement component
2. File is stored in component state as File object
3. On submit, FormData is created with all fields
4. File is appended to FormData as `featured_image`
5. Request sent with `multipart/form-data` header
6. Backend validates file size (max 10MB)
7. File saved to `/uploads/covers/` directory
8. File path stored in database
9. Frontend displays image using `/storage/` URL prefix

### Storage Pattern (Same as Books)
- **Upload directory**: `/uploads/covers/`
- **URL prefix**: `/storage/`
- **File validation**: Size limit enforced
- **File naming**: Handled by `storage.save_cover()` method
- **Old file cleanup**: Deleted when updating with new image

## File Size Limits
- **Maximum image size**: 10MB (defined in `storage.MAX_IMAGE_SIZE`)
- **Allowed formats**: JPG, JPEG, PNG, WebP, GIF (handled by storage service)

## API Endpoints

### Create Post
```
POST /api/blog/posts
Content-Type: multipart/form-data

Fields:
- title (required)
- slug (required)
- content (required)
- excerpt
- status
- featured (boolean as string)
- category
- tags (JSON string)
- seo_title
- seo_description
- seo_keywords (JSON string)
- published_at
- featured_image (file)
```

### Update Post
```
PUT /api/blog/posts/{post_id}
Content-Type: multipart/form-data

Fields: (all optional)
- Same as create endpoint
```

## Testing Checklist
- [x] Create post with featured image
- [x] Create post without featured image
- [x] Update post with new featured image
- [x] Update post without changing image
- [x] Display images in admin list
- [x] Display images on public blog page
- [x] Display images on individual post page
- [x] Handle missing/broken images gracefully
- [x] Validate file size limits
- [x] Delete old image when updating

## Benefits
1. **Consistent with existing patterns** - Uses same storage service as book covers
2. **Proper file handling** - No more URL string requirements
3. **Automatic cleanup** - Old images deleted on update
4. **Size validation** - Prevents oversized uploads
5. **Error handling** - Graceful fallbacks for missing images
6. **Responsive display** - Images shown in admin list and public pages

## Notes
- Images are stored in the same directory as book covers (`/uploads/covers/`)
- The storage service handles file naming and path generation
- Frontend uses `/storage/` prefix which is mounted in FastAPI main.py
- All image URLs are generated server-side for consistency
- Error handling ensures broken images don't break the UI
