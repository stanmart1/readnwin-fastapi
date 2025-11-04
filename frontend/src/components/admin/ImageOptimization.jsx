import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

export default function ImageOptimization() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/optimization-status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to load optimization status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOptimization = async () => {
    try {
      setOptimizing(true);
      await api.post('/admin/optimize-images');
      alert('Image optimization started in background. This may take a few minutes.');
      // Reload status after a delay
      setTimeout(loadStatus, 2000);
    } catch (error) {
      console.error('Failed to start optimization:', error);
      alert('Failed to start image optimization');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Image Optimization</h2>
        <p className="text-gray-600 mb-6">
          Compress images to reduce file sizes without changing format or losing quality.
        </p>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Cover Images Stats */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">Book Cover Images</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Images:</span>
                  <span className="font-medium">{status.stats.covers.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Optimized:</span>
                  <span className="font-medium">{status.stats.covers.webp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Unoptimized:</span>
                  <span className="font-medium">{status.stats.covers.other}</span>
                </div>
              </div>
            </div>

            {/* General Images Stats */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">General Images</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Images:</span>
                  <span className="font-medium">{status.stats.images.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Optimized:</span>
                  <span className="font-medium">{status.stats.images.webp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Unoptimized:</span>
                  <span className="font-medium">{status.stats.images.other}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Status */}
        {status && (
          <div className="mb-6">
            {status.optimization_needed ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="ri-alert-line text-yellow-600 mr-2"></i>
                  <span className="text-yellow-800">
                    {status.stats.covers.other + status.stats.images.other} images need optimization
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span className="text-green-800">All images are optimized!</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={startOptimization}
            disabled={optimizing || !status?.optimization_needed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {optimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Optimizing...
              </>
            ) : (
              <>
                <i className="ri-image-line"></i>
                Optimize All Images
              </>
            )}
          </button>

          <button
            onClick={loadStatus}
            disabled={loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i>
            Refresh Status
          </button>
        </div>

        {/* Information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">What happens during optimization?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Images are compressed without changing format (JPEG stays JPEG, PNG stays PNG)</li>
            <li>• Quality is set to 85% for JPEG/WebP (minimal visual loss)</li>
            <li>• PNG images use maximum compression level</li>
            <li>• Original files are replaced with optimized versions</li>
            <li>• Process runs in background to avoid timeouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}