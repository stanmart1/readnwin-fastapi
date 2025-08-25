'use client';

import { useState, useEffect } from 'react';

interface EmailGatewayConfig {
  id: string;
  name: string;
  type: 'resend' | 'smtp' | 'sendgrid' | 'mailgun' | 'aws-ses' | 'postmark';
  isActive: boolean;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  // SMTP specific fields
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  // Resend specific fields
  resendApiKey?: string;
  resendDomain?: string;
  // SendGrid specific fields
  sendgridApiKey?: string;
  sendgridDomain?: string;
  // Mailgun specific fields
  mailgunApiKey?: string;
  mailgunDomain?: string;
  mailgunRegion?: string;
  // AWS SES specific fields
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsSesFromEmail?: string;
  // Postmark specific fields
  postmarkApiKey?: string;
  postmarkFromEmail?: string;
  postmarkFromName?: string;
  // Environment variable integration
  useEnvVars?: boolean;
  envVarPrefix?: string;
}

export default function EmailGatewayManagement() {
  const [gateways, setGateways] = useState<EmailGatewayConfig[]>([]);

  const [activeGateway, setActiveGateway] = useState<string>('resend');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<{[key: string]: { status: 'idle' | 'testing' | 'success' | 'error', message?: string }}>({});

  useEffect(() => {
    loadGatewaySettings();
  }, []);

  const loadGatewaySettings = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/email/gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Merge database data with default gateway templates
        const defaultGateways = [
          {
            id: 'resend',
            name: 'Resend',
            type: 'resend',
            isActive: false,
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
        ];

        // Merge database data with defaults
        const mergedGateways = defaultGateways.map(defaultGateway => {
          const dbGateway = data.gateways?.find((g: any) => g.type === defaultGateway.type);
          if (dbGateway) {
            return {
              ...defaultGateway,
              ...dbGateway,
              // Preserve specific field mappings
              resendApiKey: dbGateway.resendApiKey || defaultGateway.resendApiKey,
              resendDomain: dbGateway.resendDomain || defaultGateway.resendDomain,
              smtpHost: dbGateway.smtpHost || defaultGateway.smtpHost,
              smtpPort: dbGateway.smtpPort || defaultGateway.smtpPort,
              smtpUsername: dbGateway.smtpUsername || defaultGateway.smtpUsername,
              smtpPassword: dbGateway.smtpPassword || defaultGateway.smtpPassword,
              smtpSecure: dbGateway.smtpSecure !== undefined ? dbGateway.smtpSecure : defaultGateway.smtpSecure,
              sendgridApiKey: dbGateway.sendgridApiKey || defaultGateway.sendgridApiKey,
              sendgridDomain: dbGateway.sendgridDomain || defaultGateway.sendgridDomain
            };
          }
          return defaultGateway;
        });

        setGateways(mergedGateways);
        setActiveGateway(data.activeGateway || 'resend');
      }
    } catch (error) {
      console.error('Error loading gateway settings:', error);
      setMessage({ type: 'error', text: 'Failed to load gateway settings' });
      // Set default gateways on error
      setGateways([
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
        }
      ]);
      setActiveGateway('resend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayChange = (gatewayId: string) => {
    setActiveGateway(gatewayId);
    setGateways(prev => prev.map(gw => ({
      ...gw,
      isActive: gw.id === gatewayId
    })));
  };

  const handleConfigChange = (gatewayId: string, field: string, value: any) => {
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
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const activeGatewayData = gateways.find(g => g.id === activeGateway);
      if (!activeGatewayData) {
        setMessage({ type: 'error', text: 'No active gateway selected' });
        return;
      }

      // Build request payload based on gateway type
      const payload: any = {
        provider: activeGatewayData.type,
        from_email: activeGatewayData.fromEmail || '',
        from_name: activeGatewayData.fromName || ''
      };

      // Add provider-specific fields
      if (activeGatewayData.type === 'resend') {
        if (activeGatewayData.resendApiKey) {
          payload.resend_api_key = activeGatewayData.resendApiKey;
        }
        payload.resend_domain = activeGatewayData.resendDomain || '';
      } else if (activeGatewayData.type === 'smtp') {
        payload.smtp_host = activeGatewayData.smtpHost || '';
        payload.smtp_port = activeGatewayData.smtpPort || 587;
        payload.username = activeGatewayData.smtpUsername || '';
        if (activeGatewayData.smtpPassword) {
          payload.password = activeGatewayData.smtpPassword;
        }
        payload.use_tls = activeGatewayData.smtpSecure || true;
        payload.use_ssl = false;
      } else if (activeGatewayData.type === 'sendgrid') {
        if (activeGatewayData.sendgridApiKey) {
          payload.sendgrid_api_key = activeGatewayData.sendgridApiKey;
        }
        payload.sendgrid_domain = activeGatewayData.sendgridDomain || '';
      }
      
      const response = await fetch(`${apiUrl}/admin/email/gateways`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: 'Email gateway settings saved successfully!' });
        // Reload settings to get updated data
        await loadGatewaySettings();
      } else {
        const error = await response.json();
        console.error('Save error:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving gateway settings:', error);
      setMessage({ type: 'error', text: 'Failed to save gateway settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (gatewayId: string) => {
    try {
      setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'testing' } }));
      
      const gateway = gateways.find(gw => gw.id === gatewayId);
      if (!gateway) return;

      // Validate test email
      if (!testEmail || !testEmail.includes('@')) {
        setMessage({ type: 'error', text: 'Please enter a valid email address for testing' });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: 'Invalid test email' } }));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/email/gateways/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          template_id: 1,
          test_email: testEmail.trim(),
          test_variables: {}
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Test email sent successfully to ${testEmail}! Check your inbox.` });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'success', message: 'Test successful' } }));
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send test email' });
        setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: result.message } }));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setMessage({ type: 'error', text: 'Failed to test connection' });
      setGatewayStatus(prev => ({ ...prev, [gatewayId]: { status: 'error', message: 'Connection failed' } }));
    }
  };

  const getActiveGateway = () => gateways.find(gw => gw.id === activeGateway);

  const getGatewayIcon = (type: string) => {
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

  const getGatewayDescription = (type: string) => {
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

  const renderGatewayConfig = (gateway: EmailGatewayConfig) => {
    switch (gateway.type) {
      case 'resend':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resend API Key
              </label>
              <input
                type="password"
                value={gateway.resendApiKey || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'resendApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  resend.com
                </a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
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

      case 'sendgrid':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SendGrid API Key
              </label>
              <input
                type="password"
                value={gateway.sendgridApiKey || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'sendgridApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  sendgrid.com
                </a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <input
                type="text"
                value={gateway.sendgridDomain || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'sendgridDomain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="yourdomain.com"
              />
            </div>
          </div>
        );

      case 'mailgun':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mailgun API Key
              </label>
              <input
                type="password"
                value={gateway.mailgunApiKey || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'mailgunApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://mailgun.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  mailgun.com
                </a>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={gateway.mailgunDomain || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'mailgunDomain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={gateway.mailgunRegion || 'us'}
                  onChange={(e) => handleConfigChange(gateway.id, 'mailgunRegion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="us">US</option>
                  <option value="eu">EU</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'aws-ses':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  value={gateway.awsAccessKeyId || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'awsAccessKeyId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  value={gateway.awsSecretAccessKey || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'awsSecretAccessKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Region
                </label>
                <select
                  value={gateway.awsRegion || 'us-east-1'}
                  onChange={(e) => handleConfigChange(gateway.id, 'awsRegion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SES From Email
                </label>
                <input
                  type="email"
                  value={gateway.awsSesFromEmail || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'awsSesFromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
                />
              </div>
            </div>
          </div>
        );

      case 'postmark':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postmark API Key
              </label>
              <input
                type="password"
                value={gateway.postmarkApiKey || ''}
                onChange={(e) => handleConfigChange(gateway.id, 'postmarkApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://postmarkapp.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  postmarkapp.com
                </a>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  value={gateway.postmarkFromEmail || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'postmarkFromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={gateway.postmarkFromName || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'postmarkFromName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
            </div>
          </div>
        );

      case 'smtp':
        return (
          <div className="space-y-4">
            {/* SMTP Provider Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Provider Preset
              </label>
              <select
                value=""
                onChange={(e) => {
                  const preset = e.target.value;
                  if (preset) {
                    const presets = {
                      gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
                      outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
                      yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
                      protonmail: { host: '127.0.0.1', port: 1025, secure: false },
                      custom: { host: '', port: 587, secure: false }
                    };
                    const config = presets[preset];
                    handleConfigChange(gateway.id, 'smtpHost', config.host);
                    handleConfigChange(gateway.id, 'smtpPort', config.port);
                    handleConfigChange(gateway.id, 'smtpSecure', config.secure);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a preset or configure manually</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook/Hotmail</option>
                <option value="yahoo">Yahoo Mail</option>
                <option value="protonmail">ProtonMail</option>
                <option value="custom">Custom Configuration</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={gateway.smtpHost || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpHost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="smtp.gmail.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Common hosts: smtp.gmail.com, smtp-mail.outlook.com, smtp.mail.yahoo.com
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={gateway.smtpPort || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpPort', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="587"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={gateway.smtpUsername || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpUsername', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={gateway.smtpPassword || ''}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-app-password"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use app password for Gmail, regular password for others
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={gateway.smtpSecure || false}
                  onChange={(e) => handleConfigChange(gateway.id, 'smtpSecure', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="smtpSecure" className="text-sm font-medium text-gray-700">
                  Use SSL/TLS
                </label>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">SMTP Configuration Tips:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Gmail:</strong> Use app password, port 587, TLS enabled</li>
                  <li>• <strong>Outlook:</strong> Use regular password, port 587, TLS enabled</li>
                  <li>• <strong>Yahoo:</strong> Use app password, port 587, TLS enabled</li>
                  <li>• <strong>Custom:</strong> Check your provider's SMTP documentation</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="float-right text-sm font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Gateway Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Gateway</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                activeGateway === gateway.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
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
                <div className={`w-4 h-4 rounded-full ${
                  activeGateway === gateway.id ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
              </div>
              <p className="text-xs text-gray-600">{getGatewayDescription(gateway.type)}</p>
              
              {/* Status indicator */}
              {gatewayStatus[gateway.id] && (
                <div className="mt-2">
                  {gatewayStatus[gateway.id].status === 'testing' && (
                    <div className="flex items-center text-blue-600 text-xs">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                      Testing...
                    </div>
                  )}
                  {gatewayStatus[gateway.id].status === 'success' && (
                    <div className="flex items-center text-green-600 text-xs">
                      <span className="mr-1">✅</span>
                      Test successful
                    </div>
                  )}
                  {gatewayStatus[gateway.id].status === 'error' && (
                    <div className="flex items-center text-red-600 text-xs">
                      <span className="mr-1">❌</span>
                      {gatewayStatus[gateway.id].message || 'Test failed'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gateway Configuration */}
      {getActiveGateway() && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getActiveGateway()?.name} Configuration
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure your {getActiveGateway()?.name} email gateway settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Email Address
                </label>
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
                disabled={isLoading || !testEmail || gatewayStatus[activeGateway]?.status === 'testing'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {gatewayStatus[activeGateway]?.status === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email Address
                </label>
                <input
                  type="email"
                  value={getActiveGateway()?.fromEmail || ''}
                  onChange={(e) => handleConfigChange(activeGateway, 'fromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={getActiveGateway()?.fromName || ''}
                  onChange={(e) => handleConfigChange(activeGateway, 'fromName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
            </div>

            {/* Environment Variable Integration */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Environment Variable Integration</h4>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>
              </div>
              
              {showAdvanced && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useEnvVars"
                      checked={getActiveGateway()?.useEnvVars || false}
                      onChange={(e) => handleConfigChange(activeGateway, 'useEnvVars', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="useEnvVars" className="text-sm font-medium text-gray-700">
                      Use environment variables for sensitive data
                    </label>
                  </div>
                  
                  {getActiveGateway()?.useEnvVars && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Environment Variable Prefix
                      </label>
                      <input
                        type="text"
                        value={getActiveGateway()?.envVarPrefix || ''}
                        onChange={(e) => handleConfigChange(activeGateway, 'envVarPrefix', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="RESEND"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        This will use environment variables like {getActiveGateway()?.envVarPrefix || 'PREFIX'}_API_KEY
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gateway Specific Configuration */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Gateway Configuration</h4>
              {renderGatewayConfig(getActiveGateway()!)}
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Environment Variables</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For Resend:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For SendGrid:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For Mailgun:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx<br/>
              MAILGUN_DOMAIN=yourdomain.com
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For AWS SES:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE<br/>
              AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY<br/>
              AWS_REGION=us-east-1
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For Postmark:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              POSTMARK_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For SMTP:</h4>
            <code className="block bg-blue-100 p-3 rounded text-sm text-blue-900">
              SMTP_HOST=smtp.gmail.com<br/>
              SMTP_PORT=587<br/>
              SMTP_USERNAME=your-email@gmail.com<br/>
              SMTP_PASSWORD=your-app-password<br/>
              SMTP_SECURE=false
            </code>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            <strong>Note:</strong> For security, sensitive information like API keys and passwords should be stored as environment variables rather than in the database.
          </p>
        </div>
      </div>

      {/* Save Button */}
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