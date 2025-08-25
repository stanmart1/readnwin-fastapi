"""Add missing book fields for frontend integration

This migration adds all the missing fields that the frontend book upload
components expect but are not currently in the database schema.
"""

from sqlalchemy import text
from core.database import engine

def upgrade():
    """Add missing book fields"""
    with engine.connect() as conn:
        # Add new columns to books table
        migrations = [
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS subtitle VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS short_description TEXT",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2)",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2)",

            "ALTER TABLE books ADD COLUMN IF NOT EXISTS sample_path VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS is_new_release BOOLEAN DEFAULT FALSE",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS inventory_enabled BOOLEAN DEFAULT FALSE",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS weight_grams INTEGER",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS dimensions VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS shipping_class VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS seo_title VARCHAR",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS seo_description TEXT",
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR"
        ]
        
        for migration in migrations:
            try:
                conn.execute(text(migration))
                print(f"✅ Executed: {migration}")
            except Exception as e:
                print(f"⚠️  Warning: {migration} - {e}")
        
        conn.commit()
        print("✅ Book fields migration completed successfully")

def downgrade():
    """Remove added book fields"""
    with engine.connect() as conn:
        # Remove columns (be careful with this in production)
        rollback_migrations = [
            "ALTER TABLE books DROP COLUMN IF EXISTS subtitle",
            "ALTER TABLE books DROP COLUMN IF EXISTS short_description",
            "ALTER TABLE books DROP COLUMN IF EXISTS original_price",
            "ALTER TABLE books DROP COLUMN IF EXISTS cost_price",

            "ALTER TABLE books DROP COLUMN IF EXISTS sample_path",
            "ALTER TABLE books DROP COLUMN IF EXISTS is_bestseller",
            "ALTER TABLE books DROP COLUMN IF EXISTS is_new_release",
            "ALTER TABLE books DROP COLUMN IF EXISTS inventory_enabled",
            "ALTER TABLE books DROP COLUMN IF EXISTS low_stock_threshold",
            "ALTER TABLE books DROP COLUMN IF EXISTS weight_grams",
            "ALTER TABLE books DROP COLUMN IF EXISTS dimensions",
            "ALTER TABLE books DROP COLUMN IF EXISTS shipping_class",
            "ALTER TABLE books DROP COLUMN IF EXISTS seo_title",
            "ALTER TABLE books DROP COLUMN IF EXISTS seo_description",
            "ALTER TABLE books DROP COLUMN IF EXISTS seo_keywords"
        ]
        
        for migration in rollback_migrations:
            try:
                conn.execute(text(migration))
                print(f"✅ Rolled back: {migration}")
            except Exception as e:
                print(f"⚠️  Warning: {migration} - {e}")
        
        conn.commit()
        print("✅ Book fields rollback completed successfully")

if __name__ == "__main__":
    print("Running book fields migration...")
    upgrade()