import AdminLayout from '../../components/AdminLayout';
import ReviewManagement from '../../components/admin/ReviewManagement';

const AdminReviews = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Moderate user reviews and ratings</p>
        </div>
        <ReviewManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
