import { forwardRef, useState } from 'react'
import styles from './Input.module.css'

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
    error && styles.hasError,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ')

  const inputClasses = [
    styles.input,
    icon && iconPosition === 'left' && styles.hasLeftIcon,
    (icon && iconPosition === 'right') || isPassword ? styles.hasRightIcon : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {icon && iconPosition === 'left' && (
          <span className={`${styles.icon} ${styles.leftIcon}`}>
            <i className={icon} />
          </span>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {icon && iconPosition === 'right' && !isPassword && (
          <span className={`${styles.icon} ${styles.rightIcon}`}>
            <i className={icon} />
          </span>
        )}
        
        {isPassword && (
          <button
            type="button"
            className={`${styles.icon} ${styles.rightIcon} ${styles.togglePassword}`}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
          </button>
        )}
      </div>
      
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
