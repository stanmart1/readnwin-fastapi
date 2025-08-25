"""
Currency utilities for handling Naira (NGN) calculations with precision
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Union

# Naira currency configuration
CURRENCY_CODE = "NGN"
CURRENCY_SYMBOL = "₦"
DECIMAL_PLACES = 2

def to_naira_decimal(amount: Union[str, int, float, Decimal]) -> Decimal:
    """Convert amount to Decimal with proper Naira precision"""
    if isinstance(amount, Decimal):
        return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def format_naira(amount: Union[str, int, float, Decimal]) -> str:
    """Format amount as Naira currency string"""
    decimal_amount = to_naira_decimal(amount)
    return f"{CURRENCY_SYMBOL}{decimal_amount:,.2f}"

def calculate_vat(amount: Union[str, int, float, Decimal], rate: float = 0.075) -> Decimal:
    """Calculate VAT (7.5% in Nigeria) on amount"""
    decimal_amount = to_naira_decimal(amount)
    vat_rate = Decimal(str(rate))
    return (decimal_amount * vat_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def calculate_total_with_vat(amount: Union[str, int, float, Decimal]) -> tuple[Decimal, Decimal, Decimal]:
    """Calculate subtotal, VAT, and total"""
    subtotal = to_naira_decimal(amount)
    vat = calculate_vat(subtotal)
    total = subtotal + vat
    return subtotal, vat, total

def validate_naira_amount(amount: Union[str, int, float, Decimal]) -> bool:
    """Validate if amount is a valid Naira amount"""
    try:
        decimal_amount = to_naira_decimal(amount)
        return decimal_amount > 0
    except (ValueError, TypeError):
        return False