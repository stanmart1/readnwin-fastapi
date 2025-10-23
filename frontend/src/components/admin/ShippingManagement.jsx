import { useState, useEffect, useRef } from 'react';
import { useShipping } from '../../hooks/useShipping';
import ShippingMethodModal from './shipping/ShippingMethodModal';
import ShippingZoneModal from './shipping/ShippingZoneModal';

const ShippingManagement = () => {
  const {
    shippingMethods,
    shippingZones,
    methodZones,
    loading,
    error,
    fetchShippingMethods,
    fetchShippingZones,
    fetchMethodZones,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    toggleMethodZone
  } = useShipping();

  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('methods'); // 'methods', 'zones', 'associations'
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      loadAllData();
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }, [error]);

  const loadAllData = async () => {
    await Promise.all([
      fetchShippingMethods(),
      fetchShippingZones(),
      fetchMethodZones()
    ]);
  };

  const handleMethodSubmit = async (formData) => {
    let result;
    
    if (editingMethod) {
      result = await updateShippingMethod(editingMethod.id, formData);
      if (result.success) {
        setSuccessMessage('Shipping method updated successfully');
      }
    } else {
      result = await createShippingMethod(formData);
      if (result.success) {
        setSuccessMessage('Shipping method created successfully');
      }
    }

    if (result.success) {
      setShowMethodModal(false);
      setEditingMethod(null);
      loadAllData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to save shipping method');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleZoneSubmit = async (formData) => {
    let result;
    
    if (editingZone) {
      result = await updateShippingZone(editingZone.id, formData);
      if (result.success) {
        setSuccessMessage('Shipping zone updated successfully');
      }
    } else {
      result = await createShippingZone(formData);
      if (result.success) {
        setSuccessMessage('Shipping zone created successfully');
      }
    }

    if (result.success) {
      setShowZoneModal(false);
      setEditingZone(null);
      loadAllData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to save shipping zone');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!confirm('Are you sure you want to delete this shipping method?')) return;

    const result = await deleteShippingMethod(id);
    
    if (result.success) {
      setSuccessMessage('Shipping method deleted successfully');
      loadAllData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to delete shipping method');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleDeleteZone = async (id) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;

    const result = await deleteShippingZone(id);
    
    if (result.success) {
      setSuccessMessage('Shipping zone deleted successfully');
      loadAllData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(result.error || 'Failed to delete shipping zone');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleToggleMethodZone = async (methodId, zoneId) => {
    const existing = methodZones.find(
      mz => mz.shipping_method_id === methodId && mz.shipping_zone_id === zoneId
    );
    
    const result = await toggleMethodZone(methodId, zoneId, !existing?.is_available);
    
    if (result.success) {
      loadAllData();
    } else {
      setErrorMessage(result.error || 'Failed to update method-zone association');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const isMethodAvailableInZone = (methodId, zoneId) => {
    const mz = methodZones.find(
      item => item.shipping_method_id === methodId && item.shipping_zone_id === zoneId
    );
    return mz?.is_available || false;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading && shippingMethods.length === 0) {
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex">
            <i className="ri-check-line text-green-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
        <p className="text-gray-600 mt-1">Manage shipping methods, zones, and their associations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('methods')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'methods'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-truck-line mr-2"></i>
            Shipping Methods
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'zones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-map-pin-line mr-2"></i>
            Shipping Zones
          </button>
          <button
            onClick={() => setActiveTab('associations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'associations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-links-line mr-2"></i>
            Method-Zone Associations
          </button>
        </nav>
      </div>

      {/* Shipping Methods Tab */}
      {activeTab === 'methods' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingMethod(null);
                setShowMethodModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Add Shipping Method
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shippingMethods.length > 0 ? (
                    shippingMethods.map((method) => (
                      <tr key={method.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Base: {formatCurrency(method.base_cost)}</div>
                            <div>Per Item: {formatCurrency(method.cost_per_item)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {method.free_shipping_threshold 
                            ? formatCurrency(method.free_shipping_threshold)
                            : 'No threshold'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {method.estimated_days_min}-{method.estimated_days_max} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            method.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingMethod(method);
                              setShowMethodModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteMethod(method.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <i className="ri-truck-line text-6xl text-gray-300 mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900">No shipping methods found</h3>
                        <p className="text-gray-500 mt-1">Add your first shipping method to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Zones Tab */}
      {activeTab === 'zones' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingZone(null);
                setShowZoneModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Add Shipping Zone
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shippingZones.length > 0 ? (
              shippingZones.map((zone) => (
                <div key={zone.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      zone.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">States ({zone.states?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.states?.slice(0, 5).map((state, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {state}
                        </span>
                      ))}
                      {zone.states?.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{zone.states.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setShowZoneModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <i className="ri-map-pin-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900">No shipping zones found</h3>
                <p className="text-gray-500 mt-1">Add your first shipping zone to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Method-Zone Associations Tab */}
      {activeTab === 'associations' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipping Method
                  </th>
                  {shippingZones.map((zone) => (
                    <th key={zone.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {zone.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippingMethods.length > 0 && shippingZones.length > 0 ? (
                  shippingMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{method.name}</div>
                      </td>
                      {shippingZones.map((zone) => (
                        <td key={zone.id} className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleMethodZone(method.id, zone.id)}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                              isMethodAvailableInZone(method.id, zone.id)
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={isMethodAvailableInZone(method.id, zone.id) ? 'Available' : 'Not Available'}
                          >
                            <i className={`ri-${isMethodAvailableInZone(method.id, zone.id) ? 'check' : 'close'}-line text-xl`}></i>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={shippingZones.length + 1} className="px-6 py-12 text-center">
                      <i className="ri-links-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                      <p className="text-gray-500 mt-1">Add shipping methods and zones first</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ShippingMethodModal
        isOpen={showMethodModal}
        onClose={() => {
          setShowMethodModal(false);
          setEditingMethod(null);
        }}
        onSubmit={handleMethodSubmit}
        editingMethod={editingMethod}
      />

      <ShippingZoneModal
        isOpen={showZoneModal}
        onClose={() => {
          setShowZoneModal(false);
          setEditingZone(null);
        }}
        onSubmit={handleZoneSubmit}
        editingZone={editingZone}
      />
    </div>
  );
};

export default ShippingManagement;
