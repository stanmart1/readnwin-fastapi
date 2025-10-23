"""
Migration script to update payment_settings and payment_gateways tables
"""
from core.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Drop old payment_settings table
        conn.execute(text("DROP TABLE IF EXISTS payment_settings CASCADE"))
        conn.commit()
        
        # Create new payment_settings table
        conn.execute(text("""
            CREATE TABLE payment_settings (
                id SERIAL PRIMARY KEY,
                default_gateway VARCHAR(50) DEFAULT 'flutterwave',
                currency VARCHAR(10) DEFAULT 'NGN',
                tax_rate FLOAT DEFAULT 7.5,
                shipping_cost FLOAT DEFAULT 500.0,
                free_shipping_threshold FLOAT DEFAULT 5000.0,
                webhook_url VARCHAR(255),
                test_mode BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        conn.commit()
        
        # Insert default settings
        conn.execute(text("""
            INSERT INTO payment_settings (default_gateway, currency, tax_rate, shipping_cost, free_shipping_threshold, test_mode)
            VALUES ('flutterwave', 'NGN', 7.5, 2000.0, 50000.0, FALSE)
        """))
        conn.commit()
        
        # Drop and recreate payment_gateways table
        conn.execute(text("DROP TABLE IF EXISTS payment_gateways CASCADE"))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE payment_gateways (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(100),
                enabled BOOLEAN DEFAULT FALSE,
                test_mode BOOLEAN DEFAULT TRUE,
                api_keys JSONB,
                bank_account JSONB,
                supported_currencies JSONB,
                features JSONB,
                status VARCHAR(20) DEFAULT 'inactive',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        conn.commit()
        
        # Insert default gateways
        conn.execute(text("""
            INSERT INTO payment_gateways (id, name, description, icon, enabled, test_mode, api_keys, supported_currencies, features, status)
            VALUES 
            ('flutterwave', 'Flutterwave', 'Leading payment technology company in Africa', 'ri-global-line', TRUE, FALSE, '{}', '["NGN", "USD", "EUR", "GBP"]', '["Mobile Money", "Bank Transfers", "Credit Cards", "USSD", "QR Payments"]', 'active'),
            ('bank_transfer', 'Bank Transfer', 'Direct bank transfer with proof of payment upload', 'ri-bank-line', TRUE, FALSE, '{}', '["NGN"]', '["Bank Transfers", "Proof of Payment", "Manual Verification"]', 'active')
        """))
        conn.commit()
        
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
