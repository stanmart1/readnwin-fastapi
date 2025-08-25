'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  testMode: boolean;
  apiKeys: {
    publicKey: string;
    secretKey: string;
    hash: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    instructions?: string;
  };
  supportedCurrencies: string[];
  features: string[];
  status: 'active' | 'inactive' | 'error' | 'testing';
}

interface PaymentSettings {
  defaultGateway: string;
  supportedGateways: string[];
  currency: string;
  taxRate: number;
  shippingCost: number;
  freeShippingThreshold: number;
  webhookUrl: string;
  testMode: boolean;
}

interface ValidationErrors {
  [gatewayId: string]: {
    [field: string]: string;
  };
}

export default function PaymentGatewayManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingGateway, setSavingGateway] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<{[gatewayId: string]: {[field: string]: string}}>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    action: string;
    gatewayId: string;
    message: string;
  }>({ show: false, action: '', gatewayId: '', message: '' });

  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Leading payment technology company in Africa',
      icon: 'ri-global-line',
      enabled: true,
      testMode: false,
      apiKeys: {
        publicKey: '',
        secretKey: '',
        hash: '',
      },
      supportedCurrencies: ['NGN'],
      features: ['Mobile Money', 'Bank Transfers', 'Credit Cards', 'USSD', 'QR Payments'],
      status: 'inactive',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer with proof of payment upload',
      icon: 'ri-bank-line',
      enabled: true,
      testMode: false,
      apiKeys: {
        publicKey: '',
        secretKey: '',
        hash: '',
      },
      bankAccount: {
        bankName: 'Access Bank',
        accountNumber: '0101234567',
        accountName: 'Lagsale Online Resources',
        accountType: 'Current',
        instructions: 'Please include your order number as payment reference',
      },
      supportedCurrencies: ['NGN'],
      features: ['Bank Transfers', 'Proof of Payment', 'Manual Verification'],
      status: 'active',
    },
  ]);

  const [settings, setSettings] = useState<PaymentSettings>({
    defaultGateway: 'flutterwave',
    supportedGateways: ['flutterwave', 'bank_transfer'],
    currency: 'NGN',
    taxRate: 7.5,
    shippingCost: 500,
    freeShippingThreshold: 5000,
    webhookUrl: '',
    testMode: true,
  });

  // Validation functions
  const validateApiKey = (key: string, keyType: string): string => {
    if (!key.trim()) {
      return `${keyType} is required`;
    }
    
    // Flutterwave specific validation
    if (keyType === 'publicKey' && !key.startsWith('FLWPUBK-')) {
      return 'Public key should start with FLWPUBK-';
    }
    
    if (keyType === 'secretKey' && !key.startsWith('FLWSECK-')) {
      return 'Secret key should start with FLWSECK-';
    }
    
    if (keyType === 'hash' && key.length < 20) {
      return 'Hash should be at least 20 characters long';
    }
    
    if (keyType === 'webhookSecret' && key.length < 16) {
      return 'Webhook secret should be at least 16 characters long';
    }
    
    return '';
  };

  const validateBankAccount = (gatewayId: string, field: string, value: string): string => {
    if (!value.trim()) {
      return `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    }
    
    if (field === 'accountNumber') {
      if (!/^\d{10}$/.test(value.replace(/\s/g, ''))) {
        return 'Account number should be 10 digits';
      }
    }
    
    if (field === 'bankName' && value.length < 2) {
      return 'Bank name should be at least 2 characters';
    }
    
    if (field === 'accountName' && value.length < 3) {
      return 'Account name should be at least 3 characters';
    }
    
    return '';
  };

  const validateGateway = (gateway: PaymentGateway): boolean => {
    const errors: { [field: string]: string } = {};
    
    if (gateway.id === 'flutterwave') {
      const publicKeyError = validateApiKey(gateway.apiKeys.publicKey, 'publicKey');
      const secretKeyError = validateApiKey(gateway.apiKeys.secretKey, 'secretKey');
      const hashError = validateApiKey(gateway.apiKeys.hash || '', 'hash');
      
      if (publicKeyError) errors.publicKey = publicKeyError;
      if (secretKeyError) errors.secretKey = secretKeyError;
      if (hashError) errors.hash = hashError;
    }
    
    if (gateway.id === 'bank_transfer' && gateway.bankAccount) {
      const bankNameError = validateBankAccount(gateway.id, 'bankName', gateway.bankAccount.bankName);
      const accountNumberError = validateBankAccount(gateway.id, 'accountNumber', gateway.bankAccount.accountNumber);
      const accountNameError = validateBankAccount(gateway.id, 'accountName', gateway.bankAccount.accountName);
      const accountTypeError = validateBankAccount(gateway.id, 'accountType', gateway.bankAccount.accountType);
      
      if (bankNameError) errors.bankName = bankNameError;
      if (accountNumberError) errors.accountNumber = accountNumberError;
      if (accountNameError) errors.accountName = accountNameError;
      if (accountTypeError) errors.accountType = accountTypeError;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [gateway.id]: errors
    }));
    
    return Object.keys(errors).length === 0;
  };

  // Load settings on component mount
  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/payment-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentGateways(data.gateways || paymentGateways);
        setSettings(data.settings || settings);
      } else {
        console.error('Failed to load payment settings:', response.status);
        toast.error('Failed to load payment settings');
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setIsLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/payment-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gateways: paymentGateways,
          settings,
        }),
      });

      if (response.ok) {
        toast.success('Payment settings saved successfully!');
        await loadPaymentSettings(); // Reload to get updated status
      } else {
        const error = await response.json();
        toast.error(error.detail || error.message || 'Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveGatewaySettings = async (gatewayId: string) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    if (!gateway) {
      toast.error('Gateway not found');
      return;
    }

    // Validate gateway before saving
    if (!validateGateway(gateway)) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSavingGateway(gatewayId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/payment-settings/gateway`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gateway,
        }),
      });

      if (response.ok) {
        toast.success(`${gateway.name} settings saved successfully!`);
        await loadPaymentSettings(); // Reload to get updated status
      } else {
        const error = await response.json();
        toast.error(`${gateway.name} save failed: ${error.detail || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving gateway settings:', error);
      toast.error('Failed to save gateway settings');
    } finally {
      setSavingGateway(null);
    }
  };

  const toggleGateway = async (gatewayId: string, enabled: boolean) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    
    if (enabled) {
      // Validate gateway before enabling
      if (!validateGateway(gateway!)) {
        toast.error('Please configure the gateway properly before enabling');
        return;
      }
    }

    const updatedGateways = paymentGateways.map(gateway =>
      gateway.id === gatewayId ? { ...gateway, enabled } : gateway
    );
    setPaymentGateways(updatedGateways);

    // Update supported gateways list
    const enabledGateways = updatedGateways.filter(g => g.enabled).map(g => g.id);
    setSettings(prev => ({
      ...prev,
      supportedGateways: enabledGateways,
      defaultGateway: enabledGateways.includes(prev.defaultGateway) ? prev.defaultGateway : enabledGateways[0] || 'stripe',
    }));

    toast.success(`${gateway?.name} ${enabled ? 'enabled' : 'disabled'} successfully`);
  };

  const toggleTestMode = (gatewayId: string) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    const newTestMode = !gateway?.testMode;
    
    setPaymentGateways(prev =>
      prev.map(gateway =>
        gateway.id === gatewayId ? { ...gateway, testMode: newTestMode } : gateway
      )
    );

    toast.success(`${gateway?.name} ${newTestMode ? 'test mode enabled' : 'test mode disabled'}`);
  };

  const updateApiKey = (gatewayId: string, keyType: string, value: string) => {
    setPaymentGateways(prev =>
      prev.map(gateway =>
        gateway.id === gatewayId
          ? {
              ...gateway,
              apiKeys: {
                ...gateway.apiKeys,
                [keyType]: value,
              },
            }
          : gateway
      )
    );

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [gatewayId]: {
        ...prev[gatewayId],
        [keyType]: ''
      }
    }));
  };

  const updateBankAccount = (gatewayId: string, field: string, value: string) => {
    setPaymentGateways(prev =>
      prev.map(gateway =>
        gateway.id === gatewayId
          ? {
              ...gateway,
              bankAccount: {
                bankName: gateway.bankAccount?.bankName || '',
                accountNumber: gateway.bankAccount?.accountNumber || '',
                accountName: gateway.bankAccount?.accountName || '',
                accountType: gateway.bankAccount?.accountType || '',
                instructions: gateway.bankAccount?.instructions || '',
                [field]: value,
              },
            }
          : gateway
      )
    );

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [gatewayId]: {
        ...prev[gatewayId],
        [field]: ''
      }
    }));
  };

  const loadFlutterwaveFromEnv = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/payment-settings/flutterwave-env`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const envKeys = await response.json();
        
        setPaymentGateways(prev =>
          prev.map(g =>
            g.id === 'flutterwave' ? {
              ...g,
              enabled: true,
              testMode: false,
              apiKeys: {
                publicKey: envKeys.publicKey || '',
                secretKey: envKeys.secretKey || '',
                hash: envKeys.hash || '',
                webhookSecret: g.apiKeys.webhookSecret || '',
              },
              status: 'active' as const,
            } : g
          )
        );
        
        toast.success('Flutterwave configuration loaded from environment!');
      } else {
        toast.error('Failed to load Flutterwave configuration from environment');
      }
    } catch (error) {
      console.error('Error loading Flutterwave from env:', error);
      toast.error('Failed to load Flutterwave configuration');
    }
  };

  const testGatewayConnection = async (gatewayId: string) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    if (!gateway) return;

    // Validate gateway before testing
    if (!validateGateway(gateway)) {
      toast.error('Please fix validation errors before testing connection');
      return;
    }

    // For manual gateways like Bank Transfer, just update status
    if (gatewayId === 'bank_transfer') {
      setPaymentGateways(prev =>
        prev.map(g =>
          g.id === gatewayId ? { ...g, status: 'active' } : g
        )
      );
      toast.success(`${gateway.name} is ready for manual payment processing!`);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/payment-settings/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gatewayId,
          apiKeys: gateway.apiKeys,
          testMode: gateway.testMode,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${gateway.name} connection test successful!`);
        // Update gateway status
        setPaymentGateways(prev =>
          prev.map(g =>
            g.id === gatewayId ? { ...g, status: 'active' } : g
          )
        );
      } else {
        const error = await response.json();
        toast.error(`${gateway.name} connection test failed: ${error.detail || error.message}`);
        setPaymentGateways(prev =>
          prev.map(g =>
            g.id === gatewayId ? { ...g, status: 'error' } : g
          )
        );
      }
    } catch (error) {
      console.error('Error testing gateway connection:', error);
      toast.error(`Failed to test ${gateway.name} connection`);
      setPaymentGateways(prev =>
        prev.map(g =>
          g.id === gatewayId ? { ...g, status: 'error' } : g
        )
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'ri-check-line';
      case 'inactive': return 'ri-close-line';
      case 'error': return 'ri-error-warning-line';
      case 'testing': return 'ri-loader-4-line';
      default: return 'ri-close-line';
    }
  };

  const renderGatewayCard = (gateway: PaymentGateway) => (
    <div key={gateway.id} className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i className={`${gateway.icon} text-2xl text-blue-600`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{gateway.name}</h3>
            <p className="text-sm text-gray-600">{gateway.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gateway.status)}`}>
            <i className={`${getStatusIcon(gateway.status)} mr-1`}></i>
            {gateway.status}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={gateway.enabled}
              onChange={(e) => toggleGateway(gateway.id, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Currencies</h4>
          <div className="flex flex-wrap gap-1">
            {gateway.supportedCurrencies.map(currency => (
              <span key={currency} className="px-2 py-1 bg-gray-100 text-xs rounded">
                {currency}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
          <div className="flex flex-wrap gap-1">
            {gateway.features.map(feature => (
              <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Test Mode</h4>
            <p className="text-xs text-gray-500">Use test API keys for development</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={gateway.testMode}
              onChange={() => toggleTestMode(gateway.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="space-y-3">
          {/* Only show API keys for card-based payment gateways */}
          {gateway.id !== 'bank_transfer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key {gateway.testMode && '(Test)'} *
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[`${gateway.id}_public`] ? 'text' : 'password'}
                    value={gateway.apiKeys.publicKey}
                    onChange={(e) => updateApiKey(gateway.id, 'publicKey', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      validationErrors[gateway.id]?.publicKey ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`${gateway.name} Public Key`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_public`]: !prev[`${gateway.id}_public`] }))}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className={showApiKeys[`${gateway.id}_public`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {validationErrors[gateway.id]?.publicKey && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {validationErrors[gateway.id].publicKey}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Private Key {gateway.testMode && '(Test)'} *
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[`${gateway.id}_secret`] ? 'text' : 'password'}
                    value={gateway.apiKeys.secretKey}
                    onChange={(e) => updateApiKey(gateway.id, 'secretKey', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      validationErrors[gateway.id]?.secretKey ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`${gateway.name} Private Key`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_secret`]: !prev[`${gateway.id}_secret`] }))}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className={showApiKeys[`${gateway.id}_secret`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {validationErrors[gateway.id]?.secretKey && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {validationErrors[gateway.id].secretKey}
                  </p>
                )}
              </div>

              {/* Flutterwave Hash Field */}
              {gateway.id === 'flutterwave' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hash {gateway.testMode && '(Test)'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys[`${gateway.id}_hash`] ? 'text' : 'password'}
                      value={gateway.apiKeys.hash || ''}
                      onChange={(e) => updateApiKey(gateway.id, 'hash', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                        validationErrors[gateway.id]?.hash ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Flutterwave Hash"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_hash`]: !prev[`${gateway.id}_hash`] }))}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                    >
                      <i className={showApiKeys[`${gateway.id}_hash`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                  {validationErrors[gateway.id]?.hash && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].hash}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Show manual gateway configuration for Bank Transfer */}
          {gateway.id === 'bank_transfer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="ri-information-line text-blue-600 text-lg mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Manual Payment Gateway</h4>
                  <p className="text-sm text-blue-700">
                    Bank Transfer is a manual payment gateway that doesn't require API keys. 
                    Customers will upload proof of payment for manual verification by administrators.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={gateway.bankAccount?.bankName || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'bankName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[gateway.id]?.bankName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter Bank Name"
                  />
                  {validationErrors[gateway.id]?.bankName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].bankName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={gateway.bankAccount?.accountNumber || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'accountNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[gateway.id]?.accountNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit Account Number"
                    maxLength={10}
                  />
                  {validationErrors[gateway.id]?.accountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].accountNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={gateway.bankAccount?.accountName || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'accountName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[gateway.id]?.accountName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter Account Name"
                  />
                  {validationErrors[gateway.id]?.accountName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].accountName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={gateway.bankAccount?.accountType || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'accountType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[gateway.id]?.accountType ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Account Type</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Domiciliary">Domiciliary</option>
                  </select>
                  {validationErrors[gateway.id]?.accountType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].accountType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editable Instructions Area for Bank Transfer */}
          {gateway.id === 'bank_transfer' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3 mb-3">
                <i className="ri-file-text-line text-green-600 text-lg mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">Customer Instructions</h4>
                  <p className="text-sm text-green-700">
                    These instructions will be displayed to customers during checkout when they select Bank Transfer payment.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-1">
                    Transfer Instructions
                  </label>
                  <textarea
                    value={gateway.bankAccount?.instructions || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    rows={4}
                    placeholder="Enter detailed instructions for customers on how to complete the bank transfer..."
                  />
                  <p className="text-xs text-green-600 mt-1">
                    Include account details, reference format, and any specific requirements.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-green-600">
                  <i className="ri-information-line"></i>
                  <span>These instructions will appear on the checkout page for Bank Transfer payments.</span>
                </div>
              </div>
            </div>
          )}


        </div>

        <div className="flex space-x-2">
          {/* Load from Environment Button for Flutterwave */}
          {gateway.id === 'flutterwave' && (
            <button
              onClick={loadFlutterwaveFromEnv}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Load Flutterwave configuration from environment variables"
            >
              <i className="ri-download-line mr-2"></i>
              Load from Env
            </button>
          )}
          <button
            onClick={() => testGatewayConnection(gateway.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-plug-line mr-2"></i>
            {gateway.id === 'bank_transfer' ? 'Verify Setup' : 'Test Connection'}
          </button>
          <button
            onClick={() => {
              const dashboardUrls = {
                flutterwave: 'https://dashboard.flutterwave.com/',
                bank_transfer: '#',
              };
              window.open(dashboardUrls[gateway.id as keyof typeof dashboardUrls] || '#', '_blank');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <i className="ri-external-link-line mr-2"></i>
            Dashboard
          </button>
          <button
            onClick={() => saveGatewaySettings(gateway.id)}
            disabled={savingGateway === gateway.id}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingGateway === gateway.id ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line mr-2"></i>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'gateways', label: 'Payment Gateways', icon: 'ri-bank-card-line' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Gateway Management</h3>
          <p className="text-sm text-gray-600">Configure payment gateways and processing settings</p>
        </div>
        <button
          onClick={savePaymentSettings}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="ri-save-line mr-2"></i>
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        <div className="space-y-6">
          {paymentGateways.map(renderGatewayCard)}
        </div>
      </div>
    </div>
  );
} 