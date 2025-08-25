from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from core.database import get_db
from core.security import get_current_user_from_token
from lib.currency_utils import to_naira_decimal, calculate_vat
from schemas.shopping import (
    EnhancedCartResponse,
    EnhancedCartItemCreate,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    ShoppingPreferences
)

router = APIRouter(prefix="/shopping", tags=["shopping"])

# Enhanced Cart Management
# Removed duplicate cart endpoint - use /cart/ from cart.py instead
async def get_enhanced_cart(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get enhanced cart with additional features"""
    from models.cart import Cart
    
    cart_items = db.query(Cart).filter(
        Cart.user_id == current_user.id
    ).join(Cart.book).all()
    
    items = []
    subtotal = to_naira_decimal('0.00')
    
    for item in cart_items:
        book_price = to_naira_decimal(item.book.price)
        item_total = book_price * item.quantity
        subtotal += item_total
        items.append({
            "id": item.id,
            "book_id": item.book_id,
            "title": item.book.title,
            "price": float(book_price),
            "quantity": item.quantity,
            "total": float(item_total)
        })
    
    tax = calculate_vat(subtotal)
    shipping = to_naira_decimal('1000.00') if subtotal < to_naira_decimal('10000.00') else to_naira_decimal('0.00')
    total = subtotal + tax + shipping
    
    return EnhancedCartResponse(
        id=f"cart_{current_user.id}",
        items=items,
        subtotal=float(subtotal),
        tax=float(tax),
        estimated_shipping=float(shipping),
        total=float(total),
        available_discounts=[],
        recommended_items=[],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

# Removed duplicate cart endpoint - use /cart/add from cart.py instead
async def add_to_enhanced_cart(
    item: EnhancedCartItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Add item to enhanced cart"""
    from models.cart import Cart
    from models.book import Book
    
    # Validate book exists
    book = db.query(Book).filter(Book.id == item.product_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if item already in cart
    existing_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.book_id == item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item.quantity
    else:
        cart_item = Cart(
            user_id=current_user.id,
            book_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)
    
    db.commit()
    
    # Return updated cart
    return await get_enhanced_cart(db, current_user)

# Enhanced Checkout Process
@router.post("/checkout/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    session: CheckoutSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create enhanced checkout session"""
    import uuid
    
    # Validate cart exists
    cart = await get_enhanced_cart(db, current_user)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    session_id = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(hours=1)
    
    return CheckoutSessionResponse(
        session_id=session_id,
        status="active",
        cart=cart,
        customer_info={"email": current_user.email},
        shipping_methods=[
            {"id": "standard", "name": "Standard Delivery", "price": 1000.00, "days": "3-5"},
            {"id": "express", "name": "Express Delivery", "price": 2000.00, "days": "1-2"}
        ],
        payment_methods=[
            {"id": "card", "name": "Debit/Credit Card"},
            {"id": "bank_transfer", "name": "Bank Transfer"},
            {"id": "flutterwave", "name": "Flutterwave"}
        ],
        expires_at=expires_at
    )

@router.get("/checkout/session/{session_id}", response_model=CheckoutSessionResponse)
async def get_checkout_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get checkout session details"""
    # Implementation here
    pass

# Shopping Preferences
@router.get("/preferences", response_model=ShoppingPreferences)
async def get_shopping_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get user's shopping preferences"""
    # Return default preferences for now
    return ShoppingPreferences(
        preferred_categories=["Fiction", "Technology"],
        favorite_authors=[],
        price_range={"min": 500.0, "max": 10000.0},
        preferred_formats=["ebook", "physical"],
        notification_preferences={"email": True, "sms": False},
        accessibility_settings={"large_text": False, "high_contrast": False},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@router.put("/preferences", response_model=ShoppingPreferences)
async def update_shopping_preferences(
    preferences: ShoppingPreferences,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update user's shopping preferences"""
    # Implementation here
    pass

# Guest Cart Management
@router.post("/guest-cart", response_model=EnhancedCartResponse)
async def create_guest_cart(
    db: Session = Depends(get_db)
):
    """Create a new guest cart"""
    # Implementation here
    pass

@router.get("/guest-cart/{cart_id}", response_model=EnhancedCartResponse)
async def get_guest_cart(
    cart_id: str,
    db: Session = Depends(get_db)
):
    """Get guest cart by ID"""
    # Implementation here
    pass
