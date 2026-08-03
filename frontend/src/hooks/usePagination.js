import { useState, useMemo, useCallback } from 'react';

export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const getPaginatedData = useCallback((items = []) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return items.slice(startIndex, endIndex);
  }, [page, limit]);

  const calculatePagination = useCallback((totalCount) => {
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, totalCount);

    return {
      totalPages,
      from,
      to
    };
  }, [page, limit]);

  return {
    page,
    setPage,
    limit,
    setLimit,
    resetPage,
    getPaginatedData,
    calculatePagination
  };
}

export default usePagination;
