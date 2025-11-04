from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
from pathlib import Path
from core.storage import storage

router = APIRouter()

@router.get("/debug/storage")
async def debug_storage():
    """Debug endpoint to check storage configuration and file existence"""
    try:
        debug_info = {
            "environment": os.getenv("ENVIRONMENT", "development"),
            "storage_config": {
                "base_dir": str(storage.base_dir),
                "url_prefix": storage.url_prefix,
                "base_dir_exists": storage.base_dir.exists(),
                "base_dir_is_dir": storage.base_dir.is_dir() if storage.base_dir.exists() else False,
            },
            "directories": {},
            "sample_files": []
        }
        
        # Check each subdirectory
        for name, directory in [
            ("covers", storage.covers_dir),
            ("books", storage.books_dir), 
            ("samples", storage.samples_dir),
            ("images", storage.images_dir)
        ]:
            debug_info["directories"][name] = {
                "path": str(directory),
                "exists": directory.exists(),
                "is_dir": directory.is_dir() if directory.exists() else False,
                "file_count": len(list(directory.iterdir())) if directory.exists() and directory.is_dir() else 0
            }
            
            # List some files in images directory
            if name == "images" and directory.exists() and directory.is_dir():
                try:
                    files = list(directory.rglob("*"))[:10]  # First 10 files recursively
                    debug_info["sample_files"] = [
                        {
                            "path": str(f.relative_to(storage.base_dir)),
                            "full_path": str(f),
                            "exists": f.exists(),
                            "size": f.stat().st_size if f.exists() else 0,
                            "url": storage.get_url(str(f.relative_to(storage.base_dir)))
                        }
                        for f in files if f.is_file()
                    ]
                except Exception as e:
                    debug_info["sample_files_error"] = str(e)
        
        return JSONResponse(content=debug_info)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@router.get("/debug/storage/test-file")
async def test_file_access():
    """Test accessing a specific file that's failing"""
    test_files = [
        "images/works/20251031_122534_d7acb63a.jpg",
        "images/works/20251025_222930_655800a8.png"
    ]
    
    results = []
    for file_path in test_files:
        full_path = storage.get_file_path(file_path)
        url = storage.get_url(file_path)
        
        results.append({
            "relative_path": file_path,
            "full_path": str(full_path),
            "url": url,
            "exists": full_path.exists(),
            "size": full_path.stat().st_size if full_path.exists() else 0,
            "parent_exists": full_path.parent.exists(),
            "parent_is_dir": full_path.parent.is_dir() if full_path.parent.exists() else False
        })
    
    return JSONResponse(content={"test_results": results})

@router.get("/debug/storage/list-works")
async def list_works_files():
    """List all files in the works directory"""
    try:
        works_dir = storage.images_dir / "works"
        if not works_dir.exists():
            return JSONResponse(content={
                "error": "Works directory does not exist",
                "path": str(works_dir)
            })
        
        files = []
        for file_path in works_dir.iterdir():
            if file_path.is_file():
                files.append({
                    "name": file_path.name,
                    "full_path": str(file_path),
                    "relative_path": str(file_path.relative_to(storage.base_dir)),
                    "size": file_path.stat().st_size,
                    "url": storage.get_url(str(file_path.relative_to(storage.base_dir)))
                })
        
        return JSONResponse(content={
            "works_directory": str(works_dir),
            "file_count": len(files),
            "files": files[:20]  # First 20 files
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)