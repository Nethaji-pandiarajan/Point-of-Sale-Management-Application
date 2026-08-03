import React from 'react';
import { Filter, RefreshCw, RotateCcw } from 'lucide-react';
import TableSearch from './TableSearch';
import ColumnSelector from './ColumnSelector';
import ExportButton from './ExportButton';

const TableToolbar = ({
  search,
  onSearchChange,
  columns = [],
  visibleColumns = [],
  onToggleColumn,
  onResetColumns,
  onExportCSV,
  onExportExcel,
  onRefresh,
  onResetAll,
  isFilterOpen,
  onToggleFilterPanel,
  activeFilterCount = 0,
  isRefreshing = false,
  primaryAction = null,
  searchPlaceholder
}) => {
  return (
    <div className="adt-toolbar">
      <div className="adt-toolbar-left">
        <TableSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <button
          type="button"
          className={`adt-btn adt-btn-secondary ${isFilterOpen ? 'active' : ''} ${activeFilterCount > 0 ? 'has-badge' : ''}`}
          onClick={onToggleFilterPanel}
          title="Toggle Filter Panel (ESC to close)"
        >
          <Filter size={15} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="adt-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="adt-toolbar-right">
        <ColumnSelector
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={onToggleColumn}
          onResetColumns={onResetColumns}
        />

        <ExportButton
          onExportCSV={onExportCSV}
          onExportExcel={onExportExcel}
        />

        {onRefresh && (
          <button
            type="button"
            className="adt-btn adt-btn-icon-secondary"
            onClick={onRefresh}
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
          </button>
        )}

        {onResetAll && (
          <button
            type="button"
            className="adt-btn adt-btn-icon-secondary"
            onClick={onResetAll}
            title="Reset All Filters, Search, Sorting & Columns"
          >
            <RotateCcw size={15} />
          </button>
        )}

        {primaryAction && (
          <div className="adt-primary-action">
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;
