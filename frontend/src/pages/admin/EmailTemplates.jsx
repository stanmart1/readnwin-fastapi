import AdminLayout from '../../components/AdminLayout';
import EmailTemplateManagement from '../../components/admin/EmailTemplateManagement';

const AdminEmailTemplates = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Manage email templates and notifications</p>
        </div>
        <EmailTemplateManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
