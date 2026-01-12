import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './CookieConsent.module.css'

const COOKIE_CONSENT_KEY = 'aideplus_cookie_consent'

const CookieConsent = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: true,
    preferences: true,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (consentData) => {
    const data = {
      ...consentData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data))
    setIsVisible(false)
    
    // Dispatch custom event for other parts of the app to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: data }))
  }

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      preferences: true,
      accepted: true,
    })
  }

  const handleRejectAll = () => {
    saveConsent({
      essential: true, // Essential cookies cannot be rejected
      analytics: false,
      preferences: false,
      accepted: false,
    })
  }

  const handleSavePreferences = () => {
    saveConsent({
      ...preferences,
      essential: true, // Ensure essential is always true
      accepted: preferences.analytics || preferences.preferences,
    })
  }

  const handlePreferenceChange = (key) => {
    if (key === 'essential') return // Cannot disable essential cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={styles.banner}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className={styles.content}>
              <div className={styles.header}>
                <div className={styles.iconWrapper}>
                  <i className="ri-cookie-line" />
                </div>
                <h3 className={styles.title}>{t('cookieConsent.title')}</h3>
              </div>

              <p className={styles.description}>
                {t('cookieConsent.description')}{' '}
                <Link to="/cookies" className={styles.link}>
                  {t('cookieConsent.learnMore')}
                </Link>
              </p>

              {showPreferences && (
                <motion.div
                  className={styles.preferences}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <span className={styles.preferenceName}>
                        {t('cookieConsent.categories.essential.name')}
                      </span>
                      <span className={styles.preferenceDescription}>
                        {t('cookieConsent.categories.essential.description')}
                      </span>
                    </div>
                    <label className={`${styles.toggle} ${styles.disabled}`}>
                      <input
                        type="checkbox"
                        checked={preferences.essential}
                        disabled
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>

                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <span className={styles.preferenceName}>
                        {t('cookieConsent.categories.analytics.name')}
                      </span>
                      <span className={styles.preferenceDescription}>
                        {t('cookieConsent.categories.analytics.description')}
                      </span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handlePreferenceChange('analytics')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>

                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <span className={styles.preferenceName}>
                        {t('cookieConsent.categories.preferences.name')}
                      </span>
                      <span className={styles.preferenceDescription}>
                        {t('cookieConsent.categories.preferences.description')}
                      </span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={() => handlePreferenceChange('preferences')}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </motion.div>
              )}

              <div className={styles.actions}>
                {!showPreferences ? (
                  <>
                    <button
                      className={styles.customizeButton}
                      onClick={() => setShowPreferences(true)}
                    >
                      {t('cookieConsent.customize')}
                    </button>
                    <button
                      className={styles.rejectButton}
                      onClick={handleRejectAll}
                    >
                      {t('cookieConsent.rejectAll')}
                    </button>
                    <button
                      className={styles.acceptButton}
                      onClick={handleAcceptAll}
                    >
                      {t('cookieConsent.acceptAll')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.customizeButton}
                      onClick={() => setShowPreferences(false)}
                    >
                      {t('common.back')}
                    </button>
                    <button
                      className={styles.acceptButton}
                      onClick={handleSavePreferences}
                    >
                      {t('cookieConsent.savePreferences')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CookieConsent
