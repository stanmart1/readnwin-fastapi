import { useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import UserFilters from '../../components/admin/UserFilters';
import UserTable from '../../components/admin/UserTable';
import UserMobileCard from '../../components/admin/UserMobileCard';
import CreateUserModal from '../../components/admin/CreateUserModal';
import UserDetailModal from '../../components/admin/UserDetailModal';
import PasswordResetModal from '../../components/admin/PasswordResetModal';
import UserAnalyticsModal from '../../components/admin/UserAnalyticsModal';
import AssignBooksModal from '../../components/admin/AssignBooksModal';
import Pagination from '../../components/admin/Pagination';
import { useUsers } from '../../hooks/useUsers';
import { useUserFilters } from '../../hooks/useUserFilters';
import { useUserSelection } from '../../hooks/useUserSelection';
import { useUserModals } from '../../hooks/useUserModals';
import { useState } from 'react';

const AdminUsers = () => {
  const {
    users,
    loading,
    currentPage,
    totalPages,
    totalUsers,
    fetchUsers,
    createUser,
    deleteUser,
    updateUserStatus,
    resetPassword,
    assignBooks
  } = useUsers();

  const {
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus
  } = useUserFilters((filters) => fetchUsers(1, filters));

  const { selectedUsers, selectAll, toggleUser } = useUserSelection();

  const {
    showCreateModal,
    showViewModal,
    showPasswordModal,
    showAnalyticsModal,
    showAssignBooksModal,
    selectedUser,
    selectedUserId,
    openCreateModal,
    closeCreateModal,
    openViewModal,
    closeViewModal,
    openPasswordModal,
    closePasswordModal,
    openAnalyticsModal,
    closeAnalyticsModal,
    openAssignBooksModal,
    closeAssignBooksModal
  } = useUserModals();

  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const result = await createUser(newUser);
    if (result.success) {
      closeCreateModal();
      setNewUser({ email: '', username: '', password: '', first_name: '', last_name: '', role: 'user' });
      fetchUsers(currentPage, { searchTerm, filterRole, filterStatus });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const result = await deleteUser(userId);
    if (result.success) {
      fetchUsers(currentPage, { searchTerm, filterRole, filterStatus });
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    const result = await updateUserStatus(userId, newStatus);
    if (result.success) {
      fetchUsers(currentPage, { searchTerm, filterRole, filterStatus });
    }
  };

  const handlePasswordReset = async (userId, newPassword) => {
    const result = await resetPassword(userId, newPassword);
    if (result.success) {
      closePasswordModal();
      alert('Password reset successfully');
    }
  };

  const handleAssignBooks = async (userId, bookIds) => {
    const result = await assignBooks(userId, bookIds);
    if (result.success) {
      closeAssignBooksModal();
      alert('Books assigned successfully');
    }
  };

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>

        {/* Filters */}
        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onCreateUser={openCreateModal}
          selectedCount={selectedUsers.length}
        />

        {/* Desktop Table View */}
        <div className="hidden xl:block">
          <UserTable
            users={users}
            selectedUsers={selectedUsers}
            onSelectAll={() => selectAll(users)}
            onSelectUser={toggleUser}
            onView={openViewModal}
            onEdit={(user) => console.log('Edit', user)}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteUser}
            onAnalytics={openAnalyticsModal}
            onAssignBooks={openAssignBooksModal}
            onPasswordReset={openPasswordModal}
          />
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden space-y-4">
          {users.map((user) => (
            <UserMobileCard
              key={user.id}
              user={user}
              onView={openViewModal}
              onEdit={(user) => console.log('Edit', user)}
              onAnalytics={openAnalyticsModal}
              onAssignBooks={openAssignBooksModal}
              onPasswordReset={openPasswordModal}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
            itemsPerPage={10}
            onPageChange={(page) => fetchUsers(page, { searchTerm, filterRole, filterStatus })}
          />
        </div>

        {/* Modals */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={closeCreateModal}
          newUser={newUser}
          setNewUser={setNewUser}
          onSubmit={handleCreateUser}
        />

        <UserDetailModal
          isOpen={showViewModal}
          onClose={closeViewModal}
          user={selectedUser}
        />

        <PasswordResetModal
          isOpen={showPasswordModal}
          onClose={closePasswordModal}
          user={selectedUser}
          onSubmit={handlePasswordReset}
        />

        <UserAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={closeAnalyticsModal}
          userId={selectedUserId}
        />

        <AssignBooksModal
          isOpen={showAssignBooksModal}
          onClose={closeAssignBooksModal}
          user={selectedUser}
          onSubmit={handleAssignBooks}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
