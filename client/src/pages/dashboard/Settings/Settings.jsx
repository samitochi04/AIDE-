import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Button, Card, Input, Modal } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { API_URL } from '../../../config/constants';
import { API_ENDPOINTS } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
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
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, profile, signOut, session, refreshProfile } = useAuth();
  const toast = useToast();

  // Notification preferences from user profile
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    new_aides_alerts: true,
    deadline_reminders: true,
    marketing_emails: false
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Export data
  const [exportLoading, setExportLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // Load user notification preferences from profile on mount and when profile changes
  useEffect(() => {
    if (profile) {
      // Get marketing preference from notification_preferences JSONB
      const notifPrefs = profile.notification_preferences || {};
      
      setNotifications({
        email_notifications: profile.weekly_digest_enabled ?? true,
        new_aides_alerts: profile.new_aides_notification_enabled ?? true,
        deadline_reminders: profile.in_app_notifications_enabled ?? true,
        marketing_emails: notifPrefs.marketing ?? false
      });
    }
  }, [profile]);

  const handleNotificationChange = async (key) => {
    const newValue = !notifications[key];
    const updatedNotifications = { ...notifications, [key]: newValue };
    setNotifications(updatedNotifications);
    setNotificationsLoading(true);

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.PROFILE.UPDATE_NOTIFICATIONS}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ preferences: updatedNotifications })
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      // Refresh the profile to sync the updated preferences
      await refreshProfile();
      
      toast.success(t('dashboard.settings.notifications.updated'));
    } catch (error) {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
      toast.error(t('common.error'));
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('dashboard.settings.password.minLength'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('dashboard.settings.password.mismatch'));
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.PROFILE.CHANGE_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      toast.success(t('dashboard.settings.password.success'));
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message || t('dashboard.settings.password.error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.PROFILE.REQUEST_EXPORT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        // Handle rate limit error specifically
        if (response.status === 429) {
          toast.warning(t('dashboard.settings.data.exportRateLimit'));
          return;
        }
        // Handle feature unavailable (premium only)
        if (response.status === 403) {
          const data = await response.json();
          if (data.error === 'feature_unavailable' || data.data?.error === 'feature_unavailable') {
            setUpgradeMessage(data.message || data.data?.message || t('dashboard.settings.data.exportPremiumOnly'));
            setShowUpgradeModal(true);
            return;
          }
        }
        throw new Error('Failed to request data export');
      }

      toast.success(t('dashboard.settings.data.exportRequested'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.warning(t('dashboard.settings.deleteModal.typeDelete'));
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.PROFILE.DELETE}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast.success(t('dashboard.settings.deleteModal.success'));
      // Sign out and redirect
      await signOut();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setDeleteLoading(false);
    }
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
                  className={`${styles.toggle} ${notifications.email_notifications ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('email_notifications')}
                  disabled={notificationsLoading}
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
                  className={`${styles.toggle} ${notifications.new_aides_alerts ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('new_aides_alerts')}
                  disabled={notificationsLoading}
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
                  className={`${styles.toggle} ${notifications.deadline_reminders ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('deadline_reminders')}
                  disabled={notificationsLoading}
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
                  className={`${styles.toggle} ${notifications.marketing_emails ? styles.active : ''}`}
                  onClick={() => handleNotificationChange('marketing_emails')}
                  disabled={notificationsLoading}
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

            <div className={styles.securityActions}>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                <i className="ri-lock-password-line" />
                {t('dashboard.settings.privacy.changePassword')}
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
                  <i className="ri-file-pdf-line" />
                  <div>
                    <span className={styles.dataLabel}>
                      {t('dashboard.settings.data.export')}
                    </span>
                    <span className={styles.dataDesc}>
                      {t('dashboard.settings.data.exportDescPdf')}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <i className="ri-loader-4-line ri-spin" />
                  ) : (
                    t('dashboard.settings.data.requestExport')
                  )}
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
            <p className={styles.deleteWarning}>
              {t('dashboard.settings.deleteModal.typeConfirm')}
            </p>
            <Input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className={styles.deleteInput}
            />
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}>
                {t('common.cancel')}
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
              >
                {deleteLoading ? (
                  <i className="ri-loader-4-line ri-spin" />
                ) : (
                  t('dashboard.settings.deleteModal.confirm')
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <i className="ri-lock-password-line" />
              <h3>{t('dashboard.settings.password.title')}</h3>
            </div>
            <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
              <Input
                type="password"
                label={t('dashboard.settings.password.current')}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
              <Input
                type="password"
                label={t('dashboard.settings.password.new')}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
              />
              <Input
                type="password"
                label={t('dashboard.settings.password.confirm')}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
              {passwordError && (
                <p className={styles.errorText}>{passwordError}</p>
              )}
              <div className={styles.modalActions}>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <i className="ri-loader-4-line ri-spin" />
                  ) : (
                    t('dashboard.settings.password.submit')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Upgrade Required Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={t('dashboard.settings.data.upgradeRequired')}
      >
        <div className={styles.upgradeModal}>
          <div className={styles.upgradeIcon}>
            <Crown size={48} />
          </div>
          <h3>{t('dashboard.settings.data.upgradeToContinue')}</h3>
          <p>{upgradeMessage || t('dashboard.settings.data.exportPremiumOnly')}</p>
          <div className={styles.upgradeActions}>
            <Button variant="ghost" onClick={() => setShowUpgradeModal(false)}>
              {t('common.close')}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(ROUTES.PRICING)}
            >
              <Crown size={16} />
              {t('common.upgrade')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default Settings;
