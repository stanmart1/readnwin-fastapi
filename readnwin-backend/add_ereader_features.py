"""
Add highlights and notes tables for e-reader features
"""
from sqlalchemy import create_engine, text
from core.config import settings

engine = create_engine(settings.database_url)

def add_ereader_tables():
    """Add highlights and notes tables"""
    with engine.connect() as conn:
        # Create highlights table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS highlights (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                color VARCHAR(50) DEFAULT 'yellow',
                start_offset INTEGER NOT NULL,
                end_offset INTEGER NOT NULL,
                context TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create notes table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                highlight_id INTEGER REFERENCES highlights(id) ON DELETE SET NULL,
                position INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Create indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON highlights(user_id, book_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notes_user_book ON notes(user_id, book_id)"))
        
        conn.commit()
        print("✅ E-reader tables created successfully")

if __name__ == "__main__":
    add_ereader_tables()
