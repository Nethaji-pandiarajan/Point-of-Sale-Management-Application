import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from 'lucide-react';
import TableToolbar from './TableToolbar';
import FilterPanel from './FilterPanel';
import Pagination from './Pagination';
import useTableFilters from '../../hooks/useTableFilters';
import usePagination from '../../hooks/usePagination';
import useSorting from '../../hooks/useSorting';
import useExport from '../../hooks/useExport';
import './AdvancedDataTable.css';

const AdvancedDataTable = ({
  tableKey = 'default_table',
  columns = [],
  data = [],
  loading = false,
  filterConfigs = [],
  initialFilters = {},
  initialSortField = null,
  initialSortOrder = 'asc',
  searchFields = [],
  searchPlaceholder = 'Search records... (Ctrl+F)',
  primaryAction = null,
  onRefresh = null,
  isRefreshing = false,
  
  // Server-side Pagination & Filter overrides (Optional)
  serverSide = false,
  serverTotalItems = 0,
  serverPage = 1,
  serverLimit = 10,
  onServerPageChange = null,
  onServerLimitChange = null,
  onServerSearchChange = null,
  onServerFilterChange = null,

  // Action column header/label
  actionColumnHeader = 'Actions',
  
  // Custom Empty State title/desc
  emptyStateTitle = 'No Records Found',
  emptyStateDescription = 'Try adjusting your search criteria or resetting filters.',

  // Extra bulk actions slot
  bulkActionsSlot = null
}) => {
  // 1. Column Visibility with LocalStorage persistence
  const storageKey = `saliez_cols_${tableKey}`;
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse column visibility', e);
    }
    return columns.filter(c => c.visible !== false).map(c => c.key);
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (e) {
      console.error('Failed to save column visibility', e);
    }
  }, [storageKey, visibleColumns]);

  const handleToggleColumn = useCallback((colKey) => {
    setVisibleColumns(prev => {
      if (prev.includes(colKey)) {
        if (prev.length <= 1) return prev; // Prevent hiding all columns
        return prev.filter(k => k !== colKey);
      }
      return [...prev, colKey];
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    const defaultCols = columns.filter(c => c.visible !== false).map(c => c.key);
    setVisibleColumns(defaultCols);
  }, [columns]);

  // 2. Filters & Search Hook
  const {
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    filters,
    setFilters,
    handleFilterChange,
    handleResetFilters,
    activeFilterCount
  } = useTableFilters(initialFilters);

  // Filter Panel visibility toggle state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (serverSide && onServerSearchChange) {
        onServerSearchChange(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, serverSide, onServerSearchChange, setDebouncedSearch]);

  // 3. Sorting Hook
  const { sortField, sortOrder, handleSort, resetSorting, sortData } = useSorting(
    initialSortField,
    initialSortOrder
  );

  // 4. Pagination Hook (For Client-side)
  const { page, setPage, limit, setLimit, resetPage, getPaginatedData, calculatePagination } = usePagination(10);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    if (!serverSide) {
      resetPage();
    }
  }, [debouncedSearch, filters, resetPage, serverSide]);

  // 5. Filter & Multi-Field Search (Client-Side)
  const filteredData = useMemo(() => {
    if (serverSide) return data;

    return data.filter(item => {
      // a. Text & Multi-field Search
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        let matchesSearch = false;

        if (searchFields && searchFields.length > 0) {
          matchesSearch = searchFields.some(field => {
            const val = item[field];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(query);
          });
        } else {
          // Default multi-field search across all string/number properties
          matchesSearch = Object.values(item).some(val => {
            if (val === undefined || val === null) return false;
            if (typeof val === 'object') return false;
            return String(val).toLowerCase().includes(query);
          });
        }

        if (!matchesSearch) return false;
      }

      // b. Custom Structured Filters
      for (const key in filters) {
        const filterVal = filters[key];
        if (filterVal === undefined || filterVal === null || filterVal === '') continue;

        // Date Range Filters
        if (key.endsWith('MinDate') || key.endsWith('StartDate')) {
          const itemDate = new Date(item.createdAt || item.date || item.joinedDate);
          const filterDate = new Date(filterVal);
          filterDate.setHours(0, 0, 0, 0);
          if (itemDate < filterDate) return false;
          continue;
        }
        if (key.endsWith('MaxDate') || key.endsWith('EndDate')) {
          const itemDate = new Date(item.createdAt || item.date || item.joinedDate);
          const filterDate = new Date(filterVal);
          filterDate.setHours(23, 59, 59, 999);
          if (itemDate > filterDate) return false;
          continue;
        }

        // Numeric Range Filters
        if (key.endsWith('MinPrice') || key.endsWith('MinAmount')) {
          const val = parseFloat(item.price || item.totalAmount || item.total);
          if (isNaN(val) || val < parseFloat(filterVal)) return false;
          continue;
        }
        if (key.endsWith('MaxPrice') || key.endsWith('MaxAmount')) {
          const val = parseFloat(item.price || item.totalAmount || item.total);
          if (isNaN(val) || val > parseFloat(filterVal)) return false;
          continue;
        }

        // Exact / String Property Filters
        const itemVal = item[key];
        if (itemVal !== undefined && itemVal !== null) {
          if (String(itemVal).toLowerCase() !== String(filterVal).toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, debouncedSearch, filters, searchFields, serverSide]);

  // 6. Sorted Data
  const sortedData = useMemo(() => {
    if (serverSide) return filteredData;
    return sortData(filteredData, columns);
  }, [filteredData, sortData, columns, serverSide]);

  // 7. Paginated Data
  const displayData = useMemo(() => {
    if (serverSide) return data;
    return getPaginatedData(sortedData);
  }, [serverSide, data, sortedData, getPaginatedData]);

  const totalItemCount = serverSide ? serverTotalItems : sortedData.length;
  const activePage = serverSide ? serverPage : page;
  const activeLimit = serverSide ? serverLimit : limit;

  const handlePageChange = (newPage) => {
    if (serverSide && onServerPageChange) {
      onServerPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (serverSide && onServerLimitChange) {
      onServerLimitChange(newLimit);
    } else {
      setLimit(newLimit);
      setPage(1);
    }
  };

  // 8. Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  const isAllSelected = useMemo(() => {
    if (displayData.length === 0) return false;
    return displayData.every(item => selectedIds.includes(item.id));
  }, [displayData, selectedIds]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !displayData.some(d => d.id === id)));
    } else {
      const pageIds = displayData.map(d => d.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  }, [displayData, isAllSelected]);

  const handleSelectRow = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  // 9. Export Hook
  const { exportToCSV, exportToExcel } = useExport();

  const activeColumns = useMemo(() => {
    return columns.filter(c => c.key !== 'actions' && visibleColumns.includes(c.key));
  }, [columns, visibleColumns]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(sortedData, activeColumns, tableKey);
  }, [exportToCSV, sortedData, activeColumns, tableKey]);

  const handleExportExcel = useCallback(() => {
    exportToExcel(sortedData, activeColumns, tableKey);
  }, [exportToExcel, sortedData, activeColumns, tableKey]);

  // 10. Reset All Helper
  const handleResetAll = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    handleResetFilters();
    resetSorting();
    handleResetColumns();
    resetPage();
    setSelectedIds([]);
  }, [setSearch, setDebouncedSearch, handleResetFilters, resetSorting, handleResetColumns, resetPage]);

  // Actions Column check
  const actionColumn = columns.find(c => c.key === 'actions');

  return (
    <div className="adt-container">
      {/* Table Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        columns={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onRefresh={onRefresh}
        onResetAll={handleResetAll}
        isFilterOpen={isFilterOpen}
        onToggleFilterPanel={() => setIsFilterOpen(!isFilterOpen)}
        activeFilterCount={activeFilterCount}
        isRefreshing={isRefreshing}
        primaryAction={primaryAction}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Collapsible Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        filterConfigs={filterConfigs}
        filters={filters}
        onFilterChange={(k, v) => {
          handleFilterChange(k, v);
          if (serverSide && onServerFilterChange) {
            onServerFilterChange({ ...filters, [k]: v });
          }
        }}
        onResetFilters={() => {
          handleResetFilters();
          if (serverSide && onServerFilterChange) {
            onServerFilterChange({});
          }
        }}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="adt-bulk-bar">
          <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {bulkActionsSlot}
            <button
              type="button"
              className="adt-text-btn"
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table Scrollable Body Container */}
      <div className="adt-table-container">
        <table className="adt-table">
          <thead>
            <tr>
              {/* Checkbox Header */}
              <th className="adt-checkbox-cell">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={loading || displayData.length === 0}
                  title="Select All"
                />
              </th>

              {/* Dynamic Visible Columns */}
              {activeColumns.map(col => {
                const isSortable = col.sortable !== false && col.key !== 'actions';
                const isSorted = sortField === col.key;

                return (
                  <th
                    key={col.key}
                    className={isSortable ? 'adt-th-sortable' : ''}
                    onClick={() => isSortable && handleSort(col.key)}
                    style={{ width: col.width || 'auto' }}
                  >
                    <div className="adt-th-content">
                      <span>{col.title || col.header}</span>
                      {isSortable && (
                        <span className={`adt-sort-icon ${isSorted ? 'active' : ''}`}>
                          {isSorted ? (
                            sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Action Column Header */}
              {actionColumn && (
                <th className="adt-th-action" style={{ width: actionColumn.width || '100px' }}>
                  {actionColumn.title || actionColumn.header || actionColumnHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Loading State Skeleton Rows */}
            {loading ? (
              Array.from({ length: activeLimit > 5 ? 5 : activeLimit }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="adt-skeleton-row">
                  <td className="adt-checkbox-cell">
                    <div className="adt-skeleton-line" style={{ width: '16px' }} />
                  </td>
                  {activeColumns.map(col => (
                    <td key={`sk-${col.key}`}>
                      <div className="adt-skeleton-line" style={{ width: `${Math.floor(Math.random() * 40) + 50}%` }} />
                    </td>
                  ))}
                  {actionColumn && (
                    <td className="adt-td-action">
                      <div className="adt-skeleton-line" style={{ width: '40px', marginLeft: 'auto' }} />
                    </td>
                  )}
                </tr>
              ))
            ) : displayData.length === 0 ? (
              /* Empty State Row */
              <tr>
                <td colSpan={activeColumns.length + (actionColumn ? 2 : 1)}>
                  <div className="adt-empty-container">
                    <div className="adt-empty-icon">
                      <Inbox size={26} />
                    </div>
                    <h4 className="adt-empty-title">{emptyStateTitle}</h4>
                    <p className="adt-empty-desc">{emptyStateDescription}</p>
                    <button
                      type="button"
                      className="adt-btn adt-btn-secondary"
                      onClick={handleResetAll}
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              /* Data Rows */
              displayData.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr key={item.id || index} className={isSelected ? 'selected' : ''}>
                    <td className="adt-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(item.id)}
                      />
                    </td>

                    {activeColumns.map(col => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(item, index)
                          : col.accessor
                          ? col.accessor(item)
                          : item[col.key]}
                      </td>
                    ))}

                    {actionColumn && (
                      <td className="adt-td-action">
                        {actionColumn.render ? actionColumn.render(item, index) : null}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <Pagination
        page={activePage}
        limit={activeLimit}
        totalItems={totalItemCount}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
};

export default AdvancedDataTable;
