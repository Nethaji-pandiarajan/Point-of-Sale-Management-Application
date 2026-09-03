import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((msg, type = 'success', duration = 3500, subtitle = '') => {
    const id = Math.random().toString(36).substring(2, 9);

    let titleText = '';
    let subText = subtitle;
    let toastType = type;

    if (typeof msg === 'object' && msg !== null) {
      titleText = msg.title || msg.message || '';
      subText = msg.subtitle || msg.description || subtitle;
      toastType = msg.type || type;
    } else if (typeof msg === 'string') {
      const parts = msg.split('\n');
      titleText = parts[0];
      if (parts.length > 1) {
        subText = parts.slice(1).join(' ');
      }
    }

    setToasts((prev) => [
      ...prev,
      {
        id,
        title: titleText,
        subtitle: subText,
        type: toastType,
        duration: duration || 3500,
        createdAt: Date.now()
      }
    ]);
  }, []);

  const value = React.useMemo(() => ({
    addToast,
    removeToast,
    toasts
  }), [addToast, removeToast, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
