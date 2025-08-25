from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime
import json

from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.email import EmailTemplate, EmailGatewayConfig
from models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/email", tags=["admin", "email"])

# Pydantic models for request/response
class EmailTemplateCreate(BaseModel):
    name: str
    slug: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    description: Optional[str] = None
    category: str = "general"
    variables: Optional[dict] = {}
    is_active: bool = True

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    variables: Optional[dict] = None
    is_active: Optional[bool] = None

class EmailGatewayConfigRequest(BaseModel):
    provider: str
    # Resend fields
    resend_api_key: Optional[str] = None
    resend_domain: Optional[str] = None
    # SMTP fields
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: Optional[bool] = True
    use_ssl: Optional[bool] = False
    # SendGrid fields
    sendgrid_api_key: Optional[str] = None
    sendgrid_domain: Optional[str] = None
    # Common fields
    from_email: str
    from_name: str

class EmailTestRequest(BaseModel):
    template_id: int
    test_email: str
    test_variables: Optional[dict] = {}

# Email Template Management
@router.get("/templates")
def get_email_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all email templates with filtering"""
    check_admin_access(current_user)

    try:
        query = db.query(EmailTemplate)

        # Apply filters
        if search:
            query = query.filter(
                or_(
                    EmailTemplate.name.contains(search),
                    EmailTemplate.subject.contains(search),
                    EmailTemplate.description.contains(search)
                )
            )

        if category:
            query = query.filter(EmailTemplate.category == category)

        if is_active is not None:
            query = query.filter(EmailTemplate.is_active == is_active)

        # Get templates with pagination
        templates = query.offset(skip).limit(limit).all()
        total_count = query.count()

        result = []
        for template in templates:
            result.append({
                "id": template.id,
                "name": template.name,
                "slug": template.slug,
                "subject": template.subject,
                "html_content": template.html_content,
                "text_content": template.text_content,
                "description": template.description,
                "category": template.category,
                "variables": json.loads(template.variables) if template.variables else {},
                "is_active": template.is_active,
                "created_at": template.created_at.isoformat(),
                "updated_at": template.updated_at.isoformat() if template.updated_at else None
            })

        return {
            "templates": result,
            "total": total_count,
            "page": (skip // limit) + 1,
            "pages": (total_count + limit - 1) // limit
        }

    except Exception as e:
        print(f"Error fetching email templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email templates")

@router.post("/templates")
def create_email_template(
    template: EmailTemplateCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new email template"""
    check_admin_access(current_user)

    try:
        # Check if template with same slug exists
        existing_template = db.query(EmailTemplate).filter(EmailTemplate.slug == template.slug).first()
        if existing_template:
            raise HTTPException(status_code=400, detail="Template with this slug already exists")

        # Create new template
        new_template = EmailTemplate(
            name=template.name,
            slug=template.slug,
            subject=template.subject,
            html_content=template.html_content,
            text_content=template.text_content,
            description=template.description,
            category=template.category,
            variables=json.dumps(template.variables) if template.variables else "{}",
            is_active=template.is_active,
            created_at=datetime.utcnow()
        )

        db.add(new_template)
        db.commit()
        db.refresh(new_template)

        return {
            "message": "Email template created successfully",
            "template_id": new_template.id,
            "template": {
                "id": new_template.id,
                "name": new_template.name,
                "slug": new_template.slug,
                "subject": new_template.subject,
                "category": new_template.category,
                "is_active": new_template.is_active
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating email template: {e}")
        raise HTTPException(status_code=500, detail="Failed to create email template")

@router.get("/templates/{template_id}")
def get_email_template(
    template_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get a specific email template"""
    check_admin_access(current_user)

    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")

    return {
        "id": template.id,
        "name": template.name,
        "slug": template.slug,
        "subject": template.subject,
        "html_content": template.html_content,
        "text_content": template.text_content,
        "description": template.description,
        "category": template.category,
        "variables": json.loads(template.variables) if template.variables else {},
        "is_active": template.is_active,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat() if template.updated_at else None
    }

@router.put("/templates/{template_id}")
def update_email_template(
    template_id: int,
    template_update: EmailTemplateUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update an email template"""
    check_admin_access(current_user)

    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")

    try:
        # Update fields if provided
        if template_update.name is not None:
            template.name = template_update.name
        if template_update.subject is not None:
            template.subject = template_update.subject
        if template_update.html_content is not None:
            template.html_content = template_update.html_content
        if template_update.text_content is not None:
            template.text_content = template_update.text_content
        if template_update.description is not None:
            template.description = template_update.description
        if template_update.category is not None:
            template.category = template_update.category
        if template_update.variables is not None:
            template.variables = json.dumps(template_update.variables)
        if template_update.is_active is not None:
            template.is_active = template_update.is_active

        template.updated_at = datetime.utcnow()
        db.commit()

        return {
            "message": "Email template updated successfully",
            "template_id": template.id
        }

    except Exception as e:
        db.rollback()
        print(f"Error updating email template: {e}")
        raise HTTPException(status_code=500, detail="Failed to update email template")

@router.delete("/templates/{template_id}")
def delete_email_template(
    template_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete an email template"""
    check_admin_access(current_user)

    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")

    try:
        db.delete(template)
        db.commit()
        return {"message": "Email template deleted successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error deleting email template: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete email template")

@router.get("/templates/categories")
def get_email_template_categories(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all email template categories"""
    check_admin_access(current_user)

    try:
        categories = db.query(
            EmailTemplate.category,
            func.count(EmailTemplate.id).label('template_count')
        ).group_by(EmailTemplate.category).all()

        result = []
        for category in categories:
            result.append({
                "name": category.category,
                "template_count": category.template_count,
                "description": f"Templates for {category.category}",
                "color": "#3B82F6",
                "icon": "ri-mail-line"
            })

        return {"categories": result}

    except Exception as e:
        print(f"Error fetching email categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email categories")

@router.get("/templates/stats")
def get_email_template_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get email template statistics"""
    check_admin_access(current_user)

    try:
        total_templates = db.query(EmailTemplate).count()
        active_templates = db.query(EmailTemplate).filter(EmailTemplate.is_active == True).count()

        categories_stats = db.query(
            EmailTemplate.category,
            func.count(EmailTemplate.id).label('count')
        ).group_by(EmailTemplate.category).all()

        return {
            "stats": {
                "total": total_templates,
                "active": active_templates,
                "inactive": total_templates - active_templates,
                "byCategory": {cat.category: cat.count for cat in categories_stats}
            }
        }

    except Exception as e:
        print(f"Error fetching email template stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email template stats")

# Email Gateway Configuration Endpoints
@router.post("/gateways")
def create_or_update_email_gateway(
    config: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create or update email gateway configuration in database"""
    check_admin_access(current_user)

    try:
        from models.email import EmailGatewayConfig as EmailGatewayModel
        
        # First, deactivate all existing gateways
        db.query(EmailGatewayModel).update({"is_active": False})
        
        # Check if gateway config for this provider exists
        provider = config.get("provider", "smtp")
        existing_config = db.query(EmailGatewayModel).filter(
            EmailGatewayModel.provider == provider
        ).first()

        if existing_config:
            # Update existing config based on provider
            if provider == "resend":
                if config.get("resend_api_key"):  # Only update if provided
                    existing_config.api_key = config.get("resend_api_key")
                existing_config.domain = config.get("resend_domain", "")
            elif provider == "smtp":
                existing_config.smtp_host = config.get("smtp_host", "")
                existing_config.smtp_port = config.get("smtp_port", 587)
                existing_config.username = config.get("username", "")
                if config.get("password"):  # Only update if provided
                    existing_config.password = config.get("password")
                existing_config.use_tls = config.get("use_tls", True)
                existing_config.use_ssl = config.get("use_ssl", False)
            elif provider == "sendgrid":
                if config.get("sendgrid_api_key"):  # Only update if provided
                    existing_config.api_key = config.get("sendgrid_api_key")
                existing_config.domain = config.get("sendgrid_domain", "")
            
            existing_config.from_email = config.get("from_email", existing_config.from_email)
            existing_config.from_name = config.get("from_name", existing_config.from_name)
            existing_config.is_active = True
            existing_config.updated_at = datetime.utcnow()
            message = "Email gateway configuration updated successfully"
        else:
            # Create new config
            new_config = EmailGatewayModel(
                provider=provider,
                api_key=config.get("resend_api_key") or config.get("sendgrid_api_key") or "",
                smtp_host=config.get("smtp_host", ""),
                smtp_port=config.get("smtp_port", 587),
                username=config.get("username", ""),
                password=config.get("password", ""),
                use_tls=config.get("use_tls", True),
                use_ssl=config.get("use_ssl", False),
                from_email=config.get("from_email", ""),
                from_name=config.get("from_name", ""),
                domain=config.get("resend_domain") or config.get("sendgrid_domain", ""),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(new_config)
            message = "Email gateway configuration created successfully"

        db.commit()
        return {"message": message}

    except Exception as e:
        db.rollback()
        print(f"Error saving email gateway config: {e}")
        raise HTTPException(status_code=500, detail="Failed to save email gateway configuration")

@router.get("/gateways")
def get_email_gateways(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get email gateway configurations from database"""
    check_admin_access(current_user)

    try:
        from models.email import EmailGatewayConfig as EmailGatewayModel
        
        # Get all gateway configurations from database
        configs = db.query(EmailGatewayModel).all()
        
        gateways = []
        active_gateway = None
        
        for config in configs:
            gateway_data = {
                "id": config.provider,
                "name": config.provider.title(),
                "type": config.provider,
                "isActive": config.is_active,
                "fromEmail": config.from_email,
                "fromName": config.from_name
            }
            
            # Add provider-specific fields
            if config.provider == "resend":
                gateway_data.update({
                    "resendApiKey": config.api_key or "",  # Return API key for editing
                    "resendDomain": config.domain or ""
                })
            elif config.provider == "smtp":
                gateway_data.update({
                    "smtpHost": config.smtp_host or "",
                    "smtpPort": config.smtp_port or 587,
                    "smtpUsername": config.username or "",
                    "smtpPassword": config.password or "",  # Return password for editing
                    "smtpSecure": config.use_tls
                })
            elif config.provider == "sendgrid":
                gateway_data.update({
                    "sendgridApiKey": config.api_key or "",  # Return API key for editing
                    "sendgridDomain": config.domain or ""
                })
            
            gateways.append(gateway_data)
            
            if config.is_active:
                active_gateway = config.provider
        
        # If no gateways in database, create default entries
        if not gateways:
            # Create default Resend gateway
            default_resend = EmailGatewayModel(
                provider="resend",
                from_email="noreply@readnwin.com",
                from_name="ReadnWin",
                domain="readnwin.com",
                is_active=True
            )
            db.add(default_resend)
            db.commit()
            
            return {
                "gateways": [{
                    "id": "resend",
                    "name": "Resend",
                    "type": "resend",
                    "isActive": True,
                    "fromEmail": "noreply@readnwin.com",
                    "fromName": "ReadnWin",
                    "resendApiKey": "",
                    "resendDomain": "readnwin.com"
                }],
                "activeGateway": "resend"
            }
        
        return {
            "gateways": gateways,
            "activeGateway": active_gateway
        }

    except Exception as e:
        print(f"Error fetching email gateway config: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email gateway configuration")

@router.post("/gateways/test")
def test_email_gateway(
    test_request: EmailTestRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Test email gateway by sending a test email"""
    check_admin_access(current_user)

    try:
        # Use the existing email template test functionality
        from services.resend_email_service import ResendEmailService
        
        email_service = ResendEmailService(db)
        result = email_service.send_email_by_function(
            "user_registration",  # Use a default function for testing
            test_request.test_email,
            test_request.test_variables or {"userName": "Test User"}
        )
        
        if result.get("success"):
            return {
                "message": "Test email sent successfully",
                "test_email": test_request.test_email,
                "success": True
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail=result.get("error", "Failed to send test email")
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending test email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test email")
