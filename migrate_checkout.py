#!/usr/bin/env python3
"""
Migration script for transitioning to the unified checkout system.
This script helps identify and fix data inconsistencies between the old and new checkout systems.
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'readnwin-backend'))

from core.database import get_db, engine
from models.order import Order, OrderItem
from models.payment import Payment, PaymentStatus, PaymentMethodType
from models.user import User
from models.book import Book

def check_database_connection():
    """Check if database connection is working"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def analyze_existing_orders():
    """Analyze existing orders for data consistency issues"""
    print("\n🔍 Analyzing existing orders...")
    
    db = next(get_db())
    try:
        # Get all orders
        orders = db.query(Order).all()
        print(f"📊 Found {len(orders)} total orders")
        
        issues = []
        
        for order in orders:
            # Check for missing payment records
            payments = db.query(Payment).filter(Payment.order_id == order.id).all()
            if not payments:
                issues.append(f"Order {order.order_number} has no payment records")
            
            # Check for invalid payment methods
            if order.payment_method not in ['flutterwave', 'bank_transfer', 'FLUTTERWAVE', 'BANK_TRANSFER']:
                issues.append(f"Order {order.order_number} has invalid payment method: {order.payment_method}")
            
            # Check for missing order items
            order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            if not order_items:
                issues.append(f"Order {order.order_number} has no order items")
            
            # Check for invalid addresses
            if not order.shipping_address or not isinstance(order.shipping_address, dict):
                issues.append(f"Order {order.order_number} has invalid shipping address")
        
        if issues:
            print(f"⚠️  Found {len(issues)} issues:")
            for issue in issues[:10]:  # Show first 10 issues
                print(f"   - {issue}")
            if len(issues) > 10:
                print(f"   ... and {len(issues) - 10} more issues")
        else:
            print("✅ No data consistency issues found")
        
        return issues
        
    except Exception as e:
        print(f"❌ Error analyzing orders: {e}")
        return []
    finally:
        db.close()

def fix_payment_method_formats():
    """Standardize payment method formats"""
    print("\n🔧 Fixing payment method formats...")
    
    db = next(get_db())
    try:
        # Fix order payment methods
        orders_updated = 0
        orders = db.query(Order).all()
        
        for order in orders:
            old_method = order.payment_method
            if old_method:
                if old_method.upper() == 'FLUTTERWAVE':
                    order.payment_method = 'flutterwave'
                    orders_updated += 1
                elif old_method.upper() == 'BANK_TRANSFER':
                    order.payment_method = 'bank_transfer'
                    orders_updated += 1
        
        # Fix payment records
        payments_updated = 0
        payments = db.query(Payment).all()
        
        for payment in payments:
            old_method = payment.payment_method
            if isinstance(old_method, str):
                if old_method.upper() == 'FLUTTERWAVE':
                    payment.payment_method = PaymentMethodType.FLUTTERWAVE
                    payments_updated += 1
                elif old_method.upper() == 'BANK_TRANSFER':
                    payment.payment_method = PaymentMethodType.BANK_TRANSFER
                    payments_updated += 1
        
        db.commit()
        print(f"✅ Updated {orders_updated} orders and {payments_updated} payments")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error fixing payment methods: {e}")
    finally:
        db.close()

def create_missing_payment_records():
    """Create missing payment records for orders that don't have them"""
    print("\n🔧 Creating missing payment records...")
    
    db = next(get_db())
    try:
        created_count = 0
        orders = db.query(Order).all()
        
        for order in orders:
            # Check if payment record exists
            existing_payment = db.query(Payment).filter(Payment.order_id == order.id).first()
            
            if not existing_payment:
                # Create payment record
                payment_method = PaymentMethodType.BANK_TRANSFER
                if order.payment_method == 'flutterwave':
                    payment_method = PaymentMethodType.FLUTTERWAVE
                
                payment = Payment(
                    amount=order.total_amount,
                    currency='NGN',
                    payment_method=payment_method,
                    description=f'Payment for order {order.order_number}',
                    order_id=order.id,
                    user_id=order.user_id,
                    transaction_reference=f'MIG_{order.order_number}_{int(datetime.now().timestamp())}',
                    status=PaymentStatus.PENDING
                )
                
                db.add(payment)
                created_count += 1
        
        db.commit()
        print(f"✅ Created {created_count} missing payment records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating payment records: {e}")
    finally:
        db.close()

