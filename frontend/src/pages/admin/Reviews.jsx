import AdminLayout from '../../components/AdminLayout';

const AdminReviews = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Moderate user reviews and ratings</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="ri-star-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Review management coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
