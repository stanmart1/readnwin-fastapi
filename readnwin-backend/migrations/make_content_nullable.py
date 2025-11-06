import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    cur = conn.cursor()
    
    try:
        print("Making content field nullable in blog_posts table...")
        cur.execute("ALTER TABLE blog_posts ALTER COLUMN content DROP NOT NULL;")
        conn.commit()
        print("Migration completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
