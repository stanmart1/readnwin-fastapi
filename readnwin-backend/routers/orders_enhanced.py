from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from core.database import get_db
from core.security import get_current_user_from_token
from schemas.orders import (
    EnhancedOrderCreate,
    EnhancedOrderResponse,
    OrderTrackingUpdate,
    ShippingStatusUpdate,
    GuestCheckoutCreate,
    OrderStatus,
    PaymentStatus
)
from schemas.checkout import CheckoutOrder, CheckoutResponse
from models.order import Order, OrderItem
from models.book import Book
from models.cart import Cart

router = APIRouter(prefix="/orders/enhanced", tags=["orders"])

SHIPPING_METHODS = {
    "standard": {
        "name": "Standard Shipping",
        "description": "5-7 business days",
        "price": Decimal("4.99"),
        "free_threshold": Decimal("50.00"),
        "estimated_days": "5-7"
    },
    "express": {
        "name": "Express Shipping",
        "description": "2-3 business days",
        "price": Decimal("9.99"),
        "free_threshold": Decimal("100.00"),
        "estimated_days": "2-3"
    },
    "digital": {
        "name": "Digital Delivery",
        "description": "Instant download",
        "price": Decimal("0.00"),
        "free_threshold": Decimal("0.00"),
        "estimated_days": "instant"
    }
}

@router.post("/", response_model=EnhancedOrderResponse)
async def create_enhanced_order(
    order: EnhancedOrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create an enhanced order with additional features"""
    # Validate cart items
    cart_items = db.query(Cart).filter(
        Cart.user_id == current_user.id
    ).all()
    
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # Calculate totals and determine if shipping is needed
    subtotal = sum(item.quantity * item.book.price for item in cart_items)
    has_physical_books = any(item.book.format == "physical" for item in cart_items)
    
    # Skip shipping for eBook-only orders
    shipping_method = order.shipping_method if has_physical_books else "digital"
    shipping_address = order.shipping_address.dict() if has_physical_books else None
    
    # Create order
    new_order = Order(
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        total_amount=subtotal,
        shipping_method=shipping_method,
        shipping_address=shipping_address,
        billing_address=order.billing_address.dict() if order.billing_address else (shipping_address or {}),
        created_at=datetime.utcnow()
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Create order items
    for cart_item in cart_items:
        order_item = OrderItem(
            order_id=new_order.id,
            book_id=cart_item.book_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.book.price,
            subtotal=cart_item.quantity * cart_item.book.price
        )
        db.add(order_item)
    
    # Clear cart
    for item in cart_items:
        db.delete(item)
    
    db.commit()
    
    return new_order

@router.get("/{order_id}/tracking", response_model=OrderTrackingUpdate)
async def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get enhanced order tracking information"""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this order"
        )
    
    return {
        "order_id": order.id,
        "status": order.status,
        "shipping_status": order.shipping_status,
        "estimated_delivery": order.estimated_delivery,
        "tracking_number": order.tracking_number,
        "tracking_url": order.tracking_url if order.tracking_url else None,
        "last_updated": order.updated_at
    }

