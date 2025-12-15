import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import { useAdmin } from '../../../context/AdminContext'
import styles from './Settings.module.css'

const Settings = () => {
  const { t } = useTranslation()
  const { admin } = useAdmin()
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeSection, setActiveSection] = useState('general')
  
  // Settings
  const [settings, setSettings] = useState({
    general: {
      site_name: 'AIDE+',
      site_description: '',
      maintenance_mode: false,
      registration_enabled: true,
    },
    email: {
      from_name: 'AIDE+',
      from_email: 'noreply@aideplus.fr',
      reply_to: '',
      smtp_host: '',
      smtp_port: '',
    },
    security: {
      session_timeout: 30,
      max_login_attempts: 5,
      require_email_verification: true,
      two_factor_enabled: false,
    },
    notifications: {
      notify_new_users: true,
      notify_subscriptions: true,
      notify_errors: true,
      slack_webhook: '',
    },
    limits: {
      free_simulations_per_day: 3,
      free_chat_messages_per_day: 10,
      max_saved_aides_free: 5,
    },
  })

  // Admins list (for super admin)
  const [admins, setAdmins] = useState([])
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'moderator' })

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [settingsRes, adminsRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.ADMIN.SETTINGS),
        admin?.role === 'super_admin' ? apiFetch(API_ENDPOINTS.ADMIN.ADMINS) : Promise.resolve({ data: { admins: [] } }),
      ])
      
      if (settingsRes.data?.settings) {
        setSettings(prev => ({
          ...prev,
          ...settingsRes.data.settings,
        }))
      } else if (settingsRes.data) {
        setSettings(prev => ({
          ...prev,
          ...settingsRes.data,
        }))
      }
      setAdmins(adminsRes.data?.admins || adminsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [admin?.role])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Update setting
  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      await apiFetch(API_ENDPOINTS.ADMIN.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      
      setSuccess(t('admin.settings.saved', 'Settings saved successfully!'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Add admin
  const handleAddAdmin = async () => {
    try {
      setSaving(true)
      setError(null)
      
      await apiFetch(API_ENDPOINTS.ADMIN.ADMINS, {
        method: 'POST',
        body: JSON.stringify(newAdmin),
      })
      
      setShowAdminModal(false)
      setNewAdmin({ email: '', role: 'moderator' })
      fetchSettings()
      setSuccess(t('admin.settings.adminAdded', 'Admin added successfully!'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Remove admin
  const handleRemoveAdmin = async (adminId) => {
    if (!confirm(t('admin.settings.confirmRemoveAdmin', 'Are you sure you want to remove this admin?'))) return
    
    try {
      await apiFetch(API_ENDPOINTS.ADMIN.ADMIN_USER(adminId), {
        method: 'DELETE',
      })
      fetchSettings()
      setSuccess(t('admin.settings.adminRemoved', 'Admin removed successfully!'))
    } catch (err) {
      setError(err.message)
    }
  }

  // Clear cache
  const handleClearCache = async () => {
    try {
      setSaving(true)
      await apiFetch(API_ENDPOINTS.ADMIN.CLEAR_CACHE, { method: 'POST' })
      setSuccess(t('admin.settings.cacheCleared', 'Cache cleared successfully!'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Admin roles
  const adminRoles = [
    { value: 'moderator', label: t('admin.settings.roles.moderator', 'Moderator') },
    { value: 'admin', label: t('admin.settings.roles.admin', 'Admin') },
    { value: 'super_admin', label: t('admin.settings.roles.superAdmin', 'Super Admin') },
  ]

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.loading', 'Loading...')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <i className="ri-settings-3-line" style={{ marginRight: '0.5rem' }} />
            {t('admin.settings.title', 'Settings')}
          </h1>
          <p className={styles.subtitle}>
            {t('admin.settings.subtitle', 'Configure system and admin panel settings')}
          </p>
        </div>
        <button 
          className={styles.primaryButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line ri-spin" />
              {t('admin.saving', 'Saving...')}
            </>
          ) : (
            <>
              <i className="ri-save-line" />
              {t('admin.settings.saveSettings', 'Save Settings')}
            </>
          )}
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className={styles.success}>
          <i className="ri-check-line" />
          {success}
          <button onClick={() => setSuccess(null)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          {error}
          <button onClick={() => setError(null)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Settings Sections */}
      <div className={styles.settingsLayout}>
        {/* Sidebar */}
        <div className={styles.settingsSidebar}>
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'general' ? styles.active : ''}`}
            onClick={() => setActiveSection('general')}
          >
            <i className="ri-global-line" />
            {t('admin.settings.general', 'General')}
          </button>
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'email' ? styles.active : ''}`}
            onClick={() => setActiveSection('email')}
          >
            <i className="ri-mail-settings-line" />
            {t('admin.settings.email', 'Email')}
          </button>
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'security' ? styles.active : ''}`}
            onClick={() => setActiveSection('security')}
          >
            <i className="ri-shield-check-line" />
            {t('admin.settings.security', 'Security')}
          </button>
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <i className="ri-notification-3-line" />
            {t('admin.settings.notifications', 'Notifications')}
          </button>
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'limits' ? styles.active : ''}`}
            onClick={() => setActiveSection('limits')}
          >
            <i className="ri-dashboard-3-line" />
            {t('admin.settings.limits', 'Limits')}
          </button>
          {admin?.role === 'super_admin' && (
            <button
              className={`${styles.settingsNavItem} ${activeSection === 'admins' ? styles.active : ''}`}
              onClick={() => setActiveSection('admins')}
            >
              <i className="ri-admin-line" />
              {t('admin.settings.admins', 'Admins')}
            </button>
          )}
          <button
            className={`${styles.settingsNavItem} ${activeSection === 'system' ? styles.active : ''}`}
            onClick={() => setActiveSection('system')}
          >
            <i className="ri-tools-line" />
            {t('admin.settings.system', 'System')}
          </button>
        </div>

        {/* Content */}
        <div className={styles.settingsContent}>
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.generalSettings', 'General Settings')}</h3>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.siteName', 'Site Name')}</label>
                <input
                  type="text"
                  value={settings.general.site_name}
                  onChange={e => updateSetting('general', 'site_name', e.target.value)}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.siteDescription', 'Site Description')}</label>
                <textarea
                  value={settings.general.site_description}
                  onChange={e => updateSetting('general', 'site_description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.general.maintenance_mode}
                    onChange={e => updateSetting('general', 'maintenance_mode', e.target.checked)}
                  />
                  <span>{t('admin.settings.maintenanceMode', 'Maintenance Mode')}</span>
                </label>
                <p className={styles.helpText}>
                  {t('admin.settings.maintenanceHelp', 'When enabled, users will see a maintenance page')}
                </p>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.general.registration_enabled}
                    onChange={e => updateSetting('general', 'registration_enabled', e.target.checked)}
                  />
                  <span>{t('admin.settings.registrationEnabled', 'Allow New Registrations')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeSection === 'email' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.emailSettings', 'Email Settings')}</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.fromName', 'From Name')}</label>
                  <input
                    type="text"
                    value={settings.email.from_name}
                    onChange={e => updateSetting('email', 'from_name', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.fromEmail', 'From Email')}</label>
                  <input
                    type="email"
                    value={settings.email.from_email}
                    onChange={e => updateSetting('email', 'from_email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.replyTo', 'Reply-To Email')}</label>
                <input
                  type="email"
                  value={settings.email.reply_to}
                  onChange={e => updateSetting('email', 'reply_to', e.target.value)}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.smtpHost', 'SMTP Host')}</label>
                  <input
                    type="text"
                    value={settings.email.smtp_host}
                    onChange={e => updateSetting('email', 'smtp_host', e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.smtpPort', 'SMTP Port')}</label>
                  <input
                    type="text"
                    value={settings.email.smtp_port}
                    onChange={e => updateSetting('email', 'smtp_port', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.securitySettings', 'Security Settings')}</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.sessionTimeout', 'Session Timeout (minutes)')}</label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={e => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('admin.settings.maxLoginAttempts', 'Max Login Attempts')}</label>
                  <input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={e => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.security.require_email_verification}
                    onChange={e => updateSetting('security', 'require_email_verification', e.target.checked)}
                  />
                  <span>{t('admin.settings.requireEmailVerification', 'Require Email Verification')}</span>
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.security.two_factor_enabled}
                    onChange={e => updateSetting('security', 'two_factor_enabled', e.target.checked)}
                  />
                  <span>{t('admin.settings.twoFactorEnabled', 'Enable Two-Factor Authentication')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.notificationSettings', 'Notification Settings')}</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notify_new_users}
                    onChange={e => updateSetting('notifications', 'notify_new_users', e.target.checked)}
                  />
                  <span>{t('admin.settings.notifyNewUsers', 'Notify on new user signup')}</span>
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notify_subscriptions}
                    onChange={e => updateSetting('notifications', 'notify_subscriptions', e.target.checked)}
                  />
                  <span>{t('admin.settings.notifySubscriptions', 'Notify on new subscriptions')}</span>
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notify_errors}
                    onChange={e => updateSetting('notifications', 'notify_errors', e.target.checked)}
                  />
                  <span>{t('admin.settings.notifyErrors', 'Notify on system errors')}</span>
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.slackWebhook', 'Slack Webhook URL')}</label>
                <input
                  type="url"
                  value={settings.notifications.slack_webhook}
                  onChange={e => updateSetting('notifications', 'slack_webhook', e.target.value)}
                  placeholder="https://hooks.slack.com/..."
                />
                <p className={styles.helpText}>
                  {t('admin.settings.slackHelp', 'Receive notifications in Slack')}
                </p>
              </div>
            </div>
          )}

          {/* Limits Settings */}
          {activeSection === 'limits' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.limitsSettings', 'Usage Limits')}</h3>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.freeSimulations', 'Free Simulations Per Day')}</label>
                <input
                  type="number"
                  value={settings.limits.free_simulations_per_day}
                  onChange={e => updateSetting('limits', 'free_simulations_per_day', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.freeChatMessages', 'Free Chat Messages Per Day')}</label>
                <input
                  type="number"
                  value={settings.limits.free_chat_messages_per_day}
                  onChange={e => updateSetting('limits', 'free_chat_messages_per_day', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.settings.maxSavedAides', 'Max Saved Aides (Free)')}</label>
                <input
                  type="number"
                  value={settings.limits.max_saved_aides_free}
                  onChange={e => updateSetting('limits', 'max_saved_aides_free', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Admins Management */}
          {activeSection === 'admins' && admin?.role === 'super_admin' && (
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h3>{t('admin.settings.manageAdmins', 'Manage Admins')}</h3>
                <button 
                  className={styles.primaryButton}
                  onClick={() => setShowAdminModal(true)}
                >
                  <i className="ri-add-line" />
                  {t('admin.settings.addAdmin', 'Add Admin')}
                </button>
              </div>
              
              <div className={styles.adminsList}>
                {admins.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="ri-admin-line" />
                    <p>{t('admin.settings.noAdmins', 'No admins found')}</p>
                  </div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>{t('admin.settings.adminEmail', 'Email')}</th>
                          <th>{t('admin.settings.adminRole', 'Role')}</th>
                          <th>{t('admin.settings.adminCreated', 'Created')}</th>
                          <th>{t('admin.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map(adminUser => (
                          <tr key={adminUser.id}>
                            <td>{adminUser.email}</td>
                            <td>
                              <span className={`${styles.roleBadge} ${styles[adminUser.role]}`}>
                                {adminRoles.find(r => r.value === adminUser.role)?.label || adminUser.role}
                              </span>
                            </td>
                            <td>{new Date(adminUser.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className={styles.actions}>
                                {adminUser.id !== admin?.id && (
                                  <button
                                    className={`${styles.actionButton} ${styles.danger}`}
                                    onClick={() => handleRemoveAdmin(adminUser.id)}
                                    title={t('admin.remove', 'Remove')}
                                  >
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeSection === 'system' && (
            <div className={styles.settingsSection}>
              <h3>{t('admin.settings.systemSettings', 'System Tools')}</h3>
              
              <div className={styles.systemActions}>
                <div className={styles.systemAction}>
                  <div>
                    <h4>{t('admin.settings.clearCache', 'Clear Cache')}</h4>
                    <p>{t('admin.settings.clearCacheDesc', 'Clear all cached data from the system')}</p>
                  </div>
                  <button 
                    className={styles.secondaryButton}
                    onClick={handleClearCache}
                    disabled={saving}
                  >
                    <i className="ri-delete-bin-line" />
                    {t('admin.settings.clearCacheBtn', 'Clear Cache')}
                  </button>
                </div>
                
                <div className={styles.systemAction}>
                  <div>
                    <h4>{t('admin.settings.exportData', 'Export System Data')}</h4>
                    <p>{t('admin.settings.exportDataDesc', 'Export all system data as JSON')}</p>
                  </div>
                  <button className={styles.secondaryButton}>
                    <i className="ri-download-line" />
                    {t('admin.settings.exportBtn', 'Export')}
                  </button>
                </div>
                
                <div className={styles.systemAction}>
                  <div>
                    <h4>{t('admin.settings.viewLogs', 'System Logs')}</h4>
                    <p>{t('admin.settings.viewLogsDesc', 'View recent system and error logs')}</p>
                  </div>
                  <button className={styles.secondaryButton}>
                    <i className="ri-file-list-3-line" />
                    {t('admin.settings.viewLogsBtn', 'View Logs')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAdminModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdminModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t('admin.settings.addAdmin', 'Add Admin')}</h2>
              <button className={styles.closeButton} onClick={() => setShowAdminModal(false)}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>{t('admin.settings.adminEmail', 'Email')} *</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('admin.settings.adminRole', 'Role')} *</label>
                <select
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  {adminRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <p className={styles.helpText}>
                {t('admin.settings.adminRoleHelp', 'The user must already have an account. They will receive admin access on their next login.')}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowAdminModal(false)}>
                {t('admin.cancel', 'Cancel')}
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleAddAdmin}
                disabled={saving || !newAdmin.email}
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" />
                    {t('admin.adding', 'Adding...')}
                  </>
                ) : (
                  <>
                    <i className="ri-add-line" />
                    {t('admin.add', 'Add Admin')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
