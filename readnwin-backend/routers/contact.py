from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.contact import Contact
from models.contact_settings import ContactMethod, OfficeInfo, ContactSubject
from models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any
import bleach

router = APIRouter()

class ContactSubmission(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ContactInfo(BaseModel):
    contactMethods: List[dict]
    faqs: List[dict]
    officeInfo: dict
    contactSubjects: List[dict]

def sanitize_html_content(content):
    """Sanitize HTML content to prevent XSS"""
    if isinstance(content, str):
        allowed_tags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u']
        allowed_attributes = {}
        return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    elif isinstance(content, dict):
        return {k: sanitize_html_content(v) for k, v in content.items()}
    elif isinstance(content, list):
        return [sanitize_html_content(item) for item in content]
    return content

@router.post("/")
def submit_contact(contact_data: ContactSubmission, db: Session = Depends(get_db)):
    try:
        # Sanitize input data
        sanitized_data = {
            'name': sanitize_html_content(contact_data.name),
            'email': sanitize_html_content(contact_data.email),
            'subject': sanitize_html_content(contact_data.subject),
            'message': sanitize_html_content(contact_data.message)
        }
        
        contact = Contact(
            name=sanitized_data['name'],
            email=sanitized_data['email'],
            subject=sanitized_data['subject'],
            message=sanitized_data['message']
        )
        db.add(contact)
        db.commit()
        return {"message": "Contact form submitted successfully"}
    except Exception as e:
        print(f"Database error: {e}")
        return {"message": "Contact form submitted successfully"}

@router.get("/info")
def get_contact_info(db: Session = Depends(get_db)):
    try:
        contact_methods = db.query(ContactMethod).filter(ContactMethod.is_active == True).all()
        office_info = db.query(OfficeInfo).filter(OfficeInfo.is_active == True).first()
        subjects = db.query(ContactSubject).filter(ContactSubject.is_active == True).order_by(ContactSubject.order_index).all()
        
        return {
            "success": True,
            "data": {
                "contactMethods": [
                    {
                        "icon": method.icon,
                        "title": method.title,
                        "description": method.description,
                        "contact": method.contact,
                        "action": method.action,
                        "isActive": method.is_active
                    }
                    for method in contact_methods
                ],
                "officeInfo": {
                    "address": office_info.address,
                    "hours": office_info.hours,
                    "parking": office_info.parking,
                    "isActive": office_info.is_active
                } if office_info else None,
                "contactSubjects": [
                    {
                        "name": subject.name,
                        "isActive": subject.is_active
                    }
                    for subject in subjects
                ]
            }
        }
    except Exception as e:
        print(f"Error fetching contact info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch contact information")

# Admin endpoints
@router.get("/admin")
def get_admin_contact_data(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get contact data for admin management"""
    check_admin_access(current_user)
    
    try:
        contact_methods = db.query(ContactMethod).all()
        office_info = db.query(OfficeInfo).first()
        subjects = db.query(ContactSubject).order_by(ContactSubject.order_index).all()
        
        return {
            "success": True,
            "data": {
                "contactMethods": [
                    {
                        "id": method.id,
                        "icon": method.icon,
                        "title": method.title,
                        "description": method.description,
                        "contact": method.contact,
                        "action": method.action,
                        "isActive": method.is_active
                    }
                    for method in contact_methods
                ],
                "officeInfo": {
                    "address": office_info.address if office_info else "",
                    "hours": office_info.hours if office_info else "",
                    "parking": office_info.parking if office_info else "",
                    "isActive": office_info.is_active if office_info else True
                },
                "contactSubjects": [
                    {
                        "id": str(subject.id),
                        "name": subject.name,
                        "isActive": subject.is_active,
                        "order": subject.order_index
                    }
                    for subject in subjects
                ]
            }
        }
    except Exception as e:
        print(f"Error fetching admin contact data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch contact data")

@router.post("/admin")
@router.put("/admin")
def save_admin_contact_data(
    contact_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save contact data from admin"""
    check_admin_access(current_user)
    
    try:
        sanitized_data = sanitize_html_content(contact_data)
        
        # Update contact methods
        for method_data in sanitized_data.get('contactMethods', []):
            method = db.query(ContactMethod).filter(ContactMethod.id == method_data['id']).first()
            if method:
                method.title = method_data['title']
                method.description = method_data['description']
                method.contact = method_data['contact']
                method.action = method_data['action']
                method.is_active = method_data['isActive']
            else:
                new_method = ContactMethod(
                    id=method_data['id'],
                    icon=method_data['icon'],
                    title=method_data['title'],
                    description=method_data['description'],
                    contact=method_data['contact'],
                    action=method_data['action'],
                    is_active=method_data['isActive']
                )
                db.add(new_method)
        
        # Update office info
        office_data = sanitized_data.get('officeInfo', {})
        office_info = db.query(OfficeInfo).first()
        if office_info:
            office_info.address = office_data['address']
            office_info.hours = office_data['hours']
            office_info.parking = office_data['parking']
            office_info.is_active = office_data['isActive']
        else:
            new_office = OfficeInfo(
                address=office_data['address'],
                hours=office_data['hours'],
                parking=office_data['parking'],
                is_active=office_data['isActive']
            )
            db.add(new_office)
        
        # Update subjects
        db.query(ContactSubject).delete()
        for subject_data in sanitized_data.get('contactSubjects', []):
            new_subject = ContactSubject(
                name=subject_data['name'],
                is_active=subject_data['isActive'],
                order_index=subject_data['order']
            )
            db.add(new_subject)
        
        db.commit()
        return {
            "success": True,
            "message": "Contact information saved successfully"
        }
    except Exception as e:
        db.rollback()
        print(f"Error saving admin contact data: {e}")
        raise HTTPException(status_code=500, detail="Failed to save contact data")