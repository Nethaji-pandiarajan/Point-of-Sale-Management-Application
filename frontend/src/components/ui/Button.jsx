import React from 'react';
import './Button.css';
import Spinner from './Spinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) => {
  const btnClass = `btn btn-${variant} btn-${size} ${isLoading ? 'btn-loading' : ''} ${className}`;

  return (
    <button
      type={type}
      className={btnClass}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="xs" className="btn-spinner" />}
      {!isLoading && Icon && <Icon className="btn-icon" size={size === 'sm' ? 16 : 18} />}
      <span className="btn-content">{children}</span>
    </button>
  );
};

export default Button;
