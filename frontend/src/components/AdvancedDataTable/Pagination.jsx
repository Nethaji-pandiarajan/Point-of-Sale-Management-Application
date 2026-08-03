import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  page = 1,
  limit = 10,
  totalItems = 0,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50, 100]
}) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const from = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  // Generate smart page numbers list
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="adt-pagination">
      <div className="adt-pagination-info">
        <span>Showing <strong>{from}</strong>-<strong>{to}</strong> of <strong>{totalItems}</strong> records</span>
      </div>

      <div className="adt-pagination-controls">
        <div className="adt-page-size-selector">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="adt-page-buttons">
          <button
            type="button"
            className="adt-page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return <span key={`ellipsis-${idx}`} className="adt-page-ellipsis">...</span>;
            }
            return (
              <button
                key={`page-${p}`}
                type="button"
                className={`adt-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            className="adt-page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
