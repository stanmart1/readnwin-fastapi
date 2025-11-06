import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../lib/fileService';
import { useAdminWorks } from '../../hooks/useAdminWorks';
import api from '../../lib/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const WorksManagement = () => {
  const { works, loading, error: hookError, fetchWorks, uploadWork, updateWork, deleteWork } = useAdminWorks();
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alt_text: '',
    order_index: 0,
    is_active: true
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchWorks();
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('alt_text', formData.alt_text);
      formDataToSend.append('order_index', formData.order_index.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      const result = await uploadWork(formDataToSend);

      if (result.success) {
        setShowUploadForm(false);
        resetForm();
        fetchWorks();
        alert('Work image uploaded successfully!');
      } else {
        setError(result.error || 'Failed to upload work image');
      }
    } catch (error) {
      console.error('Error uploading work:', error);
      setError('Error uploading work image');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editingWork) return;

    try {
      setUploading(true);
      
      const formDataToSend = new FormData();
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('alt_text', formData.alt_text);
      formDataToSend.append('order_index', formData.order_index.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      const result = await updateWork(editingWork.id, formDataToSend);

      if (result.success) {
        setShowEditForm(false);
        setEditingWork(null);
        resetForm();
        fetchWorks();
        alert('Work image updated successfully!');
      } else {
        setError(result.error || 'Failed to update work image');
      }
    } catch (error) {
      console.error('Error updating work:', error);
      setError('Error updating work image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteWork(id);
      if (result.success) {
        fetchWorks();
        alert('Work deleted successfully!');
      } else {
        setError(result.error || 'Failed to delete work');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    setIsTogglingStatus(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('is_active', (!currentStatus).toString());

      const response = await api.patch(`/admin/works/${id}/toggle`, formDataToSend);
      
      if (response.data?.success) {
        fetchWorks();
        alert(`Work ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        setError(response.data?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to update status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleEditClick = (work) => {
    setEditingWork(work);
    setFormData({
      title: work.title,
      description: work.description,
      alt_text: work.alt_text,
      order_index: work.order_index,
      is_active: work.is_active
    });
    setPreviewUrl(getImageUrl(work.image_path));
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      alt_text: '',
      order_index: 0,
      is_active: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  if (loading && works.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 border-b-2 border-blue-600"></div>
              <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 text-center">
                Loading works...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-3 lg:py-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <i className="ri-error-warning-line text-red-400 text-lg sm:text-xl flex-shrink-0 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-gallery-line text-blue-600"></i>
                  Works Management
                </h1>
                <p className="text-gray-600 mt-1">Manage portfolio works and images</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowUploadForm(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <i className="ri-upload-line"></i>
                <span>Upload Work</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-image-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Works</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{works.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-check-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Active</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {works.filter(w => w.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-close-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Inactive</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {works.filter(w => !w.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-gallery-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Portfolio</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Works Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {works.map((work) => {
            // Strip HTML tags from description
            const stripHtml = (html) => {
              const tmp = document.createElement('DIV');
              tmp.innerHTML = html;
              return tmp.textContent || tmp.innerText || '';
            };
            const plainDescription = stripHtml(work.description || '');
            
            return (
            <div key={work.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              {/* Image - Fixed Height */}
              <div className="relative flex-shrink-0">
                <img
                  src={getImageUrl(work.image_path)}
                  alt={work.alt_text}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                    work.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {work.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {/* Content - Flexible with Fixed Elements */}
              <div className="p-4 flex flex-col flex-1">
                {/* Title - Fixed 2 Lines */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words h-14">
                  {work.title}
                </h3>
                
                {/* Description - Fixed 3 Lines */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 break-words h-16">
                  {plainDescription}
                </p>
                
                {/* Metadata - Fixed Height */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 gap-2 h-5">
                  <span className="truncate">Order: {work.order_index}</span>
                  <span className="truncate">ID: {work.id}</span>
                </div>

                {/* Buttons - Fixed at Bottom */}
                <div className="mt-auto grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleEditClick(work)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    title="Edit work"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => toggleActive(work.id, work.is_active)}
                    disabled={isTogglingStatus}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                      work.is_active
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    title={work.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {isTogglingStatus ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      <i className={work.is_active ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(work.id)}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Delete"
                  >
                    {isDeleting ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      <i className="ri-delete-bin-line"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {works.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900">No works found</h3>
            <p className="text-gray-500 mt-1">Upload your first work</p>
          </div>
        )}

        {/* Upload/Edit Modal */}
        {(showUploadForm || showEditForm) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-start xs:items-center justify-between mb-4 xs:mb-6">
                  <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 leading-tight break-words pr-2">
                    {showEditForm ? 'Edit Work' : 'Upload Work'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setShowEditForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                  >
                    <i className="ri-close-line text-lg xs:text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <form onSubmit={showEditForm ? handleEdit : handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={!showEditForm}
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      className="bg-white rounded-lg"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          [{ 'font': [] }],
                          [{ 'size': ['small', false, 'large', 'huge'] }],
                          ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                          [{ 'align': [] }],
                          ['link', 'image', 'video'],
                          [{ 'color': [] }, { 'background': [] }],
                          ['clean']
                        ]
                      }}
                      style={{ height: '200px', marginBottom: '50px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={formData.alt_text}
                      onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Order Index</label>
                      <input
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label className="ml-2 text-sm">Active</label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadForm(false);
                        setShowEditForm(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : (showEditForm ? 'Update' : 'Upload')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorksManagement;
