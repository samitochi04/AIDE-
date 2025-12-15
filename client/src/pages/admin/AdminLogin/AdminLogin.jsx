import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../../context/AdminContext'
import { useTheme } from '../../../context/ThemeContext'
import { ROUTES } from '../../../config/routes'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const { t } = useTranslation()
  const { login, loading, error: authError, isAuthenticated } = useAdmin()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // If already authenticated as admin, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError(t('admin.login.errorRequired', 'Email and password are required'))
      return
    }

    try {
      await login(email, password)
      navigate(ROUTES.ADMIN_DASHBOARD)
    } catch (err) {
      setError(err.message || t('admin.login.errorInvalid', 'Invalid credentials or access denied'))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradient} />
      </div>

      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <i className="ri-shield-user-line" />
          </div>
          <h1 className={styles.title}>{t('admin.login.title', 'Admin Portal')}</h1>
          <p className={styles.subtitle}>{t('admin.login.subtitle', 'Sign in to access the admin dashboard')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {(error || authError) && (
            <div className={styles.error}>
              <i className="ri-error-warning-line" />
              <span>{error || authError}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              {t('admin.login.email', 'Email')}
            </label>
            <div className={styles.inputWrapper}>
              <i className="ri-mail-line" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('admin.login.emailPlaceholder', 'admin@aideplus.fr')}
                className={styles.input}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              {t('admin.login.password', 'Password')}
            </label>
            <div className={styles.inputWrapper}>
              <i className="ri-lock-line" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line ri-spin" />
                <span>{t('admin.login.signingIn', 'Signing in...')}</span>
              </>
            ) : (
              <>
                <i className="ri-login-box-line" />
                <span>{t('admin.login.signIn', 'Sign In')}</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            {t('admin.login.footerText', 'Authorized personnel only. All actions are logged.')}
          </p>
        </div>
      </div>
    </div>
  )
}
