import React, { useId } from 'react';
import './Input.css';

const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  required = false,
  placeholder = ' ', // Default to single space for pure CSS floating label check
  ...props
}, ref) => {
  const inputId = useId();
  const hasError = !!error;
  
  const inputWrapperClass = `input-wrapper ${hasError ? 'input-wrapper-error' : ''} ${Icon ? 'input-has-icon' : ''} ${rightElement ? 'input-has-right-element' : ''}`;

  return (
    <div className={`input-field-container ${className}`}>
      <div className={inputWrapperClass}>
        {Icon && <Icon className="input-icon-left" size={18} />}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className="input-control"
          placeholder={placeholder}
          required={required}
          {...props}
        />
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label} {required && <span className="input-required-star">*</span>}
          </label>
        )}
        {rightElement && (
          <div className="input-right-element">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="input-error-msg">{error}</p>}
      {!error && helperText && <p className="input-helper-msg">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
