import React, { useState, useRef, useEffect } from 'react';
import { Columns3, Check } from 'lucide-react';

const ColumnSelector = ({ columns = [], visibleColumns = [], onToggleColumn, onResetColumns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleableCols = columns.filter(c => c.key !== 'actions' && c.hideable !== false);

  return (
    <div className="adt-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`adt-btn adt-btn-secondary ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Column Visibility"
      >
        <Columns3 size={15} />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="adt-dropdown-menu adt-column-menu">
          <div className="adt-column-header">
            <span className="adt-column-title">Toggle Columns</span>
            {onResetColumns && (
              <button
                type="button"
                className="adt-text-btn"
                onClick={onResetColumns}
              >
                Reset Default
              </button>
            )}
          </div>
          <div className="adt-column-list">
            {toggleableCols.map((col) => {
              const isVisible = visibleColumns.includes(col.key);
              return (
                <label key={col.key} className="adt-column-item">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleColumn(col.key)}
                  />
                  <span className="adt-checkbox-custom">
                    {isVisible && <Check size={12} />}
                  </span>
                  <span className="adt-column-label">{col.title || col.header || col.key}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
