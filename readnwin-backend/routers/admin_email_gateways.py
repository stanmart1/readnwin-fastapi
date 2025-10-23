from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/email", tags=["admin-email-gateways"])

class EmailGatewayConfig(BaseModel):
    provider: str
    from_email: str
    from_name: str
    resend_api_key: Optional[str] = None
    resend_domain: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: Optional[bool] = None
    use_ssl: Optional[bool] = None

class EmailTestRequest(BaseModel):
    gatewayId: str
    config: dict
    testEmail: str

@router.get("/gateways")
def get_email_gateways(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get email gateway configuration"""
    check_admin_access(current_user)
    
    from sqlalchemy import text
    
    # Load saved configs from database
    saved_configs = {}
    try:
        results = db.execute(text("SELECT provider, api_key, from_email, from_name, domain, smtp_host, smtp_port, username, password, use_tls, is_active FROM email_gateway_config")).fetchall()
        for row in results:
            saved_configs[row[0]] = {
                "api_key": row[1],
                "from_email": row[2],
                "from_name": row[3],
                "domain": row[4],
                "smtp_host": row[5],
                "smtp_port": row[6],
                "username": row[7],
                "password": row[8],
                "use_tls": row[9],
                "is_active": row[10]
            }
    except Exception as e:
        logger.warning(f"Could not load saved gateway configs: {e}")
    
    # Return default gateway configs with saved values merged
    default_gateways = [
        {
            "id": "resend",
            "name": "Resend",
            "type": "resend",
            "isActive": saved_configs.get("resend", {}).get("is_active", False),
            "fromEmail": saved_configs.get("resend", {}).get("from_email", "noreply@readnwin.com"),
            "fromName": saved_configs.get("resend", {}).get("from_name", "ReadnWin"),
            "resendApiKey": saved_configs.get("resend", {}).get("api_key", ""),
            "resendDomain": saved_configs.get("resend", {}).get("domain", "readnwin.com"),
            "useEnvVars": False,
            "envVarPrefix": "RESEND"
        },
        {
            "id": "smtp",
            "name": "SMTP Server",
            "type": "smtp",
            "isActive": saved_configs.get("smtp", {}).get("is_active", False),
            "fromEmail": saved_configs.get("smtp", {}).get("from_email", "noreply@readnwin.com"),
            "fromName": saved_configs.get("smtp", {}).get("from_name", "ReadnWin"),
            "smtpHost": saved_configs.get("smtp", {}).get("smtp_host", "smtp.gmail.com"),
            "smtpPort": saved_configs.get("smtp", {}).get("smtp_port", 587),
            "smtpUsername": saved_configs.get("smtp", {}).get("username", ""),
            "smtpPassword": saved_configs.get("smtp", {}).get("password", ""),
            "smtpSecure": saved_configs.get("smtp", {}).get("use_tls", False),
            "useEnvVars": False,
            "envVarPrefix": "SMTP"
        },
        {
            "id": "sendgrid",
            "name": "SendGrid",
            "type": "sendgrid",
            "isActive": False,
            "fromEmail": "noreply@readnwin.com",
            "fromName": "ReadnWin",
            "sendgridApiKey": "",
            "sendgridDomain": "readnwin.com",
            "useEnvVars": False,
            "envVarPrefix": "SENDGRID"
        },
        {
            "id": "mailgun",
            "name": "Mailgun",
            "type": "mailgun",
            "isActive": False,
            "fromEmail": "noreply@readnwin.com",
            "fromName": "ReadnWin",
            "mailgunApiKey": "",
            "mailgunDomain": "readnwin.com",
            "mailgunRegion": "us",
            "useEnvVars": False,
            "envVarPrefix": "MAILGUN"
        },
        {
            "id": "aws-ses",
            "name": "AWS SES",
            "type": "aws-ses",
            "isActive": False,
            "fromEmail": "noreply@readnwin.com",
            "fromName": "ReadnWin",
            "awsAccessKeyId": "",
            "awsSecretAccessKey": "",
            "awsRegion": "us-east-1",
            "awsSesFromEmail": "noreply@readnwin.com",
            "useEnvVars": False,
            "envVarPrefix": "AWS_SES"
        },
        {
            "id": "postmark",
            "name": "Postmark",
            "type": "postmark",
            "isActive": False,
            "fromEmail": "noreply@readnwin.com",
            "fromName": "ReadnWin",
            "postmarkApiKey": "",
            "postmarkFromEmail": "noreply@readnwin.com",
            "postmarkFromName": "ReadnWin",
            "useEnvVars": False,
            "envVarPrefix": "POSTMARK"
        }
    ]
    
    # Find active gateway
    active_gateway = "resend"
    for provider, config in saved_configs.items():
        if config.get("is_active"):
            active_gateway = provider
            break
    
    return {
        "gateways": default_gateways,
        "activeGateway": active_gateway
    }

class EmailGatewaySaveRequest(BaseModel):
    gateways: list
    activeGateway: str

@router.post("/gateways")
def save_email_gateway(
    request: EmailGatewaySaveRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Save email gateway configuration"""
    check_admin_access(current_user)
    
    try:
        from sqlalchemy import text
        
        # Find the active gateway from the request
        active_gateway = next((g for g in request.gateways if g.get('id') == request.activeGateway), None)
        
        if not active_gateway:
            return {"success": False, "message": "Active gateway not found"}
        
        # Check if gateway config exists
        result = db.execute(text(
            "SELECT id FROM email_gateway_config WHERE provider = :provider LIMIT 1"
        ), {"provider": request.activeGateway}).fetchone()
        
        if result:
            # Update existing
            if request.activeGateway == 'resend':
                db.execute(text("""
                    UPDATE email_gateway_config 
                    SET api_key = :api_key, 
                        from_email = :from_email, 
                        from_name = :from_name,
                        domain = :domain,
                        is_active = true,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE provider = 'resend'
                """), {
                    "api_key": active_gateway.get('resendApiKey', ''),
                    "from_email": active_gateway.get('fromEmail', ''),
                    "from_name": active_gateway.get('fromName', ''),
                    "domain": active_gateway.get('resendDomain', '')
                })
            elif request.activeGateway == 'smtp':
                db.execute(text("""
                    UPDATE email_gateway_config 
                    SET smtp_host = :smtp_host,
                        smtp_port = :smtp_port,
                        username = :username,
                        password = :password,
                        from_email = :from_email,
                        from_name = :from_name,
                        use_tls = :use_tls,
                        is_active = true,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE provider = 'smtp'
                """), {
                    "smtp_host": active_gateway.get('smtpHost', ''),
                    "smtp_port": active_gateway.get('smtpPort', 587),
                    "username": active_gateway.get('smtpUsername', ''),
                    "password": active_gateway.get('smtpPassword', ''),
                    "from_email": active_gateway.get('fromEmail', ''),
                    "from_name": active_gateway.get('fromName', ''),
                    "use_tls": active_gateway.get('smtpSecure', False)
                })
        else:
            # Insert new
            if request.activeGateway == 'resend':
                db.execute(text("""
                    INSERT INTO email_gateway_config (provider, api_key, from_email, from_name, domain, is_active)
                    VALUES ('resend', :api_key, :from_email, :from_name, :domain, true)
                """), {
                    "api_key": active_gateway.get('resendApiKey', ''),
                    "from_email": active_gateway.get('fromEmail', ''),
                    "from_name": active_gateway.get('fromName', ''),
                    "domain": active_gateway.get('resendDomain', '')
                })
            elif request.activeGateway == 'smtp':
                db.execute(text("""
                    INSERT INTO email_gateway_config (provider, smtp_host, smtp_port, username, password, from_email, from_name, use_tls, is_active)
                    VALUES ('smtp', :smtp_host, :smtp_port, :username, :password, :from_email, :from_name, :use_tls, true)
                """), {
                    "smtp_host": active_gateway.get('smtpHost', ''),
                    "smtp_port": active_gateway.get('smtpPort', 587),
                    "username": active_gateway.get('smtpUsername', ''),
                    "password": active_gateway.get('smtpPassword', ''),
                    "from_email": active_gateway.get('fromEmail', ''),
                    "from_name": active_gateway.get('fromName', ''),
                    "use_tls": active_gateway.get('smtpSecure', False)
                })
        
        # Deactivate other gateways
        db.execute(text("""
            UPDATE email_gateway_config 
            SET is_active = false 
            WHERE provider != :provider
        """), {"provider": request.activeGateway})
        
        db.commit()
        
        return {"success": True, "message": "Gateway configuration saved successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving gateway config: {e}")
        return {"success": False, "message": str(e)}

@router.post("/gateways/test")
def test_email_gateway(
    request: EmailTestRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Test email gateway by sending test email"""
    check_admin_access(current_user)
    try:
        from services.resend_email_service import ResendEmailService
        email_service = ResendEmailService(db)
        result = email_service.send_email(
            to=[request.testEmail],
            subject="Test Email from ReadnWin",
            html_content="<h1>Test Email</h1><p>This is a test email from ReadnWin admin panel.</p>"
        )
        return {"success": True, "message": "Test email sent successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}