def validate_address_formats():
    """Validate and fix address formats"""
    print("\n🔧 Validating address formats...")
    
    db = next(get_db())
    try:
        fixed_count = 0
        orders = db.query(Order).all()
        
        for order in orders:
            if order.shipping_address and isinstance(order.shipping_address, dict):
                # Ensure required fields exist
                required_fields = ['first_name', 'last_name', 'email', 'address', 'city', 'state']
                needs_fix = False
                
                for field in required_fields:
                    if field not in order.shipping_address:
                        order.shipping_address[field] = ''
                        needs_fix = True
                
                # Standardize field names
                if 'firstName' in order.shipping_address:
                    order.shipping_address['first_name'] = order.shipping_address.pop('firstName')
                    needs_fix = True
                
                if 'lastName' in order.shipping_address:
                    order.shipping_address['last_name'] = order.shipping_address.pop('lastName')
                    needs_fix = True
                
                if needs_fix:
                    fixed_count += 1
        
        db.commit()
        print(f"✅ Fixed {fixed_count} address formats")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error fixing addresses: {e}")
    finally:
        db.close()

def generate_migration_report():
    """Generate a comprehensive migration report"""
    print("\n📋 Generating migration report...")
    
    db = next(get_db())
    try:
        # Count orders by status
        total_orders = db.query(Order).count()
        pending_orders = db.query(Order).filter(Order.status == 'pending').count()
        completed_orders = db.query(Order).filter(Order.status == 'completed').count()
        
        # Count payments by method
        flutterwave_payments = db.query(Payment).filter(
            Payment.payment_method == PaymentMethodType.FLUTTERWAVE
        ).count()
        bank_transfer_payments = db.query(Payment).filter(
            Payment.payment_method == PaymentMethodType.BANK_TRANSFER
        ).count()
        
        # Count payments by status
        pending_payments = db.query(Payment).filter(
            Payment.status == PaymentStatus.PENDING
        ).count()
        completed_payments = db.query(Payment).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).count()
        
        report = f"""
📊 MIGRATION REPORT
==================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

ORDERS:
- Total Orders: {total_orders}
- Pending Orders: {pending_orders}
- Completed Orders: {completed_orders}

PAYMENTS:
- Flutterwave Payments: {flutterwave_payments}
- Bank Transfer Payments: {bank_transfer_payments}
- Pending Payments: {pending_payments}
- Completed Payments: {completed_payments}

RECOMMENDATIONS:
1. Test the new unified checkout system thoroughly
2. Monitor error logs during transition
3. Keep old endpoints available for rollback
4. Update frontend to use new checkout page
5. Train support team on new system

NEXT STEPS:
1. Deploy unified checkout system
2. Update frontend routing
3. Monitor checkout completion rates
4. Gradually deprecate old endpoints
"""
        
        print(report)
        
        # Save report to file
        with open('migration_report.txt', 'w') as f:
            f.write(report)
        
        print("📄 Report saved to migration_report.txt")
        
    except Exception as e:
        print(f"❌ Error generating report: {e}")
    finally:
        db.close()

def main():
    """Main migration function"""
    print("🚀 ReadnWin Checkout Migration Tool")
    print("=" * 40)
    
    # Check database connection
    if not check_database_connection():
        print("❌ Cannot proceed without database connection")
        return
    
    # Analyze existing data
    issues = analyze_existing_orders()
    
    if issues:
        print(f"\n⚠️  Found {len(issues)} issues that need fixing")
        response = input("Do you want to proceed with fixes? (y/N): ")
        
        if response.lower() == 'y':
            # Apply fixes
            fix_payment_method_formats()
            create_missing_payment_records()
            validate_address_formats()
            
            print("\n✅ Migration fixes completed!")
        else:
            print("❌ Migration cancelled by user")
            return
    
    # Generate final report
    generate_migration_report()
    
    print("\n🎉 Migration process completed!")
    print("\nNext steps:")
    print("1. Review the migration report")
    print("2. Test the unified checkout system")
    print("3. Update frontend to use /checkout-unified")
    print("4. Monitor system performance")

if __name__ == "__main__":
    main()