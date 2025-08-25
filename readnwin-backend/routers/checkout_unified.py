from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.cart import Cart
from models.order import Order, OrderItem
from models.book import Book
from models.payment import Payment, PaymentStatus, PaymentMethodType
from models.shipping import ShippingMethod
from schemas.checkout_unified import (
    CheckoutRequest, 
    CheckoutResponse, 
    OrderSummary,
    PaymentMethodType as SchemaPaymentMethodType
)
from services.resend_email_service import ResendEmailService
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
import os
import requests
import logging
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkout", tags=["checkout"])

class CheckoutService:
    def __init__(self, db: Session):
        self.db = db
        
    def validate_cart_items(self, user_id: int, cart_items_data: List[dict] = None) -> tuple:
        """Validate and fetch cart items with books in a single query"""
        # Use cart items from database, not from request
        cart_items = self.db.query(Cart).filter(Cart.user_id == user_id).all()
        
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty. Please add items to your cart before checkout."
            )
        
        # Fetch all books in one query to avoid N+1 problem
        book_ids = [item.book_id for item in cart_items]
        books = self.db.query(Book).filter(Book.id.in_(book_ids)).all()
        book_dict = {book.id: book for book in books}
        
        # Validate all books exist and are available
        for item in cart_items:
            if item.book_id not in book_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Book with ID {item.book_id} not found"
                )
            
            book = book_dict[item.book_id]
            if book.status != 'published':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Book '{book.title}' is not available"
                )
        
        return cart_items, book_dict
    
    def calculate_order_totals(self, cart_items: List[Cart], book_dict: Dict[int, Book], 
                             shipping_method: dict = None) -> OrderSummary:
        """Calculate order totals with proper decimal handling"""
        subtotal = Decimal('0')
        
        # Calculate subtotal
        for item in cart_items:
            book = book_dict[item.book_id]
            item_total = Decimal(str(book.price)) * item.quantity
            subtotal += item_total
        
        # Calculate shipping cost
        shipping_cost = Decimal('0')
        if shipping_method:
            # Check if cart has physical books
            has_physical_books = any(
                book_dict[item.book_id].format in ['physical', 'both'] 
                for item in cart_items
            )
            
            if has_physical_books:
                base_cost = Decimal(str(shipping_method.get('base_cost', 0)))
                cost_per_item = Decimal(str(shipping_method.get('cost_per_item', 0)))
                
                # Count physical items
                physical_items = sum(
                    item.quantity for item in cart_items
                    if book_dict[item.book_id].format in ['physical', 'both']
                )
                
                shipping_cost = base_cost + (cost_per_item * physical_items)
                
                # Apply free shipping threshold if applicable
                free_threshold = shipping_method.get('free_shipping_threshold')
                if free_threshold and subtotal >= Decimal(str(free_threshold)):
                    shipping_cost = Decimal('0')
        
        # Calculate tax (7.5% VAT)
        tax_amount = subtotal * Decimal('0.075')
        
        # Calculate total
        total_amount = subtotal + shipping_cost + tax_amount
        
        return OrderSummary(
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total_amount=total_amount
        )
    
    def create_order(self, user: User, checkout_data: CheckoutRequest, 
                    order_summary: OrderSummary, cart_items: List[Cart], 
                    book_dict: Dict[int, Book]) -> Order:
        """Create order with proper transaction handling"""
        try:
            # Generate unique order number
            order_number = f"RW{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"
            
            # Check if order has physical books
            has_physical_books = any(
                book_dict[item.book_id].format in ['physical', 'both'] 
                for item in cart_items
            )
            
            # Prepare addresses - use minimal data for ebook-only orders
            if has_physical_books:
                shipping_addr = checkout_data.shipping_address.dict()
                billing_addr = (
                    shipping_addr if checkout_data.billing_address.same_as_shipping 
                    else checkout_data.billing_address.dict()
                )
            else:
                # For ebook-only orders, use minimal address data
                shipping_addr = {
                    'first_name': checkout_data.shipping_address.first_name,
                    'last_name': checkout_data.shipping_address.last_name,
                    'email': checkout_data.shipping_address.email,
                    'phone': checkout_data.shipping_address.phone,
                    'address': 'Digital Delivery',
                    'city': 'Digital',
                    'state': 'Digital',
                    'zip_code': '00000',
                    'country': checkout_data.shipping_address.country
                }
                billing_addr = shipping_addr
            
            # Create order with proper decimal conversion
            order = Order(
                user_id=user.id,
                order_number=order_number,
                total_amount=float(order_summary.total_amount),
                status='pending',
                payment_method=checkout_data.payment.method.value,
                shipping_address=shipping_addr,
                billing_address=billing_addr
            )
            
            self.db.add(order)
            self.db.flush()  # Get order ID
            
            # Create order items
            for cart_item in cart_items:
                book = book_dict[cart_item.book_id]
                order_item = OrderItem(
                    order_id=order.id,
                    book_id=cart_item.book_id,
                    quantity=cart_item.quantity,
                    price=float(book.price),
                    book_format=book.format or 'ebook',
                    book_title=book.title
                )
                self.db.add(order_item)
            
            self.db.flush()
            return order
            
        except Exception as e:
            logger.error(f"Failed to create order: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create order: {str(e)}"
            )
    
    def initialize_payment(self, order: Order, payment_method: SchemaPaymentMethodType, 
                          shipping_address: dict) -> dict:
        """Initialize payment based on method"""
        if payment_method == SchemaPaymentMethodType.FLUTTERWAVE:
            return self._initialize_flutterwave_payment(order, shipping_address)
        elif payment_method == SchemaPaymentMethodType.BANK_TRANSFER:
            return self._initialize_bank_transfer_payment(order)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment method"
            )
    
    def _initialize_flutterwave_payment(self, order: Order, shipping_address: dict) -> dict:
        """Initialize Flutterwave payment with proper error handling"""
        try:
            secret_key = os.getenv("RAVE_LIVE_SECRET_KEY")
            if not secret_key or not secret_key.startswith('FLWSECK-'):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Payment gateway not configured"
                )
            
            # Create payment record
            tx_ref = f'FLW_{order.order_number}_{int(datetime.now().timestamp())}'
            payment = Payment(
                amount=float(order.total_amount),
                currency='NGN',
                payment_method=PaymentMethodType.FLUTTERWAVE,
                description=f'Payment for order {order.order_number}',
                order_id=order.id,
                user_id=order.user_id,
                transaction_reference=tx_ref,
                status=PaymentStatus.PENDING
            )
            
            self.db.add(payment)
            self.db.flush()
            
            # Prepare Flutterwave payload
            base_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000")
            payload = {
                "tx_ref": tx_ref,
                "amount": float(order.total_amount),
                "currency": "NGN",
                "redirect_url": f"{base_url}/payment/verify",
                "payment_options": "card,mobilemoney,ussd,banktransfer",
                "customer": {
                    "email": shipping_address['email'],
                    "phone_number": shipping_address.get('phone') or "+2348000000000",
                    "name": f"{shipping_address['first_name']} {shipping_address['last_name']}"
                },
                "customizations": {
                    "title": "ReadnWin Payment",
                    "description": f"Payment for order {order.order_number}",
                    "logo": f"{base_url}/logo.png"
                },
                "meta": {
                    "order_id": order.id,
                    "user_id": order.user_id,
                    "order_number": order.order_number,
                    "payment_id": payment.id
                }
            }
            
            headers = {
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json"
            }
            
            # Make API request with timeout
            response = requests.post(
                "https://api.flutterwave.com/v3/payments",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "payment_url": data["data"]["link"],
                        "tx_ref": tx_ref
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=data.get("message", "Payment initialization failed")
                    )
            else:
                logger.error(f"Flutterwave API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Payment gateway error"
                )
                
        except requests.RequestException as e:
            logger.error(f"Flutterwave request error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment gateway unavailable"
            )
    
    def _initialize_bank_transfer_payment(self, order: Order) -> dict:
        """Initialize bank transfer payment"""
        try:
            # Create payment record
            tx_ref = f'BT_{order.order_number}_{int(datetime.now().timestamp())}'
            payment = Payment(
                amount=float(order.total_amount),
                currency='NGN',
                payment_method=PaymentMethodType.BANK_TRANSFER,
                description=f'Bank transfer for order {order.order_number}',
                order_id=order.id,
                user_id=order.user_id,
                transaction_reference=tx_ref,
                status=PaymentStatus.AWAITING_APPROVAL
            )
            
            self.db.add(payment)
            self.db.flush()
            
            # Get bank details from environment
            bank_details = {
                "amount": float(order.total_amount),
                "reference": tx_ref,
                "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
                "bank_account": {
                    "bank_name": os.getenv("BANK_NAME", "Access Bank"),
                    "account_number": os.getenv("BANK_ACCOUNT_NUMBER", "0101234567"),
                    "account_name": os.getenv("BANK_ACCOUNT_NAME", "Lagsale Online Resources"),
                    "account_type": os.getenv("BANK_ACCOUNT_TYPE", "Current")
                },
                "instructions": f"Please use reference: {tx_ref} when making payment"
            }
            
            return {
                "bank_transfer_details": bank_details,
                "payment_id": payment.id
            }
            
        except Exception as e:
            logger.error(f"Bank transfer initialization error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize bank transfer"
            )
    
    def clear_cart(self, user_id: int):
        """Clear user's cart after successful order"""
        try:
            self.db.query(Cart).filter(Cart.user_id == user_id).delete()
            self.db.flush()
        except Exception as e:
            logger.error(f"Failed to clear cart: {str(e)}")
            # Don't fail the entire checkout for this

