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
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

interface ContactMethod {
  id: string;
  icon: string;
  title: string;
  description: string;
  contact: string;
  action: string;
  isActive: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
}

interface OfficeInfo {
  address: string;
  hours: string;
  parking: string;
  isActive: boolean;
}

interface ContactSubject {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
}

export default function ContactManagement() {
  const [activeTab, setActiveTab] = useState('contact-methods');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Contact Methods State
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([
    {
      id: 'email',
      icon: 'ri-mail-line',
      title: 'Email Us',
      description: 'Get in touch with our support team',
      contact: 'hello@readnwin.com',
      action: 'mailto:hello@readnwin.com',
      isActive: true
    },
    {
      id: 'phone',
      icon: 'ri-phone-line',
      title: 'Call Us',
      description: 'Speak with our customer service',
      contact: '+1 (555) 123-4567',
      action: 'tel:+15551234567',
      isActive: true
    },
    {
      id: 'chat',
      icon: 'ri-message-3-line',
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      contact: 'Available 24/7',
      action: '#',
      isActive: true
    },
    {
      id: 'visit',
      icon: 'ri-map-pin-line',
      title: 'Visit Us',
      description: 'Our headquarters location',
      contact: '123 Reading Street, Book City, BC 12345',
      action: '#',
      isActive: true
    }
  ]);

  // FAQ State
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'How do I get started with ReadnWin?',
      answer: 'Simply sign up for a free account and start exploring our vast library of books. You can read on any device and sync your progress across platforms.',
      isActive: true,
      order: 1
    },
    {
      id: '2',
      question: 'What types of books are available?',
      answer: 'We offer a comprehensive collection including fiction, non-fiction, academic texts, self-help books, and much more. Our library is constantly growing with new releases.',
      isActive: true,
      order: 2
    },
    {
      id: '3',
      question: 'Can I read offline?',
      answer: 'Yes! You can download books to read offline. Simply tap the download button on any book and it will be available for offline reading.',
      isActive: true,
      order: 3
    },
    {
      id: '4',
      question: 'How much does ReadnWin cost?',
      answer: 'We offer both free and premium plans. The free plan includes access to thousands of books, while premium unlocks our entire library and advanced features.',
      isActive: true,
      order: 4
    },
    {
      id: '5',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from your account settings. There are no cancellation fees and you\'ll continue to have access until the end of your billing period.',
      isActive: true,
      order: 5
    },
    {
      id: '6',
      question: 'Is my reading data private?',
      answer: 'Absolutely. We take your privacy seriously. Your reading history and personal data are encrypted and never shared with third parties without your explicit consent.',
      isActive: true,
      order: 6
    }
  ]);

  // Office Information State
  const [officeInfo, setOfficeInfo] = useState<OfficeInfo>({
    address: '123 Reading Street, Book City, BC 12345',
    hours: 'Monday - Friday: 9:00 AM - 6:00 PM',
    parking: 'Free parking available in our building',
    isActive: true
  });

  // Contact Subjects State
  const [contactSubjects, setContactSubjects] = useState<ContactSubject[]>([
    { id: '1', name: 'General Inquiry', isActive: true, order: 1 },
    { id: '2', name: 'Technical Support', isActive: true, order: 2 },
    { id: '3', name: 'Account Issues', isActive: true, order: 3 },
    { id: '4', name: 'Billing Questions', isActive: true, order: 4 },
    { id: '5', name: 'Feature Request', isActive: true, order: 5 },
    { id: '6', name: 'Partnership', isActive: true, order: 6 },
    { id: '7', name: 'Press/Media', isActive: true, order: 7 },
    { id: '8', name: 'Other', isActive: true, order: 8 }
  ]);

  // Remove unused state variables
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newSubject, setNewSubject] = useState({ name: '' });

  useEffect(() => {
    loadContactData();
  }, []);

  const loadContactData = async () => {
    setIsLoading(true);
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
      }
      
      const result = await api.request('/contact/admin');
      
      if (result.success) {
        setContactMethods(result.data.contactMethods);
        setFaqs(result.data.faqs);
        setOfficeInfo(result.data.officeInfo);
        setContactSubjects(result.data.contactSubjects);
      } else {
        toast.error('Failed to load contact data');
      }
    } catch (error) {
      toast.error('Failed to load contact data');
    } finally {
      setIsLoading(false);
    }
  };

  const sanitizeContactData = (data: any): any => {
    if (typeof data === 'string') {
      return sanitizeHtml(data);
    } else if (Array.isArray(data)) {
      return data.map(sanitizeContactData);
    } else if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeContactData(value);
      }
      return sanitized;
    }
    return data;
  };

  const saveContactData = async () => {
    setIsSaving(true);
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
      }
      
      // Sanitize data before sending
      const sanitizedData = {
        contactMethods: sanitizeContactData(contactMethods),
        faqs: sanitizeContactData(faqs),
        officeInfo: sanitizeContactData(officeInfo),
        contactSubjects: sanitizeContactData(contactSubjects)
      };
      
      const result = await api.request('/contact/admin', {
        method: 'POST',
        body: JSON.stringify(sanitizedData)
      });
      
      if (result.success) {
        toast.success('Contact information saved successfully!');
        
        // Dispatch event to refresh public pages
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('contact-content-updated', {
              detail: { timestamp: Date.now() }
            })
          );
          localStorage.setItem('contact-content-updated', Date.now().toString());
        }
      } else {
        toast.error(result.error || 'Failed to save contact information');
      }
    } catch (error) {
      toast.error('Failed to save contact information');
    } finally {
      setIsSaving(false);
    }
  };

  // Contact Methods Functions
  const updateContactMethod = (id: string, field: keyof ContactMethod, value: any) => {
    setContactMethods(prev => prev.map(method => 
      method.id === id ? { ...method, [field]: value } : method
    ));
  };

  const toggleContactMethod = (id: string) => {
    updateContactMethod(id, 'isActive', !contactMethods.find(m => m.id === id)?.isActive);
  };

  // FAQ Functions
  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    const newFaqItem: FAQ = {
      id: generateId(),
      question: sanitizeHtml(newFaq.question),
      answer: sanitizeHtml(newFaq.answer),
      isActive: true,
      order: faqs.length + 1
    };

    setFaqs(prev => [...prev, newFaqItem]);
    setNewFaq({ question: '', answer: '' });
    toast.success('FAQ added successfully!');
  };

  const updateFaq = (id: string, field: keyof FAQ, value: any) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const deleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id));
    toast.success('FAQ deleted successfully!');
  };

  const moveFaq = (id: string, direction: 'up' | 'down') => {
    setFaqs(prev => {
      const currentIndex = prev.findIndex(faq => faq.id === id);
      if (currentIndex === -1) return prev;

      const newFaqs = [...prev];
      if (direction === 'up' && currentIndex > 0) {
        [newFaqs[currentIndex], newFaqs[currentIndex - 1]] = [newFaqs[currentIndex - 1], newFaqs[currentIndex]];
      } else if (direction === 'down' && currentIndex < newFaqs.length - 1) {
        [newFaqs[currentIndex], newFaqs[currentIndex + 1]] = [newFaqs[currentIndex + 1], newFaqs[currentIndex]];
      }

      return newFaqs.map((faq, index) => ({ ...faq, order: index + 1 }));
    });
  };

  // Contact Subjects Functions
  const addSubject = () => {
    if (!newSubject.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const newSubjectItem: ContactSubject = {
      id: generateId(),
      name: sanitizeHtml(newSubject.name),
      isActive: true,
      order: contactSubjects.length + 1
    };

    setContactSubjects(prev => [...prev, newSubjectItem]);
    setNewSubject({ name: '' });
    toast.success('Subject added successfully!');
  };

  const updateSubject = (id: string, field: keyof ContactSubject, value: any) => {
    setContactSubjects(prev => prev.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const deleteSubject = (id: string) => {
    setContactSubjects(prev => prev.filter(subject => subject.id !== id));
    toast.success('Subject deleted successfully!');
  };

  const moveSubject = (id: string, direction: 'up' | 'down') => {
    setContactSubjects(prev => {
      const currentIndex = prev.findIndex(subject => subject.id === id);
      if (currentIndex === -1) return prev;

      const newSubjects = [...prev];
      if (direction === 'up' && currentIndex > 0) {
        [newSubjects[currentIndex], newSubjects[currentIndex - 1]] = [newSubjects[currentIndex - 1], newSubjects[currentIndex]];
      } else if (direction === 'down' && currentIndex < newSubjects.length - 1) {
        [newSubjects[currentIndex], newSubjects[currentIndex + 1]] = [newSubjects[currentIndex + 1], newSubjects[currentIndex]];
      }

      return newSubjects.map((subject, index) => ({ ...subject, order: index + 1 }));
    });
  };

  const tabs = [
    { id: 'contact-methods', label: 'Contact Methods', icon: 'ri-phone-line' },
    { id: 'faqs', label: 'FAQs', icon: 'ri-question-line' },
    { id: 'office-info', label: 'Office Information', icon: 'ri-map-pin-line' },
    { id: 'form-subjects', label: 'Form Subjects', icon: 'ri-file-list-line' }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Management</h1>
        <p className="text-gray-600">Manage all contact page elements and information</p>
      </div>

      {/* Save Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={saveContactData}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <i className="ri-save-line"></i>
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Contact Methods Tab */}
        {activeTab === 'contact-methods' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Contact Methods</h2>
              <p className="text-sm text-gray-600">Manage how users can contact you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactMethods.map((method) => (
                <div key={method.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className={`${method.icon} text-blue-600`}></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{method.title}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={method.isActive}
                          onChange={() => toggleContactMethod(method.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                      <input
                        type="text"
                        value={method.contact}
                        onChange={(e) => updateContactMethod(method.id, 'contact', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action URL</label>
                      <input
                        type="text"
                        value={method.action}
                        onChange={(e) => updateContactMethod(method.id, 'action', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-600">Manage FAQ content and order</p>
            </div>

            {/* Add New FAQ */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New FAQ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                  <textarea
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter answer..."
                  />
                </div>
              </div>
              <button
                onClick={addFaq}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add FAQ
              </button>
            </div>

            {/* Existing FAQs */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                        #{faq.order}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={faq.isActive}
                          onChange={() => updateFaq(faq.id, 'isActive', !faq.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveFaq(faq.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <i className="ri-arrow-up-line"></i>
                      </button>
                      <button
                        onClick={() => moveFaq(faq.id, 'down')}
                        disabled={index === faqs.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <i className="ri-arrow-down-line"></i>
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Office Information Tab */}
        {activeTab === 'office-info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Office Information</h2>
              <p className="text-sm text-gray-600">Manage office location and details</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Office Details</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officeInfo.isActive}
                    onChange={(e) => setOfficeInfo(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={officeInfo.address}
                    onChange={(e) => setOfficeInfo(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
                  <input
                    type="text"
                    value={officeInfo.hours}
                    onChange={(e) => setOfficeInfo(prev => ({ ...prev, hours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parking Information</label>
                  <input
                    type="text"
                    value={officeInfo.parking}
                    onChange={(e) => setOfficeInfo(prev => ({ ...prev, parking: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Subjects Tab */}
        {activeTab === 'form-subjects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Contact Form Subjects</h2>
              <p className="text-sm text-gray-600">Manage dropdown options for contact form</p>
            </div>

            {/* Add New Subject */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Subject</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name..."
                />
                <button
                  onClick={addSubject}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Subject
                </button>
              </div>
            </div>

            {/* Existing Subjects */}
            <div className="space-y-4">
              {contactSubjects.map((subject, index) => (
                <div key={subject.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                        #{subject.order}
                      </span>
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subject.isActive}
                          onChange={() => updateSubject(subject.id, 'isActive', !subject.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <button
                        onClick={() => moveSubject(subject.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <i className="ri-arrow-up-line"></i>
                      </button>
                      <button
                        onClick={() => moveSubject(subject.id, 'down')}
                        disabled={index === contactSubjects.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <i className="ri-arrow-down-line"></i>
                      </button>
                      <button
                        onClick={() => deleteSubject(subject.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 