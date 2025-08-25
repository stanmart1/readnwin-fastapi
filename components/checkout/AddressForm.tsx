'use client';

import { useState, useEffect } from 'react';
import SearchableDropdown from '../ui/SearchableDropdown';
import { getNigerianStates, getLGAsByState } from '../../utils/nigeria-data';

interface AddressFormProps {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  onNext: () => void;
}

export default function AddressForm({ formData, updateFormData, onNext }: AddressFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [billingLGAs, setBillingLGAs] = useState<string[]>([]);
  const nigerianStates = getNigerianStates();

  // Initialize form with Nigeria as default country
  useEffect(() => {
    if (!formData.shipping.country) {
      updateFormData('shipping', { country: 'Nigeria' });
    }
    if (!formData.billing.country) {
      updateFormData('billing', { country: 'Nigeria' });
    }
  }, []);

  // Update LGAs when state changes
  useEffect(() => {
    if (formData.shipping.state) {
      const lgas = getLGAsByState(formData.shipping.state);
      setAvailableLGAs(lgas);
      // Clear LGA if state changes
      if (!lgas.includes(formData.shipping.lga)) {
        updateFormData('shipping', { lga: '' });
      }
    }
  }, [formData.shipping.state]);

  useEffect(() => {
    if (formData.billing.state) {
      const lgas = getLGAsByState(formData.billing.state);
      setBillingLGAs(lgas);
      // Clear LGA if state changes
      if (!lgas.includes(formData.billing.lga)) {
        updateFormData('billing', { lga: '' });
      }
    }
  }, [formData.billing.state]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate shipping address
    if (!formData.shipping.firstName?.trim()) {
      newErrors.shippingFirstName = 'First name is required';
    }
    if (!formData.shipping.lastName?.trim()) {
      newErrors.shippingLastName = 'Last name is required';
    }
    if (!formData.shipping.email?.trim()) {
      newErrors.shippingEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.shipping.email)) {
      newErrors.shippingEmail = 'Please enter a valid email';
    }
    if (!formData.shipping.phone?.trim()) {
      newErrors.shippingPhone = 'Phone number is required';
    }
    if (!formData.shipping.address?.trim()) {
      newErrors.shippingAddress = 'Address is required';
    }
    if (!formData.shipping.city?.trim()) {
      newErrors.shippingCity = 'City is required';
    }
    if (!formData.shipping.state?.trim()) {
      newErrors.shippingState = 'State is required';
    }
    if (!formData.shipping.lga?.trim()) {
      newErrors.shippingLga = 'Local Government Area is required';
    }

    // Validate billing address if not same as shipping
    if (!formData.billing.sameAsShipping) {
      if (!formData.billing.firstName?.trim()) {
        newErrors.billingFirstName = 'First name is required';
      }
      if (!formData.billing.lastName?.trim()) {
        newErrors.billingLastName = 'Last name is required';
      }
      if (!formData.billing.address?.trim()) {
        newErrors.billingAddress = 'Address is required';
      }
      if (!formData.billing.city?.trim()) {
        newErrors.billingCity = 'City is required';
      }
      if (!formData.billing.state?.trim()) {
        newErrors.billingState = 'State is required';
      }
      if (!formData.billing.lga?.trim()) {
        newErrors.billingLga = 'Local Government Area is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleShippingChange = (field: string, value: string) => {
    updateFormData('shipping', { [field]: value });
    
    // If billing is same as shipping, update billing too
    if (formData.billing.sameAsShipping) {
      updateFormData('billing', { [field]: value });
    }
  };

  const handleBillingSameAsShipping = (checked: boolean) => {
    updateFormData('billing', { sameAsShipping: checked });
    
    if (checked) {
      // Copy shipping address to billing
      updateFormData('billing', {
        sameAsShipping: true,
        firstName: formData.shipping.firstName,
        lastName: formData.shipping.lastName,
        address: formData.shipping.address,
        city: formData.shipping.city,
        state: formData.shipping.state,
        lga: formData.shipping.lga,
        country: formData.shipping.country
      });
    }
  };

  const stateOptions = nigerianStates.map(state => state.name);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Address</h2>
        <p className="text-gray-600">Enter your shipping information</p>
      </div>

      {/* Shipping Address Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.shipping.firstName || ''}
            onChange={(e) => handleShippingChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingFirstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.shippingFirstName && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingFirstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.shipping.lastName || ''}
            onChange={(e) => handleShippingChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingLastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.shippingLastName && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingLastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.shipping.email || ''}
            onChange={(e) => handleShippingChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingEmail ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.shippingEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.shipping.phone || ''}
            onChange={(e) => handleShippingChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingPhone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.shippingPhone && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingPhone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            value={formData.shipping.address || ''}
            onChange={(e) => handleShippingChange('address', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Street address"
          />
          {errors.shippingAddress && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingAddress}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.shipping.city || ''}
            onChange={(e) => handleShippingChange('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.shippingCity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.shippingCity && (
            <p className="text-red-500 text-sm mt-1">{errors.shippingCity}</p>
          )}
        </div>

        <div>
          <SearchableDropdown
            options={stateOptions}
            value={formData.shipping.state || ''}
            onChange={(value) => handleShippingChange('state', value)}
            placeholder="Select State"
            label="State *"
            error={errors.shippingState}
          />
        </div>

        <div>
          <SearchableDropdown
            options={availableLGAs}
            value={formData.shipping.lga || ''}
            onChange={(value) => handleShippingChange('lga', value)}
            placeholder="Select Local Government Area"
            label="Local Government Area *"
            error={errors.shippingLga}
            disabled={!formData.shipping.state}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            value={formData.shipping.country || 'Nigeria'}
            onChange={(e) => handleShippingChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Nigeria">Nigeria</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>

      {/* Billing Address Section */}
      <div className="border-t pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="sameAsShipping"
            checked={formData.billing.sameAsShipping}
            onChange={(e) => handleBillingSameAsShipping(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="sameAsShipping" className="ml-2 text-sm font-medium text-gray-700">
            Billing address same as shipping address
          </label>
        </div>

        {!formData.billing.sameAsShipping && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.billing.firstName || ''}
                  onChange={(e) => updateFormData('billing', { firstName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.billingFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.billingFirstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.billingFirstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.billing.lastName || ''}
                  onChange={(e) => updateFormData('billing', { lastName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.billingLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.billingLastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.billingLastName}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.billing.address || ''}
                  onChange={(e) => updateFormData('billing', { address: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.billingAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.billingAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.billingAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.billing.city || ''}
                  onChange={(e) => updateFormData('billing', { city: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.billingCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.billingCity && (
                  <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>
                )}
              </div>

              <div>
                <SearchableDropdown
                  options={stateOptions}
                  value={formData.billing.state || ''}
                  onChange={(value) => updateFormData('billing', { state: value })}
                  placeholder="Select State"
                  label="State *"
                  error={errors.billingState}
                />
              </div>

              <div>
                <SearchableDropdown
                  options={billingLGAs}
                  value={formData.billing.lga || ''}
                  onChange={(value) => updateFormData('billing', { lga: value })}
                  placeholder="Select Local Government Area"
                  label="Local Government Area *"
                  error={errors.billingLga}
                  disabled={!formData.billing.state}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
} 