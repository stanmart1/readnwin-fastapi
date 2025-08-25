'use client';

import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: string[];
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function EmailTemplateEditor({
  value,
  onChange,
  variables = [],
  placeholder = 'Start writing your email template...',
  className = '',
  readOnly = false
}: EmailTemplateEditorProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Common email template variables
  const commonVariables = [
    '{{userName}}',
    '{{userEmail}}',
    '{{verificationToken}}',
    '{{verificationUrl}}',
    '{{resetToken}}',
    '{{resetUrl}}',
    '{{orderNumber}}',
    '{{orderTotal}}',
    '{{trackingNumber}}',
    '{{estimatedDelivery}}'
  ];

  const allVariables = [...new Set([...commonVariables, ...variables])];

  const insertVariable = (variable: string) => {
    onChange(value + variable);
  };

  return (
    <div className={`email-template-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowVariables(!showVariables)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showVariables ? 'Hide' : 'Show'} Variables
          </button>
          
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {previewMode ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {value.length} characters
        </div>
      </div>

      {/* Variables Panel */}
      {showVariables && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Available Variables</h3>
          <div className="flex flex-wrap gap-2">
            {allVariables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200 transition-colors"
                title={`Insert ${variable}`}
              >
                {variable}
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Click on any variable to insert it at the end of the content
          </p>
        </div>
      )}

      {/* Editor Container */}
      <div className="mb-4">
        {!previewMode && (
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        )}

        {/* Preview */}
        {previewMode && (
          <div className="border border-gray-300 rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
            </div>
            <div className="p-4 bg-white">
              <div dangerouslySetInnerHTML={{ __html: value }} />
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-800 mb-1">💡 Tips for Email Templates</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Use variables like {'{{userName}}'} for personalization</li>
          <li>• Include both HTML and text versions for better email client compatibility</li>
          <li>• Test your templates with different email clients</li>
          <li>• Keep subject lines under 50 characters for better open rates</li>
          <li>• Use clear call-to-action buttons and links</li>
        </ul>
      </div>
    </div>
  );
} 