'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Secure Quill to avoid SSR issues
const SecureQuill = dynamic(() => import('./SecureQuill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
  modules?: any;
  formats?: string[];
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  readOnly = false,
  theme = 'snow',
  modules,
  formats
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default modules configuration
  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  // Default formats
  const defaultFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

  if (!mounted) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-md"></div>;
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <SecureQuill
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={className}
        style={{ height: '300px', maxHeight: '400px' }}
      />
      
      {/* Custom styles for better integration */}
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: #d1d5db;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        
        .rich-text-editor .ql-container {
          border-color: #d1d5db;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 200px;
          max-height: 250px;
          padding: 12px 15px;
          overflow-y: auto;
        }
        
        .rich-text-editor .ql-editor:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar .ql-picker-label:hover {
          color: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-stroke {
          stroke: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-fill {
          fill: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar .ql-active {
          color: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar .ql-active .ql-stroke {
          stroke: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar .ql-active .ql-fill {
          fill: #3b82f6;
        }
      `}</style>
    </div>
  );
} 