'use client';

import { useState, useEffect } from 'react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function SessionExpiredModal({ isOpen, onClose, onLogin }: SessionExpiredModalProps) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-time-line text-red-600 text-xl"></i>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Expired
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Your session has expired for security reasons. Please log in again to continue.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={onLogin}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Log In Again
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Redirecting automatically in {countdown} seconds
          </p>
        </div>
      </div>
    </div>
  );
}