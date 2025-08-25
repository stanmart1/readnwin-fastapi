#!/usr/bin/env python3
"""
Initialize database with sample data for testing ReadnWin backend endpoints
Run this script to create sample users, books, and other data needed for testing
"""

import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from passlib.context import CryptContext

# Add the parent directory to Python path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import get_db, engine, Base
from models.user import User
from models.role import Role, Permission, RolePermission
from models.book import Book, Category
from models.order import Order, OrderItem
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.notification import Notification
from models.contact import Contact

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_roles_and_permissions():
    """Create basic roles and permissions"""
    db = next(get_db())

    # Create permissions
    permissions = [
        Permission(name="read_books", description="Can read books"),
        Permission(name="manage_library", description="Can manage personal library"),
        Permission(name="admin_access", description="Administrative access"),
        Permission(name="manage_users", description="Can manage users"),
        Permission(name="manage_books", description="Can manage books"),
        Permission(name="view_stats", description="Can view statistics"),
    ]

    for perm in permissions:
        existing = db.query(Permission).filter(Permission.name == perm.name).first()
        if not existing:
            db.add(perm)

    db.commit()

    # Create roles
    user_role = db.query(Role).filter(Role.name == "user").first()
    if not user_role:
        user_role = Role(
            name="user",
            display_name="Regular User",
            description="Regular user with basic access"
        )
        db.add(user_role)

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(
            name="admin",
            display_name="Administrator",
            description="Administrator with full access"
        )
        db.add(admin_role)

    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if not super_admin_role:
        super_admin_role = Role(
            name="super_admin",
            display_name="Super Administrator",
            description="Super administrator with all permissions"
        )
        db.add(super_admin_role)

    db.commit()

    # Assign permissions to roles
    user_perms = ["read_books", "manage_library"]
    admin_perms = ["read_books", "manage_library", "admin_access", "view_stats", "manage_books"]
    super_admin_perms = ["read_books", "manage_library", "admin_access", "manage_users", "manage_books", "view_stats"]

    # Assign user permissions
    for perm_name in user_perms:
        perm = db.query(Permission).filter(Permission.name == perm_name).first()
        if perm:
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == user_role.id,
                RolePermission.permission_id == perm.id
            ).first()
            if not existing:
                db.add(RolePermission(role_id=user_role.id, permission_id=perm.id))

    # Assign admin permissions
    for perm_name in admin_perms:
        perm = db.query(Permission).filter(Permission.name == perm_name).first()
        if perm:
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == admin_role.id,
                RolePermission.permission_id == perm.id
            ).first()
            if not existing:
                db.add(RolePermission(role_id=admin_role.id, permission_id=perm.id))

    # Assign super admin permissions
    for perm_name in super_admin_perms:
        perm = db.query(Permission).filter(Permission.name == perm_name).first()
        if perm:
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == super_admin_role.id,
                RolePermission.permission_id == perm.id
            ).first()
            if not existing:
                db.add(RolePermission(role_id=super_admin_role.id, permission_id=perm.id))

    db.commit()
    db.close()
    print("✅ Roles and permissions created successfully")

def create_categories():
    """Create book categories"""
    db = next(get_db())

    categories = [
        Category(name="Fiction", description="Fictional stories and novels"),
        Category(name="Non-Fiction", description="Non-fictional books and documentaries"),
        Category(name="Science Fiction", description="Science fiction and fantasy"),
        Category(name="Mystery", description="Mystery and thriller books"),
        Category(name="Romance", description="Romance novels"),
        Category(name="Biography", description="Biographies and memoirs"),
        Category(name="Self-Help", description="Self-improvement and motivational books"),
        Category(name="Technology", description="Technology and programming books"),
        Category(name="History", description="Historical books and accounts"),
        Category(name="Business", description="Business and entrepreneurship books"),
    ]

    for category in categories:
        existing = db.query(Category).filter(Category.name == category.name).first()
        if not existing:
            db.add(category)

    db.commit()
    db.close()
    print("✅ Categories created successfully")

