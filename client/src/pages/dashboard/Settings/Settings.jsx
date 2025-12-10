import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, Card, Input, Badge } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import styles from './Settings.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    newAides: true,
    deadlines: true,
    updates: false,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    shareData: false,
    analytics: true
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyChange = (key) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportData = () => {
    // Mock data export
    console.log('Exporting user data...');
  };

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className={styles.header} variants={itemVariants}>
        <h1 className={styles.title}>{t('dashboard.settings.title')}</h1>
        <p className={styles.subtitle}>{t('dashboard.settings.subtitle')}</p>
      </motion.div>

      <div className={styles.settingsGrid}>
        {/* Appearance */}
        <motion.div variants={itemVariants}>
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <i className="ri-palette-line" />
              <h2>{t('dashboard.settings.appearance.title')}</h2>
            </div>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>
                  {t('dashboard.settings.appearance.theme')}
                </span>
                <span className={styles.settingDesc}>
                  {t('dashboard.settings.appearance.themeDesc')}
                </span>
              </div>
              <div className={styles.themeOptions}>
                <button
                  className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <i className="ri-sun-line" />
                  <span>{t('theme.light')}</span>
                </button>
                <button
                  className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <i className="ri-moon-line" />
                  <span>{t('theme.dark')}</span>
                </button>
                <button
                  className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <i className="ri-computer-line" />
                  <span>{t('theme.system')}</span>
                </button>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>
                  {t('dashboard.settings.appearance.language')}
                </span>
                <span className={styles.settingDesc}>
                  {t('dashboard.settings.appearance.languageDesc')}
                </span>
              </div>
              <div className={styles.languageOptions}>
                <button
                  className={`${styles.langBtn} ${language === 'en' ? styles.active : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  <span className={styles.flagEmoji}>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  className={`${styles.langBtn} ${language === 'fr' ? styles.active : ''}`}
                  onClick={() => setLanguage('fr')}
                >
                  <span className={styles.flagEmoji}>🇫🇷</span>
                  <span>Français</span>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <i className="ri-notification-3-line" />
              <h2>{t('dashboard.settings.notifications.title')}</h2>
            </div>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>
                    {t('dashboard.settings.notifications.email')}
                  </span>
                  <span className={styles.toggleDesc}>
                    {t('dashboard.settings.notifications.emailDesc')}
                  </span>
                </div>
                <button
                  className={`${styles.toggle} ${notifications.email ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('email')}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>
                    {t('dashboard.settings.notifications.newAides')}
                  </span>
                  <span className={styles.toggleDesc}>
                    {t('dashboard.settings.notifications.newAidesDesc')}
                  </span>
                </div>
                <button
                  className={`${styles.toggle} ${notifications.newAides ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('newAides')}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>
                    {t('dashboard.settings.notifications.deadlines')}
                  </span>
                  <span className={styles.toggleDesc}>
                    {t('dashboard.settings.notifications.deadlinesDesc')}
                  </span>
                </div>
                <button
                  className={`${styles.toggle} ${notifications.deadlines ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('deadlines')}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>
                    {t('dashboard.settings.notifications.marketing')}
                  </span>
                  <span className={styles.toggleDesc}>
                    {t('dashboard.settings.notifications.marketingDesc')}
                  </span>
                </div>
                <button
                  className={`${styles.toggle} ${notifications.marketing ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('marketing')}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div variants={itemVariants}>
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <i className="ri-shield-line" />
              <h2>{t('dashboard.settings.privacy.title')}</h2>
            </div>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>
                    {t('dashboard.settings.privacy.analytics')}
                  </span>
                  <span className={styles.toggleDesc}>
                    {t('dashboard.settings.privacy.analyticsDesc')}
                  </span>
                </div>
                <button
                  className={`${styles.toggle} ${privacy.analytics ? styles.active : ''}`}
                  onClick={() => handlePrivacyChange('analytics')}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            </div>

            <div className={styles.securityActions}>
              <Button variant="outline" onClick={() => {}}>
                <i className="ri-lock-password-line" />
                {t('dashboard.settings.privacy.changePassword')}
              </Button>
              <Button variant="outline" onClick={() => {}}>
                <i className="ri-shield-keyhole-line" />
                {t('dashboard.settings.privacy.twoFactor')}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Data & Account */}
        <motion.div variants={itemVariants}>
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <i className="ri-database-2-line" />
              <h2>{t('dashboard.settings.data.title')}</h2>
            </div>
            
            <div className={styles.dataActions}>
              <div className={styles.dataItem}>
                <div className={styles.dataInfo}>
                  <i className="ri-download-2-line" />
                  <div>
                    <span className={styles.dataLabel}>
                      {t('dashboard.settings.data.export')}
                    </span>
                    <span className={styles.dataDesc}>
                      {t('dashboard.settings.data.exportDesc')}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  {t('dashboard.settings.data.download')}
                </Button>
              </div>
              
              <div className={styles.dataItem}>
                <div className={styles.dataInfo}>
                  <i className="ri-logout-box-line" />
                  <div>
                    <span className={styles.dataLabel}>
                      {t('dashboard.settings.data.signOut')}
                    </span>
                    <span className={styles.dataDesc}>
                      {t('dashboard.settings.data.signOutDesc')}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  {t('auth.signOut')}
                </Button>
              </div>
            </div>

            <div className={styles.dangerZone}>
              <h3>{t('dashboard.settings.data.dangerZone')}</h3>
              <p>{t('dashboard.settings.data.dangerDesc')}</p>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <i className="ri-delete-bin-line" />
                {t('dashboard.settings.data.deleteAccount')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <i className="ri-error-warning-line" />
              <h3>{t('dashboard.settings.deleteModal.title')}</h3>
            </div>
            <p>{t('dashboard.settings.deleteModal.description')}</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger">
                {t('dashboard.settings.deleteModal.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

export default Settings;
