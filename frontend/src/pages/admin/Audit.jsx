import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';
import { useAuditLogs } from '../../hooks/useAuditLogs';

const Audit = () => {
  const { auditLogs, loading, error, totalLogs, fetchAuditLogs, exportAuditLogs } = useAuditLogs();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadAuditLogs = async (page = 1) => {
    const result = await fetchAuditLogs(page, filters);
    if (result.success) {
      setCurrentPage(page);
      setTotalPages(Math.ceil(result.data.total / 20));
    }
  };

  useEffect(() => {
    loadAuditLogs(1);
  }, []);

  const getActionColor = (action) => {
    if (action.includes('create')) return 'bg-gradient-to-r from-green-500 to-teal-500';
    if (action.includes('update')) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (action.includes('delete')) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (action.includes('login')) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (action.includes('assign')) return 'bg-gradient-to-r from-indigo-500 to-purple-500';
    return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  };

  const getActionIcon = (action) => {
    if (action.includes('create')) return 'ri-add-circle-line';
    if (action.includes('update')) return 'ri-edit-line';
    if (action.includes('delete')) return 'ri-delete-bin-line';
    if (action.includes('login')) return 'ri-login-circle-line';
    if (action.includes('assign')) return 'ri-user-add-line';
    return 'ri-information-line';
  };

  const formatDetails = (details) => {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return 'ri-computer-line';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'ri-smartphone-line';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'ri-tablet-line';
    return 'ri-computer-line';
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    const ua = userAgent.toLowerCase();
    
    let device = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    
    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    let browser = 'Unknown Browser';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    
    return `${device} • ${os} • ${browser}`;
  };

  const getLocationInfo = (ipAddress) => {
    if (!ipAddress) return 'Unknown Location';
    // This is a placeholder - in production, you'd use a geolocation API
    return ipAddress;
  };

  const handleExport = async () => {
    const result = await exportAuditLogs(filters);
    if (!result.success) {
      alert('Failed to export audit logs');
      return;
    }

    const logs = result.data;
    const csvContent = [
      ['ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Timestamp', 'Details'],
      ...logs.map(log => [
        log.id,
        log.action,
        log.resource || 'N/A',
        log.resource_id || 'N/A',
        log.ip_address || 'N/A',
        formatDateTime(log.created_at),
        formatDetails(log.details)
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: ''
    });
  };

  const applyFilters = () => {
    loadAuditLogs(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Track all system activities and changes
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center"
              >
                <i className="ri-filter-line mr-2"></i>
                Filters
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center"
              >
                <i className="ri-download-line mr-2"></i>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => setFilters({...filters, action: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by action"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <input
                  type="text"
                  value={filters.resource}
                  onChange={(e) => setFilters({...filters, resource: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by resource"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Cards */}
        <div className="xl:hidden space-y-4">
          {!loading && auditLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <i className="ri-file-list-3-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Logs Found</h3>
              <p className="text-gray-600">
                {filters.userId || filters.action || filters.resource
                  ? 'Try adjusting your filters to see more results'
                  : 'Audit logs will appear here as actions are performed'}
              </p>
            </div>
          ) : (
            auditLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-12 h-12 ${getActionColor(log.action)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <i className={`${getActionIcon(log.action)} text-white text-xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-base">{log.action}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {log.user_name || 'System'} • {log.resource || 'System'}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <i className="ri-time-line"></i>
                        <span>{formatDateTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <i className={`${getDeviceIcon(log.user_agent)} text-gray-400`}></i>
                    <span className="text-gray-700">{getDeviceInfo(log.user_agent)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <i className="ri-map-pin-line text-gray-400"></i>
                    <span className="text-gray-700">{getLocationInfo(log.ip_address)}</span>
                  </div>
                  {log.page_visited && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-pages-line text-gray-400"></i>
                      <span className="text-gray-700 truncate">{log.page_visited}</span>
                    </div>
                  )}
                </div>

                {log.details && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <i className="ri-information-line"></i>
                      View Full Details
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden xl:block bg-white rounded-lg shadow-md overflow-hidden">
          {!loading && auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <i className="ri-file-list-3-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Logs Found</h3>
              <p className="text-gray-600">
                {filters.userId || filters.action || filters.resource
                  ? 'Try adjusting your filters to see more results'
                  : 'Audit logs will appear here as actions are performed'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Device & Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${getActionColor(log.action)} rounded-xl flex items-center justify-center mr-3 shadow-sm`}>
                          <i className={`${getActionIcon(log.action)} text-white text-lg`}></i>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{log.action}</div>
                          <div className="text-xs text-gray-500">{log.resource || 'System'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{log.user_name || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.user_email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <i className={`${getDeviceIcon(log.user_agent)} text-gray-400`}></i>
                        <span className="text-xs">{getDeviceInfo(log.user_agent)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <i className="ri-map-pin-line text-gray-400"></i>
                        <span>{getLocationInfo(log.ip_address)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate" title={log.page_visited}>
                        {log.page_visited || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{formatDateTime(log.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.details && (
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <i className="ri-information-line"></i>
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Pagination */}
        {auditLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, totalLogs)}</span> of{' '}
                <span className="font-medium">{totalLogs}</span> logs
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => loadAuditLogs(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadAuditLogs(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${getActionColor(selectedLog.action)} rounded-xl flex items-center justify-center shadow-md`}>
                      <i className={`${getActionIcon(selectedLog.action)} text-white text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                      <p className="text-sm text-gray-600">{selectedLog.action}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                <div className="space-y-6">
                  {/* User Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-user-line"></i>
                      User Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLog.user_name || 'System'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLog.user_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-file-list-line"></i>
                      Activity Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Resource</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLog.resource || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Resource ID</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLog.resource_id || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-600">Page Visited</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{selectedLog.page_visited || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Device & Location */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-device-line"></i>
                      Device & Location
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Device Information</p>
                        <div className="flex items-center gap-2 mt-1">
                          <i className={`${getDeviceIcon(selectedLog.user_agent)} text-gray-500`}></i>
                          <p className="text-sm font-medium text-gray-900">{getDeviceInfo(selectedLog.user_agent)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">IP Address / Location</p>
                        <div className="flex items-center gap-2 mt-1">
                          <i className="ri-map-pin-line text-gray-500"></i>
                          <p className="text-sm font-medium text-gray-900">{getLocationInfo(selectedLog.ip_address)}</p>
                        </div>
                      </div>
                      {selectedLog.user_agent && (
                        <div>
                          <p className="text-xs text-gray-600">User Agent</p>
                          <p className="text-xs text-gray-700 mt-1 break-all bg-white p-2 rounded">{selectedLog.user_agent}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-time-line"></i>
                      Timestamp
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedLog.created_at)}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <p className="text-xs text-gray-600">{new Date(selectedLog.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {selectedLog.details && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <i className="ri-information-line"></i>
                        Additional Details
                      </h4>
                      <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-3 rounded border border-gray-200">
                        {formatDetails(selectedLog.details)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Audit;
