import { useState, useMemo, useCallback } from 'react';

export function useTableFilters(initialFilters = {}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setFilters(initialFilters);
  }, [initialFilters]);

  // Count active non-empty filters (excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '') {
        count++;
      }
    });
    return count;
  }, [filters]);

  return {
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    filters,
    setFilters,
    handleFilterChange,
    handleResetFilters,
    activeFilterCount
  };
}

export default useTableFilters;
