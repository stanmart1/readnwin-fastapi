"""add performance indexes

Revision ID: perf_indexes_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'perf_indexes_001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Books table indexes
    op.create_index('ix_books_category_id', 'books', ['category_id'], unique=False)
    op.create_index('ix_books_author_id', 'books', ['author_id'], unique=False)
    op.create_index('ix_books_is_active', 'books', ['is_active'], unique=False)
    op.create_index('ix_books_is_featured', 'books', ['is_featured'], unique=False)
    op.create_index('ix_books_is_bestseller', 'books', ['is_bestseller'], unique=False)
    op.create_index('ix_books_is_new_release', 'books', ['is_new_release'], unique=False)
    op.create_index('ix_books_format', 'books', ['format'], unique=False)
    op.create_index('ix_books_status', 'books', ['status'], unique=False)
    
    # Orders table indexes
    op.create_index('ix_orders_user_id', 'orders', ['user_id'], unique=False)
    op.create_index('ix_orders_status', 'orders', ['status'], unique=False)
    
    # Order items table indexes
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'], unique=False)
    op.create_index('ix_order_items_book_id', 'order_items', ['book_id'], unique=False)
    
    # Cart table indexes
    op.create_index('ix_cart_user_id', 'cart', ['user_id'], unique=False)
    op.create_index('ix_cart_book_id', 'cart', ['book_id'], unique=False)
    
    # User library table indexes
    op.create_index('ix_user_library_user_id', 'user_library', ['user_id'], unique=False)
    op.create_index('ix_user_library_book_id', 'user_library', ['book_id'], unique=False)
    op.create_index('ix_user_library_status', 'user_library', ['status'], unique=False)
    
    # Reading sessions table indexes
    op.create_index('ix_reading_sessions_user_id', 'reading_sessions', ['user_id'], unique=False)
    op.create_index('ix_reading_sessions_book_id', 'reading_sessions', ['book_id'], unique=False)
    
    # Highlights table indexes
    op.create_index('ix_highlights_user_id', 'highlights', ['user_id'], unique=False)
    op.create_index('ix_highlights_book_id', 'highlights', ['book_id'], unique=False)
    
    # Notes table indexes
    op.create_index('ix_notes_user_id', 'notes', ['user_id'], unique=False)
    op.create_index('ix_notes_book_id', 'notes', ['book_id'], unique=False)

def downgrade():
    # Drop all indexes in reverse order
    op.drop_index('ix_notes_book_id', 'notes')
    op.drop_index('ix_notes_user_id', 'notes')
    op.drop_index('ix_highlights_book_id', 'highlights')
    op.drop_index('ix_highlights_user_id', 'highlights')
    op.drop_index('ix_reading_sessions_book_id', 'reading_sessions')
    op.drop_index('ix_reading_sessions_user_id', 'reading_sessions')
    op.drop_index('ix_user_library_status', 'user_library')
    op.drop_index('ix_user_library_book_id', 'user_library')
    op.drop_index('ix_user_library_user_id', 'user_library')
    op.drop_index('ix_cart_book_id', 'cart')
    op.drop_index('ix_cart_user_id', 'cart')
    op.drop_index('ix_order_items_book_id', 'order_items')
    op.drop_index('ix_order_items_order_id', 'order_items')
    op.drop_index('ix_orders_status', 'orders')
    op.drop_index('ix_orders_user_id', 'orders')
    op.drop_index('ix_books_status', 'books')
    op.drop_index('ix_books_format', 'books')
    op.drop_index('ix_books_is_new_release', 'books')
    op.drop_index('ix_books_is_bestseller', 'books')
    op.drop_index('ix_books_is_featured', 'books')
    op.drop_index('ix_books_is_active', 'books')
    op.drop_index('ix_books_author_id', 'books')
    op.drop_index('ix_books_category_id', 'books')
