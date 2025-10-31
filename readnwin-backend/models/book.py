from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    books = relationship("Book", back_populates="category")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subtitle = Column(String)
    author = Column(String, nullable=False)
    description = Column(Text)
    short_description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    original_price = Column(Numeric(10, 2))
    cost_price = Column(Numeric(10, 2))
    cover_image = Column(String)
    file_path = Column(String)
    sample_path = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    isbn = Column(String, unique=True)
    is_featured = Column(Boolean, default=False, index=True)
    is_bestseller = Column(Boolean, default=False, index=True)
    is_new_release = Column(Boolean, default=False, index=True)
    format = Column(String, default="ebook", index=True)
    stock_quantity = Column(Integer, default=0)
    inventory_enabled = Column(Boolean, default=False)
    low_stock_threshold = Column(Integer, default=10)
    weight_grams = Column(Integer)
    dimensions = Column(String)
    shipping_class = Column(String)
    status = Column(String, default="published", index=True)
    is_active = Column(Boolean, default=True, index=True)
    pages = Column(Integer)
    language = Column(String, default="English")
    publisher = Column(String)
    publication_date = Column(DateTime)
    author_id = Column(Integer, index=True)
    seo_title = Column(String)
    seo_description = Column(Text)
    seo_keywords = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="books")
    order_items = relationship("OrderItem", back_populates="book")
    cart_items = relationship("Cart", back_populates="book")
    reviews = relationship("Review", back_populates="book")
    library_entries = relationship("UserLibrary", back_populates="book")
    reading_sessions = relationship("ReadingSession", back_populates="book")
