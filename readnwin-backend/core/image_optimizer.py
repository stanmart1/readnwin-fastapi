from pathlib import Path
from PIL import Image
import logging

class ImageOptimizer:
    """Image compression utilities without format conversion"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def optimize_image(self, image_path: Path, quality: int = 85) -> dict:
        """Compress image without changing format"""
        try:
            if not image_path.exists():
                return {'success': False, 'error': 'File not found'}
            
            original_size = image_path.stat().st_size
            
            with Image.open(image_path) as img:
                # Keep original format
                img_format = img.format
                
                # Optimize based on format
                if img_format in ['JPEG', 'JPG']:
                    img.save(image_path, format='JPEG', quality=quality, optimize=True)
                elif img_format == 'PNG':
                    img.save(image_path, format='PNG', optimize=True, compress_level=9)
                elif img_format == 'WEBP':
                    img.save(image_path, format='WEBP', quality=quality, method=6)
                else:
                    return {'success': False, 'error': f'Unsupported format: {img_format}'}
            
            new_size = image_path.stat().st_size
            saved = original_size - new_size
            
            return {
                'success': True,
                'original_size': original_size,
                'new_size': new_size,
                'saved': saved,
                'format': img_format
            }
        except Exception as e:
            self.logger.error(f"Failed to optimize {image_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    def batch_optimize_all_images(self, storage, db) -> dict:
        """Optimize all images in covers and images directories"""
        results = {
            'covers': {'processed': 0, 'optimized': 0, 'errors': 0, 'size_saved': 0},
            'images': {'processed': 0, 'optimized': 0, 'errors': 0, 'size_saved': 0}
        }
        
        # Optimize cover images
        if storage.covers_dir.exists():
            for file in storage.covers_dir.iterdir():
                if file.is_file() and file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    results['covers']['processed'] += 1
                    result = self.optimize_image(file)
                    if result['success']:
                        results['covers']['optimized'] += 1
                        results['covers']['size_saved'] += result['saved']
                    else:
                        results['covers']['errors'] += 1
        
        # Optimize general images
        if storage.images_dir.exists():
            for file in storage.images_dir.rglob('*'):
                if file.is_file() and file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    results['images']['processed'] += 1
                    result = self.optimize_image(file)
                    if result['success']:
                        results['images']['optimized'] += 1
                        results['images']['size_saved'] += result['saved']
                    else:
                        results['images']['errors'] += 1
        
        return results

image_optimizer = ImageOptimizer()