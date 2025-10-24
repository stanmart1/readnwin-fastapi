# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ReadnWin is an e-commerce platform for digital books (ebooks) with an integrated ereader. The application consists of a FastAPI backend and React + Vite frontend.

## Development Commands

### Backend (FastAPI)

**Setup:**
```bash
cd readnwin-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Run Development Server:**
```bash
cd readnwin-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Run Production Server:**
```bash
cd readnwin-backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Database Management:**
```bash
# Create new user manually
cd readnwin-backend
python create_user.py

# Run migrations
cd readnwin-backend/migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

**Testing:**
```bash
# Test email sending
cd readnwin-backend
python test_email_sending.py

# Manual testing endpoints available at /testing/* when app.debug is enabled
```

### Frontend (React + Vite)

**Setup:**
```bash
cd frontend
npm install
```

**Run Development Server:**
```bash
cd frontend
npm run dev
```

**Build for Production:**
```bash
cd frontend
npm run build
```

**Preview Production Build:**
```bash
cd frontend
npm run preview
```

## Architecture

### Backend Structure

**Three-Layer Architecture:**
1. **Routers** (`routers/`) - API endpoints and request/response handling (76 router files)
2. **Services** (`services/`) - Business logic layer (email, authentication, analytics, monitoring, caching)
3. **Models** (`models/`) - SQLAlchemy ORM models (34 models)

**Core Components:**

- `core/database.py` - PostgreSQL connection with connection pooling (QueuePool), production-ready config with SSL support
- `core/security.py` - JWT-based authentication with access/refresh tokens, bcrypt password hashing, token blacklisting
- `core/config.py` - Environment-based configuration using python-decouple
- `core/storage.py` - Centralized file storage manager for covers, books, samples, images
- `core/validation.py` - Request validation utilities
- `core/error_handlers.py` - Centralized exception handling

**Key Services:**

- `services/email_service.py` - Email service wrapper (uses Resend API)
- `services/security_service.py` - Token blacklisting, CSRF protection, suspicious activity detection
- `services/scheduler.py` - APScheduler background tasks (token cleanup runs daily at 2 AM)
- `services/redis_service.py` - Redis integration for caching and rate limiting (optional fallback mode)
- `services/achievement_service.py` - Gamification system for reading goals
- `services/reading_analytics.py` - Reading session tracking and analytics

**Authentication & Authorization:**

- Role-Based Access Control (RBAC) with `Role`, `Permission`, and `RolePermission` models
- User model has `has_admin_access`, `is_author`, and granular `has_permission()` methods
- JWT tokens with unique `jti` field for blacklisting support
- CSRF protection middleware for state-changing operations
- Rate limiting via Redis (with fallback)
- Account lockout after failed login attempts (configurable via `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_DURATION_MINUTES`)

**Data Models (Key Entities):**

- **User System**: `User`, `Role`, `Permission`, `RolePermission`, `AuthLog`, `SecurityLog`
- **Books & Content**: `Book`, `Category`, `Author`, `Review`, `UserLibrary`
- **Orders & Payments**: `Order`, `OrderItem`, `Payment`, `PaymentSettings`, `Cart`, `EnhancedCart`
- **Reading Features**: `ReadingSession`, `ReadingGoal`, `ReaderSettings`, `Achievement`
- **CMS**: `Blog`, `Portfolio`, `FAQ`, `AboutContent`, `Testimonial`
- **Communications**: `Email`, `EmailTemplate`, `EmailGateway`, `Notification`, `ContactSettings`

**Router Organization:**

Routers are prefixed by function:
- `auth*` - Authentication and user management
- `admin_*` - Admin panel features (requires admin role)
- `user_*` - User profile and library management
- `reading_*` - Reading sessions, goals, analytics
- `ereader_*` - Ebook reader functionality
- Public endpoints (books, blog, portfolio, reviews) have no prefix or `/api/` prefix

### Frontend Structure

**React + Vite SPA:**
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/context/` - React Context providers (likely auth, cart)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions
- `src/styles/` - CSS/styling

**Tech Stack:**
- React 18 with React Router DOM
- Tailwind CSS + Framer Motion for animations
- Axios for API calls
- Recharts for analytics visualization
- EpubJS for ebook rendering

### Database

**PostgreSQL with SQLAlchemy ORM:**
- Tables auto-created on startup via `Base.metadata.create_all()`
- Connection pooling: 20 base connections, 30 max overflow
- Pool pre-ping enabled for connection health checks
- SSL mode: "prefer" in production
- Application name: "readnwin_api"

### File Storage

**Centralized StorageManager:**
- Development: `uploads/` directory
- Production: `/app/storage/`
- Subdirectories: `covers/`, `books/`, `samples/`, `images/`
- File uploads generate unique names: `{timestamp}_{uuid}{ext}`
- Validation: Images (jpg, jpeg, png, webp, gif max 10MB), Books (pdf, epub, mobi, html max 500MB)
- Files served via FastAPI StaticFiles mount at `/uploads`

### Environment Configuration

**Required Environment Variables (`.env`):**
```
DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
SECRET_KEY, ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
CSRF_SECRET_KEY
FRONTEND_URL
REDIS_URL (optional)
ENVIRONMENT (development|production)
```

### CORS Configuration

Allowed origins:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://readnwin.com`
- `https://www.readnwin.com`

### API Documentation

FastAPI auto-generates OpenAPI docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Background Tasks

**APScheduler Jobs:**
- Token cleanup runs daily at 2 AM (`services/scheduler.py`)
- Manual cleanup: `python cron_cleanup_tokens.py`

### Development Workflow

1. **Adding New Endpoints**: Create router in `routers/`, add business logic to `services/`, register in `main.py`
2. **Database Changes**: Create migration with Alembic, test locally, apply to production
3. **New Models**: Add to `models/`, import in `main.py` startup to register with SQLAlchemy
4. **Authentication Required**: Use `Depends(get_current_user_from_token)` dependency
5. **Admin Only**: Use `check_admin_access(current_user)` after getting user
6. **File Uploads**: Use `StorageManager` methods (`save_cover`, `save_book`, `save_image`)

### Error Handling

Global exception handlers registered:
- `HTTPException` - Standard FastAPI errors
- `ValidationError` - Pydantic validation failures
- `SQLAlchemyError` - Database errors
- `Exception` - Catch-all for unexpected errors

### Logging

Custom logging configuration in `logging_config.py`:
- Reduces noise from 401 authentication failures
- Uvicorn access logs are filtered for specific patterns

### Optional Features

These features gracefully degrade if unavailable:
- Redis caching/rate limiting (fallback to in-memory)
- Background scheduler (API runs without it)
- Achievement system initialization

### Testing Strategy

- Manual testing endpoints available when `app.debug = True`
- Email testing via `test_email_sending.py`
- Testing router at `/testing/*` prefix (development only)
- No pytest/unittest framework currently configured

### Payment Integration

Multiple payment gateways supported:
- Flutterwave (primary)
- Bank transfer with proof upload
- Payment settings managed in database via admin panel

### Security Features

- JWT with token blacklisting
- CSRF protection for state-changing operations
- Rate limiting (Redis-backed)
- Suspicious activity detection
- Failed login attempt tracking with account lockout
- Password complexity requirements (min 8 chars, uppercase, lowercase, number, special char)
- Email verification for new accounts
