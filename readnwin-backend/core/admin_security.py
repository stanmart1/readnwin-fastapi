from fastapi import HTTPException, status
from models.user import User

def check_admin_access(user: User) -> bool:
    """Check if the user has admin role/permissions."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Check if user has admin role
    if user.role and user.role.name in ['admin', 'super_admin']:
        return True
    
    # Check if user has admin permissions
    if 'admin_access' in user.permissions or 'super_admin' in user.permissions:
        return True
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required"
    )
