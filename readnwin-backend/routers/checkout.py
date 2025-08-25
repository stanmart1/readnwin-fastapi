from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.cart import Cart
from models.book import Book
from models.user import User
from models.order import Order, OrderItem
from models.payment import Payment, PaymentStatus
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from decimal import Decimal
import uuid
import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

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
    formData: FormData
    cartItems: List[Dict[str, Any]]
    total: float
    payment_method: Optional[str] = None

@router.post("/")
async def create_order(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create comprehensive order with payment processing"""
    try:
        print(f"🔍 Checkout request received for user {current_user.id}")
        print(f"🔍 Payment method: {checkout_data.formData.payment.method}")
        
        # Get user's cart items with book details
        cart_items = db.query(Cart).join(Book).filter(
            Cart.user_id == current_user.id,
            Book.is_active == True  # Only allow active books in checkout
        ).all()
        
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
        if checkout_data.formData.shippingMethod:
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
        shipping_addr = checkout_data.formData.shipping.dict()
        billing_addr = checkout_data.formData.shipping.dict() if checkout_data.formData.billing.sameAsShipping else checkout_data.formData.billing.dict()
        
        print(f"🔍 Order data: user_id={current_user.id}, total={final_total}, payment_method={checkout_data.formData.payment.method}")
        
        # Create order with proper transaction handling
        order = Order(
            user_id=current_user.id,
            order_number=order_number,
            total_amount=final_total,
            status='pending',
            payment_method=checkout_data.formData.payment.method,
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
        
        # Send order confirmation email
        try:
            from services.resend_email_service import ResendEmailService
            email_service = ResendEmailService(db)
            import asyncio
            asyncio.create_task(email_service.send_order_confirmation_email(
                shipping_addr['email'],
                f"{shipping_addr['first_name']} {shipping_addr['last_name']}",
                order.order_number,
                f"₦{final_total:,.2f}"
            ))
        except Exception as e:
            print(f"Failed to send order confirmation email: {str(e)}")
        
        # Handle payment method
        payment_method = checkout_data.formData.payment.method
        
        if payment_method == 'flutterwave':
            # Initialize Flutterwave payment
            flutterwave_data = initialize_flutterwave_payment(order, checkout_data.formData.shipping, db)
            db.commit()  # Commit after successful payment initialization
            return {
                "success": True,
                "paymentMethod": "flutterwave",
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount)
                },
                "flutterwavePaymentUrl": flutterwave_data["payment_url"],
                "reference": flutterwave_data.get('tx_ref')
            }
        
        elif payment_method == 'bank_transfer':
            try:
                # Initialize bank transfer
                bank_transfer_data = initialize_bank_transfer(order, db)
                db.commit()  # Commit after successful payment initialization
                return {
                    "success": True,
                    "paymentMethod": "bank_transfer",
                    "order": {
                        "id": order.id,
                        "order_number": order.order_number,
                        "total_amount": float(order.total_amount)
                    },
                    "bankTransferDetails": bank_transfer_data['details'],
                    "bankTransferId": bank_transfer_data['id']
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
        print(f"🔍 Initializing Flutterwave payment for order {order.order_number}")
        
        secret_key = os.getenv("RAVE_LIVE_SECRET_KEY")
        print(f"🔍 Secret key found: {'Yes' if secret_key else 'No'}")
        print(f"🔍 Secret key length: {len(secret_key) if secret_key else 0}")
        
        if not secret_key:
            print(f"❌ RAVE_LIVE_SECRET_KEY not found in environment")
            raise HTTPException(status_code=400, detail="Flutterwave API keys not configured")
        
        if not secret_key.startswith('FLWSECK-'):
            print(f"❌ Invalid secret key format: {secret_key[:10]}...")
            raise HTTPException(status_code=400, detail="Invalid Flutterwave secret key format")
        
        # Create payment record
        tx_ref = f'FLW_{order.order_number}_{int(datetime.now().timestamp())}'
        from models.payment import PaymentMethodType
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
        db.flush()  # Don't commit here, let the main function handle it
        db.refresh(payment)
        
        print(f"🔍 Payment record created with reference: {tx_ref}")
        
        # Prepare payment data for Flutterwave API
        payload = {
            "tx_ref": payment.transaction_reference,
            "amount": float(order.total_amount),
            "currency": "NGN",
            "redirect_url": f"http://localhost:3000/payment/callback",
            "payment_options": "card,mobilemoney,ussd,banktransfer",
            "customer": {
                "email": shipping.email,
                "phone_number": shipping.phone,
                "name": f"{shipping.first_name} {shipping.last_name}"
            },
            "customizations": {
                "title": "ReadnWin Payment",
                "description": f"Payment for order {order.order_number}",
                "logo": f"http://localhost:3000/logo.png"
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
        
        print(f"🔍 Making request to Flutterwave API")
        print(f"🔍 Payload: {payload}")

        # Make request to Flutterwave API
        response = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers=headers
        )
        
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response text: {response.text}")

        if response.status_code == 200:
            data = response.json()
            print(f"🔍 Response data: {data}")
            if data.get("status") == "success":
                return {
                    "payment_url": data["data"]["link"],
                    "tx_ref": payment.transaction_reference
                }
            else:
                error_msg = data.get("message", "Payment initialization failed")
                print(f"❌ Flutterwave API error: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
        else:
            error_text = response.text
            print(f"❌ HTTP error {response.status_code}: {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"Failed to initialize payment: {error_text}")
        
    except Exception as e:
        print(f"❌ Flutterwave initialization error: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize Flutterwave payment: {str(e)}")

def initialize_bank_transfer(order: Order, db: Session):
    """Initialize bank transfer payment"""
    try:
        print(f"🔍 Initializing bank transfer for order {order.order_number}")
        
        # Order should already have an ID from the flush operation
        if not order.id:
            raise HTTPException(status_code=400, detail="Order must be saved before creating payment")
        
        # Create payment record
        tx_ref = f'BT_{order.order_number}_{int(datetime.now().timestamp())}'
        from models.payment import PaymentMethodType
        payment = Payment(
            amount=order.total_amount,
            currency='NGN',
            payment_method=PaymentMethodType.BANK_TRANSFER,
            description=f'Bank transfer for order {order.order_number}',
            order_id=order.id,
            user_id=order.user_id,
            transaction_reference=tx_ref,
            status=PaymentStatus.AWAITING_APPROVAL
        )
        
        print(f"🔍 Payment data: amount={order.total_amount}, order_id={order.id}, user_id={order.user_id}")
        
        db.add(payment)
        db.flush()  # Don't commit here, let the main function handle it
        db.refresh(payment)
        print(f"🔍 Payment record created with ID: {payment.id}")
        
        print(f"🔍 Bank transfer payment record created with reference: {tx_ref}")
        
        # Bank transfer details
        bank_details = {
            "amount": float(order.total_amount),
            "reference": payment.transaction_reference,
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
            "bank_account": {
                "bank_name": "Access Bank",
                "account_number": "0101234567",
                "account_name": "Lagsale Online Resources",
                "account_type": "Current"
            },
            "instructions": f"Please use reference: {payment.transaction_reference} when making payment"
        }
        
        return {
            "id": payment.id,
            "details": bank_details
        }
        
    except Exception as e:
        print(f"❌ Bank transfer initialization error: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize bank transfer: {str(e)}")