'use client';

import React, { useState, useEffect } from 'react';

interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  base_cost: number;
  cost_per_item: number;
  free_shipping_threshold: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
}

interface ShippingZone {
  id: number;
  name: string;
  description: string;
  countries: string[];
  states: string[];
  is_active: boolean;
}

interface ShippingMethodZone {
  id: number;
  shipping_method_id: number;
  shipping_zone_id: number;
  is_available: boolean;
  method_name: string;
  zone_name: string;
}

const EnhancedShippingManagement: React.FC = () => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [methodZones, setMethodZones] = useState<ShippingMethodZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  
  // Method form state
  const [methodForm, setMethodForm] = useState({
    name: '',
    description: '',
    base_cost: '',
    cost_per_item: '',
    free_shipping_threshold: '',
    estimated_days_min: '',
    estimated_days_max: '',
    is_active: true,
    sort_order: ''
  });
  
  // Zone form state
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: '',
    countries: ['NG'],
    states: [] as string[],
    is_active: true
  });

  const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  useEffect(() => {
    fetchShippingData();
  }, []);

  const fetchShippingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch shipping methods
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const methodsResponse = await fetch(`${apiUrl}/admin/shipping/methods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setShippingMethods(methodsData.methods || []);
      } else {
        const errorData = await methodsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch shipping methods');
      }
      
      // Fetch shipping zones
      const zonesResponse = await fetch(`${apiUrl}/admin/shipping/zones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (zonesResponse.ok) {
        const zonesData = await zonesResponse.json();
        setShippingZones(zonesData.zones || []);
      }
      
      // Skip method-zones for now
      setMethodZones([]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const url = editingMethod 
        ? `${apiUrl}/admin/shipping/methods/${editingMethod.id}`
        : `${apiUrl}/admin/shipping/methods`;
      
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: methodForm.name,
          description: methodForm.description,
          base_cost: parseFloat(methodForm.base_cost),
          cost_per_item: parseFloat(methodForm.cost_per_item),
          free_shipping_threshold: methodForm.free_shipping_threshold ? parseFloat(methodForm.free_shipping_threshold) : null,
          estimated_days_min: parseInt(methodForm.estimated_days_min) || 3,
          estimated_days_max: parseInt(methodForm.estimated_days_max) || 7,
          is_active: methodForm.is_active,
          sort_order: parseInt(methodForm.sort_order) || 0
        })
      });
      
      if (response.ok) {
        await fetchShippingData();
        resetMethodForm();
        setShowMethodForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipping method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const url = editingZone 
        ? `${apiUrl}/admin/shipping/zones/${editingZone.id}`
        : `${apiUrl}/admin/shipping/zones`;
      
      const method = editingZone ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: zoneForm.name,
          description: zoneForm.description,
          countries: zoneForm.countries,
          states: zoneForm.states,
          is_active: zoneForm.is_active
        })
      });
      
      if (response.ok) {
        await fetchShippingData();
        resetZoneForm();
        setShowZoneForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipping zone');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteMethod = async (methodId: number) => {
    if (!confirm('Are you sure you want to delete this shipping method?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/admin/shipping/methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchShippingData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shipping method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/admin/shipping/zones/${zoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchShippingData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shipping zone');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const editMethod = (method: ShippingMethod) => {
    setEditingMethod(method);
    setMethodForm({
      name: method.name,
      description: method.description,
      base_cost: method.base_cost.toString(),
      cost_per_item: method.cost_per_item.toString(),
      free_shipping_threshold: method.free_shipping_threshold?.toString() || '',
      estimated_days_min: method.estimated_days_min.toString(),
      estimated_days_max: method.estimated_days_max.toString(),
      is_active: method.is_active,
      sort_order: method.sort_order.toString()
    });
    setShowMethodForm(true);
  };

  const editZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      description: zone.description,
      countries: zone.countries,
      states: zone.states,
      is_active: zone.is_active
    });
    setShowZoneForm(true);
  };

  const resetMethodForm = () => {
    setMethodForm({
      name: '',
      description: '',
      base_cost: '',
      cost_per_item: '',
      free_shipping_threshold: '',
      estimated_days_min: '',
      estimated_days_max: '',
      is_active: true,
      sort_order: ''
    });
    setEditingMethod(null);
  };

  const resetZoneForm = () => {
    setZoneForm({
      name: '',
      description: '',
      countries: ['NG'],
      states: [] as string[],
      is_active: true
    });
    setEditingZone(null);
  };

  const toggleMethodZone = async (methodId: number, zoneId: number, currentStatus: boolean) => {
    try {
      // Skip method-zone toggle for now - not implemented
      return;
      const response = await fetch('/api/admin/shipping/method-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_method_id: methodId,
          shipping_zone_id: zoneId,
          is_available: !currentStatus
        })
      });
      
      if (response.ok) {
        await fetchShippingData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update method-zone association');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Management</h1>
        <p className="text-gray-600">Manage shipping methods, zones, and their associations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Shipping Methods Section */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Shipping Methods</h2>
          <button
            onClick={() => {
              resetMethodForm();
              setShowMethodForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Method
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingMethods.map((method) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {method.free_shipping_threshold 
                        ? formatCurrency(method.free_shipping_threshold)
                        : 'No threshold'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {method.estimated_days_min}-{method.estimated_days_max} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      method.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {method.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => editMethod(method)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Zones Section */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Shipping Zones</h2>
          <button
            onClick={() => {
              resetZoneForm();
              setShowZoneForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add Zone
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">States</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{zone.name}</div>
                      <div className="text-sm text-gray-500">{zone.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {zone.countries.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {zone.states.length > 0 ? zone.states.join(', ') : 'All states'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      zone.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => editZone(zone)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Method-Zone Associations */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Method-Zone Availability</h2>
          <p className="text-sm text-gray-600 mt-1">
            Toggle which shipping methods are available in which zones
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                {shippingZones.map((zone) => (
                  <th key={zone.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {zone.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingMethods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{method.name}</div>
                  </td>
                  {shippingZones.map((zone) => {
                    const methodZone = methodZones.find(mz => 
                      mz.shipping_method_id === method.id && mz.shipping_zone_id === zone.id
                    );
                    const isAvailable = methodZone?.is_available ?? true;
                    
                    return (
                      <td key={zone.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleMethodZone(method.id, zone.id, isAvailable)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isAvailable 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {isAvailable ? '✓' : '✗'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Method Form Modal */}
      {showMethodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </h3>
            
            <form onSubmit={handleMethodSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={methodForm.name}
                    onChange={(e) => setMethodForm({...methodForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={methodForm.description}
                    onChange={(e) => setMethodForm({...methodForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Cost (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={methodForm.base_cost}
                      onChange={(e) => setMethodForm({...methodForm, base_cost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Per Item (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={methodForm.cost_per_item}
                      onChange={(e) => setMethodForm({...methodForm, cost_per_item: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Free Shipping Threshold (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={methodForm.free_shipping_threshold}
                    onChange={(e) => setMethodForm({...methodForm, free_shipping_threshold: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for no threshold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Days
                    </label>
                    <input
                      type="number"
                      value={methodForm.estimated_days_min}
                      onChange={(e) => setMethodForm({...methodForm, estimated_days_min: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Days
                    </label>
                    <input
                      type="number"
                      value={methodForm.estimated_days_max}
                      onChange={(e) => setMethodForm({...methodForm, estimated_days_max: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={methodForm.sort_order}
                      onChange={(e) => setMethodForm({...methodForm, sort_order: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={methodForm.is_active}
                      onChange={(e) => setMethodForm({...methodForm, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMethodForm(false);
                    resetMethodForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Zone Form Modal */}
      {showZoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
            </h3>
            
            <form onSubmit={handleZoneSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={zoneForm.description}
                    onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Countries
                  </label>
                  <select
                    value={zoneForm.countries[0]}
                    onChange={(e) => setZoneForm({...zoneForm, countries: [e.target.value]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    States (leave empty for all states)
                  </label>
                  <select
                    multiple
                    value={zoneForm.states}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setZoneForm({...zoneForm, states: selectedOptions});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    size={6}
                  >
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Hold Ctrl/Cmd to select multiple states
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="zone_is_active"
                    checked={zoneForm.is_active}
                    onChange={(e) => setZoneForm({...zoneForm, is_active: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="zone_is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowZoneForm(false);
                    resetZoneForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingZone ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedShippingManagement;
