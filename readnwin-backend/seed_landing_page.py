"""
Seed script for landing page content
Run: python seed_landing_page.py
"""
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from models.about_content import AboutContent
from models.testimonial import Testimonial
from models.blog import BlogPost
from models.portfolio import Portfolio
import json

def seed_about_content(db: Session):
    """Seed about section content"""
    print("Seeding about content...")
    
    # Check if content already exists
    existing = db.query(AboutContent).first()
    if existing:
        print("About content already exists, skipping...")
        return
    
    about_data = [
        {
            "section": "hero",
            "content": {
                "title": "About ReadnWin",
                "subtitle": "Empowering The Mind Through Reading"
            }
        },
        {
            "section": "mission",
            "content": {
                "description": "Our mission is to make quality literature accessible to everyone, everywhere. We're building the world's most comprehensive digital reading platform, combining cutting-edge technology with timeless storytelling to create an experience that inspires, educates, and entertains.",
                "features": ["Unlimited Access", "AI-Powered Recommendations", "Global Community"]
            }
        },
        {
            "section": "values",
            "content": [
                {
                    "icon": "ri-book-open-line",
                    "title": "Accessibility",
                    "description": "Making reading accessible to everyone"
                },
                {
                    "icon": "ri-lightbulb-line",
                    "title": "Innovation",
                    "description": "Cutting-edge technology"
                }
            ]
        },
        {
            "section": "aboutSection",
            "content": {
                "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
                "imageAlt": "ReadnWin - Empowering minds through reading"
            }
        }
    ]
    
    for item in about_data:
        about = AboutContent(
            section=item["section"],
            content=item["content"],
            is_active=True
        )
        db.add(about)
    
    db.commit()
    print("✅ About content seeded successfully")

def seed_testimonials(db: Session):
    """Seed testimonials"""
    print("Seeding testimonials...")
    
    # Check if testimonials already exist
    existing = db.query(Testimonial).first()
    if existing:
        print("Testimonials already exist, skipping...")
        return
    
    testimonials_data = [
        {
            "name": "Sarah Johnson",
            "role": "Book Enthusiast",
            "content": "ReadnWin has completely transformed my reading habits. The platform is intuitive, and the rewards system keeps me motivated to read more!",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3B82F6&color=fff",
            "is_featured": True,
            "order_index": 1
        },
        {
            "name": "Michael Chen",
            "role": "Student",
            "content": "As a student, I love how accessible ReadnWin makes quality literature. The e-reader is fantastic, and I've won several prizes!",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=Michael+Chen&background=8B5CF6&color=fff",
            "is_featured": True,
            "order_index": 2
        },
        {
            "name": "Emma Davis",
            "role": "Teacher",
            "content": "I recommend ReadnWin to all my students. It's an excellent platform that combines education with entertainment perfectly.",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=Emma+Davis&background=10B981&color=fff",
            "is_featured": True,
            "order_index": 3
        },
        {
            "name": "James Wilson",
            "role": "Professional",
            "content": "The reading analytics feature helps me track my progress. ReadnWin has made reading a daily habit for me.",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=James+Wilson&background=F59E0B&color=fff",
            "is_featured": True,
            "order_index": 4
        },
        {
            "name": "Lisa Anderson",
            "role": "Book Blogger",
            "content": "The community features are amazing! I've connected with so many fellow readers and discovered incredible books.",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=Lisa+Anderson&background=EF4444&color=fff",
            "is_featured": True,
            "order_index": 5
        },
        {
            "name": "David Brown",
            "role": "Entrepreneur",
            "content": "ReadnWin fits perfectly into my busy schedule. I can read anywhere, anytime, and the recommendations are spot-on!",
            "rating": 5,
            "avatar_url": "https://ui-avatars.com/api/?name=David+Brown&background=06B6D4&color=fff",
            "is_featured": True,
            "order_index": 6
        }
    ]
    
    for item in testimonials_data:
        testimonial = Testimonial(**item, is_active=True)
        db.add(testimonial)
    
    db.commit()
    print("✅ Testimonials seeded successfully")

