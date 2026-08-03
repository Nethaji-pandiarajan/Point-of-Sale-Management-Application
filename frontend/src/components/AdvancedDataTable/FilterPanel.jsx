import React, { useEffect } from 'react';
import { FilterX, Check } from 'lucide-react';

const FilterPanel = ({
  isOpen,
  filterConfigs = [],
  filters = {},
  onFilterChange,
  onResetFilters,
  onClose
}) => {
  // ESC listener to close filter panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="adt-filter-panel">
      <div className="adt-filter-header">
        <div className="adt-filter-title">
          <span>Advanced Filters</span>
        </div>
        <button
          type="button"
          className="adt-text-btn adt-reset-btn"
          onClick={onResetFilters}
        >
          <FilterX size={13} />
          <span>Reset All</span>
        </button>
      </div>

      <div className="adt-filter-grid">
        {filterConfigs.map((config) => {
          const value = filters[config.key] ?? '';

          if (config.type === 'select') {
            return (
              <div key={config.key} className="adt-filter-group">
                <label className="adt-filter-label">{config.label}</label>
                <select
                  className="adt-filter-select"
                  value={value}
                  onChange={(e) => onFilterChange(config.key, e.target.value)}
                >
                  <option value="">{config.placeholder || `All ${config.label}`}</option>
                  {config.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (config.type === 'dateRange') {
            const startVal = filters[config.startKey] ?? '';
            const endVal = filters[config.endKey] ?? '';
            return (
              <div key={config.key} className="adt-filter-group adt-span-2">
                <label className="adt-filter-label">{config.label}</label>
                <div className="adt-range-inputs">
                  <input
                    type="date"
                    className="adt-filter-input"
                    value={startVal}
                    onChange={(e) => onFilterChange(config.startKey, e.target.value)}
                  />
                  <span className="adt-range-separator">to</span>
                  <input
                    type="date"
                    className="adt-filter-input"
                    value={endVal}
                    onChange={(e) => onFilterChange(config.endKey, e.target.value)}
                  />
                </div>
              </div>
            );
          }

          if (config.type === 'range') {
            const minVal = filters[config.minKey] ?? '';
            const maxVal = filters[config.maxKey] ?? '';
            return (
              <div key={config.key} className="adt-filter-group adt-span-2">
                <label className="adt-filter-label">{config.label}</label>
                <div className="adt-range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    className="adt-filter-input"
                    value={minVal}
                    onChange={(e) => onFilterChange(config.minKey, e.target.value)}
                  />
                  <span className="adt-range-separator">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="adt-filter-input"
                    value={maxVal}
                    onChange={(e) => onFilterChange(config.maxKey, e.target.value)}
                  />
                </div>
              </div>
            );
          }

          // Default text/number input
          return (
            <div key={config.key} className="adt-filter-group">
              <label className="adt-filter-label">{config.label}</label>
              <input
                type={config.inputType || "text"}
                placeholder={config.placeholder || `Filter by ${config.label}`}
                className="adt-filter-input"
                value={value}
                onChange={(e) => onFilterChange(config.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPanel;
