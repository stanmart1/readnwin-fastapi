'use client';

import { useState } from 'react';
import { BookUploadModalV2 } from '@/components/BookUploadModalV2';

export default function TestUploadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBookUploaded = (bookData: any) => {
    console.log('Book uploaded successfully:', bookData);
    // You can add additional logic here, such as redirecting to the e-reader
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Book Upload System V2 Test
          </h1>
          <p className="text-gray-600">
            Test the new HTML-based book processing system
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Upload a Book</h2>
            <p className="text-gray-600 mb-6">
              This new system processes books and stores them as structured HTML files
              with built-in analytics and reading features.
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Book
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">New Features</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• HTML-based book storage</li>
                <li>• Built-in reading analytics</li>
                <li>• Chapter navigation</li>
                <li>• Reading progress tracking</li>
                <li>• Dark mode support</li>
                <li>• Mobile responsive design</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Supported Formats</h3>
              <ul className="text-green-800 space-y-2 text-sm">
                <li>• EPUB files</li>
                <li>• PDF documents</li>
                <li>• DOCX files</li>
                <li>• Automatic metadata extraction</li>
                <li>• Chapter detection</li>
                <li>• Word count calculation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BookUploadModalV2
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookUploaded={handleBookUploaded}
      />
    </div>
  );
} 