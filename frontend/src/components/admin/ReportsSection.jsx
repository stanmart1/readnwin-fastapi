import { useState, useEffect, useRef, useMemo } from 'react';
import { useReports } from '../../hooks/useReports';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsSection = () => {
  const { reportsData, loading, fetchReportsData, generateReport, downloadReport } = useReports();
  const [generatingReport, setGeneratingReport] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchReportsData();
      hasFetched.current = true;
    }
  }, []);

  const safeData = useMemo(() => ({
    engagementData: reportsData?.engagement || [],
    popularBooks: reportsData?.popularBooks || [],
    reviewAnalytics: reportsData?.reviewAnalytics || reportsData?.reviews || [],
    reports: reportsData?.reports || []
  }), [reportsData]);

  const handleGenerateReport = async (reportType) => {
    setGeneratingReport(reportType);
    const result = await generateReport(reportType);
    if (result.success) {
      alert('Report generated successfully!');
      fetchReportsData();
    } else {
      alert('Failed to generate report');
    }
    setGeneratingReport(null);
  };

  const handleDownloadReport = async (reportType) => {
    const result = await downloadReport(reportType);
    if (result.success) {
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to download report');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading && !reportsData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        {safeData.reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeData.reports.map((report, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    report.status === 'ready' ? 'bg-green-100 text-green-800' :
                    report.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {generatingReport === report.type ? 'generating' : report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Last generated: {report.lastGenerated}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGenerateReport(report.type)}
                      disabled={generatingReport === report.type}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {generatingReport === report.type ? 'Generating...' : 'Generate'}
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.type)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No reports available</div>
        )}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Engagement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          {safeData.engagementData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeData.engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Users" />
                  <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} name="Sessions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Review Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Distribution</h3>
          {safeData.reviewAnalytics.length > 0 ? (
            <div className="space-y-3">
              {safeData.reviewAnalytics.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm text-gray-600">{item.rating}</span>
                    <i className="ri-star-fill text-yellow-400 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Popular Books */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Books Tracking</h3>
        {safeData.popularBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {safeData.popularBooks.map((book, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{book.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(book.views)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <span>{book.rating}</span>
                        <i className="ri-star-fill text-yellow-400 text-sm"></i>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{book.reviews}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <i className={`ri-arrow-${book.trend >= 0 ? 'up' : 'down'}-line text-${book.trend >= 0 ? 'green' : 'red'}-600`}></i>
                        <span className={`text-${book.trend >= 0 ? 'green' : 'red'}-600`}>
                          {book.trend >= 0 ? '+' : ''}{book.trend}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );
};

export default ReportsSection;
