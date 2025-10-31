# Checkout Testing Guide

## Test Scenarios

### Scenario 1: Ebook-Only Purchase ✅
**Expected Flow:**
1. Customer Information → Payment (2 steps)
2. No shipping address required
3. No shipping method selection
4. Shipping cost = ₦0

**Test Steps:**
1. Add only ebook(s) to cart
2. Go to checkout
3. Verify "Digital Purchase" indicator shows
4. Fill customer information (name, email)
5. Click Continue → Should go directly to Payment step
6. Verify order summary shows ₦0 shipping
7. Select payment method
8. Complete order

### Scenario 2: Physical Book Purchase ✅
**Expected Flow:**
1. Customer Information → Shipping Address → Shipping Method → Payment (4 steps)
2. All shipping fields required
3. Must select shipping method
4. Shipping cost added to total

**Test Steps:**
1. Add physical book(s) to cart
2. Go to checkout
3. Verify "Physical Books" indicator shows
4. Fill customer information (name, email, phone)
5. Click Continue → Go to Shipping Address
6. Fill shipping address (street, city, state, zip, country)
7. Click Continue → Go to Shipping Method
8. Verify shipping methods load (should see 7 methods)
9. Select a shipping method (e.g., Standard Delivery ₦1,500)
10. Verify shipping cost updates in order summary
11. Click Continue → Go to Payment
12. Verify total includes shipping cost
13. Select payment method
14. Complete order

### Scenario 3: Mixed Cart (Ebook + Physical)
**Expected Flow:**
1. Same as physical book purchase (4 steps)
2. Shipping required for physical items
3. Ebooks delivered instantly, physical items shipped

**Test Steps:**
1. Add both ebook(s) and physical book(s) to cart
2. Follow physical book purchase flow
3. Verify shipping is calculated only for physical items

## Validation Checks

### Step 1: Customer Information
- ✅ First name required
- ✅ Last name required
- ✅ Email required (valid format)
- ✅ Phone optional
- ✅ Cannot proceed without required fields

### Step 2: Shipping Address (Physical/Mixed only)
- ✅ Street address required
- ✅ City required
- ✅ State required
- ✅ ZIP code required
- ✅ Country pre-filled (Nigeria)
- ✅ Cannot proceed without required fields

### Step 3: Shipping Method (Physical/Mixed only)
- ✅ Must select one method
- ✅ Shows 7 active shipping methods
- ✅ Displays cost, delivery time, description
- ✅ Visual feedback on selection (blue border, checkmark)
- ✅ Free shipping threshold displayed if applicable
- ✅ Cannot proceed without selection
- ✅ Loading state while fetching methods

### Step 4: Payment
- ✅ Order summary shows correct totals
- ✅ Subtotal calculated correctly
- ✅ Shipping cost shown (₦0 for ebooks)
- ✅ Tax calculated (7.5%)
- ✅ Total = Subtotal + Shipping + Tax
- ✅ Payment method selection
- ✅ Complete Order button enabled when valid

## Available Shipping Methods

1. **Express Shipping** - ₦3,000 (2-3 days)
2. **Same Day Lagos** - ₦5,000 (0-1 days)
3. **Standard Shipping** - ₦1,500 (3-5 days)
4. **Same Day Delivery** - ₦5,000 (0-1 days)
5. **Express Delivery** - ₦3,000 (1-2 days)
6. **Standard Delivery** - ₦1,500 (3-5 days) - Free over ₦5,000
7. **Pick-Up (Free)** - ₦0 (3-7 days)

## Error Handling

### Network Errors
- ✅ Shipping methods API failure → Shows empty state with support message
- ✅ Payment gateways API failure → Uses fallback options (Flutterwave, Bank Transfer)
- ✅ Checkout submission failure → Shows error message, allows retry

### Validation Errors
- ✅ Missing required fields → Continue button disabled
- ✅ Invalid email format → Browser validation
- ✅ No shipping method selected → Warning message displayed

## Browser Console Checks

### Expected Logs (No Errors)
```javascript
// On checkout page load
"Loading shipping methods..." (if physical books)
"Shipping methods loaded: 7 methods"
"Payment gateways loaded: 2 gateways"

// On shipping method selection
"Shipping method selected: Standard Delivery"
"Shipping cost updated: 1500"

// On checkout submission
"Submitting checkout..."
"Checkout successful"
```

### Error Logs to Watch For
```javascript
// These should NOT appear
"Failed to load shipping methods" ❌
"Network Error" ❌
"Uncaught TypeError" ❌
"Cannot read property of undefined" ❌
```

## API Endpoints Used

1. **GET /shipping/methods** - Fetch shipping options
   - Called only for physical/mixed carts
   - Returns 7 active methods
   - Fallback: Empty array if fails

2. **GET /payment-gateways** - Fetch payment options
   - Called for all checkouts
   - Returns available gateways
   - Fallback: Flutterwave + Bank Transfer

3. **POST /checkout** - Submit order
   - Payload includes: formData, cartItems, total
   - Returns: order details, payment URL

## Performance Metrics

- **Page Load**: < 2 seconds
- **Shipping Methods Load**: < 500ms
- **Payment Gateways Load**: < 500ms
- **Checkout Submission**: < 1 second
- **Total Checkout Time**: 2-5 minutes (user input time)

## Accessibility

- ✅ Keyboard navigation works
- ✅ Screen reader friendly labels
- ✅ Focus indicators visible
- ✅ Error messages announced
- ✅ Required fields marked with *

## Mobile Responsiveness

- ✅ Works on mobile (320px+)
- ✅ Touch-friendly buttons
- ✅ Readable text sizes
- ✅ Proper spacing on small screens
- ✅ No horizontal scroll

## Known Issues (Fixed)

- ~~Network error at shipping method stage~~ ✅ Fixed
- ~~useCheckout not receiving isEbookOnly parameter~~ ✅ Fixed
- ~~No error handling for API failures~~ ✅ Fixed
- ~~No loading state for shipping methods~~ ✅ Fixed

## Next Steps

1. Test with real payment gateway integration
2. Add order confirmation email
3. Implement order tracking
4. Add promo code support
5. Implement saved addresses
