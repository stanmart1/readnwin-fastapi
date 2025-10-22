import { useState } from 'react';

export const useUserSelection = () => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const selectAll = (users) => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return {
    selectedUsers,
    selectAll,
    toggleUser,
    clearSelection
  };
};
