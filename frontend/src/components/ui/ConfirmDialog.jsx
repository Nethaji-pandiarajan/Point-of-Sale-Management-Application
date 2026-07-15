import React, { useContext } from 'react';
import './ConfirmDialog.css';
import { ConfirmContext } from '../../context/ConfirmContext';
import Button from './Button';
import { HelpCircle } from 'lucide-react';

export const ConfirmDialog = () => {
  const context = useContext(ConfirmContext);

  if (!context || !context.dialogConfig) return null;

  const { dialogConfig, handleConfirm, handleCancel } = context;

  return (
    <div className="confirm-overlay" onClick={handleCancel}>
      <div
        className="confirm-container"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <div className="confirm-body-wrapper">
          <div className={`confirm-icon-container bg-${dialogConfig.variant}`}>
            <HelpCircle size={24} />
          </div>
          <div className="confirm-content">
            <h3 id="confirm-title" className="confirm-title">{dialogConfig.title}</h3>
            <p id="confirm-desc" className="confirm-desc">{dialogConfig.message}</p>
          </div>
        </div>
        <div className="confirm-footer">
          <Button variant="ghost" onClick={handleCancel}>
            {dialogConfig.cancelLabel}
          </Button>
          <Button variant={dialogConfig.variant} onClick={handleConfirm}>
            {dialogConfig.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
