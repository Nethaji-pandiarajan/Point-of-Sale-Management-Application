import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

const ExportButton = ({ onExportCSV, onExportExcel, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <div className="adt-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`adt-btn adt-btn-secondary ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title="Export Current Filtered Data"
      >
        <Download size={15} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="adt-dropdown-menu adt-export-menu">
          <button
            type="button"
            className="adt-dropdown-item"
            onClick={() => {
              onExportCSV();
              setIsOpen(false);
            }}
          >
            <FileText size={15} className="adt-icon-csv" />
            <span>Export as CSV</span>
          </button>
          <button
            type="button"
            className="adt-dropdown-item"
            onClick={() => {
              onExportExcel();
              setIsOpen(false);
            }}
          >
            <FileSpreadsheet size={15} className="adt-icon-excel" />
            <span>Export as Excel (.xlsx)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
