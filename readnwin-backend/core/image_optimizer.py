"""
Disabled image optimization module
"""
from pathlib import Path

class ImageOptimizer:
    """Disabled image optimization utilities"""
    
    def __init__(self):
        pass
    
    def optimize_cover(self, image_path: Path) -> Path:
        """Return original path without optimization"""
        return image_path
    
    def optimize_team_photo(self, image_path: Path) -> Path:
        """Return original path without optimization"""
        return image_path
    
    def optimize_general(self, image_path: Path) -> Path:
        """Return original path without optimization"""
        return image_path

# Global instance
image_optimizer = ImageOptimizer()