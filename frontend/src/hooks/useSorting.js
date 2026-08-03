import { useState, useCallback } from 'react';

export function useSorting(initialField = null, initialOrder = 'asc') {
  const [sortField, setSortField] = useState(initialField);
  const [sortOrder, setSortOrder] = useState(initialOrder);

  const handleSort = useCallback((field) => {
    if (!field) return;
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  const resetSorting = useCallback(() => {
    setSortField(initialField);
    setSortOrder(initialOrder);
  }, [initialField, initialOrder]);

  const sortData = useCallback((items = [], columnDefs = []) => {
    if (!sortField) return items;

    const colDef = columnDefs.find(c => c.key === sortField || c.accessorKey === sortField);

    return [...items].sort((a, b) => {
      let valA = colDef && colDef.accessor ? colDef.accessor(a) : a[sortField];
      let valB = colDef && colDef.accessor ? colDef.accessor(b) : b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      // Date comparison check
      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA !== 'number') {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortField, sortOrder]);

  return {
    sortField,
    sortOrder,
    handleSort,
    resetSorting,
    sortData
  };
}

export default useSorting;
