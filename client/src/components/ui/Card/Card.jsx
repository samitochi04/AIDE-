import { motion } from 'framer-motion'
import styles from './Card.module.css'

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className = '',
  as = 'div',
  ...props
}) => {
  const Component = clickable ? motion.button : motion[as] || motion.div

  const classes = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    className,
  ].filter(Boolean).join(' ')

  const motionProps = hoverable || clickable ? {
    whileHover: { y: -4, boxShadow: 'var(--shadow-lg)' },
    transition: { duration: 0.2 }
  } : {}

  return (
    <Component className={classes} {...motionProps} {...props}>
      {children}
    </Component>
  )
}

// Sub-components
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`${styles.header} ${className}`} {...props}>
    {children}
  </div>
)

Card.Title = ({ children, className = '', as: Tag = 'h3', ...props }) => (
  <Tag className={`${styles.title} ${className}`} {...props}>
    {children}
  </Tag>
)

Card.Description = ({ children, className = '', ...props }) => (
  <p className={`${styles.description} ${className}`} {...props}>
    {children}
  </p>
)

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`${styles.body} ${className}`} {...props}>
    {children}
  </div>
)

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`${styles.footer} ${className}`} {...props}>
    {children}
  </div>
)

Card.Image = ({ src, alt, className = '', ...props }) => (
  <div className={`${styles.imageWrapper} ${className}`}>
    <img src={src} alt={alt} className={styles.image} {...props} />
  </div>
)

export default Card
