import { useState } from 'react';

export const useUserModals = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAssignBooksModal, setShowAssignBooksModal] = useState(false);
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

  return {
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
  };
};
