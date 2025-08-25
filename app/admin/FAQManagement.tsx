'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { EnhancedApiClient } from '@/lib/api-enhanced';

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

// Generate unique ID
const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString() + Math.random().toString(36).substr(2, 5);
};

// FAQ categories constant
const FAQ_CATEGORIES = [
  'general',
  'account', 
  'reading',
  'payment',
  'technical',
  'books'
];

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  order_index: number;
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_active: true
  });



  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const api = new EnhancedApiClient();
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
      }
      
      const data = await api.request('/faq/admin');
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error('Error loading FAQs');
    } finally {
      setLoading(false);
    }
  };

  const sanitizeFaqData = (data: any): any => {
    if (typeof data === 'string') {
      return sanitizeHtml(data);
    } else if (Array.isArray(data)) {
      return data.map(sanitizeFaqData);
    } else if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeFaqData(value);
      }
      return sanitized;
    }
    return data;
  };

  const saveFAQs = async () => {
    try {
      setSaving(true);
      const api = new EnhancedApiClient();
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
      }
      
      // Sanitize FAQ data before sending
      const sanitizedFaqs = sanitizeFaqData(faqs);
      
      await api.request('/faq/admin', {
        method: 'PUT',
        body: JSON.stringify({ faqs: sanitizedFaqs })
      });

      toast.success('FAQs saved successfully!');
      
      // Dispatch event to refresh public pages
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('faq-content-updated', {
            detail: { timestamp: Date.now() }
          })
        );
        localStorage.setItem('faq-content-updated', Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving FAQs:', error);
      toast.error('Error saving FAQs');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFAQ = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    const newFaq: FAQ = {
      id: parseInt(generateId(), 16),
      question: sanitizeHtml(formData.question),
      answer: sanitizeHtml(formData.answer),
      category: formData.category,
      is_active: formData.is_active,
      order_index: faqs.length + 1
    };

    setFaqs([...faqs, newFaq]);
    setFormData({ question: '', answer: '', category: 'general', is_active: true });
    setShowCreateModal(false);
    toast.success('FAQ created successfully!');
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: faq.is_active
    });
  };

  const handleUpdateFAQ = () => {
    if (!editingFaq) return;
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    const sanitizedFormData = {
      question: sanitizeHtml(formData.question),
      answer: sanitizeHtml(formData.answer),
      category: formData.category,
      is_active: formData.is_active
    };

    setFaqs(faqs.map(faq => 
      faq.id === editingFaq.id 
        ? { ...faq, ...sanitizedFormData }
        : faq
    ));
    
    setEditingFaq(null);
    setFormData({ question: '', answer: '', category: 'general', is_active: true });
    toast.success('FAQ updated successfully!');
  };

  const handleDeleteFAQ = (id: number) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(faqs.filter(faq => faq.id !== id));
      toast.success('FAQ deleted successfully!');
    }
  };

  const moveFAQ = (id: number, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(faq => faq.id === id);
    if (currentIndex === -1) return;

    const newFaqs = [...faqs];
    if (direction === 'up' && currentIndex > 0) {
      [newFaqs[currentIndex], newFaqs[currentIndex - 1]] = [newFaqs[currentIndex - 1], newFaqs[currentIndex]];
    } else if (direction === 'down' && currentIndex < newFaqs.length - 1) {
      [newFaqs[currentIndex], newFaqs[currentIndex + 1]] = [newFaqs[currentIndex + 1], newFaqs[currentIndex]];
    }

    setFaqs(newFaqs.map((faq, index) => ({ ...faq, order_index: index + 1 })));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">FAQ Management</h1>
        <p className="text-gray-600">Manage frequently asked questions</p>
      </div>

      <div className="mb-6 flex justify-between">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add FAQ
        </button>
        <button
          onClick={saveFAQs}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                  #{faq.order_index}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  {faq.category}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faq.is_active}
                    onChange={(e) => setFaqs(faqs.map(f => 
                      f.id === faq.id ? { ...f, is_active: e.target.checked } : f
                    ))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveFAQ(faq.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <i className="ri-arrow-up-line"></i>
                </button>
                <button
                  onClick={() => moveFAQ(faq.id, 'down')}
                  disabled={index === faqs.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <i className="ri-arrow-down-line"></i>
                </button>
                <button
                  onClick={() => handleEditFAQ(faq)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <i className="ri-edit-line"></i>
                </button>
                <button
                  onClick={() => handleDeleteFAQ(faq.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{faq.question}</h3>
              </div>
              <div>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFaq) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingFaq ? 'Edit FAQ' : 'Create FAQ'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FAQ_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({...formData, answer: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter answer..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingFaq(null);
                  setFormData({ question: '', answer: '', category: 'general', is_active: true });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingFaq ? handleUpdateFAQ : handleCreateFAQ}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingFaq ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}