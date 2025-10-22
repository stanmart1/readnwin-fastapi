import AdminLayout from '../../components/AdminLayout';

const AdminWorks = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Works Management</h1>
          <p className="text-gray-600 mt-1">Manage works and portfolios</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Works management coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWorks;
