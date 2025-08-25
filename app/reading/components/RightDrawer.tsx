'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Type, 
  Eye, 
  Volume2, 
  Settings,
  Sun,
  Moon,
  Palette,
  Minus,
  Plus,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  VolumeX,
  Download,
  Upload
} from 'lucide-react';
import { useReaderStore } from '@/stores/readerStore';

interface RightDrawerProps {
  onClose: () => void;
}

export default function RightDrawer({ onClose }: RightDrawerProps) {
  const {
    drawerState,
    setRightDrawerTab,
    settings,
    ttsSettings,
    updateSettings,
    updateTTSSettings,
    resetSettings,
    exportData,
    importData,
  } = useReaderStore();

  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-800 text-gray-100 border-gray-700',
    sepia: 'bg-amber-50 text-amber-900 border-amber-200',
  };

  const tabClasses = {
    light: 'text-gray-600 hover:text-gray-900 border-gray-300',
    dark: 'text-gray-400 hover:text-gray-100 border-gray-600',
    sepia: 'text-amber-600 hover:text-amber-900 border-amber-300',
  };

  // Font family options
  const fontFamilies = [
    { value: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', label: 'Inter' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  ];

  // Text alignment options
  const textAlignments = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'justify', label: 'Justify' },
  ];

  // Theme options
  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'sepia', label: 'Sepia', icon: Palette },
  ];

  // Handle export
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ereader-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = () => {
    try {
      importData(importText);
      setImportText('');
      setShowImportModal(false);
      alert('Data imported successfully!');
    } catch (error) {
      alert('Failed to import data. Please check the format.');
    }
  };

  // Render slider component
  const Slider = ({ 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    label, 
    unit = '',
    showValue = true 
  }: {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    label: string;
    unit?: string;
    showValue?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        {showValue && (
          <span className="text-sm text-gray-500">
            {value}{unit}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.3 }}
      className={`fixed right-0 top-16 bottom-0 w-80 ${themeClasses[settings.theme]} border-l shadow-lg z-40 flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reader Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'display', label: 'Display', icon: Eye },
          { id: 'reading', label: 'Reading', icon: Type },
          { id: 'audio', label: 'Audio', icon: Volume2 },
          { id: 'general', label: 'General', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRightDrawerTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-3 px-2 border-b-2 transition-colors ${
              drawerState.activeRightTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : `${tabClasses[settings.theme]} border-transparent`
            }`}
          >
            <tab.icon className="w-4 h-4 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Display Tab */}
        {drawerState.activeRightTab === 'display' && (
          <>
            {/* Theme Selection */}
            <div className="space-y-3">
              <h3 className="font-medium">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateSettings({ theme: theme.value as any })}
                    className={`p-3 rounded-lg border flex flex-col items-center space-y-1 transition-colors ${
                      settings.theme === theme.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <theme.icon className="w-5 h-5" />
                    <span className="text-xs">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <Slider
              value={settings.fontSize}
              onChange={(fontSize) => updateSettings({ fontSize })}
              min={12}
              max={24}
              step={1}
              label="Font Size"
              unit="px"
            />

            {/* Line Height */}
            <Slider
              value={settings.lineHeight}
              onChange={(lineHeight) => updateSettings({ lineHeight })}
              min={1.2}
              max={2.0}
              step={0.1}
              label="Line Height"
              unit="x"
            />

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  settings.theme === 'light'
                    ? 'border-gray-300 bg-white'
                    : settings.theme === 'dark'
                    ? 'border-gray-600 bg-gray-700'
                    : 'border-amber-300 bg-amber-100'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Alignment</label>
              <div className="flex space-x-2">
                {textAlignments.map((alignment) => (
                  <button
                    key={alignment.value}
                    onClick={() => updateSettings({ textAlign: alignment.value as any })}
                    className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                      settings.textAlign === alignment.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {alignment.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Reading Tab */}
        {drawerState.activeRightTab === 'reading' && (
          <>
            {/* Reading Width */}
            <Slider
              value={settings.readingWidth}
              onChange={(readingWidth) => updateSettings({ readingWidth })}
              min={50}
              max={100}
              step={5}
              label="Reading Width"
              unit="%"
            />

            {/* Horizontal Margin */}
            <Slider
              value={settings.marginHorizontal}
              onChange={(marginHorizontal) => updateSettings({ marginHorizontal })}
              min={0}
              max={50}
              step={5}
              label="Horizontal Margin"
              unit="px"
            />

            {/* Vertical Margin */}
            <Slider
              value={settings.marginVertical}
              onChange={(marginVertical) => updateSettings({ marginVertical })}
              min={0}
              max={50}
              step={5}
              label="Vertical Margin"
              unit="px"
            />

            {/* Column Count */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Columns</label>
              <div className="flex space-x-2">
                {[1, 2].map((columns) => (
                  <button
                    key={columns}
                    onClick={() => updateSettings({ columnCount: columns })}
                    className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                      settings.columnCount === columns
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {columns} Column{columns > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto Theme</p>
                <p className="text-xs text-gray-500">Follow system theme</p>
              </div>
              <button
                onClick={() => updateSettings({ autoTheme: !settings.autoTheme })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoTheme ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoTheme ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </>
        )}

        {/* Audio Tab */}
        {drawerState.activeRightTab === 'audio' && (
          <>
            {/* TTS Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Text-to-Speech</p>
                <p className="text-xs text-gray-500">Enable audio playback</p>
              </div>
              <button
                onClick={() => updateTTSSettings({ enabled: !ttsSettings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  ttsSettings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ttsSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {ttsSettings.enabled && (
              <>
                {/* Speech Rate */}
                <Slider
                  value={ttsSettings.rate}
                  onChange={(rate) => updateTTSSettings({ rate })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  label="Speech Rate"
                  unit="x"
                />

                {/* Speech Pitch */}
                <Slider
                  value={ttsSettings.pitch}
                  onChange={(pitch) => updateTTSSettings({ pitch })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  label="Speech Pitch"
                  unit="x"
                />

                {/* Volume */}
                <Slider
                  value={ttsSettings.volume}
                  onChange={(volume) => updateTTSSettings({ volume })}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  label="Volume"
                  unit=""
                  showValue={false}
                />

                {/* Highlight Current Sentence */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Highlight Reading</p>
                    <p className="text-xs text-gray-500">Highlight current sentence</p>
                  </div>
                  <button
                    onClick={() => updateTTSSettings({ highlightCurrentSentence: !ttsSettings.highlightCurrentSentence })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      ttsSettings.highlightCurrentSentence ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        ttsSettings.highlightCurrentSentence ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Play */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto Play</p>
                    <p className="text-xs text-gray-500">Start reading automatically</p>
                  </div>
                  <button
                    onClick={() => updateTTSSettings({ autoPlay: !ttsSettings.autoPlay })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      ttsSettings.autoPlay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        ttsSettings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* General Tab */}
        {drawerState.activeRightTab === 'general' && (
          <>
            {/* Reset Settings */}
            <div className="space-y-3">
              <h3 className="font-medium">Reset Settings</h3>
              <button
                onClick={resetSettings}
                className="w-full p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            {/* Data Export/Import */}
            <div className="space-y-3">
              <h3 className="font-medium">Data Management</h3>
              
              <button
                onClick={handleExport}
                className="w-full p-3 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="w-full p-3 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </button>
            </div>

            {/* App Information */}
            <div className="space-y-3">
              <h3 className="font-medium">About</h3>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Version:</span> 1.0.0
                </p>
                <p className="text-sm">
                  <span className="font-medium">Build:</span> Enhanced E-Reader
                </p>
                <p className="text-xs text-gray-500">
                  Built with Next.js, React, and Zustand
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${themeClasses[settings.theme]} rounded-lg p-6 w-full max-w-md`}>
            <h3 className="text-lg font-semibold mb-4">Import Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste your exported data JSON below:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste JSON data here..."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleImport}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 