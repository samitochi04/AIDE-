import { forwardRef } from 'react'
import styles from './Select.module.css'

const Select = forwardRef(({
  label,
  options = [],
  error,
  hint,
  icon,
  fullWidth = false,
  required = false,
  disabled = false,
  placeholder = 'Select an option...',
  className = '',
  ...props
}, ref) => {
  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
    error && styles.hasError,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ')

  const selectClasses = [
    styles.select,
    icon && styles.hasIcon,
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.selectWrapper}>
        {icon && (
          <span className={styles.icon}>
            <i className={icon} />
          </span>
        )}
        
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option
              key={option.value ?? `option-${index}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <span className={styles.chevron}>
          <i className="ri-arrow-down-s-line" />
        </span>
      </div>
      
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
