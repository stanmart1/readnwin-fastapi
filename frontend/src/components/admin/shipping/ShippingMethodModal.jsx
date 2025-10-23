import { useState, useEffect } from 'react';

const ShippingMethodModal = ({ isOpen, onClose, onSubmit, editingMethod }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_cost: 0,
    cost_per_item: 0,
    free_shipping_threshold: null,
    estimated_days_min: 1,
    estimated_days_max: 7,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    if (editingMethod) {
      setFormData({
        name: editingMethod.name,
        description: editingMethod.description,
        base_cost: editingMethod.base_cost,
        cost_per_item: editingMethod.cost_per_item,
        free_shipping_threshold: editingMethod.free_shipping_threshold,
        estimated_days_min: editingMethod.estimated_days_min,
        estimated_days_max: editingMethod.estimated_days_max,
        is_active: editingMethod.is_active,
        sort_order: editingMethod.sort_order
      });
    } else {
      resetForm();
    }
  }, [editingMethod, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_cost: 0,
      cost_per_item: 0,
      free_shipping_threshold: null,
      estimated_days_min: 1,
      estimated_days_max: 7,
      is_active: true,
      sort_order: 0
    });
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Base Cost & Cost Per Item */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Cost (₦) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_cost}
                  onChange={(e) => updateFormData('base_cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Per Item (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_item}
                  onChange={(e) => updateFormData('cost_per_item', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Free Shipping Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Shipping Threshold (₦)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.free_shipping_threshold || ''}
                onChange={(e) => updateFormData('free_shipping_threshold', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for no free shipping"
              />
              <p className="text-xs text-gray-500 mt-1">
                Orders above this amount will have free shipping
              </p>
            </div>

            {/* Estimated Delivery Days */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Delivery Days *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimated_days_min}
                  onChange={(e) => updateFormData('estimated_days_min', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Delivery Days *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimated_days_max}
                  onChange={(e) => updateFormData('estimated_days_max', parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => updateFormData('sort_order', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateFormData('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Active (visible to customers)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingMethod ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingMethodModal;
