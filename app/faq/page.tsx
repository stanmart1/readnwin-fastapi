'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Basic HTML sanitization function
const sanitizeHtml = (html: string) => {
  if (typeof html !== 'string') return html;
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '');
};

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  useEffect(() => {
    fetchFAQs();
    
    // Listen for admin content updates
    const handleContentUpdate = () => {
      setLoading(true);
      fetchFAQs();
    };

    window.addEventListener('faq-content-updated', handleContentUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'faq-content-updated') {
        handleContentUpdate();
      }
    });

    return () => {
      window.removeEventListener('faq-content-updated', handleContentUpdate);
      window.removeEventListener('storage', handleContentUpdate);
    };
  }, []);

  const fetchFAQs = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/faq/?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setFaqs(data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (faqId: number) => {
    setOpenFaqs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const filteredFaqs = faqs.filter(faq => 
    searchQuery === '' || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Find answers to common questions about ReadnWin competitions and platform
            </p>
            
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No questions found
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try adjusting your search query.'
                  : 'No FAQs available at the moment.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="p-6">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left flex items-start justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {faq.category}
                        </span>
                        {faq.is_featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">
                        {sanitizeHtml(faq.question)}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {openFaqs.includes(faq.id) ? (
                        <span className="text-gray-400">−</span>
                      ) : (
                        <span className="text-gray-400">+</span>
                      )}
                    </div>
                  </button>
                  
                  {openFaqs.includes(faq.id) && (
                    <div className="mt-4 pl-9">
                      <p className="text-gray-700 leading-relaxed">
                        {sanitizeHtml(faq.answer)}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Last updated: {new Date(faq.updated_at).toLocaleDateString()}
                        </span>
                        <span>
                          {faq.view_count} views
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Contact our support team for assistance.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
} 