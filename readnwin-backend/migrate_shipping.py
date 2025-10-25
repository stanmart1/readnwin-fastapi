#!/usr/bin/env python3
"""
Migrate shipping data from source database to local database
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from models.shipping import ShippingZone, ShippingMethod, ShippingMethodZone
from core.database import Base, engine, get_db
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

def migrate_shipping():
    """Migrate shipping data from source to local database"""
    
    try:
        # Connect to source database
        logger.info("🔌 Connecting to source database...")
        source_engine = create_engine(SOURCE_DB_URL)
        
        # Create local database tables
        logger.info("📊 Creating shipping tables in local database...")
        Base.metadata.create_all(engine)
        
        local_session = Session(engine)
        
        with source_engine.connect() as source_conn:
            # Migrate Shipping Zones
            logger.info("\n📍 Migrating shipping zones...")
            result = source_conn.execute(text("SELECT id, name, countries FROM shipping_zones ORDER BY id"))
            zones = result.fetchall()
            
            zone_mapping = {}  # Map source zone ID to local zone ID
            
            for zone in zones:
                source_zone_id, name, countries_str = zone
                
                # Parse countries JSON string
                try:
                    countries = json.loads(countries_str) if countries_str else []
                except:
                    countries = []
                
                # Check if zone already exists
                existing = local_session.query(ShippingZone).filter(
                    ShippingZone.name == name
                ).first()
                
                if not existing:
                    new_zone = ShippingZone(
                        name=name,
                        countries=countries,
                        is_active=True
                    )
                    local_session.add(new_zone)
                    local_session.flush()
                    zone_mapping[source_zone_id] = new_zone.id
                    logger.info(f"  ✓ Created zone: {name} (ID: {new_zone.id})") 
                else:
                    zone_mapping[source_zone_id] = existing.id
                    logger.info(f"  - Zone already exists: {name} (ID: {existing.id})")
            
            local_session.commit()
            
            # Migrate Shipping Methods
            logger.info("\n🚚 Migrating shipping methods...")
            result = source_conn.execute(text("""
                SELECT id, name, description, base_cost, cost_per_item, free_shipping_threshold, estimated_days_min, estimated_days_max 
                FROM shipping_methods ORDER BY id
            """))
            methods = result.fetchall()
            
            method_mapping = {}  # Map source method ID to local method ID
            
            for method in methods:
                source_method_id, name, description, base_cost, cost_per_item, free_threshold, est_min, est_max = method
                
                # Check if method already exists
                existing = local_session.query(ShippingMethod).filter(
                    ShippingMethod.name == name
                ).first()
                
                if not existing:
                    new_method = ShippingMethod(
                        name=name,
                        description=description,
                        base_cost=float(base_cost) if base_cost else 0.0,
                        cost_per_item=float(cost_per_item) if cost_per_item else 0.0,
                        free_shipping_threshold=float(free_threshold) if free_threshold else None,
                        estimated_days_min=est_min or 1,
                        estimated_days_max=est_max or 7,
                        is_active=True,
                        sort_order=source_method_id
                    )
                    local_session.add(new_method)
                    local_session.flush()
                    method_mapping[source_method_id] = new_method.id
                    logger.info(f"  ✓ Created method: {name} (ID: {new_method.id}, Cost: {base_cost})")
                else:
                    method_mapping[source_method_id] = existing.id
                    logger.info(f"  - Method already exists: {name} (ID: {existing.id})")
            
            local_session.commit()
            
            # Migrate Shipping Method Zone mappings
            logger.info("\n🔗 Migrating shipping method-zone mappings...")
            result = source_conn.execute(text("""
                SELECT id, shipping_method_id, shipping_zone_id, is_available 
                FROM shipping_method_zones ORDER BY id
            """))
            mappings = result.fetchall()
            
            for mapping in mappings:
                source_mapping_id, source_method_id, source_zone_id, is_available = mapping
                
                # Get local IDs
                local_method_id = method_mapping.get(source_method_id)
                local_zone_id = zone_mapping.get(source_zone_id)
                
                if local_method_id and local_zone_id:
                    # Check if mapping already exists
                    existing = local_session.query(ShippingMethodZone).filter(
                        ShippingMethodZone.shipping_method_id == local_method_id,
                        ShippingMethodZone.shipping_zone_id == local_zone_id
                    ).first()
                    
                    if not existing:
                        new_mapping = ShippingMethodZone(
                            shipping_method_id=local_method_id,
                            shipping_zone_id=local_zone_id,
                            is_available=is_available
                        )
                        local_session.add(new_mapping)
                        logger.info(f"  ✓ Created mapping: Method {local_method_id} -> Zone {local_zone_id}")
                    else:
                        logger.info(f"  - Mapping already exists: Method {local_method_id} -> Zone {local_zone_id}")
                else:
                    logger.warning(f"  ⚠ Skipped mapping {source_mapping_id}: Missing method or zone")
            
            local_session.commit()
        
        logger.info("\n✅ Shipping data migration completed successfully!")
        logger.info(f"  - Zones migrated: {len(zone_mapping)}")
        logger.info(f"  - Methods migrated: {len(method_mapping)}")
        logger.info(f"  - Mappings migrated: {len(mappings)}")
        
    except Exception as e:
        logger.error(f"❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        if local_session:
            local_session.rollback()
    finally:
        if local_session:
            local_session.close()

if __name__ == "__main__":
    migrate_shipping()
