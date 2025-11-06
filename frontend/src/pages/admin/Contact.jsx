import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';
import { useContactManagement } from '../../hooks/useContactManagement';

const iconOptions = ['ri-mail-line', 'ri-phone-line', 'ri-message-3-line', 'ri-map-pin-line', 'ri-customer-service-line'];

const AdminContact = () => {
  const { contactMethods, setContactMethods, officeInfo, setOfficeInfo, contactSubjects, setContactSubjects, loading, saving, error, saveContent } = useContactManagement();
  const [activeTab, setActiveTab] = useState('methods');

  const handleSave = async () => {
    const result = await saveContent();
    alert(result.success ? 'Saved successfully!' : 'Failed to save');
  };

  const tabs = [
    { id: 'methods', label: 'Contact Methods', icon: 'ri-contacts-line' },
    { id: 'office', label: 'Office Info', icon: 'ri-building-line' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-contacts-line text-blue-600"></i>
                  Contact Page Management
                </h1>
                <p className="text-gray-600 mt-1">Manage contact methods and office information</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b px-6">
            <nav className="flex gap-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Contact Methods */}
                {activeTab === 'methods' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactMethods.map((method, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <h3 className="font-medium">Method {idx + 1}</h3>
                          <button
                            onClick={() => setContactMethods(contactMethods.filter((_, i) => i !== idx))}
                            className="text-red-600"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                        <select
                          value={method.icon || ''}
                          onChange={(e) => {
                            const updated = [...contactMethods];
                            updated[idx] = { ...method, icon: e.target.value };
                            setContactMethods(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="Title"
                          value={method.title || ''}
                          onChange={(e) => {
                            const updated = [...contactMethods];
                            updated[idx] = { ...method, title: e.target.value };
                            setContactMethods(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={method.description || ''}
                          onChange={(e) => {
                            const updated = [...contactMethods];
                            updated[idx] = { ...method, description: e.target.value };
                            setContactMethods(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Contact"
                          value={method.contact || ''}
                          onChange={(e) => {
                            const updated = [...contactMethods];
                            updated[idx] = { ...method, contact: e.target.value };
                            setContactMethods(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setContactMethods([...contactMethods, { icon: 'ri-mail-line', title: '', description: '', contact: '', action: '', isActive: true }])}
                      className="border-2 border-dashed rounded-lg p-8 text-gray-500"
                    >
                      Add Method
                    </button>
                  </div>
                )}

                {/* Office Info */}
                {activeTab === 'office' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={officeInfo.address || ''}
                        onChange={(e) => setOfficeInfo({ ...officeInfo, address: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Hours</label>
                      <input
                        type="text"
                        value={officeInfo.hours || ''}
                        onChange={(e) => setOfficeInfo({ ...officeInfo, hours: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Parking</label>
                      <input
                        type="text"
                        value={officeInfo.parking || ''}
                        onChange={(e) => setOfficeInfo({ ...officeInfo, parking: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>
                )}


              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContact;
