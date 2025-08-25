'use client';

import { useState } from 'react';
import { FAQWithCategory, FAQCategory } from '@/types/faq';
import { 
  RiEditLine, 
  RiDeleteBinLine, 
  RiEyeLine, 
  RiEyeOffLine, 
  RiStarLine, 
  RiStarFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiQuestionLine
} from 'react-icons/ri';

interface FAQListProps {
  faqs: FAQWithCategory[];
  categories: FAQCategory[];
  selectedFAQs: number[];
  onSelectFAQ: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onEditFAQ: (faq: FAQWithCategory) => void;
  onDeleteFAQ: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
}

export default function FAQList({
  faqs,
  categories,
  selectedFAQs,
  onSelectFAQ,
  onSelectAll,
  onEditFAQ,
  onDeleteFAQ,
  onToggleStatus
}: FAQListProps) {
  const [expandedFAQs, setExpandedFAQs] = useState<number[]>([]);

  const toggleExpanded = (id: number) => {
    setExpandedFAQs(prev => 
      prev.includes(id) 
        ? prev.filter(faqId => faqId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFAQs.length === faqs.length) {
      onSelectAll([]);
    } else {
      onSelectAll(faqs.map(faq => faq.id));
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || 'ri-question-line';
  };

  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">
          <RiQuestionLine className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
          <p className="text-gray-600">Get started by creating your first FAQ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedFAQs.length === faqs.length && faqs.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedFAQs.includes(faq.id)}
                    onChange={() => onSelectFAQ(faq.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      {expandedFAQs.includes(faq.id) ? (
                        <RiArrowUpSLine className="h-4 w-4" />
                      ) : (
                        <RiArrowDownSLine className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {faq.question}
                      </div>
                      {expandedFAQs.includes(faq.id) && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${getCategoryColor(faq.category)}20`,
                        color: getCategoryColor(faq.category)
                      }}
                    >
                      <i className={`${getCategoryIcon(faq.category)} mr-1`}></i>
                      {faq.category}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      faq.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {faq.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {faq.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {faq.view_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(faq.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Featured Toggle */}
                    <button
                      onClick={() => {
                        // TODO: Implement featured toggle
                        console.log('Toggle featured for FAQ:', faq.id);
                      }}
                      className="text-yellow-600 hover:text-yellow-900"
                      title={faq.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      {faq.is_featured ? (
                        <RiStarFill className="h-4 w-4" />
                      ) : (
                        <RiStarLine className="h-4 w-4" />
                      )}
                    </button>

                    {/* Status Toggle */}
                    <button
                      onClick={() => onToggleStatus(faq.id, !faq.is_active)}
                      className="text-gray-600 hover:text-gray-900"
                      title={faq.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {faq.is_active ? (
                        <RiEyeLine className="h-4 w-4" />
                      ) : (
                        <RiEyeOffLine className="h-4 w-4" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditFAQ(faq)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit FAQ"
                    >
                      <RiEditLine className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteFAQ(faq.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete FAQ"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 