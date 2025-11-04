/**
 * Checkout validation utilities
 */

export const validateCheckoutData = (formData, analytics) => {
  const errors = [];

  // Validate shipping information
  if (!formData.shipping.first_name?.trim()) {
    errors.push('First name is required');
  }
  
  if (!formData.shipping.last_name?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!formData.shipping.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.shipping.email)) {
    errors.push('Valid email is required');
  }

  // Validate physical shipping address if not ebook-only
  if (!analytics.isEbookOnly) {
    if (!formData.shipping.address?.trim()) {
      errors.push('Shipping address is required');
    }
    
    if (!formData.shipping.city?.trim()) {
      errors.push('City is required');
    }
    
    if (!formData.shipping.state?.trim()) {
      errors.push('State is required');
    }
    
    if (!formData.shipping.zip_code?.trim()) {
      errors.push('ZIP/Postal code is required');
    }
    
    if (!formData.shipping_method) {
      errors.push('Shipping method is required');
    }
  }

  // Validate payment method
  if (!formData.payment.method) {
    errors.push('Payment method is required');
  }

  return errors;
};

export const formatCheckoutRequest = (formData, analytics) => {
  return {
    formData: {
      shipping: formData.shipping,
      billing: formData.billing,
      payment: formData.payment,
      shippingMethod: formData.shipping_method
    },
    total: analytics.total
  };
};

export const validateCartItems = (cartItems) => {
  if (!cartItems || cartItems.length === 0) {
    return ['Cart is empty'];
  }

  const errors = [];
  
  cartItems.forEach((item, index) => {
    if (!item.book) {
      errors.push(`Item ${index + 1}: Book information missing`);
    } else {
      if (!item.book.price || item.book.price <= 0) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      
      // Check stock for physical books
      if (item.book.format === 'physical' && 
          item.book.inventory_enabled && 
          item.book.stock_quantity !== null &&
          item.quantity > item.book.stock_quantity) {
        errors.push(`Item ${index + 1}: Insufficient stock (${item.book.stock_quantity} available)`);
      }
    }
  });

  return errors;
};