import React from 'react';
import Button from './Button';
import { Filter, X } from 'lucide-react';
import './AdvancedFilter.css';

/**
 * AdvancedFilter Component
 * A reusable, responsive advanced filtering panel with smooth animations.
 * 
 * Props:
 * - isOpen (boolean): Toggles the open/close animation states.
 * - fields (array): Array of field configs e.g. [{ name, label, type, placeholder, options }]
 * - values (object): Current active state of each filter field.
 * - onFieldChange (function): Callback when a field changes, parameters: (fieldName, value)
 * - onApply (function): Triggered when clicking "Apply Filters" button.
 * - onReset (function): Triggered when clicking "Reset Filters" button.
 */
const AdvancedFilter = ({
  isOpen,
  fields = [],
  values = {},
  onFieldChange,
  onApply,
  onReset
}) => {
  return (
    <div className={`advanced-filter-panel ${isOpen ? 'open' : ''}`}>
      <div className="advanced-filter-grid">
        {fields.map((field) => {
          const { name, label, type, placeholder, options } = field;
          const currentValue = values[name] !== undefined ? values[name] : '';

          return (
            <div key={name} className="advanced-filter-field">
              <label htmlFor={`filter-${name}`}>{label}</label>
              {type === 'select' ? (
                <select
                  id={`filter-${name}`}
                  className="advanced-filter-input"
                  value={currentValue}
                  onChange={(e) => onFieldChange(name, e.target.value)}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`filter-${name}`}
                  type={type}
                  className="advanced-filter-input"
                  placeholder={placeholder || ''}
                  value={currentValue}
                  onChange={(e) => onFieldChange(name, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="advanced-filter-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          style={{ borderRadius: '10px' }}
        >
          Reset Filters
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={Filter}
          onClick={onApply}
          style={{ borderRadius: '10px' }}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default AdvancedFilter;
