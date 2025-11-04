from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from core.database import get_db
from core.storage import storage

router = APIRouter()

@router.get("/debug/db/works-images")
async def check_works_images(db: Session = Depends(get_db)):
    """Check what image URLs are stored in the database for works"""
    try:
        # Check portfolio/works table
        result = db.execute("SELECT id, title, image_url FROM portfolio LIMIT 10")
        works = result.fetchall()
        
        works_data = []
        for work in works:
            image_url = work[2] if work[2] else None
            full_url = None
            if image_url:
                # Generate full URL using storage manager
                full_url = storage.get_url(image_url)
            
            works_data.append({
                "id": work[0],
                "title": work[1],
                "stored_image_url": image_url,
                "generated_full_url": full_url,
                "file_exists": storage.file_exists(image_url) if image_url else False
            })
        
        return JSONResponse(content={
            "works_count": len(works_data),
            "works": works_data,
            "storage_config": {
                "base_dir": str(storage.base_dir),
                "url_prefix": storage.url_prefix
            }
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/debug/db/sample-urls")
async def check_sample_urls(db: Session = Depends(get_db)):
    """Check a few sample image URLs from different tables"""
    try:
        queries = [
            ("portfolio", "SELECT id, title, image_url FROM portfolio WHERE image_url IS NOT NULL LIMIT 5"),
            ("books", "SELECT id, title, cover_image FROM books WHERE cover_image IS NOT NULL LIMIT 5"),
            ("blog_posts", "SELECT id, title, featured_image FROM blog_posts WHERE featured_image IS NOT NULL LIMIT 5")
        ]
        
        results = {}
        for table_name, query in queries:
            try:
                result = db.execute(query)
                rows = result.fetchall()
                
                table_data = []
                for row in rows:
                    image_path = row[2] if len(row) > 2 and row[2] else None
                    if image_path:
                        table_data.append({
                            "id": row[0],
                            "title": row[1],
                            "stored_path": image_path,
                            "generated_url": storage.get_url(image_path),
                            "file_exists": storage.file_exists(image_path)
                        })
                
                results[table_name] = table_data
            except Exception as e:
                results[table_name] = {"error": str(e)}
        
        return JSONResponse(content=results)
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)