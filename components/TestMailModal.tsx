'use client';

import { useState } from 'react';

interface EmailTemplate {
  id?: number;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  text_content?: string;
  description?: string;
  variables?: Record<string, any>;
  is_active: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
}

interface TestMailModalProps {
  template: EmailTemplate;
  onClose: () => void;
}

export default function TestMailModal({ template, onClose }: TestMailModalProps) {
  const [testEmail, setTestEmail] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate sample variables based on template variables
  const generateSampleVariables = () => {
    const sampleVars: Record<string, any> = {};
    
    if (template.variables) {
      Object.keys(template.variables).forEach(key => {
        switch (key) {
          case 'userName':
            sampleVars[key] = 'John Doe';
            break;
          case 'userEmail':
            sampleVars[key] = testEmail || 'test@example.com';
            break;
          case 'orderNumber':
            sampleVars[key] = 'ORD-12345';
            break;
          case 'orderTotal':
            sampleVars[key] = '₦25,000';
            break;
          case 'orderItems':
            sampleVars[key] = [
              { title: 'Sample Book', author: 'Sample Author', price: '₦15,000' }
            ];
            break;
          case 'resetToken':
            sampleVars[key] = 'sample-reset-token-123';
            break;
          case 'resetUrl':
            sampleVars[key] = `${process.env.NEXTAUTH_URL || 'https://readnwin.com'}/reset-password?token=sample-token`;
            break;
          case 'verificationToken':
            sampleVars[key] = 'sample-verification-token-123';
            break;
          case 'verificationUrl':
            sampleVars[key] = `${process.env.NEXTAUTH_URL || 'https://readnwin.com'}/verify-email?token=sample-token`;
            break;
          case 'trackingNumber':
            sampleVars[key] = 'TRK123456789';
            break;
          case 'estimatedDelivery':
            sampleVars[key] = '3-5 business days';
            break;
          case 'changedAt':
            sampleVars[key] = new Date().toLocaleString();
            break;
          case 'ipAddress':
            sampleVars[key] = '192.168.1.1';
            break;
          case 'loginTime':
            sampleVars[key] = new Date().toLocaleString();
            break;
          case 'deviceInfo':
            sampleVars[key] = 'Chrome on Windows 10';
            break;
          case 'deactivationReason':
            sampleVars[key] = 'Account inactivity';
            break;
          case 'reactivationUrl':
            sampleVars[key] = `${process.env.NEXTAUTH_URL || 'https://readnwin.com'}/reactivate-account?token=sample-token`;
            break;
          case 'subscriptionType':
            sampleVars[key] = 'Newsletter';
            break;
          case 'unsubscribeUrl':
            sampleVars[key] = `${process.env.NEXTAUTH_URL || 'https://readnwin.com'}/unsubscribe?token=sample-token`;
            break;
          case 'offerTitle':
            sampleVars[key] = 'Special Discount';
            break;
          case 'offerDescription':
            sampleVars[key] = 'Get 20% off on all books';
            break;
          case 'expiryDate':
            sampleVars[key] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            break;
          case 'discountCode':
            sampleVars[key] = 'SAVE20';
            break;
          case 'maintenanceType':
            sampleVars[key] = 'Scheduled Maintenance';
            break;
          case 'startTime':
            sampleVars[key] = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString();
            break;
          case 'endTime':
            sampleVars[key] = new Date(Date.now() + 26 * 60 * 60 * 1000).toLocaleString();
            break;
          case 'affectedServices':
            sampleVars[key] = 'Email notifications, User registration';
            break;
          case 'alertType':
            sampleVars[key] = 'Security Alert';
            break;
          case 'severity':
            sampleVars[key] = 'High';
            break;
          case 'description':
            sampleVars[key] = 'Unusual login activity detected';
            break;
          case 'actionRequired':
            sampleVars[key] = 'Please review your recent login activity';
            break;
          default:
            sampleVars[key] = `Sample ${key}`;
        }
      });
    }
    
    setVariables(sampleVars);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Map template slugs to function slugs
      const templateToFunctionMap: Record<string, string> = {
        'welcome': 'user_registration',
        'email-confirmation': 'user_registration',
        'account-verification': 'user_registration',
        'password-reset': 'password_reset',
        'password-changed': 'password_reset',
        'order-confirmation': 'order_confirmation',
        'payment-confirmation': 'order_confirmation',
        'order-status-update': 'order_confirmation',
        'shipping-notification': 'shipping_notification',
        'order-shipped': 'shipping_notification'
      };

      const functionSlug = templateToFunctionMap[template.slug] || template.slug;

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          function_slug: functionSlug,
          to_email: testEmail,
          variables: variables
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setTestEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error sending test email' });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariableChange = (key: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Send Test Email - {template.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex">
                <i className={`text-xl mr-2 ${
                  message.type === 'success' ? 'ri-check-line text-green-500' : 'ri-error-warning-line text-red-500'
                }`}></i>
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Test Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address *
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to send test to"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Template Variables */}
          {template.variables && Object.keys(template.variables).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Template Variables</h3>
                <button
                  onClick={generateSampleVariables}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  Generate Sample Data
                </button>
              </div>
              
              <div className="space-y-3">
                {Object.keys(template.variables).map(key => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key}
                    </label>
                    {key === 'orderItems' ? (
                      <textarea
                        value={JSON.stringify(variables[key] || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handleVariableChange(key, parsed);
                          } catch {
                            // Invalid JSON, keep as string
                            handleVariableChange(key, e.target.value);
                          }
                        }}
                        placeholder={`Enter ${key} value`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    ) : (
                      <input
                        type="text"
                        value={variables[key] || ''}
                        onChange={(e) => handleVariableChange(key, e.target.value)}
                        placeholder={`Enter ${key} value`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Template Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> {template.subject}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Category:</strong> {template.category}
              </div>
              {template.description && (
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Description:</strong> {template.description}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTestEmail}
              disabled={isLoading || !testEmail.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-line mr-2"></i>
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 