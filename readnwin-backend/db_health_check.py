#!/usr/bin/env python3
"""
Database health check and connection validation
"""

import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from core.database import engine, test_database_connection

# Load environment variables
load_dotenv()

def comprehensive_db_check():
    """Comprehensive database health check"""
    print("🔍 Running comprehensive database health check...")
    
    checks = {
        "connection": False,
        "tables": False,
        "indexes": False,
        "performance": False
    }
    
    try:
        # 1. Basic connection test
        print("\n1. Testing database connection...")
        checks["connection"] = test_database_connection()
        
        if not checks["connection"]:
            print("❌ Database connection failed - stopping health check")
            return checks
        
        # 2. Check tables exist
        print("\n2. Checking database tables...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
            required_tables = [
                'users', 'roles', 'books', 'orders', 'cart',
                'token_blacklist', 'security_logs', 'login_attempts'
            ]
            
            missing_tables = [t for t in required_tables if t not in tables]
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                checks["tables"] = False
            else:
                print(f"✅ All required tables present ({len(tables)} total)")
                checks["tables"] = True
        
        # 3. Check indexes
        print("\n3. Checking database indexes...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT schemaname, tablename, indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public'
                ORDER BY tablename, indexname
            """))
            indexes = list(result)
            print(f"✅ Found {len(indexes)} indexes")
            checks["indexes"] = True
        
        # 4. Performance test
        print("\n4. Testing query performance...")
        start_time = time.time()
        with engine.connect() as conn:
            conn.execute(text("SELECT COUNT(*) FROM users"))
        query_time = time.time() - start_time
        
        if query_time < 1.0:
            print(f"✅ Query performance good ({query_time:.3f}s)")
            checks["performance"] = True
        else:
            print(f"⚠️ Query performance slow ({query_time:.3f}s)")
            checks["performance"] = False
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Summary
    print("\n📊 Health Check Summary:")
    for check, status in checks.items():
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {check.capitalize()}: {'PASS' if status else 'FAIL'}")
    
    all_passed = all(checks.values())
    print(f"\n🎯 Overall Status: {'HEALTHY' if all_passed else 'NEEDS ATTENTION'}")
    
    return checks

if __name__ == "__main__":
    comprehensive_db_check()