#!/usr/bin/env python3
"""
Add metadata column to notifications table if it doesn't exist
"""

import sys
import os
from sqlalchemy import text, inspect
from core.database import engine, get_db

def add_metadata_column():
    """Add metadata column to notifications table"""
    
    try:
        # Check if the column already exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('notifications')]
        
        if 'metadata' in columns:
            print("✅ metadata column already exists in notifications table")
            return
        
        print("📝 Adding metadata column to notifications table...")
        
        with engine.connect() as connection:
            # Add the metadata column
            connection.execute(text("""
                ALTER TABLE notifications 
                ADD COLUMN metadata JSON
            """))
            connection.commit()
            
        print("✅ metadata column added successfully")
        
    except Exception as e:
        print(f"❌ Error adding metadata column: {str(e)}")
        return False
    
    return True

def create_sample_notifications():
    """Create some sample admin notifications"""
    
    try:
        from models.notification import Notification
        from sqlalchemy.orm import Session
        
        db = next(get_db())
        
        # Check if we already have sample notifications
        existing_count = db.query(Notification).filter(
            Notification.user_id == None,
            Notification.is_global == True
        ).count()
        
        if existing_count > 0:
            print(f"✅ {existing_count} admin notifications already exist")
            return
        
        print("📝 Creating sample admin notifications...")
        
        sample_notifications = [
            {
                "type": "system",
                "title": "System Maintenance Complete",
                "message": "Scheduled system maintenance has been completed successfully. All services are now operational.",
                "is_global": True,
                "priority": "normal"
            },
            {
                "type": "warning",
                "title": "High Server Load Detected",
                "message": "Server load is currently above 80%. Consider scaling resources if this persists.",
                "is_global": True,
                "priority": "high"
            },
            {
                "type": "info",
                "title": "New User Registration Spike",
                "message": "Unusual increase in user registrations detected. 150 new users in the last hour.",
                "is_global": True,
                "priority": "normal"
            },
            {
                "type": "error",
                "title": "Payment Gateway Alert",
                "message": "Payment processing is experiencing intermittent delays. Monitoring the situation.",
                "is_global": True,
                "priority": "urgent"
            },
            {
                "type": "success",
                "title": "Database Backup Complete",
                "message": "Daily database backup completed successfully at 2:00 AM.",
                "is_global": True,
                "priority": "low"
            }
        ]
        
        created_count = 0
        for notif_data in sample_notifications:
            notification = Notification(
                user_id=None,  # Global admin notification
                type=notif_data["type"],
                title=notif_data["title"],
                message=notif_data["message"],
                is_read=False,
                is_global=notif_data["is_global"],
                priority=notif_data["priority"],
                extra_data={"source": "system", "auto_generated": True}
            )
            db.add(notification)
            created_count += 1
        
        db.commit()
        print(f"✅ Created {created_count} sample admin notifications")
        
    except Exception as e:
        print(f"❌ Error creating sample notifications: {str(e)}")
        if 'db' in locals():
            db.rollback()

if __name__ == "__main__":
    print("🔧 Setting up admin notifications...")
    
    # Add metadata column
    if add_metadata_column():
        # Create sample notifications
        create_sample_notifications()
    
    print("🎉 Setup complete!")