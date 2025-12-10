import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import styles from './Button.module.css'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  as = 'button',
  className = '',
  ...props
}, ref) => {
  const Component = as === 'button' ? motion.button : motion.a
  
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ')

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {loading && (
        <span className={styles.spinner}>
          <i className="ri-loader-4-line" />
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={styles.icon}>
          <i className={icon} />
        </span>
      )}
      
      <span className={styles.label}>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={styles.icon}>
          <i className={icon} />
        </span>
      )}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button