@router.post("/", response_model=CheckoutResponse)
async def create_order_unified(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Unified checkout endpoint with comprehensive validation and error handling"""
    
    # Log the incoming request data for debugging
    logger.info(f"Checkout request received for user {current_user.id}")
    logger.info(f"Payment method: {checkout_data.payment.method}")
    logger.info(f"Cart items count: {len(checkout_data.cart_items)}")
    logger.info(f"Is ebook only: {checkout_data.is_ebook_only}")
    
    checkout_service = CheckoutService(db)
    
    try:
        # Validate cart items and fetch books
        try:
            cart_items, book_dict = checkout_service.validate_cart_items(
                current_user.id
            )
            logger.info(f"Cart validation successful: {len(cart_items)} items")
        except Exception as e:
            logger.error(f"Cart validation error: {str(e)}")
            raise
        
        # Check if order contains physical books
        has_physical_books = any(
            book_dict[item.book_id].format in ['physical', 'both'] 
            for item in cart_items
        )
        
        is_ebook_only = checkout_data.is_ebook_only or not has_physical_books
        
        # Validate shipping requirements for physical books only
        if has_physical_books and not checkout_data.is_ebook_only:
            if not checkout_data.shipping_method:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Shipping method required for physical books"
                )
            
            # Validate shipping address fields for physical books
            addr = checkout_data.shipping_address
            if not all([addr.address, addr.city, addr.state, addr.zip_code]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Complete shipping address required for physical books"
                )
        
        # For ebook-only orders, ensure shipping method is None
        if checkout_data.is_ebook_only or not has_physical_books:
            checkout_data.shipping_method = None
        
        # Calculate order totals
        shipping_method_dict = (
            checkout_data.shipping_method.dict() 
            if checkout_data.shipping_method else None
        )
        order_summary = checkout_service.calculate_order_totals(
            cart_items, book_dict, shipping_method_dict
        )
        
        # Create order with proper transaction handling
        try:
            logger.info(f"Creating order for user {current_user.id}")
            order = checkout_service.create_order(
                current_user, checkout_data, order_summary, cart_items, book_dict
            )
            logger.info(f"Order created successfully: {order.id}")
            
            # Initialize payment
            payment_result = checkout_service.initialize_payment(
                order, 
                checkout_data.payment.method,
                checkout_data.shipping_address.dict()
            )
            
            # Commit transaction only after everything succeeds
            db.commit()
            logger.info(f"Transaction committed successfully for order {order.id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction failed, rolled back: {str(e)}")
            raise
        
        # Send order confirmation email (async, don't fail checkout if this fails)
        try:
            email_service = ResendEmailService(db)
            await email_service.send_order_confirmation_email(
                checkout_data.shipping_address.email,
                f"{checkout_data.shipping_address.first_name} {checkout_data.shipping_address.last_name}",
                order.order_number,
                f"₦{order_summary.total_amount:,.2f}"
            )
        except Exception as e:
            logger.error(f"Failed to send order confirmation email: {str(e)}")
        
        # Prepare response
        response_data = {
            "success": True,
            "order_id": order.id,
            "order_number": order.order_number,
            "total_amount": order_summary.total_amount,
            "payment_method": checkout_data.payment.method,
            "message": "Order created successfully"
        }
        
        # Add payment-specific data
        if checkout_data.payment.method == SchemaPaymentMethodType.FLUTTERWAVE:
            response_data["payment_url"] = payment_result["payment_url"]
        else:
            response_data["bank_transfer_details"] = payment_result["bank_transfer_details"]
        
        return CheckoutResponse(**response_data)
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected checkout error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during checkout: {str(e)}"
        )

@router.get("/summary")
async def get_checkout_summary(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get checkout summary for cart items"""
    
    checkout_service = CheckoutService(db)
    
    try:
        # Get cart items
        cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
        
        if not cart_items:
            return {"message": "Cart is empty", "items": []}
        
        # Fetch books
        book_ids = [item.book_id for item in cart_items]
        books = db.query(Book).filter(Book.id.in_(book_ids)).all()
        book_dict = {book.id: book for book in books}
        
        # Calculate summary without shipping
        order_summary = checkout_service.calculate_order_totals(cart_items, book_dict)
        
        return {
            "subtotal": order_summary.subtotal,
            "tax_amount": order_summary.tax_amount,
            "total_items": sum(item.quantity for item in cart_items),
            "items": [
                {
                    "book_id": item.book_id,
                    "title": book_dict[item.book_id].title,
                    "quantity": item.quantity,
                    "price": book_dict[item.book_id].price,
                    "format": book_dict[item.book_id].format
                }
                for item in cart_items
                if item.book_id in book_dict
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get checkout summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get checkout summary"
        )