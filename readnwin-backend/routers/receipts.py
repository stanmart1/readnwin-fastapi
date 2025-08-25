from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.order import Order, OrderItem
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import io

router = APIRouter()

def create_receipt_pdf(order: Order) -> bytes:
    """Generate a receipt PDF for an order"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1f2937')
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.HexColor('#374151')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Title
    elements.append(Paragraph("RECEIPT", title_style))
    elements.append(Spacer(1, 12))
    
    # Company Info
    elements.append(Paragraph("ReadnWin", header_style))
    elements.append(Paragraph("Digital Book Platform", normal_style))
    elements.append(Paragraph("support@readnwin.com", normal_style))
    elements.append(Spacer(1, 20))
    
    # Receipt Info
    receipt_data = [
        ['Receipt #:', order.order_number],
        ['Date:', order.created_at.strftime('%B %d, %Y')],
        ['Payment Method:', order.payment_method or 'N/A'],
        ['Status:', order.status.title()]
    ]
    
    receipt_table = Table(receipt_data, colWidths=[2*inch, 3*inch])
    receipt_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(receipt_table)
    elements.append(Spacer(1, 20))
    
    # Customer Info
    elements.append(Paragraph("Bill To:", header_style))
    if order.user:
        customer_name = f"{order.user.first_name or ''} {order.user.last_name or ''}".strip() or order.user.email
        elements.append(Paragraph(customer_name, normal_style))
        elements.append(Paragraph(order.user.email, normal_style))
    else:
        elements.append(Paragraph("Guest Customer", normal_style))
        elements.append(Paragraph(getattr(order, 'guest_email', 'N/A'), normal_style))
    
    elements.append(Spacer(1, 20))
    
    # Items table
    elements.append(Paragraph("Items Purchased:", header_style))
    
    # Table headers
    item_data = [['Item', 'Qty', 'Price', 'Total']]
    
    # Add items
    for item in order.items:
        item_data.append([
            f"{item.book.title}\nby {item.book.author}",
            str(item.quantity),
            f"₦{item.price:,.2f}",
            f"₦{item.quantity * item.price:,.2f}"
        ])
    
    # Create table
    items_table = Table(item_data, colWidths=[3.5*inch, 0.8*inch, 1*inch, 1*inch])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Totals
    total_data = [
        ['Subtotal:', f"₦{order.total_amount:,.2f}"],
        ['Tax:', f"₦{getattr(order, 'tax_amount', 0):,.2f}"],
        ['Total:', f"₦{order.total_amount:,.2f}"]
    ]
    
    totals_table = Table(total_data, colWidths=[4*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
    ]))
    elements.append(totals_table)
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Thank you for your purchase!", 
                            ParagraphStyle('Footer', parent=styles['Normal'], 
                                         fontSize=12, alignment=TA_CENTER, 
                                         textColor=colors.HexColor('#6b7280'))))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def create_invoice_pdf(order: Order) -> bytes:
    """Generate an invoice PDF for an order"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1f2937')
    )
    
    header_style = ParagraphStyle(
        'InvoiceHeader',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.HexColor('#374151')
    )
    
    normal_style = ParagraphStyle(
        'InvoiceNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 12))
    
    # Company and Invoice Info Side by Side
    company_info = [
        ['<b>ReadnWin</b>', ''],
        ['Digital Book Platform', ''],
        ['support@readnwin.com', ''],
        ['', ''],
        ['', f'<b>Invoice #:</b> {order.order_number}'],
        ['', f'<b>Date:</b> {order.created_at.strftime("%B %d, %Y")}'],
        ['', f'<b>Due Date:</b> {order.created_at.strftime("%B %d, %Y")}'],
        ['', f'<b>Status:</b> {order.status.title()}']
    ]
    
    info_table = Table(company_info, colWidths=[3*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 30))
    
    # Bill To
    elements.append(Paragraph("Bill To:", header_style))
    if order.user:
        customer_name = f"{order.user.first_name or ''} {order.user.last_name or ''}".strip() or order.user.email
        elements.append(Paragraph(f"<b>{customer_name}</b>", normal_style))
        elements.append(Paragraph(order.user.email, normal_style))
    else:
        elements.append(Paragraph("<b>Guest Customer</b>", normal_style))
        elements.append(Paragraph(getattr(order, 'guest_email', 'N/A'), normal_style))
    
    # Add billing address if available
    if order.billing_address:
        if isinstance(order.billing_address, dict):
            addr = order.billing_address
            elements.append(Paragraph(f"{addr.get('street', '')}", normal_style))
            elements.append(Paragraph(f"{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}", normal_style))
            elements.append(Paragraph(f"{addr.get('country', '')}", normal_style))
    
    elements.append(Spacer(1, 20))
    
    # Items table with more detailed styling
    elements.append(Paragraph("Items:", header_style))
    
    item_data = [['Description', 'Qty', 'Unit Price', 'Total']]
    
    for item in order.items:
        item_data.append([
            f"{item.book.title}\nAuthor: {item.book.author}\nFormat: {getattr(item.book, 'format', 'Digital')}",
            str(item.quantity),
            f"₦{item.price:,.2f}",
            f"₦{item.quantity * item.price:,.2f}"
        ])
    
    items_table = Table(item_data, colWidths=[3.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        
        # Data
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Summary
    subtotal = order.total_amount
    tax_amount = getattr(order, 'tax_amount', 0)
    shipping_amount = getattr(order, 'shipping_amount', 0)
    discount_amount = getattr(order, 'discount_amount', 0)
    
    summary_data = []
    if subtotal != order.total_amount:
        summary_data.append(['Subtotal:', f"₦{subtotal:,.2f}"])
    if tax_amount > 0:
        summary_data.append(['Tax:', f"₦{tax_amount:,.2f}"])
    if shipping_amount > 0:
        summary_data.append(['Shipping:', f"₦{shipping_amount:,.2f}"])
    if discount_amount > 0:
        summary_data.append(['Discount:', f"-₦{discount_amount:,.2f}"])
    
    summary_data.append(['<b>Total:</b>', f"<b>₦{order.total_amount:,.2f}</b>"])
    
    summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1f2937')),
        ('TOPPADDING', (0, -1), (-1, -1), 10),
    ]))
    elements.append(summary_table)
    
    # Payment Info
    if order.payment_method:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Payment Information:", header_style))
        payment_info = [
            ['Payment Method:', order.payment_method],
            ['Payment Status:', order.payment_status or 'Pending']
        ]
        if order.payment_transaction_id:
            payment_info.append(['Transaction ID:', order.payment_transaction_id])
        
        payment_table = Table(payment_info, colWidths=[2*inch, 4*inch])
        payment_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(payment_table)
    
    # Terms and Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Terms & Conditions:", header_style))
    elements.append(Paragraph("• Digital products are delivered immediately upon payment confirmation", normal_style))
    elements.append(Paragraph("• All sales are final for digital products", normal_style))
    elements.append(Paragraph("• For support, contact support@readnwin.com", normal_style))
    
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Thank you for your business!", 
                            ParagraphStyle('InvoiceFooter', parent=styles['Normal'], 
                                         fontSize=12, alignment=TA_CENTER, 
                                         textColor=colors.HexColor('#6b7280'))))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/orders/{order_id}/receipt")
def download_receipt(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Download receipt for an order"""
    check_admin_access(current_user)
    
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.book)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        pdf_content = create_receipt_pdf(order)
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=receipt_{order.order_number}.pdf"
            }
        )
    except Exception as e:
        print(f"Error generating receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate receipt")

@router.get("/orders/{order_id}/invoice")
def download_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Download invoice for an order"""
    check_admin_access(current_user)
    
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.book)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        pdf_content = create_invoice_pdf(order)
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{order.order_number}.pdf"
            }
        )
    except Exception as e:
        print(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate invoice")

@router.get("/orders/{order_id}/receipt/preview")
def preview_receipt(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Preview receipt in browser"""
    check_admin_access(current_user)
    
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.book)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        pdf_content = create_receipt_pdf(order)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=receipt_{order.order_number}.pdf"
            }
        )
    except Exception as e:
        print(f"Error generating receipt preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate receipt preview")

@router.get("/orders/{order_id}/invoice/preview")
def preview_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Preview invoice in browser"""
    check_admin_access(current_user)
    
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.book)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        pdf_content = create_invoice_pdf(order)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=invoice_{order.order_number}.pdf"
            }
        )
    except Exception as e:
        print(f"Error generating invoice preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate invoice preview")