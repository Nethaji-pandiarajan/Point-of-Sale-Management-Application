import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X, Check } from 'lucide-react';
import { categoryIcons } from '../../utils/icons';
import Button from './Button';
import './IconPickerModal.css';

const IconPickerModal = ({ isOpen, onClose, initialIcon, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [tempSelectedIcon, setTempSelectedIcon] = useState(initialIcon || '');
  const [isClosing, setIsClosing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const searchInputRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsConfirming(false);
    }, 260);
  }, [onClose]);

  // Sync initial selection
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIcon(initialIcon || '');
      setSearchQuery('');
      setSelectedGroup('All');
      setIsClosing(false);
      setIsConfirming(false);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 60);
    }
  }, [isOpen, initialIcon]);

  // Handle Escape key listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Category navigation groups with icons
  const navGroups = [
    { name: 'All', icon: '🍽️' },
    { name: 'Main Course', icon: '🍛' },
    { name: 'Fast Food', icon: '🍔' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Bakery', icon: '🥐' },
    { name: 'General', icon: '✨' }
  ];

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
    if (!tempSelectedIcon || isConfirming) return;
    setIsConfirming(true);
    setTimeout(() => {
      onSelect(tempSelectedIcon);
      handleClose();
    }, 160);
  };

  const currentSelectedObj = categoryIcons.find(i => i.key === tempSelectedIcon || i.icon === tempSelectedIcon);

  return (
    <div className={`picker-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`picker-modal-container ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose Category Icon"
      >
        {/* Header */}
        <div className="picker-header">
          <div className="picker-header-text">
            <h3 className="picker-title">Choose Category Icon</h3>
            <p className="picker-subtitle">Pick an icon that represents your menu category</p>
          </div>
          <button className="picker-close-btn" onClick={handleClose} aria-label="Close icon picker">
            <X size={20} />
          </button>
        </div>

        {/* Split-Panel Main Content Area */}
        <div className="picker-split-body">
          
          {/* LEFT PANEL — VERTICAL CATEGORY NAV */}
          <div className="picker-nav-panel">
            {navGroups.map((g) => {
              const isActive = selectedGroup === g.name;
              return (
                <button
                  key={g.name}
                  type="button"
                  className={`picker-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(g.name)}
                >
                  {isActive && <div className="picker-nav-indicator" />}
                  <span className="picker-nav-icon">{g.icon}</span>
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* MIDDLE PANEL — ICON EXPLORER */}
          <div className="picker-explorer-panel">
            {/* Search Field */}
            <div className="picker-explorer-search">
              <Search className="picker-search-icon" size={18} />
              <input
                type="text"
                className="picker-search-input"
                placeholder="Search food icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                aria-label="Search food icons"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="picker-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <span className="picker-explorer-header">Choose an icon</span>

            {/* Scrollable Floating Icon Gallery */}
            <div className="picker-explorer-scroll">
              {filteredIcons.length === 0 ? (
                <div className="picker-empty-state">No matching food icons found for "{searchQuery}".</div>
              ) : (
                <div className="picker-floating-grid">
                  {filteredIcons.map((item) => {
                    const isSelected = tempSelectedIcon === item.key || tempSelectedIcon === item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`picker-floating-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setTempSelectedIcon(item.key)}
                        aria-label={`Select icon ${item.label}`}
                        aria-selected={isSelected}
                      >
                        {isSelected && (
                          <div className="picker-check-badge">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                        <span className="picker-floating-emoji">{item.icon}</span>
                        <span className="picker-floating-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT-SIDE PREVIEW PANEL */}
          <div className="picker-preview-panel">
            <span className="picker-preview-label">SELECTED ICON</span>

            <div className="picker-preview-circle">
              {currentSelectedObj ? (
                <span key={currentSelectedObj.key} className="picker-preview-emoji">
                  {currentSelectedObj.icon}
                </span>
              ) : (
                <span className="picker-preview-emoji" style={{ opacity: 0.4 }}>🍽️</span>
              )}
            </div>

            <h4 className="picker-preview-name">
              {currentSelectedObj ? currentSelectedObj.label : 'None'}
            </h4>

            <p className="picker-preview-note">
              This icon will represent your menu category across POS views.
            </p>
          </div>

        </div>

        {/* BOTTOM ACTION FOOTER */}
        <div className="picker-footer">
          <div className="picker-footer-selected">
            <span style={{ color: 'var(--color-text-secondary)' }}>Selected:</span>
            {currentSelectedObj ? (
              <>
                <span className="picker-footer-emoji">{currentSelectedObj.icon}</span>
                <span style={{ color: 'var(--color-primary, #B71C1C)', fontWeight: '800' }}>{currentSelectedObj.label}</span>
              </>
            ) : (
              <span className="text-secondary">None</span>
            )}
          </div>

          <div className="picker-footer-actions">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSelectConfirm}
              disabled={!tempSelectedIcon || isConfirming}
              className={`picker-use-btn ${isConfirming ? 'confirming' : ''}`}
            >
              {isConfirming ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} strokeWidth={3} /> Selected
                </span>
              ) : (
                'Use This Icon'
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IconPickerModal;
