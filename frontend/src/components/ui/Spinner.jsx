import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', variant = 'primary', className = '' }) => {
  const spinnerClass = `spinner spinner-${size} spinner-${variant} ${className}`;
  return <div className={spinnerClass} role="status"><span className="sr-only">Loading...</span></div>;
};

export default Spinner;
