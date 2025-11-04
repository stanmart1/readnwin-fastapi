"""add user profile fields

Revision ID: user_profile_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'user_profile_001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column('users', sa.Column('school_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('school_category', sa.String(), nullable=True))
    op.add_column('users', sa.Column('class_level', sa.String(), nullable=True))
    op.add_column('users', sa.Column('department', sa.String(), nullable=True))

def downgrade():
    # Remove columns
    op.drop_column('users', 'department')
    op.drop_column('users', 'class_level')
    op.drop_column('users', 'school_category')
    op.drop_column('users', 'school_name')
    op.drop_column('users', 'phone_number')