def create_sample_books():
    """Create sample books"""
    db = next(get_db())

    # Get categories
    fiction_cat = db.query(Category).filter(Category.name == "Fiction").first()
    scifi_cat = db.query(Category).filter(Category.name == "Science Fiction").first()
    tech_cat = db.query(Category).filter(Category.name == "Technology").first()
    business_cat = db.query(Category).filter(Category.name == "Business").first()

    books = [
        Book(
            title="The Great Adventure",
            author="John Smith",
            description="An epic tale of adventure and discovery",
            price=Decimal("19.99"),
            category_id=fiction_cat.id if fiction_cat else None,
            isbn="978-0123456789",
            is_featured=True
        ),
        Book(
            title="Future Worlds",
            author="Jane Doe",
            description="A journey through possible futures",
            price=Decimal("24.99"),
            category_id=scifi_cat.id if scifi_cat else None,
            isbn="978-0123456790",
            is_featured=True
        ),
        Book(
            title="Python Programming Mastery",
            author="Tech Guru",
            description="Complete guide to Python programming",
            price=Decimal("39.99"),
            category_id=tech_cat.id if tech_cat else None,
            isbn="978-0123456791",
            is_featured=False
        ),
        Book(
            title="Startup Success",
            author="Business Pro",
            description="How to build a successful startup",
            price=Decimal("29.99"),
            category_id=business_cat.id if business_cat else None,
            isbn="978-0123456792",
            is_featured=True
        ),
        Book(
            title="Mystery of the Lost City",
            author="Mystery Writer",
            description="A thrilling mystery adventure",
            price=Decimal("22.99"),
            category_id=fiction_cat.id if fiction_cat else None,
            isbn="978-0123456793",
            is_featured=False
        ),
        Book(
            title="AI and Machine Learning",
            author="Data Scientist",
            description="Introduction to AI and ML concepts",
            price=Decimal("34.99"),
            category_id=tech_cat.id if tech_cat else None,
            isbn="978-0123456794",
            is_featured=True
        ),
        Book(
            title="The Digital Revolution",
            author="Tech Historian",
            description="How technology changed our world",
            price=Decimal("27.99"),
            category_id=tech_cat.id if tech_cat else None,
            isbn="978-0123456795",
            is_featured=False
        ),
        Book(
            title="Leadership Principles",
            author="Leadership Expert",
            description="Essential leadership skills for success",
            price=Decimal("31.99"),
            category_id=business_cat.id if business_cat else None,
            isbn="978-0123456796",
            is_featured=True
        ),
    ]

    for book in books:
        existing = db.query(Book).filter(Book.isbn == book.isbn).first()
        if not existing:
            db.add(book)

    db.commit()
    db.close()
    print("✅ Sample books created successfully")

def create_users():
    """Create sample users"""
    db = next(get_db())

    # Get roles
    user_role = db.query(Role).filter(Role.name == "user").first()
    admin_role = db.query(Role).filter(Role.name == "admin").first()

    users = [
        User(
            email="test@example.com",
            username="testuser",
            password_hash=get_password_hash("testpass123"),
            first_name="Test",
            last_name="User",
            role_id=user_role.id if user_role else None,
            is_active=True,
            is_email_verified=True
        ),
        User(
            email="admin@example.com",
            username="admin",
            password_hash=get_password_hash("adminpass123"),
            first_name="Admin",
            last_name="User",
            role_id=admin_role.id if admin_role else None,
            is_active=True,
            is_email_verified=True
        ),
        User(
            email="john.doe@example.com",
            username="johndoe",
            password_hash=get_password_hash("password123"),
            first_name="John",
            last_name="Doe",
            role_id=user_role.id if user_role else None,
            is_active=True,
            is_email_verified=True
        ),
        User(
            email="jane.smith@example.com",
            username="janesmith",
            password_hash=get_password_hash("password123"),
            first_name="Jane",
            last_name="Smith",
            role_id=user_role.id if user_role else None,
            is_active=True,
            is_email_verified=True
        ),
    ]

    for user in users:
        existing = db.query(User).filter(User.email == user.email).first()
        if not existing:
            db.add(user)
            print(f"Created user: {user.email}")

    db.commit()
    db.close()
    print("✅ Sample users created successfully")

