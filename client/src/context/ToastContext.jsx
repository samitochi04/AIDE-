import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

// Toast types with their styles
const TOAST_TYPES = {
  success: {
    icon: 'ri-check-line',
    className: 'toast-success',
  },
  error: {
    icon: 'ri-error-warning-line',
    className: 'toast-error',
  },
  warning: {
    icon: 'ri-alert-line',
    className: 'toast-warning',
  },
  info: {
    icon: 'ri-information-line',
    className: 'toast-info',
  },
}

const DEFAULT_DURATION = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random()
    const type = options.type || 'info'
    const duration = options.duration ?? DEFAULT_DURATION

    const toast = {
      id,
      message,
      type,
      ...TOAST_TYPES[type],
      ...options,
    }

    setToasts((prev) => [...prev, toast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const success = useCallback((message, options = {}) => 
    addToast(message, { ...options, type: 'success' }), [addToast])
  
  const error = useCallback((message, options = {}) => 
    addToast(message, { ...options, type: 'error' }), [addToast])
  
  const warning = useCallback((message, options = {}) => 
    addToast(message, { ...options, type: 'warning' }), [addToast])
  
  const info = useCallback((message, options = {}) => 
    addToast(message, { ...options, type: 'info' }), [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast container component
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast ${toast.className}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <i className={toast.icon} />
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <i className="ri-close-line" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default ToastContext
