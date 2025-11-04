from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from core.image_optimizer import image_optimizer
from models.user import User
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/admin", tags=["admin-image-optimization"])

class OptimizationResult(BaseModel):
    success: bool
    message: str
    results: dict

def run_image_optimization(db: Session):
    """Background task to optimize images"""
    try:
        logging.info("Starting image optimization process...")
        results = image_optimizer.batch_optimize_all_images(storage, db)
        
        total_processed = results['covers']['processed'] + results['images']['processed']
        total_optimized = results['covers']['optimized'] + results['images']['optimized']
        total_errors = results['covers']['errors'] + results['images']['errors']
        total_saved = results['covers']['size_saved'] + results['images']['size_saved']
        
        logging.info(f"Image optimization completed: {total_optimized}/{total_processed} optimized, {total_saved} bytes saved, {total_errors} errors")
        
    except Exception as e:
        logging.error(f"Image optimization failed: {e}")

@router.post("/optimize-images", response_model=OptimizationResult)
async def optimize_images(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Start image optimization process"""
    check_admin_access(current_user)
    
    try:
        # Run optimization in background
        background_tasks.add_task(run_image_optimization, db)
        
        return OptimizationResult(
            success=True,
            message="Image optimization started in background",
            results={}
        )
        
    except Exception as e:
        logging.error(f"Failed to start image optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/optimization-status")
async def get_optimization_status(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current optimization status and statistics"""
    check_admin_access(current_user)
    
    try:
        from PIL import Image
        
        covers_dir = storage.covers_dir
        images_dir = storage.images_dir
        
        stats = {
            'covers': {'total': 0, 'webp': 0, 'other': 0},
            'images': {'total': 0, 'webp': 0, 'other': 0}
        }
        
        # Count cover images
        if covers_dir.exists():
            for file in covers_dir.iterdir():
                if file.is_file() and file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    stats['covers']['total'] += 1
                    # Check if image is already optimized (has optimize flag in metadata)
                    try:
                        with Image.open(file) as img:
                            # Consider optimized if file size is reasonable or already processed
                            if file.stat().st_size < 500000:  # Less than 500KB considered optimized
                                stats['covers']['webp'] += 1
                            else:
                                stats['covers']['other'] += 1
                    except:
                        stats['covers']['other'] += 1
        
        # Count general images
        if images_dir.exists():
            for file in images_dir.rglob('*'):
                if file.is_file() and file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    stats['images']['total'] += 1
                    try:
                        with Image.open(file) as img:
                            if file.stat().st_size < 500000:
                                stats['images']['webp'] += 1
                            else:
                                stats['images']['other'] += 1
                    except:
                        stats['images']['other'] += 1
        
        return {
            'success': True,
            'stats': stats,
            'optimization_needed': stats['covers']['other'] + stats['images']['other'] > 0
        }
        
    except Exception as e:
        logging.error(f"Failed to get optimization status: {e}")
        raise HTTPException(status_code=500, detail=str(e))