def create_sample_orders_and_library():
    """Create sample orders and populate user libraries"""
    db = next(get_db())

    # Get users and books
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    john_user = db.query(User).filter(User.email == "john.doe@example.com").first()
    books = db.query(Book).limit(5).all()

    if not test_user or not books:
        print("⚠️ Users or books not found, skipping orders and library creation")
        db.close()
        return

    # Create orders for test user
    order1 = Order(
        user_id=test_user.id,
        total_amount=Decimal("44.98"),
        status="completed",
        payment_method="credit_card",
        created_at=datetime.utcnow() - timedelta(days=30)
    )
    db.add(order1)
    db.flush()  # Get the order ID

    # Add order items
    order_item1 = OrderItem(
        order_id=order1.id,
        book_id=books[0].id,
        quantity=1,
        price=books[0].price
    )
    order_item2 = OrderItem(
        order_id=order1.id,
        book_id=books[1].id,
        quantity=1,
        price=books[1].price
    )
    db.add(order_item1)
    db.add(order_item2)

    # Create second order
    order2 = Order(
        user_id=test_user.id,
        total_amount=books[2].price,
        status="completed",
        payment_method="paypal",
        created_at=datetime.utcnow() - timedelta(days=15)
    )
    db.add(order2)
    db.flush()

    order_item3 = OrderItem(
        order_id=order2.id,
        book_id=books[2].id,
        quantity=1,
        price=books[2].price
    )
    db.add(order_item3)

    # Create library entries for test user
    library_entries = [
        UserLibrary(
            user_id=test_user.id,
            book_id=books[0].id,
            status="completed",
            progress=100.0,
            last_read_at=datetime.utcnow() - timedelta(days=5),
            created_at=datetime.utcnow() - timedelta(days=30)
        ),
        UserLibrary(
            user_id=test_user.id,
            book_id=books[1].id,
            status="reading",
            progress=65.0,
            last_read_at=datetime.utcnow() - timedelta(days=1),
            created_at=datetime.utcnow() - timedelta(days=30)
        ),
        UserLibrary(
            user_id=test_user.id,
            book_id=books[2].id,
            status="unread",
            progress=0.0,
            created_at=datetime.utcnow() - timedelta(days=15)
        ),
    ]

    for entry in library_entries:
        existing = db.query(UserLibrary).filter(
            UserLibrary.user_id == entry.user_id,
            UserLibrary.book_id == entry.book_id
        ).first()
        if not existing:
            db.add(entry)

    # Create library entries for john user
    if john_user and len(books) > 3:
        john_library = [
            UserLibrary(
                user_id=john_user.id,
                book_id=books[3].id,
                status="reading",
                progress=45.0,
                last_read_at=datetime.utcnow() - timedelta(days=2),
                created_at=datetime.utcnow() - timedelta(days=20)
            ),
            UserLibrary(
                user_id=john_user.id,
                book_id=books[4].id,
                status="completed",
                progress=100.0,
                last_read_at=datetime.utcnow() - timedelta(days=10),
                created_at=datetime.utcnow() - timedelta(days=25)
            ),
        ]

        for entry in john_library:
            existing = db.query(UserLibrary).filter(
                UserLibrary.user_id == entry.user_id,
                UserLibrary.book_id == entry.book_id
            ).first()
            if not existing:
                db.add(entry)

    db.commit()
    db.close()
    print("✅ Sample orders and library entries created successfully")

