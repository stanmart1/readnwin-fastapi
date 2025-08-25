import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine

def upgrade():
    with engine.connect() as conn:
        migrations = [
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS format VARCHAR DEFAULT 'ebook'",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS pages INTEGER",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'English'",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS author_id INTEGER",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP"
        ]
        
        for migration in migrations:
            try:
                conn.execute(text(migration))
                print(f"✅ {migration}")
            except Exception as e:
                print(f"⚠️  {migration} - {e}")
        
        conn.commit()
        print("✅ Migration completed")

if __name__ == "__main__":
    upgrade()