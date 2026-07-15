import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const badgeClass = `badge badge-${variant} ${className}`;

  return (
    <span className={badgeClass} {...props}>
      {children}
    </span>
  );
};

export default Badge;
