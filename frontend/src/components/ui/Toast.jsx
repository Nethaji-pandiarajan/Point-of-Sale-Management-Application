import React, { useState, useEffect, useRef } from 'react';
import './Toast.css';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useToast from '../../hooks/useToast';

const getToastIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="toast-status-icon text-success" size={20} />;
    case 'warning':
      return <AlertTriangle className="toast-status-icon text-warning" size={20} />;
    case 'error':
      return <XCircle className="toast-status-icon text-error" size={20} />;
    case 'info':
    default:
      return <Info className="toast-status-icon text-info" size={20} />;
  }
};

const ToastItem = ({ id, title, subtitle, type, duration = 3500, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const remainingRef = useRef(duration);
  const startTimeRef = useRef(Date.now());

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 180); // Duration of fade/slide out animation
  };

  const startTimer = () => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= (Date.now() - startTimeRef.current);
      if (remainingRef.current < 500) remainingRef.current = 1000;
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className={`toast-item toast-${type} ${isExiting ? 'toast-exiting' : ''}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      role="alert"
    >
      <div className="toast-accent-line" />
      <div className="toast-icon-wrapper">
        {getToastIcon(type)}
      </div>
      <div className="toast-content-wrapper">
        <h4 className="toast-title">{title}</h4>
        {subtitle && <p className="toast-subtitle">{subtitle}</p>}
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          subtitle={toast.subtitle}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
