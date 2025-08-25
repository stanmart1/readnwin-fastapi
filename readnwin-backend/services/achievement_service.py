from sqlalchemy.orm import Session
from models.achievement import Achievement

def initialize_default_achievements(db: Session):
    """Initialize default achievements if they don't exist"""
    try:
        # Check if achievements already exist
        existing_count = db.query(Achievement).count()
        if existing_count > 0:
            return
        
        default_achievements = [
            {
                "name": "First Finish",
                "description": "Complete your first book",
                "achievement_type": "books_read",
                "icon": "ri-book-line",
                "requirement_value": 1
            },
            {
                "name": "Bookworm",
                "description": "Complete 10 books",
                "achievement_type": "books_read",
                "icon": "ri-book-open-line",
                "requirement_value": 10
            },
            {
                "name": "Scholar",
                "description": "Complete 25 books",
                "achievement_type": "books_read",
                "icon": "ri-graduation-cap-line",
                "requirement_value": 25
            },
            {
                "name": "Reading Habit",
                "description": "Complete 10 reading sessions",
                "achievement_type": "reading_sessions",
                "icon": "ri-calendar-check-line",
                "requirement_value": 10
            },
            {
                "name": "Page Turner",
                "description": "Read 1000 pages",
                "achievement_type": "pages_read",
                "icon": "ri-file-text-line",
                "requirement_value": 1000
            },
            {
                "name": "Speed Reader",
                "description": "Read 5000 pages",
                "achievement_type": "pages_read",
                "icon": "ri-flashlight-line",
                "requirement_value": 5000
            }
        ]
        
        for achievement_data in default_achievements:
            achievement = Achievement(**achievement_data)
            db.add(achievement)
        
        db.commit()
        print("✅ Default achievements initialized")
        
    except Exception as e:
        print(f"❌ Error initializing achievements: {e}")
        db.rollback()