import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { categoryIcons } from '../../utils/icons';
import Button from './Button';
import './IconPickerModal.css';

const IconPickerModal = ({ isOpen, onClose, initialIcon, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [tempSelectedIcon, setTempSelectedIcon] = useState(initialIcon || '');
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Sync initial selection
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIcon(initialIcon || '');
      setSearchQuery('');
      setSelectedGroup('All');
      // Autofocus search on open
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
  }, [isOpen, initialIcon]);

  // Handle Escape key listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Unique groups list
  const groups = ['All', 'Main Course', 'Fast Food', 'Drinks', 'Desserts', 'Bakery', 'General'];

  // Filtered icons lists
  const filteredIcons = useMemo(() => {
    return categoryIcons.filter((item) => {
      const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.key.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === 'All' || item.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [searchQuery, selectedGroup]);

  if (!isOpen) return null;

  const handleSelectConfirm = () => {
    if (tempSelectedIcon) {
      onSelect(tempSelectedIcon);
    }
    onClose();
  };

  const currentSelectedObj = categoryIcons.find(i => i.key === tempSelectedIcon || i.icon === tempSelectedIcon);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-container icon-picker-modal-container" 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose Category Icon"
      >
        <div className="modal-header">
          <h3 className="modal-title">Choose Category Icon</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close icon picker">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body icon-picker-modal-body">
          {/* Search Field */}
          <div className="picker-search-wrapper">
            <Search className="picker-search-icon" size={16} />
            <input
              type="text"
              className="picker-search-input"
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              ref={searchInputRef}
              aria-label="Search category icons"
            />
          </div>

          {/* Group Filter Tabs */}
          <div className="picker-group-tabs">
            {groups.map((group) => (
              <button
                key={group}
                type="button"
                className={`picker-group-tab ${selectedGroup === group ? 'active' : ''}`}
                onClick={() => setSelectedGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>

          {/* Icons Grid list */}
          <div className="picker-icons-grid-container">
            {filteredIcons.length === 0 ? (
              <div className="picker-empty-state">No matching food icons found.</div>
            ) : (
              <div className="picker-icons-grid">
                {filteredIcons.map((item) => {
                  const isSelected = tempSelectedIcon === item.key || tempSelectedIcon === item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`picker-icon-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTempSelectedIcon(item.key)}
                      aria-label={`Select icon ${item.label}`}
                      aria-selected={isSelected}
                    >
                      <span className="picker-card-emoji">{item.icon}</span>
                      <span className="picker-card-label">{item.label}</span>
                      {isSelected && (
                        <div className="picker-check-badge">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Footer state */}
        <div className="modal-footer picker-modal-footer">
          <div className="picker-footer-preview">
            {currentSelectedObj ? (
              <>
                <span className="preview-label-muted">Selected:</span>
                <span className="preview-emoji">{currentSelectedObj.icon}</span>
                <span className="preview-text">{currentSelectedObj.label}</span>
              </>
            ) : (
              <span className="preview-label-muted text-danger">No icon selected</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleSelectConfirm}
              disabled={!tempSelectedIcon}
            >
              Select Icon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconPickerModal;