def seed_blog_posts(db: Session):
    """Seed blog posts"""
    print("Seeding blog posts...")
    
    # Check if blog posts already exist
    existing = db.query(BlogPost).first()
    if existing:
        print("Blog posts already exist, skipping...")
        return
    
    # Get or create a default author (admin user)
    from models.user import User
    admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
    
    if not admin_user:
        print("⚠️  No admin user found, skipping blog posts...")
        return
    
    blog_posts_data = [
        {
            "title": "The Power of Reading: Transform Your Life",
            "slug": "power-of-reading-transform-your-life",
            "content": "Reading is one of the most powerful tools for personal growth and transformation. In this comprehensive guide, we explore how developing a consistent reading habit can change your perspective, expand your knowledge, and open new opportunities in your life. From improving cognitive function to reducing stress, the benefits of reading are backed by science and experienced by millions of readers worldwide.",
            "excerpt": "Discover how reading can change your perspective and open new opportunities.",
            "author_id": admin_user.id,
            "is_published": True
        },
        {
            "title": "10 Must-Read Books for 2025",
            "slug": "10-must-read-books-2025",
            "content": "As we navigate through 2025, these ten books stand out as essential reading for anyone looking to stay informed, inspired, and entertained. Our curated list spans multiple genres including fiction, non-fiction, self-help, and business. Each book has been carefully selected based on its impact, relevance, and ability to resonate with modern readers. Whether you're looking for escapism or enlightenment, this list has something for everyone.",
            "excerpt": "Our curated list of the most anticipated books this year.",
            "author_id": admin_user.id,
            "is_published": True
        },
        {
            "title": "Building Better Reading Habits",
            "slug": "building-better-reading-habits",
            "content": "Creating a sustainable reading habit doesn't have to be difficult. In this practical guide, we share proven strategies and techniques to help you make reading a natural part of your daily routine. Learn how to set realistic goals, choose the right books, create a reading-friendly environment, and overcome common obstacles that prevent people from reading regularly. With these tips, you'll be well on your way to becoming a lifelong reader.",
            "excerpt": "Practical tips to make reading a daily habit.",
            "author_id": admin_user.id,
            "is_published": True
        },
        {
            "title": "The Science Behind Speed Reading",
            "slug": "science-behind-speed-reading",
            "content": "Speed reading has fascinated people for decades, but what does science actually say about it? In this article, we dive deep into the research behind speed reading techniques, examining what works, what doesn't, and how you can realistically improve your reading speed without sacrificing comprehension. We'll debunk common myths and provide evidence-based strategies for reading more efficiently.",
            "excerpt": "Exploring the truth about speed reading and comprehension.",
            "author_id": admin_user.id,
            "is_published": True
        },
        {
            "title": "Digital vs Physical Books: The Great Debate",
            "slug": "digital-vs-physical-books-debate",
            "content": "The debate between digital and physical books continues to divide readers. Both formats have their unique advantages and devoted followers. In this balanced analysis, we examine the pros and cons of each format, considering factors like convenience, reading experience, environmental impact, and cost. Whether you're team e-book or team paperback, understanding both perspectives can help you make informed choices about your reading preferences.",
            "excerpt": "An objective look at the pros and cons of each format.",
            "author_id": admin_user.id,
            "is_published": True
        },
        {
            "title": "How to Start a Book Club",
            "slug": "how-to-start-book-club",
            "content": "Book clubs are a wonderful way to combine your love of reading with social connection. Starting your own book club can seem daunting, but with the right approach, it can be incredibly rewarding. This comprehensive guide covers everything from finding members and choosing books to facilitating discussions and keeping everyone engaged. Learn from experienced book club organizers and discover tips for creating a thriving reading community.",
            "excerpt": "Complete guide to creating and managing a successful book club.",
            "author_id": admin_user.id,
            "is_published": True
        }
    ]
    
    for item in blog_posts_data:
        blog_post = BlogPost(**item)
        db.add(blog_post)
    
    db.commit()
    print("✅ Blog posts seeded successfully")

def seed_portfolio_works(db: Session):
    """Seed portfolio works"""
    print("Seeding portfolio works...")
    
    # Check if works already exist
    existing = db.query(Portfolio).first()
    if existing:
        print("Portfolio works already exist, skipping...")
        return
    
    works_data = [
        {
            "title": "Digital Library Platform",
            "description": "A comprehensive digital library system with advanced search and recommendation features.",
            "image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
            "order_index": 1,
            "is_active": True
        },
        {
            "title": "Reading Analytics Dashboard",
            "description": "Real-time analytics and insights for tracking reading habits and progress.",
            "image_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
            "order_index": 2,
            "is_active": True
        },
        {
            "title": "Mobile Reading App",
            "description": "Cross-platform mobile application for seamless reading on the go.",
            "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
            "order_index": 3,
            "is_active": True
        },
        {
            "title": "E-Book Marketplace",
            "description": "Secure marketplace for buying, selling, and trading digital books.",
            "image_url": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800",
            "order_index": 4,
            "is_active": True
        }
    ]
    
    for item in works_data:
        work = Portfolio(**item)
        db.add(work)
    
    db.commit()
    print("✅ Portfolio works seeded successfully")

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        seed_about_content(db)
        seed_testimonials(db)
        seed_blog_posts(db)
        seed_portfolio_works(db)
        
        print("=" * 50)
        print("✅ All landing page content seeded successfully!")
        print("\nYou can now:")
        print("- View about content at: GET /api/about")
        print("- View testimonials at: GET /api/testimonials")
        print("- View blog posts at: GET /api/blog/posts")
        print("- View works at: GET /api/works")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
