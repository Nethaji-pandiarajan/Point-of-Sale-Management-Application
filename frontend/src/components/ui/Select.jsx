import React, { useId } from 'react';
import './Select.css';

const Select = React.forwardRef(({
  label,
  options = [],
  error,
  helperText,
  className = '',
  required = false,
  placeholder,
  value,
  ...props
}, ref) => {
  const selectId = useId();
  const hasError = !!error;
  // Dropdowns always display a selected option label (either default or placeholder), so the label should always stay floated to avoid overlapping.
  const hasValue = true;
  
  const selectWrapperClass = `select-wrapper ${hasError ? 'select-wrapper-error' : ''} ${hasValue ? 'select-has-value' : ''}`;

  return (
    <div className={`select-field-container ${className}`}>
      <div className={selectWrapperClass}>
        <select
          ref={ref}
          id={selectId}
          className="select-control"
          required={required}
          value={value}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {label && (
          <label htmlFor={selectId} className="select-label">
            {label} {required && <span className="select-required-star">*</span>}
          </label>
        )}
        <span className="select-arrow"></span>
      </div>
      {error && <p className="select-error-msg">{error}</p>}
      {!error && helperText && <p className="select-helper-msg">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
