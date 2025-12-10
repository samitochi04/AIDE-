import { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { useLanguage } from '../../../context/LanguageContext'
import { Logo, Button } from '../../ui'
import { ROUTES } from '../../../config/routes'
import styles from './Navbar.module.css'

const Navbar = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { path: ROUTES.PRICING, label: t('nav.pricing') },
    { path: ROUTES.BLOG, label: t('nav.blog') },
    { path: ROUTES.CONTACT, label: t('nav.contact') },
  ]

  const isActive = useCallback((path) => {
    return location.pathname === path
  }, [location.pathname])

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <Logo size="md" className={styles.logo} />

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            <ul className={styles.navLinks}>
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`${styles.navLink} ${isActive(link.path) ? styles.active : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className={styles.navActions}>
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={styles.iconButton}
                aria-label={t('accessibility.switchLanguage')}
                title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
              >
                <span className={styles.langFlag}>
                  {language === 'fr' ? '🇫🇷' : '🇬🇧'}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={styles.iconButton}
                aria-label={t('accessibility.toggleTheme')}
                title={theme === 'light' ? t('theme.dark') : t('theme.light')}
              >
                <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'} />
              </button>

              {/* Auth Buttons */}
              {user ? (
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  icon="ri-dashboard-line"
                >
                  {t('nav.dashboard')}
                </Button>
              ) : (
                <div className={styles.authButtons}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(ROUTES.LOGIN)}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(ROUTES.REGISTER)}
                  >
                    {t('nav.signup')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <i className={mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className={styles.mobileOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />
            <motion.div
              className={styles.mobileMenu}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className={styles.mobileMenuHeader}>
                <Logo size="sm" onClick={closeMobileMenu} />
                <div className={styles.mobileMenuActions}>
                  <button
                    onClick={toggleLanguage}
                    className={styles.iconButton}
                  >
                    <span className={styles.langFlag}>
                      {language === 'fr' ? '🇫🇷' : '🇬🇧'}
                    </span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={styles.iconButton}
                  >
                    <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'} />
                  </button>
                </div>
              </div>

              <ul className={styles.mobileNavLinks}>
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className={`${styles.mobileNavLink} ${isActive(link.path) ? styles.active : ''}`}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className={styles.mobileAuthButtons}>
                {user ? (
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate(ROUTES.DASHBOARD)
                      closeMobileMenu()
                    }}
                    icon="ri-dashboard-line"
                  >
                    {t('nav.dashboard')}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        navigate(ROUTES.LOGIN)
                        closeMobileMenu()
                      }}
                    >
                      {t('nav.login')}
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => {
                        navigate(ROUTES.REGISTER)
                        closeMobileMenu()
                      }}
                    >
                      {t('nav.signup')}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
