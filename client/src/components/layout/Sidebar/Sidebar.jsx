import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../../ui';
import { ROUTES } from '../../../config/routes';
import { useAuth } from '../../../context';
import styles from './Sidebar.module.css';

const navItems = [
  {
    key: 'overview',
    icon: 'ri-dashboard-line',
    path: ROUTES.DASHBOARD,
    exact: true
  },
  {
    key: 'aides',
    icon: 'ri-hand-coin-line',
    path: ROUTES.AIDES
  },
  {
    key: 'housing',
    icon: 'ri-home-4-line',
    path: ROUTES.HOUSING
  },
  {
    key: 'procedures',
    icon: 'ri-file-list-3-line',
    path: ROUTES.PROCEDURES
  },
  {
    key: 'tutorials',
    icon: 'ri-play-circle-line',
    path: ROUTES.TUTORIALS
  },
  {
    key: 'chat',
    icon: 'ri-chat-3-line',
    path: ROUTES.CHAT
  },
  {
    key: 'simulation',
    icon: 'ri-calculator-line',
    path: ROUTES.SIMULATION
  }
];

const bottomNavItems = [
  {
    key: 'profile',
    icon: 'ri-user-line',
    path: ROUTES.PROFILE
  },
  {
    key: 'settings',
    icon: 'ri-settings-3-line',
    path: ROUTES.SETTINGS
  }
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile } = useAuth();
  
  // Only show upgrade card for free tier users
  const isFreeTier = !profile?.subscription_tier || profile.subscription_tier === 'free';

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  const renderNavItem = (item) => {
    const isActive = item.exact 
      ? location.pathname === item.path 
      : location.pathname.startsWith(item.path);

    return (
      <NavLink
        key={item.key}
        to={item.path}
        className={`${styles.navItem} ${isActive ? styles.active : ''} ${isCollapsed ? styles.collapsed : ''}`}
        onClick={onClose}
        title={isCollapsed ? t(`dashboard.sidebar.${item.key}`) : undefined}
      >
        <i className={item.icon} />
        {!isCollapsed && (
          <span className={styles.navLabel}>
            {t(`dashboard.sidebar.${item.key}`)}
          </span>
        )}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className={styles.activeIndicator}
          />
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      <div className={styles.header}>
        <Logo size={isCollapsed ? 'sm' : 'md'} />
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={isCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} />
        </button>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {!isCollapsed && (
            <span className={styles.navSectionTitle}>
              {t('dashboard.sidebar.main')}
            </span>
          )}
          {navItems.map(renderNavItem)}
        </div>

        <div className={styles.navSection}>
          {!isCollapsed && (
            <span className={styles.navSectionTitle}>
              {t('dashboard.sidebar.account')}
            </span>
          )}
          {bottomNavItems.map(renderNavItem)}
        </div>
      </nav>

      <div className={styles.footer}>
        {!isCollapsed && isFreeTier && (
          <div className={styles.upgradeCard}>
            <i className="ri-vip-crown-line" />
            <div className={styles.upgradeContent}>
              <span className={styles.upgradeTitle}>
                {t('dashboard.sidebar.upgrade')}
              </span>
              <span className={styles.upgradeText}>
                {t('dashboard.sidebar.upgradeText')}
              </span>
            </div>
            <NavLink to={ROUTES.PRICING} className={styles.upgradeBtn}>
              {t('common.upgrade')}
            </NavLink>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className={`${styles.mobileSidebar}`}
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <i className="ri-close-line" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
