#!/bin/bash

# ReadnWin FastAPI Backend Startup Script
echo "🚀 Starting ReadnWin FastAPI Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/readnwin-backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=readnwin_db

# JWT Configuration
SECRET_KEY=your_super_secret_key_here_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
EOF
    echo "📝 Please edit the .env file with your database credentials before running the backend."
    echo "💡 You can also use SQLite for development by changing the database URL in core/config.py"
fi

# Check if database is accessible (optional)
echo "🔍 Checking database connection..."
python -c "
try:
    from core.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️  Database connection warning: {e}')
    print('💡 The API will still start but some features may not work')
"

# Start the FastAPI server
echo "🌟 Starting FastAPI server on http://localhost:9000"
echo "📖 API documentation will be available at http://localhost:9000/docs"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python run.py
