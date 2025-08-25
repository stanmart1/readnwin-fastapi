"""Add verification fields to User model

This migration adds email verification related fields to the User model.
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '001_add_verification_fields'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns
    op.add_column('users', sa.Column('verification_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_token_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), server_default='false', nullable=False))
    
    # Add unique constraint on verification_token
    op.create_unique_constraint('uq_users_verification_token', 'users', ['verification_token'])
    
    # Update existing users to be verified if they are active
    op.execute("""
        UPDATE users 
        SET is_email_verified = true 
        WHERE is_active = true
    """)

def downgrade():
    # Remove unique constraint
    op.drop_constraint('uq_users_verification_token', 'users', type_='unique')
    
    # Remove columns
    op.drop_column('users', 'is_email_verified')
    op.drop_column('users', 'verification_token_expires')
    op.drop_column('users', 'verification_token')
