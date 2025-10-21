# API Versioning & Documentation

## ✅ Implemented Features

### 1. API Versioning
All API endpoints are now versioned under `/api/v1/` prefix:

**Before**: `/auth/login`  
**After**: `/api/v1/auth/login`

### 2. Documentation Endpoints

#### Swagger UI (Interactive API Documentation)
- **URL**: `http://localhost:8000/api/v1/docs`
- **Production**: `https://your-domain.com/api/v1/docs`
- Interactive API testing interface
- Try out endpoints directly from browser

#### ReDoc (Alternative Documentation)
- **URL**: `http://localhost:8000/api/v1/redoc`
- **Production**: `https://your-domain.com/api/v1/redoc`
- Clean, responsive documentation
- Better for reading and sharing

#### OpenAPI Schema
- **URL**: `http://localhost:8000/api/v1/openapi.json`
- Raw OpenAPI 3.0 specification
- Use for code generation and tooling

## API Endpoints Structure

### Root Endpoint
```
GET /
Response: {
  "message": "ReadnWin API is running",
  "version": "1.0.0",
  "docs": "/api/v1/docs",
  "redoc": "/api/v1/redoc"
}
```

### Health Check
```
GET /health
Response: {
  "status": "healthy",
  "message": "ReadnWin API is running",
  "database": "connected",
  "timestamp": "2025-01-21T23:21:49.000000Z"
}
```

### Versioned Endpoints

All API endpoints follow this pattern:
```
/api/v1/{resource}/{action}
```

Examples:
- `/api/v1/auth/login` - User login
- `/api/v1/books/` - List books
- `/api/v1/cart/add` - Add to cart
- `/api/v1/orders/` - List orders
- `/api/v1/admin/users` - Admin user management

## Categories

### Authentication & Authorization
- `/api/v1/auth/*` - Login, register, logout
- `/api/v1/rbac/*` - Role-based access control

### Core Features
- `/api/v1/books/*` - Book catalog
- `/api/v1/cart/*` - Shopping cart
- `/api/v1/checkout/*` - Checkout process
- `/api/v1/orders/*` - Order management
- `/api/v1/payment/*` - Payment processing

### E-Reader
- `/api/v1/ereader/*` - E-reader functionality
- `/api/v1/reading/*` - Reading sessions
- `/api/v1/reading-goals/*` - Reading goals

### User Features
- `/api/v1/user/*` - User profile
- `/api/v1/user-library/*` - User's book library
- `/api/v1/dashboard/*` - User dashboard

### Admin Features
- `/api/v1/admin/*` - Admin operations
- `/api/v1/admin/stats/*` - Statistics
- `/api/v1/admin/email/*` - Email management

### Content
- `/api/v1/blog/*` - Blog posts
- `/api/v1/about/*` - About content
- `/api/v1/faq/*` - FAQ management
- `/api/v1/reviews/*` - Book reviews

## Migration Guide

### Frontend Updates Required

Update all API calls to use the new versioned endpoints:

**Before**:
```javascript
axios.post('/auth/login', credentials)
axios.get('/books/')
```

**After**:
```javascript
axios.post('/api/v1/auth/login', credentials)
axios.get('/api/v1/books/')
```

### Environment Variables

Update your base URL configuration:
```javascript
// .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```javascript
// API client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Now you can use:
api.post('/auth/login', credentials)
api.get('/books/')
```

## Benefits

1. **Version Control**: Easy to introduce breaking changes in v2 while maintaining v1
2. **Clear Structure**: All API endpoints under consistent prefix
3. **Better Documentation**: Swagger UI and ReDoc for interactive exploration
4. **Professional**: Industry-standard API versioning approach
5. **Future-Proof**: Easy to add new versions without breaking existing clients

## Future Versions

When introducing breaking changes, create v2:
```python
API_V2_PREFIX = "/api/v2"
# Add new routers with v2 prefix
```

Both versions can coexist:
- `/api/v1/*` - Legacy endpoints
- `/api/v2/*` - New endpoints with breaking changes
