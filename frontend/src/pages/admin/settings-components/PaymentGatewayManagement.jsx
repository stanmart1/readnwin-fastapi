import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function PaymentGatewayManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [savingGateway, setSavingGateway] = useState(null);
  const [testingGateway, setTestingGateway] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [savedGateways, setSavedGateways] = useState(new Set());

  const [paymentGateways, setPaymentGateways] = useState([
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Leading payment technology company in Africa',
      icon: 'ri-global-line',
      enabled: true,
      testMode: false,
      apiKeys: {
        clientId: '',
        clientSecret: '',
        encryptionKey: ''
      },
      supportedCurrencies: ['NGN', 'USD', 'EUR', 'GBP'],
      features: ['Mobile Money', 'Bank Transfers', 'Credit Cards', 'USSD', 'QR Payments'],
      status: 'active'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer with proof of payment upload',
      icon: 'ri-bank-line',
      enabled: true,
      testMode: false,
      apiKeys: {
        clientId: '',
        clientSecret: '',
        encryptionKey: ''
      },
      bankAccount: {
        bankName: 'Access Bank',
        accountNumber: '0101234567',
        accountName: 'ReadnWin',
        accountType: 'Current',
        instructions: 'Please include your order number as payment reference'
      },
      supportedCurrencies: ['NGN'],
      features: ['Bank Transfers', 'Proof of Payment', 'Manual Verification'],
      status: 'active'
    }
  ]);

  const [paymentSettings, setPaymentSettings] = useState({
    defaultGateway: 'flutterwave',
    supportedGateways: ['flutterwave', 'bank_transfer'],
    currency: 'NGN',
    taxRate: 7.5,
    shippingCost: 2000,
    freeShippingThreshold: 50000,
    webhookUrl: '',
    testMode: false
  });

  useEffect(() => {
    loadPaymentGateways();
  }, []);

  const loadPaymentGateways = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/payment-settings');
      if (response.data.gateways) {
        setPaymentGateways(response.data.gateways);
      }
      if (response.data.settings) {
        setPaymentSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading payment gateways:', error);
      alert('Failed to load payment gateway settings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKey = (value, type) => {
    if (!value) return `${type} is required`;
    switch (type) {
      case 'clientId':
        if (value.length < 10) return 'Client ID must be at least 10 characters';
        break;
      case 'clientSecret':
        if (value.length < 10) return 'Client Secret must be at least 10 characters';
        break;
      case 'encryptionKey':
        if (value.length < 8) return 'Encryption Key must be at least 8 characters';
        break;
    }
    return '';
  };

  const validateGateway = (gateway) => {
    const errors = {};
    if (gateway.id === 'flutterwave') {
      const clientIdError = validateApiKey(gateway.apiKeys.clientId, 'clientId');
      const clientSecretError = validateApiKey(gateway.apiKeys.clientSecret, 'clientSecret');
      const encryptionKeyError = validateApiKey(gateway.apiKeys.encryptionKey, 'encryptionKey');
      if (clientIdError) errors.clientId = clientIdError;
      if (clientSecretError) errors.clientSecret = clientSecretError;
      if (encryptionKeyError) errors.encryptionKey = encryptionKeyError;
    }
    if (gateway.id === 'bank_transfer' && gateway.bankAccount) {
      if (!gateway.bankAccount.bankName) errors.bankName = 'Bank name is required';
      if (!gateway.bankAccount.accountNumber) errors.accountNumber = 'Account number is required';
      if (!gateway.bankAccount.accountName) errors.accountName = 'Account name is required';
    }
    setValidationErrors(prev => ({ ...prev, [gateway.id]: errors }));
    return Object.keys(errors).length === 0;
  };

  const saveGateway = async (gateway) => {
    if (!validateGateway(gateway)) {
      alert('Please fix validation errors before saving');
      return;
    }
    setSavingGateway(gateway.id);
    try {
      const response = await api.post('/admin/payment-settings/gateway', { gateway });
      if (response.status === 200) {
        alert(`${gateway.name} configuration saved successfully!`);
        setSavedGateways(prev => new Set(prev).add(gateway.id));
        setTimeout(() => setSavedGateways(prev => {
          const newSet = new Set(prev);
          newSet.delete(gateway.id);
          return newSet;
        }), 3000);
        setPaymentGateways(prev => prev.map(g => g.id === gateway.id ? { ...g, status: 'active' } : g));
      } else {
        alert(`Failed to save ${gateway.name}`);
      }
    } catch (error) {
      console.error('Error saving gateway:', error);
      alert(`Failed to save ${gateway.name} configuration`);
    } finally {
      setSavingGateway(null);
    }
  };

  const updateApiKey = (gatewayId, keyType, value) => {
    setPaymentGateways(prev => prev.map(gateway =>
      gateway.id === gatewayId
        ? { ...gateway, apiKeys: { ...gateway.apiKeys, [keyType]: value } }
        : gateway
    ));
    setValidationErrors(prev => ({
      ...prev,
      [gatewayId]: { ...prev[gatewayId], [keyType]: '' }
    }));
  };

  const updateBankAccount = (gatewayId, field, value) => {
    setPaymentGateways(prev => prev.map(gateway =>
      gateway.id === gatewayId
        ? { ...gateway, bankAccount: { ...gateway.bankAccount, [field]: value } }
        : gateway
    ));
    setValidationErrors(prev => ({
      ...prev,
      [gatewayId]: { ...prev[gatewayId], [field]: '' }
    }));
  };

  const toggleGateway = (gatewayId, enabled) => {
    setPaymentGateways(prev => prev.map(gateway =>
      gateway.id === gatewayId ? { ...gateway, enabled } : gateway
    ));
  };

  const toggleTestMode = (gatewayId) => {
    setPaymentGateways(prev => prev.map(gateway =>
      gateway.id === gatewayId ? { ...gateway, testMode: !gateway.testMode } : gateway
    ));
  };

  const setAsDefault = (gatewayId) => {
    setPaymentSettings(prev => ({ ...prev, defaultGateway: gatewayId }));
  };

  const testGatewayConnection = async (gatewayId) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    if (!gateway) return;

    if (!validateGateway(gateway)) {
      alert('Please fix validation errors before testing connection');
      return;
    }

    setTestingGateway(gatewayId);
    setPaymentGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, status: 'testing' } : g));
    
    if (gatewayId === 'bank_transfer') {
      setTimeout(() => {
        setPaymentGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, status: 'active' } : g));
        alert(`✅ ${gateway.name} is ready for manual payment processing!`);
        setTestingGateway(null);
      }, 1000);
      return;
    }

    try {
      const response = await api.post('/admin/payment-settings/test-connection', {
        gatewayId,
        apiKeys: gateway.apiKeys,
        testMode: gateway.testMode
      });

      if (response.status === 200) {
        alert(`✅ ${gateway.name} connection test successful!`);
        setPaymentGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, status: 'active' } : g));
      } else {
        alert(`❌ ${gateway.name} connection failed`);
        setPaymentGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, status: 'error' } : g));
      }
    } catch (error) {
      console.error('Error testing gateway connection:', error);
      alert(`❌ Failed to test ${gateway.name} connection`);
      setPaymentGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, status: 'error' } : g));
    } finally {
      setTestingGateway(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'ri-check-line';
      case 'inactive': return 'ri-close-line';
      case 'error': return 'ri-error-warning-line';
      case 'testing': return 'ri-loader-4-line animate-spin';
      default: return 'ri-close-line';
    }
  };



  const renderGatewayCard = (gateway) => (
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
              <span key={currency} className="px-2 py-1 bg-gray-100 text-xs rounded">{currency}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
          <div className="flex flex-wrap gap-1">
            {gateway.features.map(feature => (
              <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{feature}</span>
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
          {gateway.id === 'flutterwave' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID {gateway.testMode && '(Test)'} *
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[`${gateway.id}_clientId`] ? 'text' : 'password'}
                    value={gateway.apiKeys.clientId}
                    onChange={(e) => updateApiKey(gateway.id, 'clientId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      validationErrors[gateway.id]?.clientId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Flutterwave Client ID"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_clientId`]: !prev[`${gateway.id}_clientId`] }))}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className={showApiKeys[`${gateway.id}_clientId`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {validationErrors[gateway.id]?.clientId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {validationErrors[gateway.id].clientId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret {gateway.testMode && '(Test)'} *
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[`${gateway.id}_clientSecret`] ? 'text' : 'password'}
                    value={gateway.apiKeys.clientSecret}
                    onChange={(e) => updateApiKey(gateway.id, 'clientSecret', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      validationErrors[gateway.id]?.clientSecret ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Flutterwave Client Secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_clientSecret`]: !prev[`${gateway.id}_clientSecret`] }))}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className={showApiKeys[`${gateway.id}_clientSecret`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {validationErrors[gateway.id]?.clientSecret && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {validationErrors[gateway.id].clientSecret}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encryption Key {gateway.testMode && '(Test)'} *
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[`${gateway.id}_encryptionKey`] ? 'text' : 'password'}
                    value={gateway.apiKeys.encryptionKey}
                    onChange={(e) => updateApiKey(gateway.id, 'encryptionKey', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      validationErrors[gateway.id]?.encryptionKey ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Flutterwave Encryption Key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(prev => ({ ...prev, [`${gateway.id}_encryptionKey`]: !prev[`${gateway.id}_encryptionKey`] }))}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className={showApiKeys[`${gateway.id}_encryptionKey`] ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {validationErrors[gateway.id]?.encryptionKey && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {validationErrors[gateway.id].encryptionKey}
                  </p>
                )}
              </div>
            </div>
          )}

          {gateway.id === 'bank_transfer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <i className="ri-information-line text-blue-600 text-lg mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Manual Payment Gateway</h4>
                  <p className="text-sm text-blue-700">
                    Bank Transfer is a manual payment gateway that doesn't require API keys. Customers will upload proof of payment for manual verification by administrators.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={gateway.bankAccount?.accountNumber || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'accountNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[gateway.id]?.accountNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter Account Number"
                  />
                  {validationErrors[gateway.id]?.accountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {validationErrors[gateway.id].accountNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Instructions</label>
                  <textarea
                    value={gateway.bankAccount?.instructions || ''}
                    onChange={(e) => updateBankAccount(gateway.id, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Instructions for customers making bank transfers"
                  />
                  <div className="mt-1 text-xs text-gray-500 flex items-start">
                    <i className="ri-information-line mr-1 mt-0.5"></i>
                    <span>These instructions will appear on the checkout page for Bank Transfer payments.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {paymentSettings.defaultGateway === gateway.id && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <i className="ri-star-fill mr-1"></i>
                Default
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => testGatewayConnection(gateway.id)}
              disabled={testingGateway === gateway.id}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              {testingGateway === gateway.id ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1"></i>
                  Testing...
                </>
              ) : (
                <>
                  <i className="ri-wifi-line mr-1"></i>
                  Test Connection
                </>
              )}
            </button>
            <button
              onClick={() => setAsDefault(gateway.id)}
              disabled={paymentSettings.defaultGateway === gateway.id}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              <i className="ri-star-line mr-1"></i>
              Set Default
            </button>
            <button
              onClick={() => saveGateway(gateway)}
              disabled={savingGateway === gateway.id}
              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 flex items-center ${
                savedGateways.has(gateway.id)
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {savingGateway === gateway.id ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1"></i>
                  Saving...
                </>
              ) : savedGateways.has(gateway.id) ? (
                <>
                  <i className="ri-check-line mr-1"></i>
                  Saved
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-1"></i>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Gateway</label>
            <select
              value={paymentSettings.defaultGateway}
              onChange={(e) => setPaymentSettings(prev => ({ ...prev, defaultGateway: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentGateways.filter(g => g.enabled).map(gateway => (
                <option key={gateway.id} value={gateway.id}>{gateway.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={paymentSettings.currency}
              onChange={(e) => setPaymentSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NGN">Nigerian Naira (NGN)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={paymentSettings.taxRate}
              onChange={(e) => setPaymentSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="7.5"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Gateways</h4>
          <div className="space-y-6">
            {paymentGateways.map(renderGatewayCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
