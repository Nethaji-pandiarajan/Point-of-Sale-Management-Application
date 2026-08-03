import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const TableSearch = ({ value, onChange, placeholder = "Search records... (Ctrl+F)" }) => {
  const inputRef = useRef(null);

  // Global Ctrl + F keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="adt-search-wrapper">
      <Search className="adt-search-icon" size={16} />
      <input
        ref={inputRef}
        type="text"
        className="adt-search-input"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="adt-search-clear"
          onClick={() => onChange('')}
          title="Clear search"
        >
          <X size={14} />
        </button>
      ) : (
        <span className="adt-search-shortcut">Ctrl+F</span>
      )}
    </div>
  );
};

export default TableSearch;
