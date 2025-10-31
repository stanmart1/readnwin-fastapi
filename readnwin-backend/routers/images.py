from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import httpx
from PIL import Image
import io
from typing import Optional
from core.path_validator import validate_path

router = APIRouter(prefix="/images", tags=["images"])

@router.get("/optimize")
async def optimize_image(
    url: str = Query(..., description="Image URL to optimize"),
    w: Optional[int] = Query(None, description="Target width"),
    h: Optional[int] = Query(None, description="Target height"),
    q: int = Query(80, description="Quality (1-100)")
):
    """Optimize and resize images for better performance"""
    try:
        # Handle local file paths
        if url.startswith('/uploads/') or 'localhost' in url:
            # Extract the file path from URL
            if 'localhost' in url:
                # Extract path after localhost:port
                import re
                match = re.search(r'localhost:\d+/(.*)', url)
                if match:
                    file_path = match.group(1)
                else:
                    file_path = url.split('/')[-4:]  # Get last 4 parts for uploads/covers/file
                    file_path = '/'.join(file_path)
            else:
                file_path = url.lstrip('/')
            
            # Clean up any duplicate paths
            if file_path.startswith('uploads/covers/uploads/covers/'):
                file_path = file_path.replace('uploads/covers/uploads/covers/', 'uploads/covers/')
            
            # Validate path to prevent traversal
            safe_path = validate_path("./uploads", file_path)
            if not safe_path or not safe_path.exists():
                raise HTTPException(status_code=404, detail="Image not found")
            
            image_data = safe_path.read_bytes()
        else:
            # Handle external URLs
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code != 200:
                    raise HTTPException(status_code=404, detail="Image not found")
                image_data = response.content

        # Open and process image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Resize if dimensions provided
        if w or h:
            original_width, original_height = image.size
            
            if w and h:
                # Resize to exact dimensions
                image = image.resize((w, h), Image.Resampling.LANCZOS)
            elif w:
                # Resize by width, maintain aspect ratio
                ratio = w / original_width
                new_height = int(original_height * ratio)
                image = image.resize((w, new_height), Image.Resampling.LANCZOS)
            elif h:
                # Resize by height, maintain aspect ratio
                ratio = h / original_height
                new_width = int(original_width * ratio)
                image = image.resize((new_width, h), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=q, optimize=True)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="image/jpeg",
            headers={
                "Cache-Control": "public, max-age=31536000",  # 1 year cache
                "ETag": f'"{hash(url + str(w) + str(h) + str(q))}"'
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@router.get("/thumbnail/{path:path}")
async def get_thumbnail(
    path: str,
    size: int = Query(200, description="Thumbnail size")
):
    """Generate thumbnails for book covers"""
    try:
        # Validate path to prevent traversal
        safe_path = validate_path("./uploads/covers", path)
        if not safe_path or not safe_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = safe_path.read_bytes()
        
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Create square thumbnail
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="image/jpeg",
            headers={
                "Cache-Control": "public, max-age=31536000",
                "ETag": f'"{hash(path + str(size))}"'
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail generation failed: {str(e)}")