def create_reading_sessions():
    """Create sample reading sessions"""
    db = next(get_db())

    test_user = db.query(User).filter(User.email == "test@example.com").first()
    john_user = db.query(User).filter(User.email == "john.doe@example.com").first()
    books = db.query(Book).limit(3).all()

    if not test_user or not books:
        print("⚠️ Users or books not found, skipping reading sessions creation")
        db.close()
        return

    # Create reading sessions for test user
    sessions = [
        ReadingSession(
            user_id=test_user.id,
            book_id=books[0].id,
            duration=45.0,
            pages_read=15,
            progress=25.0,
            created_at=datetime.utcnow() - timedelta(days=5)
        ),
        ReadingSession(
            user_id=test_user.id,
            book_id=books[0].id,
            duration=60.0,
            pages_read=20,
            progress=58.0,
            created_at=datetime.utcnow() - timedelta(days=4)
        ),
        ReadingSession(
            user_id=test_user.id,
            book_id=books[0].id,
            duration=30.0,
            pages_read=12,
            progress=100.0,
            created_at=datetime.utcnow() - timedelta(days=3)
        ),
        ReadingSession(
            user_id=test_user.id,
            book_id=books[1].id,
            duration=40.0,
            pages_read=18,
            progress=35.0,
            created_at=datetime.utcnow() - timedelta(days=2)
        ),
        ReadingSession(
            user_id=test_user.id,
            book_id=books[1].id,
            duration=50.0,
            pages_read=22,
            progress=65.0,
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
    ]

    # Create sessions for john user
    if john_user and len(books) > 2:
        john_sessions = [
            ReadingSession(
                user_id=john_user.id,
                book_id=books[2].id,
                duration=35.0,
                pages_read=12,
                progress=30.0,
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            ReadingSession(
                user_id=john_user.id,
                book_id=books[2].id,
                duration=45.0,
                pages_read=16,
                progress=45.0,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
        ]
        sessions.extend(john_sessions)

    for session in sessions:
        db.add(session)

    db.commit()
    db.close()
    print("✅ Sample reading sessions created successfully")

def create_reading_goals():
    """Create sample reading goals"""
    db = next(get_db())

    test_user = db.query(User).filter(User.email == "test@example.com").first()
    john_user = db.query(User).filter(User.email == "john.doe@example.com").first()

    if not test_user:
        print("⚠️ Test user not found, skipping reading goals creation")
        db.close()
        return

    current_year = datetime.utcnow().year

    goals = [
        ReadingGoal(
            user_id=test_user.id,
            goal_type="books",
            target_value=24,
            current_value=8,
            start_date=datetime(current_year, 1, 1),
            end_date=datetime(current_year, 12, 31),
            completed=False
        ),
        ReadingGoal(
            user_id=test_user.id,
            goal_type="pages",
            target_value=5000,
            current_value=1200,
            start_date=datetime(current_year, 1, 1),
            end_date=datetime(current_year, 12, 31),
            completed=False
        ),
    ]

    if john_user:
        john_goals = [
            ReadingGoal(
                user_id=john_user.id,
                goal_type="books",
                target_value=12,
                current_value=3,
                start_date=datetime(current_year, 1, 1),
                end_date=datetime(current_year, 12, 31),
                completed=False
            ),
        ]
        goals.extend(john_goals)

    for goal in goals:
        existing = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == goal.user_id,
            ReadingGoal.goal_type == goal.goal_type,
            ReadingGoal.start_date == goal.start_date
        ).first()
        if not existing:
            db.add(goal)

    db.commit()
    db.close()
    print("✅ Sample reading goals created successfully")

def create_notifications():
    """Create sample notifications"""
    db = next(get_db())

    test_user = db.query(User).filter(User.email == "test@example.com").first()
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()

    if not test_user:
        print("⚠️ Test user not found, skipping notifications creation")
        db.close()
        return

    notifications = [
        Notification(
            user_id=test_user.id,
            title="Welcome to ReadnWin!",
            message="Thank you for joining ReadnWin. Start exploring our book collection!",
            type="welcome",
            is_read=True,
            priority="normal",
            created_at=datetime.utcnow() - timedelta(days=30)
        ),
        Notification(
            user_id=test_user.id,
            title="Reading Goal Progress",
            message="You're making great progress on your yearly reading goal! Keep it up!",
            type="achievement",
            is_read=False,
            priority="normal",
            created_at=datetime.utcnow() - timedelta(days=7)
        ),
        Notification(
            user_id=test_user.id,
            title="New Book Recommendation",
            message="Based on your reading history, we think you'll love 'The Digital Revolution'",
            type="recommendation",
            is_read=False,
            priority="low",
            created_at=datetime.utcnow() - timedelta(days=2)
        ),
        # Global notification for admins
        Notification(
            user_id=None,
            title="System Maintenance",
            message="Scheduled maintenance will occur this weekend. Users may experience brief interruptions.",
            type="system",
            is_global=True,
            is_read=False,
            priority="high",
            created_at=datetime.utcnow() - timedelta(days=1),
            expires_at=datetime.utcnow() + timedelta(days=7)
        ),
    ]

    if admin_user:
        admin_notifications = [
            Notification(
                user_id=admin_user.id,
                title="New User Registration",
                message="A new user has registered: jane.smith@example.com",
                type="admin",
                is_read=False,
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=6)
            ),
            Notification(
                user_id=admin_user.id,
                title="Monthly Stats Available",
                message="Your monthly statistics report is ready for review.",
                type="stats",
                is_read=False,
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
        ]
        notifications.extend(admin_notifications)

    for notification in notifications:
        db.add(notification)

    db.commit()
    db.close()
    print("✅ Sample notifications created successfully")

def create_sample_contacts():
    """Create sample contact messages"""
    db = next(get_db())

    contacts = [
        Contact(
            name="Alice Johnson",
            email="alice@example.com",
            subject="Question about book availability",
            message="Hi, I'm looking for a specific book on machine learning. Do you have 'Pattern Recognition and Machine Learning' by Bishop?",
            is_resolved=False,
            created_at=datetime.utcnow() - timedelta(days=5)
        ),
        Contact(
            name="Bob Wilson",
            email="bob@example.com",
            subject="Technical issue with reading app",
            message="I'm having trouble accessing my library on the mobile app. The books don't seem to load properly.",
            is_resolved=True,
            created_at=datetime.utcnow() - timedelta(days=10)
        ),
        Contact(
            name="Carol Brown",
            email="carol@example.com",
            subject="Subscription inquiry",
            message="I'd like to know more about your premium subscription plans. What additional features do they include?",
            is_resolved=False,
            created_at=datetime.utcnow() - timedelta(days=2)
        ),
    ]

    for contact in contacts:
        db.add(contact)

    db.commit()
    db.close()
    print("✅ Sample contact messages created successfully")

def main():
    """Main function to initialize all sample data"""
    print("🚀 Initializing ReadnWin Database with Sample Data")
    print("=" * 60)

    try:
        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")

        # Create sample data
        create_roles_and_permissions()
        create_categories()
        create_sample_books()
        create_users()
        create_sample_orders_and_library()
        create_reading_sessions()
        create_reading_goals()
        create_notifications()
        create_sample_contacts()

        print("\n🎉 Sample data initialization completed successfully!")
        print("\nTest credentials created:")
        print("📧 Regular User: test@example.com / testpass123")
        print("🔐 Admin User: admin@example.com / adminpass123")
        print("👤 Additional User: john.doe@example.com / password123")
        print("👤 Additional User: jane.smith@example.com / password123")
        print("\n🧪 You can now run test_endpoints.py to verify all endpoints work correctly")

    except Exception as e:
        print(f"❌ Error initializing sample data: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
