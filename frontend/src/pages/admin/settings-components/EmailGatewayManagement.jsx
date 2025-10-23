import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function EmailGatewayManagement() {
  const [gateways, setGateways] = useState([
    {
      id: 'resend',
      name: 'Resend',
      type: 'resend',
      isActive: true,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      resendApiKey: '',
      resendDomain: 'readnwin.com',
      useEnvVars: false,
      envVarPrefix: 'RESEND'
    },
    {
      id: 'smtp',
      name: 'SMTP Server',
      type: 'smtp',
      isActive: false,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      useEnvVars: false,
      envVarPrefix: 'SMTP'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      type: 'sendgrid',
      isActive: false,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      sendgridApiKey: '',
      sendgridDomain: 'readnwin.com',
      useEnvVars: false,
      envVarPrefix: 'SENDGRID'
    },
    {
      id: 'mailgun',
      name: 'Mailgun',
      type: 'mailgun',
      isActive: false,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      mailgunApiKey: '',
      mailgunDomain: 'readnwin.com',
      mailgunRegion: 'us',
      useEnvVars: false,
      envVarPrefix: 'MAILGUN'
    },
    {
      id: 'aws-ses',
      name: 'AWS SES',
      type: 'aws-ses',
      isActive: false,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: 'us-east-1',
      awsSesFromEmail: 'noreply@readnwin.com',
      useEnvVars: false,
      envVarPrefix: 'AWS_SES'
    },
    {
      id: 'postmark',
      name: 'Postmark',
      type: 'postmark',
      isActive: false,
      fromEmail: 'noreply@readnwin.com',
      fromName: 'ReadnWin',
      postmarkApiKey: '',
      postmarkFromEmail: 'noreply@readnwin.com',
      postmarkFromName: 'ReadnWin',
      useEnvVars: false,
      envVarPrefix: 'POSTMARK'
    }
  ]);

  const [activeGateway, setActiveGateway] = useState('resend');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState({});

  useEffect(() => {
    loadGatewaySettings();
  }, []);

  const loadGatewaySettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/email/gateways');
      if (response.data) {
        setGateways(response.data.gateways);
        setActiveGateway(response.data.activeGateway || 'resend');
      }
    } catch (error) {
      console.error('Error loading gateway settings:', error);
      setMessage({ type: 'error', text: 'Failed to load gateway settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayChange = (gatewayId) => {
    setActiveGateway(gatewayId);
    setGateways(prev => prev.map(gw => ({
      ...gw,
      isActive: gw.id === gatewayId
    })));
  };

  const handleConfigChange = (gatewayId, field, value) => {
    setGateways(prev => {
      const updated = prev.map(gw => 
        gw.id === gatewayId ? { ...gw, [field]: value } : gw
      );
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/admin/email/gateways', {
        gateways,
        activeGateway
      });
      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Email gateway settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving gateway settings:', error);
      setMessage({ type: 'error', text: 'Failed to save gateway settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (gatewayId) => {
    try {
      setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'testing' } }));
      const gateway = gateways.find(gw => gw.id === gatewayId);
      if (!gateway) return;
      if (!testEmail || !testEmail.includes('@')) {
        setMessage({ type: 'error', text: 'Please enter a valid email address for testing' });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: 'Invalid test email' } }));
        return;
      }
      const response = await api.post('/admin/email/gateways/test', { 
        gatewayId, 
        config: gateway,
        testEmail: testEmail.trim()
      });
      if (response.status === 200) {
        setMessage({ type: 'success', text: `Test email sent successfully to ${testEmail}! Check your inbox.` });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'success', message: 'Test successful' } }));
      } else {
        setMessage({ type: 'error', text: 'Failed to send test email' });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: 'Test failed' } }));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setMessage({ type: 'error', text: 'Failed to test connection' });
      setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: 'Connection failed' } }));
    }
  };

  const getActiveGateway = () => gateways.find(gw => gw.id === activeGateway);

  const getGatewayIcon = (type) => {
    switch (type) {
      case 'resend': return '🚀';
      case 'smtp': return '📧';
      case 'sendgrid': return '📊';
      case 'mailgun': return '🔫';
      case 'aws-ses': return '☁️';
      case 'postmark': return '📮';
      default: return '📧';
    }
  };

  const getGatewayDescription = (type) => {
    switch (type) {
      case 'resend': return 'Modern email API with excellent deliverability';
      case 'smtp': return 'Traditional SMTP server for custom email providers';
      case 'sendgrid': return 'Enterprise email delivery platform';
      case 'mailgun': return 'Developer-friendly email service';
      case 'aws-ses': return 'Amazon Simple Email Service';
      case 'postmark': return 'Transactional email service with high deliverability';
      default: return '';
    }
  };

  const renderGatewayConfig = (gateway) => {
    if (!gateway) return null;
    
    switch (gateway.type) {
      case 'resend':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resend API Key</label>
              <input
                type="password"
                value={gateway.resendApiKey || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'resendApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input
                type="text"
                value={gateway.resendDomain || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'resendDomain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="yourdomain.com"
              />
            </div>
          </div>
        );
      case 'smtp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={gateway.smtpHost || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpHost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={gateway.smtpPort || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpPort', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="587"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                <input
                  type="text"
                  value={gateway.smtpUsername || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpUsername', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                <input
                  type="password"
                  value={gateway.smtpPassword || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-app-password"
                />
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-gray-500">Configuration for {gateway.name} coming soon...</div>;
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-sm font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Gateway</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${activeGateway === gateway.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => handleGatewayChange(gateway.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getGatewayIcon(gateway.type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{gateway.type} Gateway</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full ${activeGateway === gateway.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              </div>
              <p className="text-xs text-gray-600">{getGatewayDescription(gateway.type)}</p>
            </div>
          ))}
        </div>
      </div>

      {getActiveGateway() && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getActiveGateway()?.name} Configuration</h3>
              <p className="text-sm text-gray-500 mt-1">Configure your {getActiveGateway()?.name} email gateway settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Email Address</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to test with"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => handleTestConnection(activeGateway)}
                disabled={isLoading || !testEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm mt-6"
              >
                Test Connection
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
                <input
                  type="email"
                  value={getActiveGateway()?.fromEmail || ''}
                  onChange={(e) => handleConfigChange(activeGateway, 'fromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                <input
                  type="text"
                  value={getActiveGateway()?.fromName || ''}
                  onChange={(e) => handleConfigChange(activeGateway, 'fromName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Gateway Configuration</h4>
              {renderGatewayConfig(getActiveGateway())}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