@router.put("/{order_id}/shipping", response_model=ShippingStatusUpdate)
async def update_shipping_status(
    order_id: int,
    status: ShippingStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update shipping status with enhanced details"""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Only allow staff/admin to update shipping status
    if not current_user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update shipping status"
        )
    
    order.shipping_status = status.status
    order.tracking_number = status.tracking_number
    order.tracking_url = status.tracking_url
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

@router.post("/guest-checkout", response_model=EnhancedOrderResponse)
async def process_guest_checkout(
    order: GuestCheckoutCreate,
    db: Session = Depends(get_db)
):
    """Process guest checkout with enhanced features"""
    # Validate cart items exist and are available
    cart_items = []
    total_amount = Decimal("0")
    
    for item in order.items:
        book = db.query(Book).filter(Book.id == item.book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Book with id {item.book_id} not found"
            )
        
        if book.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for book {book.title}"
            )
            
        cart_items.append({
            "book": book,
            "quantity": item.quantity
        })
        total_amount += book.price * item.quantity
    
    # Create guest order
    guest_order = Order(
        guest_email=order.email,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        total_amount=total_amount,
        shipping_method=order.shipping_method,
        shipping_address=order.shipping_address.dict(),
        billing_address=order.billing_address.dict() if order.billing_address else order.shipping_address.dict(),
        created_at=datetime.utcnow()
    )
    
    db.add(guest_order)
    db.commit()
    db.refresh(guest_order)
    
    # Create order items
    for cart_item in cart_items:
        order_item = OrderItem(
            order_id=guest_order.id,
            book_id=cart_item["book"].id,
            quantity=cart_item["quantity"],
            unit_price=cart_item["book"].price,
            subtotal=cart_item["quantity"] * cart_item["book"].price
        )
        db.add(order_item)
    
    db.commit()
    
    return guest_order

@router.get("/guest/{guest_id}", response_model=List[EnhancedOrderResponse])
async def get_guest_orders(
    guest_id: str,
    db: Session = Depends(get_db)
):
    """Get orders for a guest user"""
    orders = db.query(Order).filter(
        Order.guest_email == guest_id
    ).order_by(Order.created_at.desc()).all()
    
    return orders

@router.post("/{order_id}/confirmation", response_model=EnhancedOrderResponse)
async def process_order_confirmation(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Process enhanced order confirmation workflow"""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify order belongs to user or is a guest order with matching email
    if (order.user_id and order.user_id != current_user.id) or \
       (order.guest_email and order.guest_email != current_user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this order"
        )
    
    # Update order status
    order.status = OrderStatus.PROCESSING
    order.confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

# New checkout endpoint that matches the frontend requirements
@router.post("/checkout-new", response_model=CheckoutResponse)
async def create_checkout(
    checkout_data: CheckoutOrder,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_from_token)
):
    """Create a new checkout order with enhanced features"""
    # Handle both authenticated and guest users
    if current_user:
        cart_items = db.query(Cart).filter(
            Cart.user_id == current_user.id
        ).all()
        
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty"
            )
    else:
        # Validate items for guest checkout
        cart_items = []
        for item in checkout_data.items:
            book = db.query(Book).filter(Book.id == item["book_id"]).first()
            if not book:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Book with id {item['book_id']} not found"
                )
            cart_items.append({
                "book": book,
                "quantity": item["quantity"]
            })
    
    # Calculate totals
    subtotal = sum(
        item.quantity * item.book.price 
        if isinstance(item, Cart) 
        else item["quantity"] * item["book"].price 
        for item in cart_items
    )
    
    # Get shipping cost
    shipping_details = SHIPPING_METHODS[checkout_data.shipping_method]
    shipping_cost = shipping_details["price"]
    if subtotal >= shipping_details["free_threshold"]:
        shipping_cost = Decimal("0")
    
    total_amount = subtotal + shipping_cost
    
    # Create order
    new_order = Order(
        user_id=current_user.id if current_user else None,
        guest_email=None if current_user else checkout_data.email,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total_amount=total_amount,
        shipping_method=checkout_data.shipping_method,
        shipping_address=checkout_data.shipping_address,
        billing_address=checkout_data.billing_address or checkout_data.shipping_address,
        notes=checkout_data.notes,
        created_at=datetime.utcnow()
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Create order items
    for item in cart_items:
        if isinstance(item, Cart):
            order_item = OrderItem(
                order_id=new_order.id,
                book_id=item.book_id,
                quantity=item.quantity,
                unit_price=item.book.price,
                subtotal=item.quantity * item.book.price
            )
        else:
            order_item = OrderItem(
                order_id=new_order.id,
                book_id=item["book"].id,
                quantity=item["quantity"],
                unit_price=item["book"].price,
                subtotal=item["quantity"] * item["book"].price
            )
        db.add(order_item)
    
    # Clear cart for authenticated users
    if current_user:
        for item in cart_items:
            db.delete(item)
    
    db.commit()
    
    return CheckoutResponse(
        order_id=new_order.id,
        status=new_order.status,
        payment_status=new_order.payment_status,
        total_amount=new_order.total_amount,
        shipping_cost=new_order.shipping_cost,
        payment_details={
            "method": checkout_data.payment_method,
            "status": PaymentStatus.PENDING
        },
        created_at=new_order.created_at
    )
