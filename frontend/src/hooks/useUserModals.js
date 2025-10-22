import { useState } from 'react';

export const useUserModals = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAssignBooksModal, setShowAssignBooksModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
  };

  const openAnalyticsModal = (userId) => {
    setSelectedUserId(userId);
    setShowAnalyticsModal(true);
  };
  const closeAnalyticsModal = () => {
    setShowAnalyticsModal(false);
    setSelectedUserId(null);
  };

  const openAssignBooksModal = (user) => {
    setSelectedUser(user);
    setShowAssignBooksModal(true);
  };
  const closeAssignBooksModal = () => {
    setShowAssignBooksModal(false);
    setSelectedUser(null);
  };

  const openAssignRoleModal = (user) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };
  const closeAssignRoleModal = () => {
    setShowAssignRoleModal(false);
    setSelectedUser(null);
  };

  return {
    showCreateModal,
    showViewModal,
    showEditModal,
    showPasswordModal,
    showAnalyticsModal,
    showAssignBooksModal,
    showAssignRoleModal,
    selectedUser,
    selectedUserId,
    openCreateModal,
    closeCreateModal,
    openViewModal,
    closeViewModal,
    openEditModal,
    closeEditModal,
    openPasswordModal,
    closePasswordModal,
    openAnalyticsModal,
    closeAnalyticsModal,
    openAssignBooksModal,
    closeAssignBooksModal,
    openAssignRoleModal,
    closeAssignRoleModal
  };
};
