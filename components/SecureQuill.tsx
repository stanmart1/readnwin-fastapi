'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface SecureQuillProps {
  value?: string;
  onChange?: (content: string, delta: any, source: any, editor: any) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Secure Quill Editor Component
 * 
 * This component wraps React Quill with security measures to prevent XSS attacks:
 * - Input sanitization
 * - Restricted toolbar options
 * - Safe HTML filtering
 * - Content validation
 */
const SecureQuill: React.FC<SecureQuillProps> = ({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  className = '',
  style = {}
}) => {
  const [sanitizedValue, setSanitizedValue] = useState('');
  const isUpdatingRef = useRef(false);

  // HTML sanitization function
  const sanitizeHTML = (html: string): string => {
    if (typeof html !== 'string') return '';
    
    return html
      // Remove script tags and content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove iframe tags and content
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      // Remove object tags and content
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
      // Remove embed tags
      .replace(/<embed[^>]*>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: protocols
      .replace(/data:/gi, '')
      // Remove vbscript: protocols
      .replace(/vbscript:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove eval() calls
      .replace(/eval\s*\(/gi, '')
      // Remove dangerous CSS
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Sanitize remaining HTML tags
      .replace(/<[^>]*>/g, (match) => {
        const safeTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'];
        const tagName = match.match(/<(\w+)/)?.[1]?.toLowerCase();
        
        if (safeTags.includes(tagName || '')) {
          // Remove dangerous attributes from safe tags
          return match
            .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/\s+javascript\s*:/gi, '')
            .replace(/\s+data\s*:/gi, '')
            .replace(/\s+vbscript\s*:/gi, '')
            .replace(/\s+expression\s*\(/gi, '')
            .replace(/\s+eval\s*\(/gi, '')
            .replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');
        }
        
        return '';
      });
  };

  // Validate content length
  const validateContent = (content: string): boolean => {
    // Limit content to 1MB to prevent DoS
    const maxSize = 1024 * 1024; // 1MB
    return content.length <= maxSize;
  };

  // Secure configuration for Quill
  const secureModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['link'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false, // Disable visual matching for security
    }
  };

  const secureFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'header',
    'link',
    'blockquote', 'code-block'
  ];

  // Handle content changes with security validation
  const handleChange = (content: string, delta: any, source: any, editor: any) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      // Validate content length
      if (!validateContent(content)) {
        console.warn('Security: Content too large, truncating');
        content = content.substring(0, 1024 * 1024);
      }

      // Sanitize the content
      const sanitizedContent = sanitizeHTML(content);
      
      // Only update if content actually changed
      if (sanitizedContent !== sanitizedValue) {
        setSanitizedValue(sanitizedContent);
        
        // Call parent onChange with sanitized content
        if (onChange) {
          onChange(sanitizedContent, delta, source, editor);
        }
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Sanitize initial value
  useEffect(() => {
    const sanitized = sanitizeHTML(value);
    setSanitizedValue(sanitized);
  }, [value]);

  return (
    <div className={`secure-quill-wrapper ${className}`} style={style}>
      <ReactQuill
        value={sanitizedValue}
        onChange={handleChange}
        modules={secureModules}
        formats={secureFormats}
        placeholder={placeholder}
        readOnly={readOnly}
        theme="snow"
        style={{
          minHeight: '200px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
      />
      
      {/* Security indicator */}
      <div className="security-indicator" style={{
        fontSize: '10px',
        color: '#666',
        marginTop: '5px',
        textAlign: 'right'
      }}>
        🔒 Secure Editor
      </div>
    </div>
  );
};

export default SecureQuill;
