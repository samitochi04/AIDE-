import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api, API_ENDPOINTS } from '../../../config/api'
import { ROUTES } from '../../../config/routes'
import styles from './Dashboard.module.css'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD)
      if (response.success) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <i className="ri-loader-4-line ri-spin" />
        <span>{t('admin.dashboard.loading', 'Loading dashboard...')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <i className="ri-error-warning-line" />
        <span>{error}</span>
        <button onClick={fetchDashboard} className={styles.retryBtn}>
          {t('admin.dashboard.retry', 'Retry')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('admin.dashboard.title', 'Dashboard')}</h1>
        <p className={styles.subtitle}>
          {t('admin.dashboard.subtitle', 'Overview of your platform')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <i className="ri-user-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.users?.total || 0}</span>
            <span className={styles.statLabel}>{t('admin.dashboard.totalUsers', 'Total Users')}</span>
          </div>
          <div className={styles.statBadge} data-positive={stats?.users?.growth > 0}>
            {stats?.users?.growth > 0 ? '+' : ''}{stats?.users?.growth || 0}%
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <i className="ri-user-add-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.users?.newToday || 0}</span>
            <span className={styles.statLabel}>{t('admin.dashboard.newToday', 'New Today')}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <i className="ri-vip-crown-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.subscriptions?.active || 0}</span>
            <span className={styles.statLabel}>{t('admin.dashboard.activeSubscriptions', 'Active Subscriptions')}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <i className="ri-chat-1-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.ai?.messagesThisMonth || 0}</span>
            <span className={styles.statLabel}>{t('admin.dashboard.aiMessages', 'AI Messages (Month)')}</span>
          </div>
        </div>
      </div>

      {/* Charts & Tables Row */}
      <div className={styles.row}>
        {/* Subscription Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="ri-pie-chart-line" />
              {t('admin.dashboard.subscriptionBreakdown', 'Subscriptions by Tier')}
            </h2>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.tierList}>
              {stats?.subscriptions?.byTier && Object.entries(stats.subscriptions.byTier).map(([tier, count]) => (
                <div key={tier} className={styles.tierItem}>
                  <div className={styles.tierInfo}>
                    <span className={`${styles.tierBadge} ${styles[tier]}`}>{tier}</span>
                    <span className={styles.tierCount}>{count} {t('admin.dashboard.users', 'users')}</span>
                  </div>
                  <div className={styles.tierBar}>
                    <div 
                      className={`${styles.tierProgress} ${styles[tier]}`}
                      style={{ width: `${(count / (stats?.users?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!stats?.subscriptions?.byTier || Object.keys(stats.subscriptions.byTier).length === 0) && (
                <p className={styles.noData}>{t('admin.dashboard.noSubscriptions', 'No subscription data')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="ri-user-follow-line" />
              {t('admin.dashboard.recentSignups', 'Recent Signups')}
            </h2>
            <Link to={ROUTES.ADMIN_USERS} className={styles.viewAllLink}>
              {t('admin.dashboard.viewAll', 'View all')}
              <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.userList}>
              {stats?.recentSignups?.map((user) => (
                <Link 
                  key={user.id} 
                  to={`${ROUTES.ADMIN_USERS}/${user.id}`}
                  className={styles.userItem}
                >
                  <div className={styles.userAvatar}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" />
                    ) : (
                      <i className="ri-user-line" />
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {user.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                  <span className={styles.userDate}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {(!stats?.recentSignups || stats.recentSignups.length === 0) && (
                <p className={styles.noData}>{t('admin.dashboard.noSignups', 'No recent signups')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <i className="ri-flashlight-line" />
            {t('admin.dashboard.quickActions', 'Quick Actions')}
          </h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.quickActions}>
            <Link to={ROUTES.ADMIN_CONTENT} className={styles.quickAction}>
              <i className="ri-article-line" />
              <span>{t('admin.dashboard.newBlogPost', 'New Blog Post')}</span>
            </Link>
            <Link to={ROUTES.ADMIN_GOV_AIDES} className={styles.quickAction}>
              <i className="ri-hand-heart-line" />
              <span>{t('admin.dashboard.manageAides', 'Manage Gov Aides')}</span>
            </Link>
            <Link to={ROUTES.ADMIN_EMAILS} className={styles.quickAction}>
              <i className="ri-mail-send-line" />
              <span>{t('admin.dashboard.sendEmail', 'Send Bulk Email')}</span>
            </Link>
            <Link to={ROUTES.ADMIN_ANALYTICS} className={styles.quickAction}>
              <i className="ri-bar-chart-box-line" />
              <span>{t('admin.dashboard.viewAnalytics', 'View Analytics')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
