import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import styles from './Emails.module.css'

export default function AdminEmails() {
  const { t } = useTranslation()
  
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])
  const [recentEmails, setRecentEmails] = useState([])
  const [recipientCount, setRecipientCount] = useState(0)
  
  // Bulk email state
  const [activeTab, setActiveTab] = useState('compose') // 'compose' | 'templates' | 'history'
  const [sending, setSending] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  // Email form
  const [emailForm, setEmailForm] = useState({
    subject: '',
    subject_fr: '',
    content: '',
    content_fr: '',
    template: '',
    // Recipient filters
    filters: {
      all: false,
      subscribers_only: true,
      profile_type: '', // students, workers, families, etc.
      nationality: '', // eu, non-eu
      has_subscription: '', // true, false
      region: '',
      saved_aide_id: '', // users who saved specific aide
      custom_emails: '', // comma-separated emails
    },
  })
  
  // Show preview modal
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [statsRes, templatesRes, recentRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.ADMIN.EMAIL_STATS),
        apiFetch(API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES),
        apiFetch(API_ENDPOINTS.ADMIN.EMAIL_RECENT),
      ])
      
      setStats(statsRes.data)
      setTemplates(templatesRes.data?.templates || [])
      setRecentEmails(recentRes.data?.emails || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch recipient count when filters change
  useEffect(() => {
    const fetchRecipientCount = async () => {
      try {
        setPreviewLoading(true)
        const params = new URLSearchParams()
        
        if (emailForm.filters.all) params.set('all', 'true')
        if (emailForm.filters.subscribers_only) params.set('subscribers_only', 'true')
        if (emailForm.filters.profile_type) params.set('profile_type', emailForm.filters.profile_type)
        if (emailForm.filters.nationality) params.set('nationality', emailForm.filters.nationality)
        if (emailForm.filters.has_subscription) params.set('has_subscription', emailForm.filters.has_subscription)
        if (emailForm.filters.region) params.set('region', emailForm.filters.region)
        if (emailForm.filters.saved_aide_id) params.set('saved_aide_id', emailForm.filters.saved_aide_id)
        if (emailForm.filters.custom_emails) {
          const emails = emailForm.filters.custom_emails.split(',').map(e => e.trim()).filter(Boolean)
          if (emails.length > 0) params.set('custom_emails', emails.join(','))
        }
        
        const response = await apiFetch(`${API_ENDPOINTS.ADMIN.BULK_EMAIL_RECIPIENTS}?${params}`)
        setRecipientCount(response.data?.count || 0)
      } catch (err) {
        console.error('Error fetching recipient count:', err)
      } finally {
        setPreviewLoading(false)
      }
    }
    
    const debounce = setTimeout(fetchRecipientCount, 500)
    return () => clearTimeout(debounce)
  }, [emailForm.filters])

  // Update filter
  const updateFilter = (key, value) => {
    setEmailForm(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
        // Reset conflicting filters
        ...(key === 'all' && value ? { subscribers_only: false } : {}),
        ...(key === 'subscribers_only' && value ? { all: false } : {}),
      },
    }))
  }

  // Load template
  const loadTemplate = (template) => {
    setEmailForm(prev => ({
      ...prev,
      subject: template.subject_en || template.subject || '',
      subject_fr: template.subject_fr || '',
      content: template.content_en || template.content || '',
      content_fr: template.content_fr || '',
      template: template.key,
    }))
  }

  // Preview email
  const handlePreview = async () => {
    if (!emailForm.subject || !emailForm.content) {
      setError('Please enter a subject and content')
      return
    }
    
    setPreviewData({
      subject: emailForm.subject,
      subject_fr: emailForm.subject_fr,
      content: emailForm.content,
      content_fr: emailForm.content_fr,
      recipientCount,
      filters: emailForm.filters,
    })
    setShowPreview(true)
  }

  // Send bulk email
  const handleSend = async () => {
    try {
      setSending(true)
      setError(null)
      
      await apiFetch(API_ENDPOINTS.ADMIN.BULK_EMAILS, {
        method: 'POST',
        body: JSON.stringify({
          subject: emailForm.subject,
          subject_fr: emailForm.subject_fr,
          content: emailForm.content,
          content_fr: emailForm.content_fr,
          filters: emailForm.filters,
        }),
      })
      
      setSuccess(`Email sent successfully to ${recipientCount} recipients!`)
      setShowSendConfirm(false)
      
      // Reset form
      setEmailForm({
        subject: '',
        subject_fr: '',
        content: '',
        content_fr: '',
        template: '',
        filters: {
          all: false,
          subscribers_only: true,
          profile_type: '',
          nationality: '',
          has_subscription: '',
          region: '',
          saved_aide_id: '',
          custom_emails: '',
        },
      })
      
      // Refresh data
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Profile types for filter
  const profileTypes = [
    { value: '', key: 'all', label: t('admin.emails.allProfiles', 'All Profiles') },
    { value: 'students', key: 'students', label: t('admin.emails.students', 'Students') },
    { value: 'workers', key: 'workers', label: t('admin.emails.workers', 'Workers') },
    { value: 'seniors', key: 'seniors', label: t('admin.emails.seniors', 'Seniors') },
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
          <h1 className={styles.title}>{t('admin.emails.title', 'Email Management')}</h1>
          <p className={styles.subtitle}>
            {t('admin.emails.subtitle', 'Send bulk emails and manage templates')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-mail-send-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.emailsSent || 0}</span>
            <span className={styles.statLabel}>{t('admin.emails.totalSent', 'Emails Sent')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-user-follow-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.subscribers || 0}</span>
            <span className={styles.statLabel}>{t('admin.emails.subscribers', 'Subscribers')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-mail-check-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.openRate || 0}%</span>
            <span className={styles.statLabel}>{t('admin.emails.openRate', 'Open Rate')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-file-list-3-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{templates.length}</span>
            <span className={styles.statLabel}>{t('admin.emails.templates', 'Templates')}</span>
          </div>
        </div>
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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'compose' ? styles.active : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <i className="ri-edit-line" />
          {t('admin.emails.compose', 'Compose')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'templates' ? styles.active : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <i className="ri-file-copy-line" />
          {t('admin.emails.templatesTab', 'Templates')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="ri-history-line" />
          {t('admin.emails.history', 'History')}
        </button>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className={styles.emailComposer}>
          <div className={styles.composerGrid}>
            {/* Left: Email Content */}
            <div className={styles.emailContent}>
              <h3>{t('admin.emails.emailContent', 'Email Content')}</h3>
              
              <div className={styles.formGroup}>
                <label>{t('admin.emails.subjectEn', 'Subject (English)')} *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.emails.subjectFr', 'Subject (French)')}</label>
                <input
                  type="text"
                  value={emailForm.subject_fr}
                  onChange={e => setEmailForm({ ...emailForm, subject_fr: e.target.value })}
                  placeholder="Entrez le sujet"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.emails.contentEn', 'Content (English)')} *</label>
                <textarea
                  value={emailForm.content}
                  onChange={e => setEmailForm({ ...emailForm, content: e.target.value })}
                  placeholder="Enter email content (HTML supported)"
                  rows={8}
                  className={styles.contentEditor}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t('admin.emails.contentFr', 'Content (French)')}</label>
                <textarea
                  value={emailForm.content_fr}
                  onChange={e => setEmailForm({ ...emailForm, content_fr: e.target.value })}
                  placeholder="Entrez le contenu (HTML supporté)"
                  rows={8}
                  className={styles.contentEditor}
                />
              </div>
              
              <div className={styles.helpText}>
                <i className="ri-information-line" />
                <span>
                  {t('admin.emails.variables', 'Available variables: {{name}}, {{email}}, {{profile_type}}')}
                </span>
              </div>
            </div>
            
            {/* Right: Recipient Filters */}
            <div className={styles.recipientFilters}>
              <h3>{t('admin.emails.recipients', 'Recipients')}</h3>
              
              <div className={styles.recipientCount}>
                <i className="ri-group-line" />
                <span>
                  {previewLoading ? (
                    <i className="ri-loader-4-line ri-spin" />
                  ) : (
                    <>
                      <strong>{recipientCount}</strong> {t('admin.emails.recipientsSelected', 'recipients selected')}
                    </>
                  )}
                </span>
              </div>
              
              <div className={styles.filterSection}>
                <h4>{t('admin.emails.baseFilters', 'Base Filters')}</h4>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={emailForm.filters.subscribers_only}
                    onChange={e => updateFilter('subscribers_only', e.target.checked)}
                  />
                  <span>{t('admin.emails.subscribersOnly', 'Only email subscribers')}</span>
                </label>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={emailForm.filters.all}
                    onChange={e => updateFilter('all', e.target.checked)}
                  />
                  <span>{t('admin.emails.allUsers', 'All users (ignore preferences)')}</span>
                </label>
              </div>
              
              <div className={styles.filterSection}>
                <h4>{t('admin.emails.profileFilters', 'Profile Filters')}</h4>
                
                <div className={styles.formGroup}>
                  <label>{t('admin.emails.profileType', 'Profile Type')}</label>
                  <select
                    value={emailForm.filters.profile_type}
                    onChange={e => updateFilter('profile_type', e.target.value)}
                  >
                    {profileTypes.map(pt => (
                      <option key={pt.key} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>{t('admin.emails.nationality', 'Nationality')}</label>
                  <select
                    value={emailForm.filters.nationality}
                    onChange={e => updateFilter('nationality', e.target.value)}
                  >
                    <option value="">{t('admin.emails.allNationalities', 'All Nationalities')}</option>
                    <option value="eu">{t('admin.emails.eu', 'EU Citizens')}</option>
                    <option value="non-eu">{t('admin.emails.nonEu', 'Non-EU')}</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>{t('admin.emails.subscription', 'Subscription Status')}</label>
                  <select
                    value={emailForm.filters.has_subscription}
                    onChange={e => updateFilter('has_subscription', e.target.value)}
                  >
                    <option value="">{t('admin.emails.allSubscriptions', 'All')}</option>
                    <option value="true">{t('admin.emails.premium', 'Premium Users')}</option>
                    <option value="false">{t('admin.emails.free', 'Free Users')}</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.filterSection}>
                <h4>{t('admin.emails.advancedFilters', 'Advanced Filters')}</h4>
                
                <div className={styles.formGroup}>
                  <label>{t('admin.emails.savedAide', 'Users who saved specific aide')}</label>
                  <input
                    type="text"
                    value={emailForm.filters.saved_aide_id}
                    onChange={e => updateFilter('saved_aide_id', e.target.value)}
                    placeholder="Enter aide ID"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>{t('admin.emails.customEmails', 'Custom email list')}</label>
                  <textarea
                    value={emailForm.filters.custom_emails}
                    onChange={e => updateFilter('custom_emails', e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.composerActions}>
                <button 
                  className={styles.secondaryButton}
                  onClick={handlePreview}
                  disabled={!emailForm.subject || !emailForm.content}
                >
                  <i className="ri-eye-line" />
                  {t('admin.emails.preview', 'Preview')}
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => setShowSendConfirm(true)}
                  disabled={!emailForm.subject || !emailForm.content || recipientCount === 0}
                >
                  <i className="ri-send-plane-line" />
                  {t('admin.emails.send', 'Send Email')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className={styles.templatesSection}>
          <div className={styles.templatesGrid}>
            {templates.length === 0 ? (
              <div className={styles.empty}>
                <i className="ri-file-copy-line" />
                <p>{t('admin.emails.noTemplates', 'No templates found')}</p>
              </div>
            ) : (
              templates.map(template => (
                <div key={template.key} className={styles.templateCard}>
                  <div className={styles.templateHeader}>
                    <h4>{template.name}</h4>
                    <span className={styles.templateKey}>{template.key}</span>
                  </div>
                  <p className={styles.templateDesc}>
                    {template.description || template.subject_en || template.subject}
                  </p>
                  <div className={styles.templateActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => loadTemplate(template)}
                    >
                      <i className="ri-edit-line" />
                      {t('admin.emails.useTemplate', 'Use Template')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className={styles.historySection}>
          {recentEmails.length === 0 ? (
            <div className={styles.empty}>
              <i className="ri-history-line" />
              <p>{t('admin.emails.noHistory', 'No email history found')}</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('admin.emails.subject', 'Subject')}</th>
                    <th>{t('admin.emails.recipients', 'Recipients')}</th>
                    <th>{t('admin.emails.sentAt', 'Sent At')}</th>
                    <th>{t('admin.emails.openRate', 'Open Rate')}</th>
                    <th>{t('admin.emails.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmails.map(email => (
                    <tr key={email.id}>
                      <td>
                        <div className={styles.aideInfo}>
                          <span className={styles.aideName}>{email.subject}</span>
                        </div>
                      </td>
                      <td>{email.recipient_count}</td>
                      <td>{formatDate(email.sent_at)}</td>
                      <td>
                        <span className={styles.amount}>
                          {email.open_rate || 0}%
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${email.status === 'sent' ? styles.active : styles.inactive}`}>
                          {email.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t('admin.emails.previewTitle', 'Email Preview')}</h2>
              <button className={styles.closeButton} onClick={() => setShowPreview(false)}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.previewSection}>
                <label>{t('admin.emails.subject', 'Subject')}</label>
                <p className={styles.previewSubject}>{previewData.subject}</p>
              </div>
              <div className={styles.previewSection}>
                <label>{t('admin.emails.content', 'Content')}</label>
                <div 
                  className={styles.previewContent}
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>
              <div className={styles.previewSection}>
                <label>{t('admin.emails.recipients', 'Recipients')}</label>
                <p><strong>{previewData.recipientCount}</strong> users will receive this email</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowPreview(false)}>
                {t('admin.close', 'Close')}
              </button>
              <button 
                className={styles.primaryButton}
                onClick={() => {
                  setShowPreview(false)
                  setShowSendConfirm(true)
                }}
              >
                <i className="ri-send-plane-line" />
                {t('admin.emails.proceedToSend', 'Proceed to Send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowSendConfirm(false)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <i className="ri-mail-send-line" />
            </div>
            <h3>{t('admin.emails.confirmSend', 'Send Bulk Email?')}</h3>
            <p>
              {t('admin.emails.confirmMessage', 'You are about to send an email to')}{' '}
              <strong>{recipientCount}</strong> {t('admin.emails.recipientsText', 'recipients')}.
              {t('admin.emails.confirmNote', ' This action cannot be undone.')}
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowSendConfirm(false)}
                disabled={sending}
              >
                {t('admin.cancel', 'Cancel')}
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" />
                    {t('admin.emails.sending', 'Sending...')}
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line" />
                    {t('admin.emails.confirmSendButton', 'Yes, Send Email')}
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
