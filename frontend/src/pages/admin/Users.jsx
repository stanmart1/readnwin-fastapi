import { useState, useEffect } from 'react';
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAssignBooksModal, setShowAssignBooksModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user'
  });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterRole !== 'all') params.append('role', filterRole);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setTotalUsers(data.pagination.total);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, filterStatus]);

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setNewUser({ email: '', username: '', password: '', first_name: '', last_name: '', role: 'user' });
        fetchUsers(currentPage);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        fetchUsers(currentPage);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();

      if (data.success) {
        fetchUsers(currentPage);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handlePasswordReset = async (userId, newPassword) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await response.json();

      if (data.success) {
        setShowPasswordModal(false);
        alert('Password reset successfully');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleAssignBooks = async (userId, bookIds) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/assign-books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: bookIds })
      });
      const data = await response.json();

      if (data.success) {
        setShowAssignBooksModal(false);
        alert('Books assigned successfully');
      }
    } catch (error) {
      console.error('Error assigning books:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  if (loading) {
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
          onCreateUser={() => setShowCreateModal(true)}
          selectedCount={selectedUsers.length}
        />

        {/* Desktop Table View */}
        <div className="hidden xl:block">
          <UserTable
            users={users}
            selectedUsers={selectedUsers}
            onSelectAll={handleSelectAll}
            onSelectUser={handleSelectUser}
            onView={(user) => {
              setSelectedUser(user);
              setShowViewModal(true);
            }}
            onEdit={(user) => console.log('Edit', user)}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteUser}
            onAnalytics={(userId) => {
              setSelectedUserId(userId);
              setShowAnalyticsModal(true);
            }}
            onAssignBooks={(user) => {
              setSelectedUser(user);
              setShowAssignBooksModal(true);
            }}
            onPasswordReset={(user) => {
              setSelectedUser(user);
              setShowPasswordModal(true);
            }}
          />
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden space-y-4">
          {users.map((user) => (
            <UserMobileCard
              key={user.id}
              user={user}
              onView={(user) => {
                setSelectedUser(user);
                setShowViewModal(true);
              }}
              onEdit={(user) => console.log('Edit', user)}
              onAnalytics={(userId) => {
                setSelectedUserId(userId);
                setShowAnalyticsModal(true);
              }}
              onAssignBooks={(user) => {
                setSelectedUser(user);
                setShowAssignBooksModal(true);
              }}
              onPasswordReset={(user) => {
                setSelectedUser(user);
                setShowPasswordModal(true);
              }}
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
            onPageChange={fetchUsers}
          />
        </div>

        {/* Modals */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          newUser={newUser}
          setNewUser={setNewUser}
          onSubmit={handleCreateUser}
        />

        <UserDetailModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          user={selectedUser}
        />

        <PasswordResetModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          user={selectedUser}
          onSubmit={handlePasswordReset}
        />

        <UserAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          userId={selectedUserId}
        />

        <AssignBooksModal
          isOpen={showAssignBooksModal}
          onClose={() => setShowAssignBooksModal(false)}
          user={selectedUser}
          onSubmit={handleAssignBooks}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
