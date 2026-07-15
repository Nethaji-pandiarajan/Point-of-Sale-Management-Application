import React, { createContext, useState, useCallback, useRef } from 'react';

export const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((config) => {
    setDialogConfig({
      title: config.title || 'Are you sure?',
      message: config.message || 'Please confirm this action.',
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      variant: config.variant || 'primary' // 'primary' | 'danger'
    });

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
    }
    setDialogConfig(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    setDialogConfig(null);
  }, []);

  const value = React.useMemo(() => ({
    confirm,
    dialogConfig,
    handleConfirm,
    handleCancel
  }), [confirm, dialogConfig, handleConfirm, handleCancel]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
    </ConfirmContext.Provider>
  );
};
