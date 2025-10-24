from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime
import json
import logging

from core.database import get_db
from models.email_templates import AdminEmailTemplate, AdminEmailFunction, AdminEmailFunctionAssignment, AdminEmailTemplateCategory
from core.security import get_current_user_from_token, check_admin_access
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin-email-templates"])
logger = logging.getLogger(__name__)

# Pydantic models
class EmailTemplateCreate(BaseModel):
    name: str
    slug: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    description: Optional[str] = None
    category: str = "general"
    is_active: bool = True

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class EmailFunctionAssignmentCreate(BaseModel):
    functionId: int
    templateId: int
    priority: int = 1

class EmailFunctionAssignmentUpdate(BaseModel):
    priority: Optional[int] = None

@router.get("/email-templates")
def get_email_templates(
    category: Optional[str] = Query(None),
    is_active: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all email templates with filtering"""
    check_admin_access(current_user)
    try:
        query = db.query(AdminEmailTemplate)
        
        if category:
            query = query.filter(AdminEmailTemplate.category == category)
        
        if is_active is not None:
            active_bool = is_active.lower() == 'true'
            query = query.filter(AdminEmailTemplate.is_active == active_bool)
        
        if search:
            query = query.filter(
                or_(
                    AdminEmailTemplate.name.ilike(f"%{search}%"),
                    AdminEmailTemplate.subject.ilike(f"%{search}%"),
                    AdminEmailTemplate.description.ilike(f"%{search}%")
                )
            )
        
        templates = query.order_by(AdminEmailTemplate.created_at.desc()).all()
        
        return {
            "templates": [
                {
                    "id": template.id,
                    "name": template.name,
                    "slug": template.slug,
                    "subject": template.subject,
                    "html_content": template.html_content,
                    "text_content": template.text_content,
                    "description": template.description,
                    "category": template.category,
                    "is_active": template.is_active,
                    "created_at": template.created_at.isoformat() if template.created_at else None,
                    "updated_at": template.updated_at.isoformat() if template.updated_at else None
                }
                for template in templates
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/email-templates")
def create_email_template(
    template_data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create a new email template"""
    check_admin_access(current_user)
    try:
        # Check if slug already exists
        existing = db.query(AdminEmailTemplate).filter(AdminEmailTemplate.slug == template_data.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template with this slug already exists")
        
        template = AdminEmailTemplate(
            name=template_data.name,
            slug=template_data.slug,
            subject=template_data.subject,
            html_content=template_data.html_content,
            text_content=template_data.text_content,
            description=template_data.description,
            category=template_data.category,
            is_active=template_data.is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return {
            "message": "Email template created successfully",
            "template": {
                "id": template.id,
                "name": template.name,
                "slug": template.slug,
                "subject": template.subject,
                "category": template.category,
                "is_active": template.is_active
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/email-templates/{template_id}")
def update_email_template(
    template_id: int,
    template_data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update an email template"""
    check_admin_access(current_user)
    try:
        template = db.query(AdminEmailTemplate).filter(AdminEmailTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check slug uniqueness if being updated
        if template_data.slug and template_data.slug != template.slug:
            existing = db.query(AdminEmailTemplate).filter(
                and_(AdminEmailTemplate.slug == template_data.slug, AdminEmailTemplate.id != template_id)
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Template with this slug already exists")
        
        # Update fields
        for field, value in template_data.dict(exclude_unset=True).items():
            setattr(template, field, value)
        
        template.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(template)
        
        return {"message": "Email template updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/email-templates/{template_id}")
def delete_email_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete an email template"""
    check_admin_access(current_user)
    try:
        template = db.query(AdminEmailTemplate).filter(AdminEmailTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Save slug for filesystem deletion
        template_slug = template.slug
        
        # Delete associated assignments first
        db.query(AdminEmailFunctionAssignment).filter(AdminEmailFunctionAssignment.template_id == template_id).delete()
        
        db.delete(template)
        db.commit()
        
        # Sync deletion to filesystem
        try:
            from services.template_sync_service import TemplateSyncService
            TemplateSyncService.delete_from_filesystem(template_slug)
        except Exception as e:
            logger.warning(f"Failed to delete template from filesystem: {e}")
        
        return {"message": "Email template deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-categories")
def get_email_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all email template categories"""
    check_admin_access(current_user)
    try:
        categories = db.query(AdminEmailTemplateCategory).all()
        
        # If no categories exist, create default ones
        if not categories:
            default_categories = [
                AdminEmailTemplateCategory(name="general", description="General purpose emails", color="#6B7280", icon="ri-mail-line"),
                AdminEmailTemplateCategory(name="authentication", description="Login and registration emails", color="#3B82F6", icon="ri-shield-user-line"),
                AdminEmailTemplateCategory(name="notifications", description="System notifications", color="#10B981", icon="ri-notification-line"),
                AdminEmailTemplateCategory(name="marketing", description="Marketing and promotional emails", color="#F59E0B", icon="ri-megaphone-line"),
                AdminEmailTemplateCategory(name="transactional", description="Order and payment confirmations", color="#8B5CF6", icon="ri-shopping-cart-line")
            ]
            
            for category in default_categories:
                db.add(category)
            
            db.commit()
            categories = default_categories
        
        return {
            "categories": [
                {
                    "id": category.id,
                    "name": category.name,
                    "description": category.description,
                    "color": category.color,
                    "icon": category.icon
                }
                for category in categories
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-functions")
def get_email_functions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all email functions"""
    check_admin_access(current_user)
    try:
        functions = db.query(AdminEmailFunction).all()
        
        # If no functions exist, create default ones
        if not functions:
            default_functions = [
                AdminEmailFunction(
                    name="User Registration",
                    slug="user_registration",
                    description="Welcome email sent when user registers",
                    category="authentication",
                    required_variables=["userName", "userEmail", "verificationUrl"],
                    is_active=True
                ),
                AdminEmailFunction(
                    name="Password Reset",
                    slug="password_reset",
                    description="Email sent when user requests password reset",
                    category="authentication",
                    required_variables=["userName", "resetUrl", "resetToken"],
                    is_active=True
                ),
                AdminEmailFunction(
                    name="Order Confirmation",
                    slug="order_confirmation",
                    description="Email sent when order is placed",
                    category="transactional",
                    required_variables=["userName", "orderNumber", "orderTotal"],
                    is_active=True
                ),
                AdminEmailFunction(
                    name="Shipping Notification",
                    slug="shipping_notification",
                    description="Email sent when order is shipped",
                    category="transactional",
                    required_variables=["userName", "trackingNumber", "estimatedDelivery"],
                    is_active=True
                )
            ]
            
            for function in default_functions:
                db.add(function)
            
            db.commit()
            functions = default_functions
        
        return {
            "functions": [
                {
                    "id": function.id,
                    "name": function.name,
                    "slug": function.slug,
                    "description": function.description,
                    "category": function.category,
                    "required_variables": function.required_variables,
                    "is_active": function.is_active,
                    "created_at": function.created_at.isoformat() if function.created_at else None
                }
                for function in functions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-assignments")
def get_email_assignments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all email function assignments"""
    check_admin_access(current_user)
    try:
        assignments = db.query(AdminEmailFunctionAssignment).join(AdminEmailFunction).join(AdminEmailTemplate).all()
        
        return {
            "assignments": [
                {
                    "id": assignment.id,
                    "function_id": assignment.function_id,
                    "template_id": assignment.template_id,
                    "is_active": assignment.is_active,
                    "priority": assignment.priority,
                    "function_name": assignment.email_function.name,
                    "function_slug": assignment.email_function.slug,
                    "template_name": assignment.email_template.name,
                    "template_slug": assignment.email_template.slug,
                    "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
                    "updated_at": assignment.updated_at.isoformat() if assignment.updated_at else None
                }
                for assignment in assignments
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/email-templates/assignments")
def create_assignment(
    assignment_data: EmailFunctionAssignmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Assign template to function"""
    check_admin_access(current_user)
    try:
        # Check if assignment already exists
        existing = db.query(AdminEmailFunctionAssignment).filter(
            and_(
                AdminEmailFunctionAssignment.function_id == assignment_data.functionId,
                AdminEmailFunctionAssignment.template_id == assignment_data.templateId
            )
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Assignment already exists")
        
        assignment = AdminEmailFunctionAssignment(
            function_id=assignment_data.functionId,
            template_id=assignment_data.templateId,
            priority=assignment_data.priority,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(assignment)
        db.commit()
        
        return {"message": "Template assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/email-templates/assignments")
def delete_assignment(
    function_id: int = Query(...),
    template_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Remove template assignment"""
    check_admin_access(current_user)
    try:
        assignment = db.query(AdminEmailFunctionAssignment).filter(
            and_(
                AdminEmailFunctionAssignment.function_id == function_id,
                AdminEmailFunctionAssignment.template_id == template_id
            )
        ).first()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        db.delete(assignment)
        db.commit()
        
        return {"message": "Assignment removed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/email-templates/assignments/{assignment_id}")
def update_assignment_priority(
    assignment_id: int,
    assignment_data: EmailFunctionAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update assignment priority"""
    check_admin_access(current_user)
    try:
        assignment = db.query(AdminEmailFunctionAssignment).filter(AdminEmailFunctionAssignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        if assignment_data.priority is not None:
            assignment.priority = assignment_data.priority
        
        assignment.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Assignment updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/email-templates/assignments/{assignment_id}")
def toggle_assignment_status(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Toggle assignment active status"""
    check_admin_access(current_user)
    try:
        assignment = db.query(AdminEmailFunctionAssignment).filter(AdminEmailFunctionAssignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        assignment.is_active = not assignment.is_active
        assignment.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Assignment status updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-stats")
def get_email_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get email template statistics"""
    check_admin_access(current_user)
    try:
        total_templates = db.query(AdminEmailTemplate).count()
        active_templates = db.query(AdminEmailTemplate).filter(AdminEmailTemplate.is_active == True).count()
        
        # Get templates by category
        category_stats = db.query(
            AdminEmailTemplate.category,
            func.count(AdminEmailTemplate.id).label('count')
        ).group_by(AdminEmailTemplate.category).all()
        
        by_category = {stat.category: stat.count for stat in category_stats}
        
        return {
            "stats": {
                "total": total_templates,
                "active": active_templates,
                "byCategory": by_category
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))