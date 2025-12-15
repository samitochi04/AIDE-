import { useState } from 'react'
import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../../context/AdminContext'
import { ADMIN_PERMISSIONS } from '../../../config/adminConstants'
import { useTheme } from '../../../context/ThemeContext'
import { ROUTES } from '../../../config/routes'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  // Main
  {
    key: 'dashboard',
    labelKey: 'admin.nav.dashboard',
    icon: 'ri-dashboard-3-line',
    path: ROUTES.ADMIN_DASHBOARD,
  },
  // Users Section
  {
    key: 'divider-users',
    type: 'divider',
    labelKey: 'admin.nav.sections.users',
  },
  {
    key: 'users',
    labelKey: 'admin.nav.users',
    icon: 'ri-user-line',
    path: ROUTES.ADMIN_USERS,
    permission: ADMIN_PERMISSIONS.MANAGE_USERS,
  },
  {
    key: 'affiliates',
    labelKey: 'admin.nav.affiliates',
    icon: 'ri-links-line',
    path: ROUTES.ADMIN_AFFILIATES,
    permission: ADMIN_PERMISSIONS.MANAGE_AFFILIATES,
  },
  // Content Section
  {
    key: 'divider-content',
    type: 'divider',
    labelKey: 'admin.nav.sections.content',
  },
  {
    key: 'govAides',
    labelKey: 'admin.nav.govAides',
    icon: 'ri-hand-heart-line',
    path: ROUTES.ADMIN_GOV_AIDES,
    permission: ADMIN_PERMISSIONS.MANAGE_CONTENT,
  },
  {
    key: 'procedures',
    labelKey: 'admin.nav.procedures',
    icon: 'ri-file-list-3-line',
    path: ROUTES.ADMIN_PROCEDURES,
    permission: ADMIN_PERMISSIONS.MANAGE_CONTENT,
  },
  {
    key: 'renting',
    labelKey: 'admin.nav.renting',
    icon: 'ri-home-2-line',
    path: ROUTES.ADMIN_RENTING,
    permission: ADMIN_PERMISSIONS.MANAGE_CONTENT,
  },
  {
    key: 'content',
    labelKey: 'admin.nav.blog',
    icon: 'ri-article-line',
    path: ROUTES.ADMIN_CONTENT,
    permission: ADMIN_PERMISSIONS.MANAGE_CONTENT,
  },
  // Communication Section
  {
    key: 'divider-communication',
    type: 'divider',
    labelKey: 'admin.nav.sections.communication',
  },
  {
    key: 'emails',
    labelKey: 'admin.nav.emails',
    icon: 'ri-mail-line',
    path: ROUTES.ADMIN_EMAILS,
    permission: ADMIN_PERMISSIONS.SEND_BULK_EMAILS,
  },
  // System Section
  {
    key: 'divider-system',
    type: 'divider',
    labelKey: 'admin.nav.sections.system',
  },
  {
    key: 'analytics',
    labelKey: 'admin.nav.analytics',
    icon: 'ri-bar-chart-box-line',
    path: ROUTES.ADMIN_ANALYTICS,
    permission: ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    key: 'admins',
    labelKey: 'admin.nav.admins',
    icon: 'ri-shield-user-line',
    path: ROUTES.ADMIN_ADMINS,
    permission: ADMIN_PERMISSIONS.MANAGE_ADMINS,
    superAdminOnly: true,
  },
  {
    key: 'settings',
    labelKey: 'admin.nav.settings',
    icon: 'ri-settings-3-line',
    path: ROUTES.ADMIN_SETTINGS,
    permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS,
    superAdminOnly: true,
  },
]

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { admin, user, loading, isAuthenticated, logout, hasPermission, isSuperAdmin } = useAdmin()
  const { theme, toggleTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />
  }

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <i className="ri-loader-4-line ri-spin" />
        </div>
        <p>{t('admin.loading', 'Loading...')}</p>
      </div>
    )
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang)
  }

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.type === 'divider') return true
    if (item.superAdminOnly && !isSuperAdmin()) return false
    if (item.permission && !hasPermission(item.permission)) return false
    return true
  })

  return (
    <div className={styles.layout}>
      {/* Mobile Menu Button */}
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <i className={mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} />
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <i className="ri-shield-star-line" />
            {!sidebarCollapsed && <span>Aide+ Admin</span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={sidebarCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} />
          </button>
        </div>

        <nav className={styles.nav}>
          {filteredNavItems.map((item) => {
            if (item.type === 'divider') {
              return (
                <div key={item.key} className={styles.navDivider}>
                  {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
                </div>
              )
            }

            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => 
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? t(item.labelKey) : undefined}
              >
                <i className={item.icon} />
                {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              <i className="ri-user-line" />
            </div>
            {!sidebarCollapsed && (
              <div className={styles.adminDetails}>
                <span className={styles.adminName}>{user?.email?.split('@')[0]}</span>
                <span className={styles.adminRole}>{admin?.role}</span>
              </div>
            )}
          </div>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            title={t('admin.logout', 'Logout')}
          >
            <i className="ri-logout-box-r-line" />
            {!sidebarCollapsed && <span>{t('admin.logout', 'Logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.breadcrumb}>
            <span className={styles.pageTitle}>
              {t(`admin.pages.${location.pathname.split('/').pop()}`, location.pathname.split('/').pop())}
            </span>
          </div>

          <div className={styles.topBarActions}>
            <button
              className={styles.actionBtn}
              onClick={toggleLanguage}
              title={t('admin.toggleLanguage', 'Toggle language')}
            >
              <span className={styles.langLabel}>{i18n.language.toUpperCase()}</span>
            </button>

            <button
              className={styles.actionBtn}
              onClick={toggleTheme}
              title={t('admin.toggleTheme', 'Toggle theme')}
            >
              <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
            </button>

            <NavLink to="/" className={styles.actionBtn} title={t('admin.viewSite', 'View site')}>
              <i className="ri-external-link-line" />
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
