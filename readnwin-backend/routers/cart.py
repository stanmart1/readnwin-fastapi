from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.cart import Cart
from models.book import Book, Category
from models.user import User
from core.storage import storage

from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/cart", tags=["cart"])

class CartItem(BaseModel):
    book_id: int
    quantity: int = 1

class CartResponse(BaseModel):
    id: int
    book_id: int
    quantity: int
    book_title: str
    book_author: str
    book_price: float
    book_original_price: float
    book_cover_url: str
    book_cover_image: str
    book_format: str
    book_category: str
    book_stock_quantity: int
    book_is_active: bool
    book_inventory_enabled: bool



@router.get("/", response_model=List[CartResponse])
@router.get("", response_model=List[CartResponse])
def get_cart(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        cart_items = db.query(Cart).join(Book).outerjoin(Category).filter(Cart.user_id == current_user.id).all()
        print(f"Found {len(cart_items)} cart items for user {current_user.id}")
        for item in cart_items:
            print(f"Book: {item.book.title}, Format: {item.book.format}, ID: {item.book.id}")

        response_items = []
        for item in cart_items:
            cover_url = storage.get_url(item.book.cover_image) if item.book.cover_image and item.book.cover_image.strip() else ""
            print(f"Book {item.book.title}: cover_image='{item.book.cover_image}', cover_url='{cover_url}'")
            
            response_items.append(CartResponse(
                id=item.id,
                book_id=item.book_id,
                quantity=item.quantity,
                book_title=item.book.title,
                book_author=item.book.author or "Unknown Author",
                book_price=float(item.book.price),
                book_original_price=float(item.book.original_price) if item.book.original_price else float(item.book.price),
                book_cover_url=cover_url,
                book_cover_image=item.book.cover_image or "",
                book_format=item.book.format or "ebook",
                book_category=item.book.category.name if item.book.category else "Uncategorized",
                book_stock_quantity=item.book.stock_quantity or 0,
                book_is_active=getattr(item.book, 'is_active', True),
                book_inventory_enabled=getattr(item.book, 'inventory_enabled', False)
            ))
        print(f"Returning cart response with formats: {[item.book_format for item in response_items]}")
        return response_items
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load cart: {str(e)}")

@router.post("/add")
def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        user_id = current_user.id
        
        # Check if book exists and is active
        book = db.query(Book).filter(Book.id == item.book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Check if book is active
        if hasattr(book, 'is_active') and not book.is_active:
            raise HTTPException(status_code=400, detail="This book is currently unavailable")
        
        # Check stock only for physical books with inventory enabled
        if (book.format in ['physical', 'both'] and 
            getattr(book, 'inventory_enabled', False) and 
            book.stock_quantity is not None):
            
            # Check current cart quantity for this book
            existing_cart_item = db.query(Cart).filter(
                Cart.user_id == user_id, 
                Cart.book_id == item.book_id
            ).first()
            
            current_cart_qty = existing_cart_item.quantity if existing_cart_item else 0
            total_requested = current_cart_qty + item.quantity
            
            if total_requested > book.stock_quantity:
                available = book.stock_quantity - current_cart_qty
                if available <= 0:
                    raise HTTPException(status_code=400, detail="This book is out of stock")
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Only {available} copies available. You already have {current_cart_qty} in your cart."
                    )

        existing_item = db.query(Cart).filter(Cart.user_id == user_id, Cart.book_id == item.book_id).first()
        if existing_item:
            existing_item.quantity += item.quantity
        else:
            cart_item = Cart(user_id=user_id, book_id=item.book_id, quantity=item.quantity)
            db.add(cart_item)

        db.commit()
        return {"message": "Item added to cart successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add item to cart: {str(e)}")

@router.delete("/{item_id}")
def remove_from_cart(item_id: int, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        user_id = current_user.id
        item = db.query(Cart).filter(Cart.id == item_id, Cart.user_id == user_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        db.delete(item)
        db.commit()
        return {"message": "Item removed from cart"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to remove item: {str(e)}")

class GuestCartTransfer(BaseModel):
    cartItems: List[CartItem]

@router.post("/transfer-guest")
def transfer_guest_cart(transfer_data: GuestCartTransfer, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        user_id = current_user.id
        transferred_count = 0

        for item in transfer_data.cartItems:
            book = db.query(Book).filter(Book.id == item.book_id).first()
            if not book:
                continue
            
            if hasattr(book, 'is_active') and not book.is_active:
                continue
            
            existing_item = db.query(Cart).filter(Cart.user_id == user_id, Cart.book_id == item.book_id).first()
            if existing_item:
                existing_item.quantity += item.quantity
            else:
                cart_item = Cart(user_id=user_id, book_id=item.book_id, quantity=item.quantity)
                db.add(cart_item)
            transferred_count += 1

        db.commit()
        return {"message": "Guest cart transferred successfully", "transferred_items": transferred_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to transfer cart: {str(e)}")

@router.delete("/clear")
def clear_cart(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        if not current_user or not current_user.id:
            raise HTTPException(status_code=401, detail="User not authenticated")
            
        user_id = current_user.id
        print(f"🗑️ Clearing cart for user {user_id}")
        
        deleted_count = db.query(Cart).filter(Cart.user_id == user_id).delete()
        db.commit()
        
        print(f"✅ Cleared {deleted_count} items from cart for user {user_id}")
        return {"message": "Cart cleared successfully", "items_cleared": deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing cart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cart: {str(e)}")
