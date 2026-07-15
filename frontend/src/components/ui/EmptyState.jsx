import React from 'react';
import './EmptyState.css';
import Button from './Button';

const EmptyState = ({
  title = 'No records found',
  description = 'Add some items or change your search filters to see data here.',
  icon: Icon,
  actionLabel,
  onActionClick,
  className = ''
}) => {
  return (
    <div className={`empty-state-container ${className}`}>
      <div className="empty-state-icon-wrapper">
        {Icon ? <Icon size={36} className="empty-state-icon" /> : '🍽️'}
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onActionClick && (
        <Button variant="primary" onClick={onActionClick} className="empty-state-btn">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
