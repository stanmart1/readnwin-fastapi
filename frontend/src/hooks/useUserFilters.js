import { useState, useEffect } from 'react';

export const useUserFilters = (onFilterChange) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ searchTerm, filterRole, filterStatus });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, filterStatus]);

  return {
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus
  };
};
