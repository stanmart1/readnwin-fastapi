'use client';

import { useEffect } from 'react';

interface WorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: {
    id: number;
    src: string;
    alt: string;
    title: string;
    description: string;
  } | null;
}

export default function WorkModal({ isOpen, onClose, work }: WorkModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !work) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 hover:bg-white"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
        
        {/* Modal Body */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Image Section */}
          <div className="lg:w-1/2 flex-shrink-0">
            <img
              src={work.src}
              alt={work.alt}
              className="w-full h-64 lg:h-full object-cover object-center"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/600x400?text=Work+Image';
              }}
            />
          </div>
          
          {/* Content Section */}
          <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col overflow-y-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {work.title}
            </h2>
            <div className="flex-1">
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
                {work.description || 'Innovative solutions that enhance the digital reading experience and connect readers with their favorite books.'}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Add any additional action here (e.g., navigate to project page)
                  console.log('View project details for:', work.title);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                View Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 