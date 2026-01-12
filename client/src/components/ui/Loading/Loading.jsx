import { motion } from 'framer-motion'
import styles from './Loading.module.css'

// Spinner loading indicator
export const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const classes = [
    styles.spinner,
    styles[`spinner-${size}`],
    styles[`spinner-${color}`],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <i className="ri-loader-4-line" />
      </motion.div>
    </div>
  )
}

// Skeleton loading placeholder
export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  ...props
}) => {
  const classes = [
    styles.skeleton,
    styles[`skeleton-${variant}`],
    className,
  ].filter(Boolean).join(' ')

  return (
    <motion.div
      className={classes}
      style={{ width, height }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      {...props}
    />
  )
}

// Dots loading indicator
export const LoadingDots = ({ size = 'md', className = '' }) => {
  const classes = [
    styles.dots,
    styles[`dots-${size}`],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={styles.dot}
          animate={{ y: ['0%', '-50%', '0%'] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Full page loading
export const PageLoader = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={`${styles.pageLoader} ${className}`}>
      <motion.div
        className={styles.pageLoaderContent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Spinner size="lg" />
        <span className={styles.pageLoaderText}>{text}</span>
      </motion.div>
    </div>
  )
}

// Skeleton card
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`${styles.skeletonCard} ${className}`}>
      <Skeleton variant="rect" height={180} />
      <div className={styles.skeletonCardBody}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  )
}

// Default export as a namespace
const Loading = {
  Spinner,
  Skeleton,
  LoadingDots,
  PageLoader,
  SkeletonCard,
}

export default Loading
