'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import EmailGatewayManagement from './EmailGatewayManagement';
import PaymentGatewayManagement from './PaymentGatewayManagement';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request('/admin/system-settings');
      const settingsData = {};
      
      // Convert settings object to flat structure
      Object.entries(response.settings).forEach(([key, data]: [string, any]) => {
        settingsData[key] = data.value;
      });
      
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Save each changed setting
      const promises = Object.entries(settings).map(([key, value]) => 
        apiClient.request(`/admin/system-settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value })
        })
      );
      
      await Promise.all(promises);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const initializeSettings = async () => {
    try {
      await apiClient.request('/admin/system-settings/initialize', {
        method: 'POST'
      });
      await loadSettings();
      setSuccess('Default settings initialized!');
    } catch (error) {
      console.error('Error initializing settings:', error);
      setError('Failed to initialize settings');
    }
  };

  const syncFromEnvironment = async () => {
    try {
      const response = await apiClient.request('/admin/system-settings/sync-env', {
        method: 'POST'
      });
      await loadSettings();
      setSuccess(response.message || 'Settings synced from environment variables!');
    } catch (error) {
      console.error('Error syncing from environment:', error);
      setError('Failed to sync from environment variables');
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
        <input
          type="text"
          value={settings.site_name || ''}
          onChange={(e) => handleSettingChange('site_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
        <textarea
          value={settings.site_description || ''}
          onChange={(e) => handleSettingChange('site_description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
            <p className="text-sm text-gray-500">Temporarily disable site for maintenance</p>
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
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">User Registration</label>
            <p className="text-sm text-gray-500">Allow new users to register</p>
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
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Email Notifications</label>
            <p className="text-sm text-gray-500">Send email notifications to users</p>
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
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Double Opt-In Registration</label>
            <p className="text-sm text-gray-500">Require email verification for new user registrations</p>
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
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Review Moderation</label>
            <p className="text-sm text-gray-500">Moderate reviews before publishing</p>
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
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
        <input
          type="number"
          value={settings.session_timeout_minutes || 40}
          onChange={(e) => handleSettingChange('session_timeout_minutes', parseInt(e.target.value))}
          min="5"
          max="1440"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">How long users stay logged in (5-1440 minutes)</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
        <input
          type="number"
          value={settings.max_login_attempts || 5}
          onChange={(e) => handleSettingChange('max_login_attempts', parseInt(e.target.value))}
          min="3"
          max="10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">Maximum failed login attempts before lockout</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
        <input
          type="number"
          value={settings.lockout_duration_minutes || 15}
          onChange={(e) => handleSettingChange('lockout_duration_minutes', parseInt(e.target.value))}
          min="5"
          max="60"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">How long accounts are locked after failed attempts</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Require Password Complexity</label>
          <p className="text-sm text-gray-500">Enforce strong password requirements</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.require_password_complexity || false}
            onChange={(e) => handleSettingChange('require_password_complexity', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
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
          min="1"
          max="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderContentSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Books Per Page</label>
        <input
          type="number"
          value={settings.books_per_page || 20}
          onChange={(e) => handleSettingChange('books_per_page', parseInt(e.target.value))}
          min="5"
          max="50"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Featured Books Count</label>
        <input
          type="number"
          value={settings.featured_books_count || 8}
          onChange={(e) => handleSettingChange('featured_books_count', parseInt(e.target.value))}
          min="4"
          max="20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Enable Reviews</label>
          <p className="text-sm text-gray-500">Allow users to write book reviews</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enable_reviews || false}
            onChange={(e) => handleSettingChange('enable_reviews', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Enable Ratings</label>
          <p className="text-sm text-gray-500">Allow users to rate books</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enable_ratings || false}
            onChange={(e) => handleSettingChange('enable_ratings', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderReadingSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Default Reading Goal (books/year)</label>
        <input
          type="number"
          value={settings.default_reading_goal || 12}
          onChange={(e) => handleSettingChange('default_reading_goal', parseInt(e.target.value))}
          min="1"
          max="365"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Reading Streak Tracking</label>
          <p className="text-sm text-gray-500">Track consecutive reading days</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.reading_streak_enabled || false}
            onChange={(e) => handleSettingChange('reading_streak_enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Achievement System</label>
          <p className="text-sm text-gray-500">Enable reading achievements and badges</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.achievement_system_enabled || false}
            onChange={(e) => handleSettingChange('achievement_system_enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );



  const tabs = [
    { id: 'general', label: 'General', icon: 'ri-settings-line' },
    { id: 'security', label: 'Security', icon: 'ri-shield-check-line' },
    { id: 'content', label: 'Content', icon: 'ri-book-line' },
    { id: 'reading', label: 'Reading', icon: 'ri-book-open-line' },
    { id: 'payment', label: 'Payment', icon: 'ri-money-dollar-circle-line' },
    { id: 'email', label: 'Email Gateway', icon: 'ri-mail-line' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
          <div className="flex space-x-3">
            <button
              onClick={syncFromEnvironment}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <i className="ri-refresh-line mr-1"></i>
              Sync from Env
            </button>
            <button
              onClick={initializeSettings}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Initialize Defaults
            </button>
          </div>
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="max-w-2xl">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'content' && renderContentSettings()}
          {activeTab === 'reading' && renderReadingSettings()}
          {activeTab === 'payment' && <PaymentGatewayManagement />}
          {activeTab === 'email' && <EmailGatewayManagement />}
        </div>
        
        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button 
              onClick={loadSettings}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}