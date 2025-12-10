import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Sidebar } from '../Sidebar';
import { Button, Loading } from '../../ui';
import { ROUTES } from '../../../config/routes';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  if (loading) {
    return <Loading.PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={styles.main}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <i className="ri-menu-line" />
            </button>
            
            <div className={styles.searchBar}>
              <i className="ri-search-line" />
              <input
                type="text"
                placeholder={t('dashboard.search')}
                className={styles.searchInput}
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </div>
          </div>

          <div className={styles.headerRight}>
            {/* Language Toggle */}
            <button
              className={styles.headerBtn}
              onClick={toggleLanguage}
              aria-label="Toggle language"
              title={language === 'fr' ? 'English' : 'Français'}
            >
              <span className={styles.langText}>
                {language === 'fr' ? 'FR' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              className={styles.headerBtn}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
            </button>

            {/* Notifications */}
            <button className={styles.headerBtn} aria-label="Notifications">
              <i className="ri-notification-3-line" />
              <span className={styles.notificationBadge} />
            </button>

            {/* User Menu */}
            <div className={styles.userMenuWrapper}>
              <button
                className={styles.userBtn}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className={styles.avatar}>
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user.user_metadata?.full_name || 'User'} 
                    />
                  ) : (
                    <span>
                      {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {user.user_metadata?.full_name || t('dashboard.user')}
                  </span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                <i className={`ri-arrow-${showUserMenu ? 'up' : 'down'}-s-line`} />
              </button>

              {showUserMenu && (
                <motion.div
                  className={styles.userMenu}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(ROUTES.PROFILE);
                    }}
                  >
                    <i className="ri-user-line" />
                    {t('dashboard.sidebar.profile')}
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(ROUTES.SETTINGS);
                    }}
                  >
                    <i className="ri-settings-3-line" />
                    {t('dashboard.sidebar.settings')}
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    className={`${styles.menuItem} ${styles.danger}`}
                    onClick={handleLogout}
                  >
                    <i className="ri-logout-box-r-line" />
                    {t('common.logout')}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className={styles.backdrop}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
