from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.achievement import Achievement

def initialize_default_achievements(db: Session):
    """Initialize default achievements if they don't exist"""
    try:
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
        
        # Only add achievements that don't already exist
        added_count = 0
        for achievement_data in default_achievements:
            try:
                existing = db.query(Achievement).filter(
                    Achievement.achievement_type == achievement_data["achievement_type"]
                ).first()
                if not existing:
                    achievement = Achievement(**achievement_data)
                    db.add(achievement)
                    db.commit()
                    added_count += 1
            except IntegrityError:
                db.rollback()
                # Silently skip if it already exists
                continue
        
        if added_count > 0:
            print(f"✅ Added {added_count} default achievements")
        else:
            print("⏭️  Achievements already exist, skipping initialization")
        
    except Exception as e:
        print(f"❌ Error initializing achievements: {e}")
        db.rollback()
