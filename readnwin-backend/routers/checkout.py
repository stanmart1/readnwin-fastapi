from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.cart import Cart
from models.book import Book
from models.user import User
from models.order import Order, OrderItem
from models.payment import Payment, PaymentStatus, PaymentMethodType
from models.payment_settings import PaymentGateway
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from decimal import Decimal
import uuid
import requests
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/checkout", tags=["checkout"])

class ShippingAddress(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    country: str = "Nigeria"

class BillingAddress(BaseModel):
    sameAsShipping: bool = True
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None

class PaymentMethod(BaseModel):
    method: str  # 'flutterwave' or 'bank_transfer'

class FormData(BaseModel):
    shipping: ShippingAddress
    billing: BillingAddress
    payment: PaymentMethod
    shippingMethod: Optional[Dict[str, Any]] = None

class CheckoutRequest(BaseModel):
    # Support both old and new formats
    formData: Optional[FormData] = None
    cartItems: Optional[List[Dict[str, Any]]] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    
    # New format fields
    shipping_info: Optional[ShippingAddress] = None
    billing_info: Optional[ShippingAddress] = None
    payment_method: Optional[str] = None
    shipping_method_id: Optional[int] = None
    total_amount: Optional[float] = None

@router.post("/")
@router.post("")
async def create_order(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create comprehensive order with payment processing"""
    try:
        print(f"🔍 Checkout request received for user {current_user.id}")
        # Handle both old and new request formats
        if checkout_data.formData:
            # Old format
            shipping_info = checkout_data.formData.shipping
            billing_info = checkout_data.formData.shipping if checkout_data.formData.billing.sameAsShipping else checkout_data.formData.billing
            payment_method = checkout_data.formData.payment.method
            shipping_method = checkout_data.formData.shippingMethod
            total_amount = checkout_data.total
        else:
            # New format
            shipping_info = checkout_data.shipping_info
            billing_info = checkout_data.billing_info or checkout_data.shipping_info
            payment_method = checkout_data.payment_method
            shipping_method = None  # TODO: fetch from shipping_method_id
            total_amount = checkout_data.total_amount
        
        print(f"🔍 Payment method: {payment_method}")
        
        # Get user's cart items with book details
        cart_items = db.query(Cart).join(Book).filter(
            Cart.user_id == current_user.id,
            Book.is_active == True  # Only allow active books in checkout
        ).all()
        
        # Enrich cart items with full book data including cover_image_url
        for item in cart_items:
            if item.book:
                # Ensure cover_image_url is set if not present
                if not hasattr(item.book, 'cover_image_url') or not item.book.cover_image_url:
                    item.book.cover_image_url = item.book.cover_image
        
        if not cart_items:
            print(f"❌ Cart is empty for user {current_user.id}")
            raise HTTPException(status_code=400, detail="Cart is empty or contains unavailable items")
        
        print(f"🔍 Found {len(cart_items)} active items in cart")
        
        # Calculate total from cart (books already joined)
        total_amount = Decimal('0')
        for item in cart_items:
            if item.book:
                item_total = item.book.price * item.quantity
                total_amount += item_total
                print(f"🔍 Item: {item.book.title}, Price: {item.book.price}, Qty: {item.quantity}, Total: {item_total}")
            else:
                print(f"❌ Book not found for cart item {item.id}")
                raise HTTPException(status_code=400, detail="Invalid cart item found")
        
        print(f"🔍 Subtotal: {total_amount}")
        
        # Add shipping cost if applicable
        shipping_cost = Decimal('0')
        if checkout_data.formData and checkout_data.formData.shippingMethod:
            shipping_method = checkout_data.formData.shippingMethod
            base_cost = shipping_method.get('base_cost', 0)
            cost_per_item = shipping_method.get('cost_per_item', 0)
            
            # Calculate physical items count
            physical_items = 0
            for item in cart_items:
                if item.book and item.book.format in ['physical', 'both']:
                    # Check stock only for physical books with inventory enabled
                    if (getattr(item.book, 'inventory_enabled', False) and 
                        item.book.stock_quantity is not None and 
                        item.quantity > item.book.stock_quantity):
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Insufficient stock for '{item.book.title}'. Available: {item.book.stock_quantity}, Requested: {item.quantity}"
                        )
                    physical_items += item.quantity
            
            if physical_items > 0:
                shipping_cost = Decimal(str(base_cost + (cost_per_item * physical_items)))
                print(f"🔍 Shipping cost: {shipping_cost} for {physical_items} physical items")
        
        # Add VAT (7.5%)
        vat_amount = total_amount * Decimal('0.075')
        final_total = total_amount + shipping_cost + vat_amount
        print(f"🔍 VAT: {vat_amount}, Shipping: {shipping_cost}, Final Total: {final_total}")
        
        # Create order
        order_number = str(uuid.uuid4())[:8].upper()
        print(f"🔍 Creating order {order_number}")
        
        # Prepare addresses
        shipping_addr = shipping_info.dict()
        billing_addr = billing_info.dict()
        
        print(f"🔍 Order data: user_id={current_user.id}, total={final_total}, payment_method={payment_method}")
        
        # Create order with proper transaction handling
        order = Order(
            user_id=current_user.id,
            order_number=order_number,
            subtotal=total_amount,
            tax_amount=vat_amount,
            shipping_cost=shipping_cost,
            total_amount=final_total,
            status='pending',
            payment_method=payment_method,
            shipping_address=shipping_addr,
            billing_address=billing_addr
        )
        
        db.add(order)
        db.flush()  # Get order ID without committing
        print(f"🔍 Order created successfully with ID: {order.id}")
        
        # Create order items and update stock
        for item in cart_items:
            if item.book:
                order_item = OrderItem(
                    order_id=order.id,
                    book_id=item.book_id,
                    quantity=item.quantity,
                    price=item.book.price,
                    book_format=item.book.format or 'ebook',
                    book_title=item.book.title
                )
                db.add(order_item)
                
                # Update stock only for physical books with inventory enabled
                if (item.book.format in ['physical', 'both'] and 
                    getattr(item.book, 'inventory_enabled', False) and 
                    item.book.stock_quantity is not None):
                    item.book.stock_quantity -= item.quantity
                    print(f"🔍 Updated stock for {item.book.title}: -{item.quantity}, remaining: {item.book.stock_quantity}")
                
                print(f"🔍 Added order item: book_id={item.book_id}, qty={item.quantity}, price={item.book.price}")
        
        db.flush()  # Flush to get IDs
        print(f"🔍 Order items created successfully")
        
        # NOTE: Cart will be cleared after successful payment confirmation
        # Do not clear cart here as payment might fail
        
        # Handle payment method (already extracted above)
        
        if payment_method == 'flutterwave':
            # Initialize Flutterwave payment
            flutterwave_data = initialize_flutterwave_payment(order, shipping_info, db)
            db.commit()  # Commit after successful payment initialization
            
            # Send order confirmation email
            try:
                from services.email_service import send_order_confirmation_email
                order_items = [{
                    "title": item.book.title,
                    "price": float(item.book.price)
                } for item in cart_items if item.book]
                send_order_confirmation_email(
                    to_email=current_user.email,
                    order_data={
                        "order_id": order.order_number,
                        "order_number": order.order_number,
                        "order_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                        "total_amount": float(order.total_amount),
                        "items": order_items
                    },
                    first_name=current_user.first_name or current_user.username,
                    db_session=db
                )
            except Exception as e:
                logger.warning(f"Failed to send order confirmation email: {e}")
            
            return {
                "success": True,
                "paymentMethod": "flutterwave",
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount)
                },
                "payment_url": flutterwave_data["payment_url"],
                "payment_method": "flutterwave",
                "reference": flutterwave_data.get('tx_ref')
            }
        
        elif payment_method == 'bank_transfer':
            try:
                # Get bank account details but DON'T create payment record yet
                gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "bank_transfer").first()
                
                if not gateway or not gateway.enabled:
                    raise HTTPException(status_code=400, detail="Bank transfer payment not enabled")
                
                bank_account = gateway.bank_account or {}
                
                db.commit()  # Commit order only
                
                # Send order confirmation email
                try:
                    from services.email_service import send_order_confirmation_email
                    order_items = [{
                        "title": item.book.title,
                        "price": float(item.book.price)
                    } for item in cart_items if item.book]
                    send_order_confirmation_email(
                        to_email=current_user.email,
                        order_data={
                            "order_id": order.order_number,
                            "order_number": order.order_number,
                            "order_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "total_amount": float(order.total_amount),
                            "items": order_items
                        },
                        first_name=current_user.first_name or current_user.username,
                        db_session=db
                    )
                except Exception as e:
                    logger.warning(f"Failed to send order confirmation email: {e}")
                
                return {
                    "success": True,
                    "payment_method": "bank_transfer",
                    "order": {
                        "id": order.id,
                        "order_number": order.order_number,
                        "total_amount": float(order.total_amount)
                    },
                    "bankTransferDetails": {
                        "amount": float(order.total_amount),
                        "bank_account": {
                            "bank_name": bank_account.get('bank_name', 'Access Bank'),
                            "account_number": bank_account.get('account_number', '0101234567'),
                            "account_name": bank_account.get('account_name', 'Lagsale Online Resources'),
                            "account_type": bank_account.get('account_type', 'Current')
                        },
                        "payment_instructions": bank_account.get('payment_instructions', 'Please include order number in payment reference')
                    }
                }
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Failed to initialize bank transfer: {str(e)}")
        
        else:
            raise HTTPException(status_code=400, detail="Invalid payment method")
        
    except HTTPException as he:
        db.rollback()
        print(f"❌ HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        db.rollback()
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

def initialize_flutterwave_payment(order: Order, shipping: ShippingAddress, db: Session):
    """Initialize Flutterwave payment and get redirect URL"""
    try:
        logger.info(f"Initializing Flutterwave payment for order {order.order_number}")
        
        # Get Flutterwave settings from database
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "flutterwave").first()
        
        if not gateway or not gateway.enabled:
            raise HTTPException(status_code=400, detail="Flutterwave payment gateway not enabled")
        
        api_keys = gateway.api_keys or {}
        secret_key = api_keys.get('secretKey') or api_keys.get('secret_key')
        
        if not secret_key:
            raise HTTPException(status_code=400, detail="Flutterwave API keys not configured")
        
        if not secret_key.startswith('FLWSECK-'):
            raise HTTPException(status_code=400, detail="Invalid Flutterwave secret key format")
        
        # Create payment record
        tx_ref = f'FLW_{order.order_number}_{int(datetime.now().timestamp())}'
        payment = Payment(
            amount=order.total_amount,
            currency='NGN',
            payment_method=PaymentMethodType.FLUTTERWAVE,
            description=f'Payment for order {order.order_number}',
            order_id=order.id,
            user_id=order.user_id,
            transaction_reference=tx_ref,
            status=PaymentStatus.PENDING
        )
        
        db.add(payment)
        db.flush()
        db.refresh(payment)
        
        logger.info(f"Payment record created with reference: {tx_ref}")
        
        # Get frontend URL from environment or use default
        import os
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Prepare payment data for Flutterwave API
        payload = {
            "tx_ref": payment.transaction_reference,
            "amount": float(order.total_amount),
            "currency": "NGN",
            "redirect_url": f"{frontend_url}/payment/callback",
            "payment_options": "card,mobilemoney,ussd,banktransfer",
            "customer": {
                "email": shipping.email,
                "phone_number": shipping.phone,
                "name": f"{shipping.first_name} {shipping.last_name}"
            },
            "customizations": {
                "title": "ReadnWin Payment",
                "description": f"Payment for order {order.order_number}",
                "logo": f"{frontend_url}/logo.png"
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
        
        logger.info("Making request to Flutterwave API")

        # Make request to Flutterwave API
        response = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        logger.info(f"Response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "payment_url": data["data"]["link"],
                    "tx_ref": payment.transaction_reference
                }
            else:
                error_msg = data.get("message", "Payment initialization failed")
                logger.error(f"Flutterwave API error: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
        else:
            logger.error(f"HTTP error {response.status_code}: {response.text}")
            raise HTTPException(status_code=500, detail="Payment gateway error")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flutterwave initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize Flutterwave payment: {str(e)}")

