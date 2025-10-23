import { useState } from 'react';
import api from '../lib/api';

export const useReports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/reports/data');
      setReportsData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/admin/reports/generate', { type: reportType });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType) => {
    try {
      const response = await api.get(`/admin/reports/download/${reportType}`, {
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error downloading report:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    reportsData,
    loading,
    error,
    fetchReportsData,
    generateReport,
    downloadReport
  };
};
