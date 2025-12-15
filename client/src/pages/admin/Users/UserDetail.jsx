import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, API_ENDPOINTS } from '../../../config/api'
import { ROUTES } from '../../../config/routes'
import { useAdmin } from '../../../context/AdminContext'
import styles from './UserDetail.module.css'

export default function UserDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, isSuperAdmin } = useAdmin()

  const [user, setUser] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const [userRes, activityRes] = await Promise.all([
        api.get(`${API_ENDPOINTS.ADMIN.USERS}/${id}`),
        api.get(`${API_ENDPOINTS.ADMIN.USERS}/${id}/activity`)
      ])

      if (userRes.success) {
        setUser(userRes.data)
        setEditForm(userRes.data)
      }
      if (activityRes.success) {
        setActivity(activityRes.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await api.patch(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, {
        full_name: editForm.full_name,
        status: editForm.status,
        nationality: editForm.nationality,
        subscription_tier: editForm.subscription_tier,
        region: editForm.region,
        is_active: editForm.is_active,
        admin_notes: editForm.admin_notes,
      })

      if (response.success) {
        setUser(response.data)
        setIsEditing(false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      await api.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`)
      navigate(ROUTES.ADMIN_USERS)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleGrantSubscription = async (tier) => {
    try {
      setSaving(true)
      const response = await api.post(`${API_ENDPOINTS.ADMIN.BASE}/subscriptions/grant`, {
        userId: id,
        tier,
        months: 1,
      })
      if (response.success) {
        fetchUser()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <i className="ri-loader-4-line ri-spin" />
        <span>{t('common.loading', 'Loading...')}</span>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className={styles.error}>
        <i className="ri-error-warning-line" />
        <span>{error || t('admin.users.notFound', 'User not found')}</span>
        <Link to={ROUTES.ADMIN_USERS} className={styles.backBtn}>
          {t('common.back', 'Back')}
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link to={ROUTES.ADMIN_USERS} className={styles.backLink}>
          <i className="ri-arrow-left-line" />
          {t('admin.users.backToUsers', 'Back to Users')}
        </Link>

        <div className={styles.headerContent}>
          <div className={styles.userHeader}>
            <div className={styles.avatar}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" />
              ) : (
                <i className="ri-user-line" />
              )}
            </div>
            <div className={styles.userHeaderInfo}>
              <h1>{user.full_name || t('admin.users.noName', 'No name')}</h1>
              <p>{user.email}</p>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles[user.subscription_tier || 'free']}`}>
                  {user.subscription_tier || 'free'}
                </span>
                <span className={`${styles.badge} ${styles.statusBadge}`}>
                  {user.status || 'other'}
                </span>
                {!user.is_active && (
                  <span className={`${styles.badge} ${styles.inactive}`}>
                    {t('admin.users.inactive', 'Inactive')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            {hasPermission('manage_users') && (
              <>
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                      {saving ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-save-line" />}
                      {t('common.save', 'Save')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                    <i className="ri-edit-line" />
                    {t('common.edit', 'Edit')}
                  </button>
                )}
                {isSuperAdmin() && (
                  <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
                    <i className="ri-delete-bin-line" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="ri-user-line" />
          {t('admin.users.overview', 'Overview')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <i className="ri-history-line" />
          {t('admin.users.activity', 'Activity')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'subscription' ? styles.active : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <i className="ri-vip-crown-line" />
          {t('admin.users.subscription', 'Subscription')}
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.grid}>
              {/* Personal Info */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-user-3-line" />
                  {t('admin.users.personalInfo', 'Personal Information')}
                </h3>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.fullName', 'Full Name')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  ) : (
                    <p>{user.full_name || '-'}</p>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.email', 'Email')}</label>
                  <p>{user.email}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.phone', 'Phone')}</label>
                  <p>{user.phone || '-'}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.status', 'Status')}</label>
                  {isEditing ? (
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="student">Student</option>
                      <option value="worker">Worker</option>
                      <option value="job_seeker">Job Seeker</option>
                      <option value="retiree">Retiree</option>
                      <option value="tourist">Tourist</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p>{user.status || '-'}</p>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.nationality', 'Nationality')}</label>
                  {isEditing ? (
                    <select
                      value={editForm.nationality || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                    >
                      <option value="french">French</option>
                      <option value="eu_eea">EU/EEA</option>
                      <option value="non_eu">Non-EU</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p>{user.nationality || '-'}</p>
                  )}
                </div>
              </div>

              {/* Location Info */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-map-pin-line" />
                  {t('admin.users.location', 'Location')}
                </h3>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.region', 'Region')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.region || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, region: e.target.value }))}
                    />
                  ) : (
                    <p>{user.region || '-'}</p>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.department', 'Department')}</label>
                  <p>{user.department || '-'}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.city', 'City')}</label>
                  <p>{user.city || '-'}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.postalCode', 'Postal Code')}</label>
                  <p>{user.postal_code || '-'}</p>
                </div>
              </div>

              {/* Account Info */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-shield-user-line" />
                  {t('admin.users.accountInfo', 'Account')}
                </h3>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.createdAt', 'Joined')}</label>
                  <p>{new Date(user.created_at).toLocaleString()}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.lastSeen', 'Last Seen')}</label>
                  <p>{user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : '-'}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.emailVerified', 'Email Verified')}</label>
                  <p>{user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : t('admin.users.notVerified', 'Not verified')}</p>
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.isActive', 'Active')}</label>
                  {isEditing ? (
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  ) : (
                    <p>{user.is_active ? t('common.yes', 'Yes') : t('common.no', 'No')}</p>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label>{t('admin.users.referralCode', 'Referral Code')}</label>
                  <p>{user.referral_code || '-'}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-sticky-note-line" />
                  {t('admin.users.adminNotes', 'Admin Notes')}
                </h3>
                {isEditing ? (
                  <textarea
                    value={editForm.admin_notes || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={5}
                    placeholder={t('admin.users.addNotes', 'Add notes about this user...')}
                  />
                ) : (
                  <p className={styles.notes}>{user.admin_notes || t('admin.users.noNotes', 'No notes')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.activityTab}>
            <div className={styles.activityGrid}>
              {/* Saved Aides */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-hand-heart-line" />
                  {t('admin.users.savedAides', 'Saved Aides')}
                  <span className={styles.count}>{activity?.savedAides?.length || 0}</span>
                </h3>
                <div className={styles.list}>
                  {activity?.savedAides?.length > 0 ? (
                    activity.savedAides.map((aide, i) => (
                      <div key={i} className={styles.listItem}>
                        <span>{aide.aide_name || aide.aide_id}</span>
                        <span className={styles.date}>
                          {new Date(aide.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.empty}>{t('admin.users.noSavedAides', 'No saved aides')}</p>
                  )}
                </div>
              </div>

              {/* Procedures */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-file-list-3-line" />
                  {t('admin.users.procedures', 'Procedures')}
                  <span className={styles.count}>{activity?.procedures?.length || 0}</span>
                </h3>
                <div className={styles.list}>
                  {activity?.procedures?.length > 0 ? (
                    activity.procedures.map((proc, i) => (
                      <div key={i} className={styles.listItem}>
                        <div>
                          <span>{proc.procedure_name || proc.procedure_id}</span>
                          <span className={`${styles.badge} ${styles[proc.status]}`}>
                            {proc.status}
                          </span>
                        </div>
                        <span className={styles.date}>
                          {new Date(proc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.empty}>{t('admin.users.noProcedures', 'No procedures')}</p>
                  )}
                </div>
              </div>

              {/* Chat Conversations */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-chat-3-line" />
                  {t('admin.users.chatHistory', 'Chat History')}
                  <span className={styles.count}>{activity?.chats?.length || 0}</span>
                </h3>
                <div className={styles.list}>
                  {activity?.chats?.length > 0 ? (
                    activity.chats.map((chat, i) => (
                      <div key={i} className={styles.listItem}>
                        <div>
                          <span>{chat.title || t('admin.users.untitledChat', 'Untitled')}</span>
                          <span className={styles.meta}>
                            {chat.message_count} {t('admin.users.messages', 'messages')}
                          </span>
                        </div>
                        <span className={styles.date}>
                          {new Date(chat.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.empty}>{t('admin.users.noChats', 'No chat history')}</p>
                  )}
                </div>
              </div>

              {/* Simulations */}
              <div className={styles.card}>
                <h3>
                  <i className="ri-calculator-line" />
                  {t('admin.users.simulations', 'Simulations')}
                  <span className={styles.count}>{activity?.simulations?.length || 0}</span>
                </h3>
                <div className={styles.list}>
                  {activity?.simulations?.length > 0 ? (
                    activity.simulations.map((sim, i) => (
                      <div key={i} className={styles.listItem}>
                        <div>
                          <span>{t('admin.users.simulation', 'Simulation')} #{i + 1}</span>
                          <span className={styles.meta}>
                            {sim.eligible_aides_count || 0} {t('admin.users.eligibleAides', 'eligible aides')}
                          </span>
                        </div>
                        <span className={styles.date}>
                          {new Date(sim.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.empty}>{t('admin.users.noSimulations', 'No simulations')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className={styles.subscriptionTab}>
            <div className={styles.card}>
              <h3>
                <i className="ri-vip-crown-line" />
                {t('admin.users.currentSubscription', 'Current Subscription')}
              </h3>
              <div className={styles.subscriptionInfo}>
                <div className={styles.tierDisplay}>
                  <span className={`${styles.tierBadge} ${styles[user.subscription_tier || 'free']}`}>
                    {user.subscription_tier || 'free'}
                  </span>
                </div>
                {user.subscription && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label>{t('admin.users.subscriptionStatus', 'Status')}</label>
                      <p>{user.subscription.status}</p>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>{t('admin.users.currentPeriodEnd', 'Current Period End')}</label>
                      <p>{new Date(user.subscription.current_period_end).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>{t('admin.users.cancelAtPeriodEnd', 'Cancel at Period End')}</label>
                      <p>{user.subscription.cancel_at_period_end ? t('common.yes', 'Yes') : t('common.no', 'No')}</p>
                    </div>
                  </>
                )}
              </div>

              {isSuperAdmin() && (
                <div className={styles.subscriptionActions}>
                  <h4>{t('admin.users.grantSubscription', 'Grant Subscription')}</h4>
                  <p>{t('admin.users.grantSubscriptionDesc', 'Grant a complimentary subscription to this user')}</p>
                  <div className={styles.grantButtons}>
                    <button 
                      onClick={() => handleGrantSubscription('basic')}
                      disabled={saving}
                      className={styles.grantBtn}
                    >
                      Basic (1 month)
                    </button>
                    <button 
                      onClick={() => handleGrantSubscription('premium')}
                      disabled={saving}
                      className={`${styles.grantBtn} ${styles.premium}`}
                    >
                      Premium (1 month)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>{t('admin.users.deleteUser', 'Delete User')}</h3>
            <p>{t('admin.users.deleteConfirm', 'Are you sure you want to delete this user? This action cannot be undone.')}</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} className={styles.cancelBtn}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleDelete} disabled={saving} className={styles.deleteConfirmBtn}>
                {saving ? <i className="ri-loader-4-line ri-spin" /> : t('common.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
