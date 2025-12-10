import styles from './Badge.module.css';

const VARIANTS = {
  default: 'default',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info'
};

const SIZES = {
  sm: 'sm',
  md: 'md',
  lg: 'lg'
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const classes = [
    styles.badge,
    styles[VARIANTS[variant] || 'default'],
    styles[SIZES[size] || 'md'],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
