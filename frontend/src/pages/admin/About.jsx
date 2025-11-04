import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getFileUrl } from '../../lib/fileService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const defaultContent = {
  hero: { title: 'About ReadnWin', subtitle: 'Empowering The Mind Through Reading' },
  mission: { 
    title: 'Our Mission', 
    description: '<p>At ReadnWin, we believe that reading is the gateway to knowledge, imagination, and personal growth. Our mission is to make quality literature accessible to everyone, everywhere, breaking down barriers between readers and the books they love.</p><p>We combine cutting-edge technology with a passion for literature to create an immersive reading experience that adapts to your lifestyle. Whether you prefer physical books or digital formats, we\'re here to support your reading journey every step of the way.</p>', 
    features: [
      'Unlimited Access to Thousands of Titles',
      'AI-Powered Personalized Recommendations',
      'Vibrant Global Reading Community',
      'Seamless Cross-Platform Experience',
      'Support for Authors and Publishers'
    ]
  },
  stats: [
    { number: '50K+', label: 'Active Readers' },
    { number: '100K+', label: 'Books Available' },
    { number: '95%', label: 'Customer Satisfaction' },
    { number: '24/7', label: 'Customer Support' }
  ],
  values: [
    { icon: 'ri-book-open-line', title: 'Accessibility', description: 'We believe everyone deserves access to quality literature, regardless of location or economic status. Our platform breaks down barriers to make reading accessible to all.' },
    { icon: 'ri-lightbulb-line', title: 'Innovation', description: 'We leverage cutting-edge technology to enhance the reading experience, from AI recommendations to seamless digital delivery, while preserving the joy of traditional reading.' },
    { icon: 'ri-heart-line', title: 'Community', description: 'Reading is better together. We foster a vibrant community where readers can connect, share insights, and discover new perspectives through literature.' },
    { icon: 'ri-shield-check-line', title: 'Quality', description: 'We maintain the highest standards in content curation, user experience, and customer service, ensuring every interaction with ReadnWin exceeds expectations.' }
  ],
  team: [],
  cta: { title: 'Join the Reading Revolution', description: 'Start your journey with ReadnWin today and discover a world of endless stories.', primaryButton: 'Get Started Free', secondaryButton: 'Learn More' }
};

const iconOptions = ['ri-book-line', 'ri-brain-line', 'ri-heart-line', 'ri-shield-check-line', 'ri-group-line', 'ri-star-line'];

