import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';
import { useSettingsManagement } from '../../hooks/useSettingsManagement';
import EmailGatewayManagement from './settings-components/EmailGatewayManagement';
import PaymentGatewayManagement from './settings-components/PaymentGatewayManagement';
import ImageCacheManager from './settings-components/ImageCacheManager';
import RedisManagement from './settings-components/RedisManagement';
import ImageOptimization from '../../components/admin/ImageOptimization';

export default function SystemSettings() {
  const { settings, setSettings, loading, saving, error, saveSettings } = useSettingsManagement();
  const [activeTab, setActiveTab] = useState('general');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    const result = await saveSettings();
    if (result.success) {
      alert('Settings saved successfully!');
    } else {
      alert(`Error saving settings: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderGeneralSettings = () => (
    <div className="space-y-3 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Site Name</label>
        <input
          type="text"
          value={settings.site_name || ''}
          onChange={(e) => handleSettingChange('site_name', e.target.value)}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Site Description</label>
        <textarea
          value={settings.site_description || ''}
          onChange={(e) => handleSettingChange('site_description', e.target.value)}
          rows={3}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-2 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">Maintenance Mode</label>
            <p className="text-xs text-gray-500">Temporarily disable site for maintenance</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenance_mode || false}
              onChange={(e) => handleSettingChange('maintenance_mode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">User Registration</label>
            <p className="text-xs text-gray-500">Allow new users to register</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.user_registration || false}
              onChange={(e) => handleSettingChange('user_registration', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">Email Notifications</label>
            <p className="text-xs text-gray-500">Send email notifications to users</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_notifications || false}
              onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">Double Opt-In Registration</label>
            <p className="text-xs text-gray-500">Require email verification for new user registrations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.double_opt_in || false}
              onChange={(e) => handleSettingChange('double_opt_in', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">Review Moderation</label>
            <p className="text-xs text-gray-500">Moderate reviews before publishing</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.review_moderation || false}
              onChange={(e) => handleSettingChange('review_moderation', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700">Redis Caching</label>
            <p className="text-xs text-gray-500">Enable Redis for caching and rate limiting</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.redis_enabled !== false}
              onChange={(e) => handleSettingChange('redis_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
        <input
          type="number"
          min="5"
          max="1440"
          value={settings.session_timeout_minutes || settings.sessionTimeoutMinutes || 40}
          onChange={(e) => handleSettingChange('session_timeout_minutes', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Users will be warned 5 minutes before timeout (5-1440 minutes)</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Auto Backup</label>
          <p className="text-sm text-gray-500">Automatically backup system data</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_backup || false}
            onChange={(e) => handleSettingChange('auto_backup', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
        <select
          value={settings.backup_frequency || 'daily'}
          onChange={(e) => handleSettingChange('backup_frequency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
        <input
          type="number"
          value={settings.max_file_size_mb || 10}
          onChange={(e) => handleSettingChange('max_file_size_mb', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
        <div className="space-y-2">
          {['pdf', 'epub', 'mobi', 'txt', 'doc', 'docx'].map(type => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={(settings.allowed_file_types || []).includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleSettingChange('allowed_file_types', [...(settings.allowed_file_types || []), type]);
                  } else {
                    handleSettingChange('allowed_file_types', (settings.allowed_file_types || []).filter(t => t !== type));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{type.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-800 mb-4">Image Cache Management</h4>
        <ImageCacheManager />
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
        <div className="space-y-2">
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Clear All Cache
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2">
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <PaymentGatewayManagement />
  );

  const tabs = [
    { id: 'general', label: 'General', icon: 'ri-settings-line' },
    { id: 'security', label: 'Security', icon: 'ri-shield-check-line' },
    { id: 'redis', label: 'Redis', icon: 'ri-database-line' },
    { id: 'images', label: 'Images', icon: 'ri-image-line' },
    { id: 'payment', label: 'Payment', icon: 'ri-money-dollar-circle-line' },
    { id: 'email', label: 'Email Gateway', icon: 'ri-mail-line' }
  ];

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-6"
      >
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">System Settings</h2>
          
          {/* Tabs - scrollable on mobile */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <i className={`${tab.icon} text-sm sm:text-base`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'redis' && <RedisManagement />}
            {activeTab === 'images' && <ImageOptimization />}
            {activeTab === 'payment' && renderPaymentSettings()}
            {activeTab === 'email' && <EmailGatewayManagement />}
          </div>
          
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
