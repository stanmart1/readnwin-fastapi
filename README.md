# ReadnWin FastAPI Backend

This project now contains only the FastAPI backend for the ReadnWin e-book platform.

## Project Structure

- `readnwin-backend/` - Main FastAPI application
  - `core/` - Core configuration and utilities
  - `models/` - SQLAlchemy database models
  - `routers/` - API route handlers
  - `schemas/` - Pydantic schemas for request/response validation
  - `services/` - Business logic services
  - `middleware/` - Custom middleware
  - `migrations/` - Database migration files
  - `uploads/` - File upload storage

## Getting Started

1. Navigate to the backend directory:
   ```bash
   cd readnwin-backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python main.py
   ```

## Frontend

The NextJS frontend has been completely removed. A new React frontend will be implemented separately.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`