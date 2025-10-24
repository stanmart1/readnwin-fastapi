from core.database import SessionLocal
from models.review import Review
from models.user import User
from models.book import Book
from datetime import datetime

db = SessionLocal()

# Get first user and books
user = db.query(User).first()
books = db.query(Book).limit(5).all()

if not user or not books:
    print("❌ Need at least 1 user and 1 book in database")
    db.close()
    exit()

reviews_data = [
    {"rating": 5, "title": "Amazing Read!", "text": "This book completely changed my perspective. Highly recommend to everyone!", "featured": True},
    {"rating": 5, "title": "Couldn't Put It Down", "text": "Stayed up all night reading. The story was captivating from start to finish.", "featured": True},
    {"rating": 4, "title": "Great Book", "text": "Really enjoyed this one. Well-written and engaging throughout.", "featured": True},
    {"rating": 5, "title": "Must Read", "text": "One of the best books I've read this year. The author's writing style is incredible.", "featured": True},
    {"rating": 4, "title": "Highly Recommended", "text": "A wonderful reading experience. Would definitely recommend to friends.", "featured": True},
]

for i, review_data in enumerate(reviews_data):
    book = books[i % len(books)]
    
    existing = db.query(Review).filter(
        Review.user_id == user.id,
        Review.book_id == book.id
    ).first()
    
    if not existing:
        review = Review(
            user_id=user.id,
            book_id=book.id,
            rating=review_data["rating"],
            title=review_data["title"],
            review_text=review_data["text"],
            comment=review_data["text"],
            is_featured=review_data["featured"],
            is_verified_purchase=True,
            created_at=datetime.utcnow()
        )
        db.add(review)

db.commit()
print(f"✅ Seeded {len(reviews_data)} reviews")
db.close()
