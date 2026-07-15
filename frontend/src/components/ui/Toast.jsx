import React from 'react';
import './Toast.css';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useToast from '../../hooks/useToast';

const getToastIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="toast-icon text-success" size={20} />;
    case 'warning':
      return <AlertTriangle className="toast-icon text-warning" size={20} />;
    case 'error':
      return <XCircle className="toast-icon text-error" size={20} />;
    case 'info':
    default:
      return <Info className="toast-icon text-info" size={20} />;
  }
};

const ToastItem = ({ id, message, type, onClose }) => {
  return (
    <div className={`toast-item toast-${type}`} role="alert">
      <div className="toast-content-wrapper">
        {getToastIcon(type)}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close-btn" onClick={() => onClose(id)} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
