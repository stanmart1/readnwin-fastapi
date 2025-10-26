import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function FAQForm({ faq, categories, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    priority: 0,
    is_active: true,
    is_featured: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        priority: faq.priority,
        is_active: faq.is_active,
        is_featured: faq.is_featured
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: categories.length > 0 ? categories[0].name : '',
        priority: 0,
        is_active: true,
        is_featured: false
      });
    }
  }, [faq, categories]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.question.trim()) newErrors.question = 'Question is required';
    if (!formData.answer.trim()) newErrors.answer = 'Answer is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.priority < 0) newErrors.priority = 'Priority must be 0 or greater';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = faq ? { ...formData, id: faq.id } : formData;
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {faq ? 'Edit FAQ' : 'Create New FAQ'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
            <ReactQuill
              theme="snow"
              value={formData.question}
              onChange={(value) => handleChange('question', value)}
              className="bg-white rounded-lg"
              placeholder="Enter the question..."
              modules={{ toolbar: [['bold', 'italic'], ['clean']] }}
            />
            {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer *</label>
            <ReactQuill
              theme="snow"
              value={formData.answer}
              onChange={(value) => handleChange('answer', value)}
              className="bg-white rounded-lg"
              placeholder="Enter the answer..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
              style={{ height: '200px', marginBottom: '50px' }}
            />
            {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.priority ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
              <p className="mt-1 text-xs text-gray-500">Higher numbers appear first</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">Featured</label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <i className="ri-save-line mr-2"></i>
              {loading ? 'Saving...' : (faq ? 'Update FAQ' : 'Create FAQ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
