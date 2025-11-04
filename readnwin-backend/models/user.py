from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    phone_number = Column(String)
    school_name = Column(String)
    school_category = Column(String)  # Primary, Secondary, Tertiary
    class_level = Column(String)  # For Primary/Secondary
    department = Column(String)  # For Tertiary
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=False)  # Changed default to False until verified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    verification_token = Column(String, unique=True, nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    is_email_verified = Column(Boolean, default=False)

    role = relationship("Role", back_populates="users")
    auth_logs = relationship("AuthLog", back_populates="user")
    orders = relationship("Order", back_populates="user")
    enhanced_orders = relationship("EnhancedOrder", back_populates="user")
    cart_items = relationship("Cart", back_populates="user")
    enhanced_cart = relationship("EnhancedCart", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    library_items = relationship("UserLibrary", back_populates="user")
    reading_sessions = relationship("ReadingSession", back_populates="user")
    reading_goals = relationship("ReadingGoal", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    shopping_preferences = relationship("ShoppingPreference", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    # reader_settings = relationship("ReaderSettings", back_populates="user", uselist=False)
    # bookmarks = relationship("Bookmark", back_populates="user")
    # notes = relationship("Note", back_populates="user")

    @property
    def permissions(self):
        """Get user permissions from role"""
        try:
            if not self.role:
                return []
            if not hasattr(self.role, 'permissions') or not self.role.permissions:
                return []
            return [rp.permission.name for rp in self.role.permissions if rp.permission]
        except:
            return []

    @property
    def has_admin_access(self):
        """Check if user has admin access"""
        try:
            if not self.role:
                return False
            # Check role name first (doesn't require permissions to be loaded)
            if self.role.name in ['super_admin', 'admin']:
                return True
            # Only check permissions if they're loaded
            try:
                perms = self.permissions
                return 'super_admin' in perms or 'admin_access' in perms
            except:
                # If permissions can't be loaded, rely on role name only
                return False
        except:
            return False
    
    @property
    def is_admin(self):
        """Alias for has_admin_access"""
        return self.has_admin_access
    
    @property
    def is_author(self):
        """Check if user is an author"""
        if not self.role:
            return False
        return (
            self.role.name == 'author' or
            'author_access' in self.permissions
        )

    def has_permission(self, permission_name: str) -> bool:
        """Check if user has specific permission"""
        return permission_name in self.permissions

    def has_any_permission(self, permission_names: list) -> bool:
        """Check if user has any of the specified permissions"""
        user_permissions = self.permissions
        return any(perm in user_permissions for perm in permission_names)

    def has_all_permissions(self, permission_names: list) -> bool:
        """Check if user has all of the specified permissions"""
        user_permissions = self.permissions
        return all(perm in user_permissions for perm in permission_names)
