import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Sidebar } from '../Sidebar';
import { Button, Loading, Modal } from '../../ui';
import { ROUTES } from '../../../config/routes';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef(null);

  // Mock notifications - replace with real data
  const notifications = [
    { id: 1, title: 'Nouvelle aide disponible', message: 'Vous êtes éligible à la Prime d\'activité', time: '2h', read: false },
    { id: 2, title: 'Document requis', message: 'Veuillez soumettre votre justificatif de domicile', time: '1j', read: false },
    { id: 3, title: 'Démarche complétée', message: 'Votre demande APL a été validée', time: '3j', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search items for command palette
  const searchItems = [
    { id: 'overview', label: t('dashboard.sidebar.overview'), icon: 'ri-dashboard-line', route: ROUTES.DASHBOARD },
    { id: 'aides', label: t('dashboard.sidebar.aides'), icon: 'ri-hand-coin-line', route: ROUTES.AIDES },
    { id: 'procedures', label: t('dashboard.sidebar.procedures'), icon: 'ri-file-list-3-line', route: ROUTES.PROCEDURES },
    { id: 'housing', label: t('dashboard.sidebar.housing'), icon: 'ri-home-line', route: ROUTES.HOUSING },
    { id: 'chat', label: t('dashboard.sidebar.chat'), icon: 'ri-chat-3-line', route: ROUTES.CHAT },
    { id: 'profile', label: t('dashboard.sidebar.profile'), icon: 'ri-user-line', route: ROUTES.PROFILE },
    { id: 'settings', label: t('dashboard.sidebar.settings'), icon: 'ri-settings-3-line', route: ROUTES.SETTINGS },
    { id: 'simulation', label: t('dashboard.overview.newSimulation'), icon: 'ri-calculator-line', route: ROUTES.SIMULATION },
  ];

  const filteredSearchItems = searchQuery
    ? searchItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, loading, navigate]);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  const handleSearchSelect = (item) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(item.route);
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
            
            <button 
              className={styles.searchBar}
              onClick={() => setShowSearch(true)}
            >
              <i className="ri-search-line" />
              <span className={styles.searchPlaceholder}>{t('dashboard.search')}</span>
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </button>
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
            <div className={styles.notificationWrapper}>
              <button 
                className={styles.headerBtn} 
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="ri-notification-3-line" />
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className={styles.notificationDropdown}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className={styles.notificationHeader}>
                      <h3>{t('dashboard.notifications')}</h3>
                      <button className={styles.markAllRead}>
                        {t('dashboard.markAllRead')}
                      </button>
                    </div>
                    <div className={styles.notificationList}>
                      {notifications.length === 0 ? (
                        <div className={styles.emptyNotifications}>
                          <i className="ri-notification-off-line" />
                          <p>{t('dashboard.noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                          >
                            <div className={styles.notificationDot} />
                            <div className={styles.notificationContent}>
                              <span className={styles.notificationTitle}>{notification.title}</span>
                              <p className={styles.notificationMessage}>{notification.message}</p>
                              <span className={styles.notificationTime}>{notification.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button className={styles.viewAllNotifications}>
                      {t('common.viewAll')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className={styles.backdrop}
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className={styles.searchModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              className={styles.searchContent}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.searchInputWrapper}>
                <i className="ri-search-line" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchModalInput}
                />
                <kbd className={styles.escKey}>ESC</kbd>
              </div>
              <div className={styles.searchResults}>
                {filteredSearchItems.length === 0 ? (
                  <div className={styles.noResults}>
                    <i className="ri-search-line" />
                    <p>{t('dashboard.noSearchResults')}</p>
                  </div>
                ) : (
                  filteredSearchItems.map(item => (
                    <button
                      key={item.id}
                      className={styles.searchResultItem}
                      onClick={() => handleSearchSelect(item)}
                    >
                      <i className={item.icon} />
                      <span>{item.label}</span>
                      <i className="ri-arrow-right-line" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DashboardLayout;