const AdminAbout = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/about/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Object.keys(response.data).length > 0) {
        setContent({ ...defaultContent, ...response.data });
      }
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/about/admin`, content, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLastSaved(new Date());
      setUnsavedChanges(false);
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const updateContent = useCallback((section, data) => {
    setContent(prev => ({ ...prev, [section]: data }));
    setUnsavedChanges(true);
  }, []);

  const sections = [
    { id: 'hero', label: 'Hero', icon: 'ri-home-line' },
    { id: 'mission', label: 'Mission', icon: 'ri-target-line' },
    { id: 'stats', label: 'Statistics', icon: 'ri-bar-chart-line' },
    { id: 'values', label: 'Values', icon: 'ri-heart-line' },
    { id: 'team', label: 'Team Members', icon: 'ri-team-line' },
    { id: 'cta', label: 'Call to Action', icon: 'ri-megaphone-line' }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">About Page Management</h1>
              <p className="text-gray-600 mt-1">Manage your About Us page content</p>
              {lastSaved && <p className="text-sm text-green-600 mt-2">Last saved: {lastSaved.toLocaleTimeString()}</p>}
              {unsavedChanges && <p className="text-sm text-amber-600 mt-1">Unsaved changes</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-4">Sections</h3>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                      activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className={section.icon}></i>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Hero Section */}
                  {activeSection === 'hero' && (
                    <>
                      <h2 className="text-2xl font-bold">Hero Section</h2>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={content.hero?.title || ''}
                          onChange={(e) => updateContent('hero', { ...content.hero, title: e.target.value })}
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subtitle</label>
                        <ReactQuill
                          theme="snow"
                          value={content.hero?.subtitle || ''}
                          onChange={(value) => updateContent('hero', { ...content.hero, subtitle: value })}
                          className="bg-white rounded-lg"
                          modules={{ toolbar: [['bold', 'italic', 'underline'], ['clean']] }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Hero Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const token = localStorage.getItem('token');
                                const response = await axios.post(`${API_BASE_URL}/api/about/upload-image`, formData, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                updateContent('hero', { ...content.hero, image_url: response.data.url });
                              } catch (error) {
                                console.error('Upload error:', error);
                                alert('Failed to upload image');
                              }
                            }
                          }}
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                        {content.hero?.image_url && (
                          <div className="mt-2">
                            <img src={getFileUrl(content.hero.image_url)} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Mission Section */}
                  {activeSection === 'mission' && (
                    <>
                      <h2 className="text-2xl font-bold">Mission</h2>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={content.mission?.title || ''}
                          onChange={(e) => updateContent('mission', { ...content.mission, title: e.target.value })}
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <ReactQuill
                          theme="snow"
                          value={content.mission?.description || ''}
                          onChange={(value) => updateContent('mission', { ...content.mission, description: value })}
                          className="bg-white rounded-lg"
                          modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['clean']] }}
                          style={{ height: '150px', marginBottom: '50px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Mission Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const token = localStorage.getItem('token');
                                const response = await axios.post(`${API_BASE_URL}/api/about/upload-image`, formData, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                updateContent('mission', { ...content.mission, image_url: response.data.url });
                              } catch (error) {
                                console.error('Upload error:', error);
                                alert('Failed to upload image');
                              }
                            }
                          }}
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                        {content.mission?.image_url && (
                          <div className="mt-2">
                            <img src={getFileUrl(content.mission.image_url)} alt="Mission" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Features</label>
                        {(content.mission?.features || []).map((feature, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...content.mission.features];
                                newFeatures[idx] = e.target.value;
                                updateContent('mission', { ...content.mission, features: newFeatures });
                              }}
                              className="flex-1 px-3 py-2 border rounded-lg"
                            />
                            <button
                              onClick={() => {
                                const newFeatures = content.mission.features.filter((_, i) => i !== idx);
                                updateContent('mission', { ...content.mission, features: newFeatures });
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateContent('mission', { ...content.mission, features: [...content.mission.features, ''] })}
                          className="w-full px-3 py-2 border-2 border-dashed rounded-lg text-gray-500"
                        >
                          Add Feature
                        </button>
                      </div>
                    </>
                  )}

                  {/* Stats Section */}
                  {activeSection === 'stats' && (
                    <>
                      <h2 className="text-2xl font-bold">Statistics</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {(content.stats || []).map((stat, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                              <h3 className="font-medium">Stat {idx + 1}</h3>
                              <button
                                onClick={() => updateContent('stats', content.stats.filter((_, i) => i !== idx))}
                                className="text-red-600"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Number"
                              value={stat.number}
                              onChange={(e) => {
                                const newStats = [...content.stats];
                                newStats[idx] = { ...stat, number: e.target.value };
                                updateContent('stats', newStats);
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                            <input
                              type="text"
                              placeholder="Label"
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...content.stats];
                                newStats[idx] = { ...stat, label: e.target.value };
                                updateContent('stats', newStats);
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => updateContent('stats', [...content.stats, { number: '', label: '' }])}
                          className="border-2 border-dashed rounded-lg p-8 text-gray-500"
                        >
                          Add Stat
                        </button>
                      </div>
                    </>
                  )}

                  {/* Values Section */}
                  {activeSection === 'values' && (
                    <>
                      <h2 className="text-2xl font-bold">Company Values</h2>
                      <div className="grid grid-cols-2 gap-6">
                        {(content.values || []).map((value, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between">
                              <h3 className="font-medium">Value {idx + 1}</h3>
                              <button
                                onClick={() => updateContent('values', content.values.filter((_, i) => i !== idx))}
                                className="text-red-600"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                            <select
                              value={value.icon}
                              onChange={(e) => {
                                const newValues = [...content.values];
                                newValues[idx] = { ...value, icon: e.target.value };
                                updateContent('values', newValues);
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                            <input
                              type="text"
                              placeholder="Title"
                              value={value.title}
                              onChange={(e) => {
                                const newValues = [...content.values];
                                newValues[idx] = { ...value, title: e.target.value };
                                updateContent('values', newValues);
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                            <ReactQuill
                              theme="snow"
                              value={value.description}
                              onChange={(val) => {
                                const newValues = [...content.values];
                                newValues[idx] = { ...value, description: val };
                                updateContent('values', newValues);
                              }}
                              className="bg-white rounded-lg"
                              placeholder="Description"
                              modules={{ toolbar: [['bold', 'italic'], ['clean']] }}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => updateContent('values', [...content.values, { icon: 'ri-star-line', title: '', description: '' }])}
                          className="border-2 border-dashed rounded-lg p-8 text-gray-500"
                        >
                          Add Value
                        </button>
                      </div>
                    </>
                  )}

                  {/* Team Section */}
                  {activeSection === 'team' && (
                    <>
                      <h2 className="text-2xl font-bold">Team Members</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(content.team || []).map((member, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                              <h3 className="font-medium">Member {idx + 1}</h3>
                              <button
                                onClick={() => updateContent('team', content.team.filter((_, i) => i !== idx))}
                                className="text-red-600 hover:text-red-800"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    try {
                                      const token = localStorage.getItem('token');
                                      const response = await axios.post(`${API_BASE_URL}/api/about/upload-image`, formData, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      const newTeam = [...content.team];
                                      newTeam[idx] = { ...member, image: response.data.url };
                                      updateContent('team', newTeam);
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      alert('Failed to upload image');
                                    }
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              {member.image && (
                                <img src={getFileUrl(member.image)} alt={member.name} className="mt-2 w-full h-48 object-cover rounded-lg border border-gray-200" />
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Name"
                              value={member.name || ''}
                              onChange={(e) => {
                                const newTeam = [...content.team];
                                newTeam[idx] = { ...member, name: e.target.value };
                                updateContent('team', newTeam);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Role/Position"
                              value={member.role || ''}
                              onChange={(e) => {
                                const newTeam = [...content.team];
                                newTeam[idx] = { ...member, role: e.target.value };
                                updateContent('team', newTeam);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                              <ReactQuill
                                theme="snow"
                                value={member.bio || ''}
                                onChange={(val) => {
                                  const newTeam = [...content.team];
                                  newTeam[idx] = { ...member, bio: val };
                                  updateContent('team', newTeam);
                                }}
                                className="bg-white rounded-lg"
                                placeholder="Enter bio..."
                                modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['clean']] }}
                                style={{ height: '120px', marginBottom: '50px' }}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => updateContent('team', [...(content.team || []), { name: '', role: '', bio: '', image: '' }])}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <i className="ri-add-line text-2xl mb-2"></i>
                          <div>Add Team Member</div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* CTA Section */}
                  {activeSection === 'cta' && (
                    <>
                      <h2 className="text-2xl font-bold">Call to Action</h2>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={content.cta?.title || ''}
                          onChange={(e) => updateContent('cta', { ...content.cta, title: e.target.value })}
                          className="w-full px-4 py-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <ReactQuill
                          theme="snow"
                          value={content.cta?.description || ''}
                          onChange={(value) => updateContent('cta', { ...content.cta, description: value })}
                          className="bg-white rounded-lg"
                          modules={{ toolbar: [['bold', 'italic', 'underline'], ['clean']] }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Primary Button</label>
                          <input
                            type="text"
                            value={content.cta?.primaryButton || ''}
                            onChange={(e) => updateContent('cta', { ...content.cta, primaryButton: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Secondary Button</label>
                          <input
                            type="text"
                            value={content.cta?.secondaryButton || ''}
                            onChange={(e) => updateContent('cta', { ...content.cta, secondaryButton: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
