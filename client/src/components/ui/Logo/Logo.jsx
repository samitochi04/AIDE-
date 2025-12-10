import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './Logo.module.css'

const Logo = ({ 
  size = 'md', 
  showText = true,
  linkTo = '/',
  className = '',
  ...props 
}) => {
  const classes = [
    styles.logo,
    styles[size],
    className,
  ].filter(Boolean).join(' ')

  const content = (
    <>
      <motion.span 
        className={styles.text}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <span className={styles.aide}>AIDE</span>
        <span className={styles.plus}>+</span>
      </motion.span>
      {showText && size !== 'sm' && (
        <span className={styles.tagline}>Votre assistant administratif</span>
      )}
    </>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <div className={classes} {...props}>
      {content}
    </div>
  )
}

export default Logo
