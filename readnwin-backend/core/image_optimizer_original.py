"""
Image optimization module for book covers and other images
"""
from pathlib import Path
from PIL import Image, ImageOps
import logging

logger = logging.getLogger(__name__)

class ImageOptimizer:
    """Image optimization and conversion utilities"""
    
    def __init__(self):
        self.cover_size = (400, 600)  # Standard book cover size
        self.thumbnail_size = (150, 225)  # Thumbnail size
        self.team_photo_size = (300, 300)  # Team photo size
        self.quality = 85  # JPEG/WebP quality
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'}
    
    def optimize_cover(self, image_path: Path) -> Path:
        """Optimize book cover image and convert to WebP"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize maintaining aspect ratio
                img = ImageOps.fit(img, self.cover_size, Image.Resampling.LANCZOS)
                
                # Save as WebP
                webp_path = image_path.with_suffix('.webp')
                img.save(webp_path, 'WebP', quality=self.quality, optimize=True)
                
                # Remove original if different format
                if image_path.suffix.lower() != '.webp':
                    image_path.unlink()
                
                return webp_path
        except Exception as e:
            logger.error(f"Failed to optimize cover image {image_path}: {e}")
            return image_path  # Return original on error
    
    def optimize_team_photo(self, image_path: Path) -> Path:
        """Optimize team photo"""
        try:
            with Image.open(image_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                img = ImageOps.fit(img, self.team_photo_size, Image.Resampling.LANCZOS)
                
                webp_path = image_path.with_suffix('.webp')
                img.save(webp_path, 'WebP', quality=self.quality, optimize=True)
                
                if image_path.suffix.lower() != '.webp':
                    image_path.unlink()
                
                return webp_path
        except Exception as e:
            logger.error(f"Failed to optimize team photo {image_path}: {e}")
            return image_path
    
    def optimize_general(self, image_path: Path) -> Path:
        """Optimize general images"""
        try:
            with Image.open(image_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Don't resize, just optimize
                webp_path = image_path.with_suffix('.webp')
                img.save(webp_path, 'WebP', quality=self.quality, optimize=True)
                
                if image_path.suffix.lower() != '.webp':
                    image_path.unlink()
                
                return webp_path
        except Exception as e:
            logger.error(f"Failed to optimize image {image_path}: {e}")
            return image_path

    def batch_optimize_covers(self, storage_manager, db_session=None):
        """Batch optimize all book cover images"""
        from models.book import Book
        
        results = {
            'processed': 0,
            'optimized': 0,
            'errors': 0,
            'size_saved': 0
        }
        
        covers_dir = storage_manager.covers_dir
        if not covers_dir.exists():
            return results
        
        # Get all image files
        image_files = []
        for ext in self.supported_formats:
            image_files.extend(covers_dir.glob(f'*{ext}'))
        
        for image_path in image_files:
            try:
                results['processed'] += 1
                original_size = image_path.stat().st_size
                
                # Optimize image
                optimized_path = self.optimize_cover(image_path)
                
                if optimized_path != image_path:
                    # Image was converted
                    results['optimized'] += 1
                    new_size = optimized_path.stat().st_size
                    results['size_saved'] += (original_size - new_size)
                    
                    # Update database if session provided
                    if db_session:
                        old_relative = f"covers/{image_path.name}"
                        new_relative = f"covers/{optimized_path.name}"
                        
                        books = db_session.query(Book).filter(Book.cover_image == old_relative).all()
                        for book in books:
                            book.cover_image = new_relative
                        
                        if books:
                            db_session.commit()
                            
            except Exception as e:
                results['errors'] += 1
                logger.error(f"Error optimizing {image_path}: {e}")
        
        return results
    
    def batch_optimize_all_images(self, storage_manager, db_session=None):
        """Batch optimize all images in storage"""
        results = {
            'covers': self.batch_optimize_covers(storage_manager, db_session),
            'images': {'processed': 0, 'optimized': 0, 'errors': 0, 'size_saved': 0}
        }
        
        # Optimize general images
        images_dir = storage_manager.images_dir
        if images_dir.exists():
            image_files = []
            for ext in self.supported_formats:
                image_files.extend(images_dir.rglob(f'*{ext}'))
            
            for image_path in image_files:
                try:
                    results['images']['processed'] += 1
                    original_size = image_path.stat().st_size
                    
                    optimized_path = self.optimize_general(image_path)
                    
                    if optimized_path != image_path:
                        results['images']['optimized'] += 1
                        new_size = optimized_path.stat().st_size
                        results['images']['size_saved'] += (original_size - new_size)
                        
                except Exception as e:
                    results['images']['errors'] += 1
                    logger.error(f"Error optimizing {image_path}: {e}")
        
        return results

# Global instance
image_optimizer = ImageOptimizer()