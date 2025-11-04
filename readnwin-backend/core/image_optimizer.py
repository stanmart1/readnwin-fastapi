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

# Global instance
image_optimizer = ImageOptimizer()