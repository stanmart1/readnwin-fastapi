import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';

const AdminBooks = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Books Management</h2>
          <button className="btn-primary flex items-center space-x-2">
            <i className="ri-book-add-line"></i>
            <span>Add Book</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Books management interface coming soon...</p>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminBooks;
