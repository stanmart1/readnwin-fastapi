import AdminLayout from '../../components/AdminLayout';
import ReportsSection from '../../components/admin/ReportsSection';

const AdminReports = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and download comprehensive reports</p>
        </div>
        <ReportsSection />
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
