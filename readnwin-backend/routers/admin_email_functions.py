from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.email_templates import AdminEmailFunction
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/admin", tags=["admin-email-functions"])

class EmailFunctionCreate(BaseModel):
    name: str
    slug: str
    description: str
    category: str
    required_variables: List[str]
    is_active: bool = True

@router.post("/email-functions")
def create_email_function(
    function_data: EmailFunctionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create a new email function"""
    check_admin_access(current_user)
    try:
        function = AdminEmailFunction(
            name=function_data.name,
            slug=function_data.slug,
            description=function_data.description,
            category=function_data.category,
            required_variables=function_data.required_variables,
            is_active=function_data.is_active
        )
        db.add(function)
        db.commit()
        return {"message": "Function created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/email-functions/{function_id}")
def update_email_function(
    function_id: int,
    function_data: EmailFunctionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update an email function"""
    check_admin_access(current_user)
    try:
        function = db.query(AdminEmailFunction).filter(AdminEmailFunction.id == function_id).first()
        if not function:
            raise HTTPException(status_code=404, detail="Function not found")
        
        function.name = function_data.name
        function.slug = function_data.slug
        function.description = function_data.description
        function.category = function_data.category
        function.required_variables = function_data.required_variables
        function.is_active = function_data.is_active
        
        db.commit()
        return {"message": "Function updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/email-functions/{function_id}")
def delete_email_function(
    function_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete an email function"""
    check_admin_access(current_user)
    try:
        function = db.query(AdminEmailFunction).filter(AdminEmailFunction.id == function_id).first()
        if not function:
            raise HTTPException(status_code=404, detail="Function not found")
        
        db.delete(function)
        db.commit()
        return {"message": "Function deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))