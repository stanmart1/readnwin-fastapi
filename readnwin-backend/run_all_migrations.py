#!/usr/bin/env python3
"""
Run all database migrations
"""
import sys
from sqlalchemy import create_engine, text, inspect
from core.config import settings

def run_migrations():
    """Run all necessary migrations"""
    print("=" * 60)
    print("RUNNING ALL MIGRATIONS")
    print("=" * 60)
    
    print("\n1. Creating all tables from models...")
    from core.database import Base, engine as app_engine
    from models import (
        user, role, book, order, cart, contact, contact_settings, blog, faq, 
        portfolio, review, notification, reading_session, user_library, auth_log, 
        payment, payment_settings, shipping, enhanced_shopping, email, email_templates, 
        author, about_content, email_gateway, reader_settings, achievement, 
        system_settings, token_blacklist, security_log, reading
    )
    
    try:
        Base.metadata.create_all(bind=app_engine, checkfirst=True)
        print("   ✅ All model tables created")
    except Exception as e:
        print(f"   ⚠️  Some tables already exist (continuing): {str(e)[:100]}")
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        print("\n2. Creating additional authentication tables...")
        
        # Token Blacklist (if not created by model)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS token_blacklist (
                id SERIAL PRIMARY KEY,
                token_jti VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                reason VARCHAR(100) DEFAULT 'logout'
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at)"))
        print("   ✅ token_blacklist")
        
        # Security Logs
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS security_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                event_type VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                details TEXT,
                risk_level VARCHAR(20) DEFAULT 'low',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event_type)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC)"))
        print("   ✅ security_logs")
        
        # Login Attempts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                success BOOLEAN DEFAULT FALSE,
                failure_reason VARCHAR(100),
                attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                user_agent TEXT
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at DESC)"))
        print("   ✅ login_attempts")
        
        print("\n3. Creating e-reader tables...")
        
        # Highlights
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS highlights (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                book_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                color VARCHAR(50) DEFAULT 'yellow',
                start_offset INTEGER NOT NULL,
                end_offset INTEGER NOT NULL,
                context TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON highlights(user_id, book_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_highlights_created ON highlights(created_at DESC)"))
        print("   ✅ highlights")
        
        # Notes
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                book_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                highlight_id INTEGER,
                position INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notes_user_book ON notes(user_id, book_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)"))
        print("   ✅ notes")
        
        print("\n4. Adding missing user columns...")
        
        # Check and add columns
        conn.execute(text("""
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='verification_token') THEN
                        ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) UNIQUE;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='verification_token_expires') THEN
                        ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='is_email_verified') THEN
                        ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='users' AND column_name='last_login') THEN
                        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
                    END IF;
                END IF;
            END $$;
        """))
        print("   ✅ User columns updated")
        
        print("\n5. Creating indexes...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)"))
        print("   ✅ Indexes created")
        
        conn.commit()
    
    print("\n" + "=" * 60)
    print("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        run_migrations()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
