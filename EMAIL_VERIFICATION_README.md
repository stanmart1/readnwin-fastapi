# Email System Verification Guide

## Overview
This guide helps verify that all email sending functions in the ReadnWin application are properly connected to their corresponding email templates in the admin dashboard and can actually send emails.

## Quick Verification Steps

### 1. Ensure Email Functions Exist
```bash
python ensure_email_functions.py
```
This script ensures the required email functions exist in the database.

### 2. Verify Template Connections
```bash
python verify_email_connections.py
```
This script:
- Checks existing email templates
- Verifies email functions are configured
- Creates missing function-template assignments
- Tests email sending (optional)

### 3. Comprehensive Function Test
```bash
python test_all_email_functions.py
```
This script tests all email functions end-to-end:
- User registration email (welcome)
- Password reset email
- Order confirmation email
- Shipping notification email

## Email Functions in the Application

### 1. User Registration Email (`user_registration`)
**Triggered by:** User registration in `/auth/register`
**Template Variables:**
- `userName` - User's first name or username
- `userEmail` - User's email address
- `verificationUrl` - Email verification link
- `site_url` - Base site URL

**Code Location:** `readnwin-backend/routers/auth.py` (register function)

### 2. Password Reset Email (`password_reset`)
**Triggered by:** Password reset request in `/auth/reset-password`
**Template Variables:**
- `userName` - User's first name or username
- `resetUrl` - Password reset link
- `resetToken` - Reset token
- `site_url` - Base site URL

**Code Location:** `readnwin-backend/routers/auth.py` (request_password_reset function)

### 3. Order Confirmation Email (`order_confirmation`)
**Triggered by:** Order creation in checkout process
**Template Variables:**
- `userName` - Customer's name
- `orderNumber` - Order number
- `orderTotal` - Total amount
- `payment_method` - Payment method used
- `order_status` - Order status
- `site_url` - Base site URL

**Code Locations:**
- `readnwin-backend/routers/orders.py`
- `readnwin-backend/routers/checkout.py`

### 4. Shipping Notification Email (`shipping_notification`)
**Triggered by:** Order status update to "shipped" in admin
**Template Variables:**
- `userName` - Customer's name
- `trackingNumber` - Shipping tracking number
- `estimatedDelivery` - Estimated delivery date
- `order_number` - Order number
- `tracking_url` - Tracking URL
- `site_url` - Base site URL

**Code Location:** `readnwin-backend/routers/admin.py` (update order status)

## Email Service Configuration

### Option 1: Resend API (Recommended)
Set in `.env` file:
```
RESEND_API_KEY=your_resend_api_key_here
```

### Option 2: SMTP
Set in `.env` file:
```
SMTP_HOST=mail.readnwin.com
SMTP_USER=portal@readnwin.com
SMTP_PASS=your_smtp_password
SMTP_PORT=465
```

## Template Management

### Admin Dashboard Access
1. Login as admin user
2. Navigate to Email Templates section
3. View/Edit templates and function assignments

### Template Variables
Templates use `{{variable}}` syntax for variable substitution:
```html
<p>Hello {{userName}},</p>
<p>Your order {{orderNumber}} has been confirmed.</p>
```

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check email service configuration (Resend API key or SMTP settings)
   - Verify email gateway is active in admin dashboard
   - Check server logs for error messages

2. **Template not found errors**
   - Ensure email functions exist in database
   - Verify function-template assignments are created
   - Check template is active

3. **Variables not rendering**
   - Verify variable names match between code and template
   - Check template syntax uses `{{variable}}` format

### Debug Steps

1. **Check Environment Variables**
   ```bash
   echo $RESEND_API_KEY
   # or
   echo $SMTP_HOST
   ```

2. **Check Database Tables**
   - `email_functions` - Email function definitions
   - `email_templates` - Email template content
   - `email_function_assignments` - Function-template mappings

3. **Check Server Logs**
   Look for email-related error messages in the FastAPI server logs.

## Testing Email Delivery

### Test with Real Email
1. Update test scripts with your email address
2. Run verification scripts
3. Check your email inbox for test messages

### Test Template Rendering
Use the admin dashboard email template test feature:
1. Go to Email Templates in admin
2. Select a template
3. Click "Test" button
4. Enter test email and variables
5. Send test email

## API Endpoints

### Email Template Management
- `GET /admin/email-templates` - List templates
- `POST /admin/email-templates` - Create template
- `PUT /admin/email-templates/{id}` - Update template
- `DELETE /admin/email-templates/{id}` - Delete template

### Email Function Management
- `GET /admin/email-functions` - List functions
- `GET /admin/email-assignments` - List assignments
- `POST /admin/email-templates/assignments` - Create assignment

### Email Testing
- `POST /admin/email-templates/test` - Test email sending

## Success Indicators

✅ **Fully Working Email System:**
- All 4 email functions have template assignments
- Email service is configured (Resend or SMTP)
- Test emails send successfully
- Templates render variables correctly
- Users receive emails for registration, password reset, orders, and shipping

## Support

If you encounter issues:
1. Run the verification scripts to identify problems
2. Check the troubleshooting section above
3. Review server logs for detailed error messages
4. Ensure email service credentials are correct