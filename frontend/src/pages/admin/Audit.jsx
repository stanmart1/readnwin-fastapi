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
    return new Date(dateString).toLocaleString();
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
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${getActionColor(log.action)} rounded-full flex items-center justify-center`}>
                    <i className={`${getActionIcon(log.action)} text-white text-lg`}></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{log.action}</div>
                    <div className="text-sm text-gray-500">{log.resource}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{formatDateTime(log.created_at)}</div>
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Resource ID:</span>
                  <span className="ml-2 text-gray-900">{log.resource_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">IP Address:</span>
                  <span className="ml-2 text-gray-900">{log.ip_address || 'N/A'}</span>
                </div>
                {log.details && (
                  <div>
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View Details
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${getActionColor(log.action)} rounded-full flex items-center justify-center mr-3`}>
                          <i className={`${getActionIcon(log.action)} text-white text-sm`}></i>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{log.resource || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{log.resource_id || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{log.ip_address || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-4">
                      {log.details && (
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Audit Log Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-gray-700">Action:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Resource:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.resource || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Resource ID:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.resource_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">IP Address:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.ip_address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Timestamp:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(selectedLog.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Details:</span>
                    <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                      {formatDetails(selectedLog.details)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
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
