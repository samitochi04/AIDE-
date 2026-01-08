import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import styles from './Analytics.module.css'

const Analytics = () => {
  const { t } = useTranslation()
  
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [dateRange, setDateRange] = useState('30') // days
  const [activityLogs, setActivityLogs] = useState([])
  
  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [analyticsRes, logsRes] = await Promise.all([
        apiFetch(`${API_ENDPOINTS.ADMIN.ANALYTICS}?days=${dateRange}`),
        apiFetch(`${API_ENDPOINTS.ADMIN.ACTIVITY_LOGS}?limit=20`),
      ])
      
      setAnalytics(analyticsRes.data)
      setActivityLogs(logsRes.data?.logs || logsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num?.toString() || '0'
  }

  // Format percentage
  const formatPercent = (value, total) => {
    if (!total) return '0%'
    return `${((value / total) * 100).toFixed(1)}%`
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get trend icon and color
  const getTrend = (current, previous) => {
    if (!previous || current === previous) return { icon: 'ri-subtract-line', color: 'var(--color-text-secondary)' }
    if (current > previous) return { icon: 'ri-arrow-up-line', color: 'var(--color-success)' }
    return { icon: 'ri-arrow-down-line', color: 'var(--color-error)' }
  }

  // Get activity icon
  const getActivityIcon = (type) => {
    const icons = {
      'user_signup': 'ri-user-add-line',
      'user_login': 'ri-login-box-line',
      'subscription_created': 'ri-vip-crown-line',
      'subscription_cancelled': 'ri-vip-crown-line',
      'simulation_run': 'ri-play-circle-line',
      'aide_saved': 'ri-heart-line',
      'procedure_started': 'ri-file-list-line',
      'chat_message': 'ri-chat-3-line',
      'profile_updated': 'ri-user-settings-line',
      'admin_action': 'ri-shield-user-line',
    }
    return icons[type] || 'ri-information-line'
  }

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
            <i className="ri-bar-chart-box-line" style={{ marginRight: '0.5rem' }} />
            {t('admin.analytics.title', 'Analytics')}
          </h1>
          <p className={styles.subtitle}>
            {t('admin.analytics.subtitle', 'Monitor app performance and user metrics')}
          </p>
        </div>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="7">{t('admin.analytics.last7Days', 'Last 7 days')}</option>
          <option value="30">{t('admin.analytics.last30Days', 'Last 30 days')}</option>
          <option value="90">{t('admin.analytics.last90Days', 'Last 90 days')}</option>
          <option value="365">{t('admin.analytics.lastYear', 'Last year')}</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          {error}
          <button onClick={() => setError(null)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-user-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatNumber(analytics?.users?.total || 0)}</span>
            <span className={styles.statLabel}>{t('admin.analytics.totalUsers', 'Total Users')}</span>
            <span className={styles.statTrend} style={{ color: getTrend(analytics?.users?.new, analytics?.users?.previousNew).color }}>
              <i className={getTrend(analytics?.users?.new, analytics?.users?.previousNew).icon} />
              +{analytics?.users?.new || 0} new
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-vip-crown-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatNumber(analytics?.subscriptions?.active || 0)}</span>
            <span className={styles.statLabel}>{t('admin.analytics.activeSubscriptions', 'Active Subscriptions')}</span>
            <span className={styles.statTrend}>
              {formatPercent(analytics?.subscriptions?.active, analytics?.users?.total)} of users
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-play-circle-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatNumber(analytics?.simulations?.total || 0)}</span>
            <span className={styles.statLabel}>{t('admin.analytics.simulationsRun', 'Simulations Run')}</span>
            <span className={styles.statTrend} style={{ color: 'var(--color-success)' }}>
              <i className="ri-arrow-up-line" />
              +{analytics?.simulations?.recent || 0} this period
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-money-euro-circle-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>€{formatNumber(analytics?.revenue?.total || 0)}</span>
            <span className={styles.statLabel}>{t('admin.analytics.totalRevenue', 'Total Revenue')}</span>
            <span className={styles.statTrend}>
              €{analytics?.revenue?.monthly || 0}/mo MRR
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.analyticsGrid}>
        {/* Left Column - Charts/Metrics */}
        <div className={styles.analyticsSection}>
          <h3>{t('admin.analytics.userMetrics', 'User Metrics')}</h3>
          
          {/* User breakdown */}
          <div className={styles.metricsCard}>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-graduation-cap-line" />
                {t('admin.analytics.students', 'Students')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.students || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.students, analytics?.users?.total)}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-briefcase-line" />
                {t('admin.analytics.workers', 'Workers')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.workers || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.workers, analytics?.users?.total)}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-search-line" />
                {t('admin.analytics.jobSeekers', 'Job Seekers')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.jobSeekers || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.jobSeekers, analytics?.users?.total)}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-user-heart-line" />
                {t('admin.analytics.retirees', 'Retirees')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.retirees || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.retirees, analytics?.users?.total)}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-plane-line" />
                {t('admin.analytics.tourists', 'Tourists')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.tourists || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.tourists, analytics?.users?.total)}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-question-line" />
                {t('admin.analytics.other', 'Other/Not set')}
              </span>
              <span className={styles.metricValue}>{analytics?.usersByProfile?.other || 0}</span>
              <span className={styles.metricPercent}>
                {formatPercent(analytics?.usersByProfile?.other, analytics?.users?.total)}
              </span>
            </div>
          </div>
          
          <h3>{t('admin.analytics.engagement', 'Engagement')}</h3>
          
          <div className={styles.metricsCard}>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-heart-line" />
                {t('admin.analytics.savedAides', 'Saved Aides')}
              </span>
              <span className={styles.metricValue}>{analytics?.engagement?.savedAides || 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-file-list-line" />
                {t('admin.analytics.proceduresStarted', 'Procedures Started')}
              </span>
              <span className={styles.metricValue}>{analytics?.engagement?.proceduresStarted || 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-chat-3-line" />
                {t('admin.analytics.chatMessages', 'Chat Messages')}
              </span>
              <span className={styles.metricValue}>{analytics?.engagement?.chatMessages || 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>
                <i className="ri-eye-line" />
                {t('admin.analytics.avgSessionTime', 'Avg Session Time')}
              </span>
              <span className={styles.metricValue}>{analytics?.engagement?.avgSessionTime || '0m'}</span>
            </div>
          </div>
          
          <h3>{t('admin.analytics.topAides', 'Top Viewed Aides')}</h3>
          
          <div className={styles.metricsCard}>
            {(analytics?.topAides || []).slice(0, 5).map((aide, idx) => (
              <div key={aide.id || idx} className={styles.metricRow}>
                <span className={styles.metricRank}>#{idx + 1}</span>
                <span className={styles.metricLabel}>{aide.name}</span>
                <span className={styles.metricValue}>{aide.views} views</span>
              </div>
            ))}
            {(!analytics?.topAides || analytics.topAides.length === 0) && (
              <p className={styles.noData}>{t('admin.analytics.noData', 'No data available')}</p>
            )}
          </div>
        </div>
        
        {/* Right Column - Activity Feed */}
        <div className={styles.analyticsSection}>
          <h3>{t('admin.analytics.recentActivity', 'Recent Activity')}</h3>
          
          <div className={styles.activityFeed}>
            {activityLogs.length === 0 ? (
              <div className={styles.noActivity}>
                <i className="ri-time-line" />
                <p>{t('admin.analytics.noActivity', 'No recent activity')}</p>
              </div>
            ) : (
              activityLogs.map((log, idx) => (
                <div key={log.id || idx} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <i className={getActivityIcon(log.type)} />
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{log.message || log.description}</p>
                    <span className={styles.activityTime}>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <h3>{t('admin.analytics.conversionRates', 'Conversion Rates')}</h3>
          
          <div className={styles.metricsCard}>
            <div className={styles.conversionMetric}>
              <div className={styles.conversionHeader}>
                <span>{t('admin.analytics.signupToSimulation', 'Signup → Simulation')}</span>
                <span className={styles.conversionRate}>{analytics?.conversions?.signupToSimulation || 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${analytics?.conversions?.signupToSimulation || 0}%` }}
                />
              </div>
            </div>
            
            <div className={styles.conversionMetric}>
              <div className={styles.conversionHeader}>
                <span>{t('admin.analytics.freeToPayin', 'Free → Premium')}</span>
                <span className={styles.conversionRate}>{analytics?.conversions?.freeToPremium || 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.premium}`}
                  style={{ width: `${analytics?.conversions?.freeToPremium || 0}%` }}
                />
              </div>
            </div>
            
            <div className={styles.conversionMetric}>
              <div className={styles.conversionHeader}>
                <span>{t('admin.analytics.retention30Day', '30-Day Retention')}</span>
                <span className={styles.conversionRate}>{analytics?.conversions?.retention30Day || 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.retention}`}
                  style={{ width: `${analytics?.conversions?.retention30Day || 0}%` }}
                />
              </div>
            </div>
          </div>
          
          <h3>{t('admin.analytics.geography', 'User Geography')}</h3>
          
          <div className={styles.metricsCard}>
            {(analytics?.geography || []).slice(0, 5).map((geo, idx) => (
              <div key={geo.country || idx} className={styles.metricRow}>
                <span className={styles.metricLabel}>
                  <span className={styles.countryFlag}>{geo.flag || '🌍'}</span>
                  {geo.country}
                </span>
                <span className={styles.metricValue}>{geo.count}</span>
                <span className={styles.metricPercent}>
                  {formatPercent(geo.count, analytics?.users?.total)}
                </span>
              </div>
            ))}
            {(!analytics?.geography || analytics.geography.length === 0) && (
              <p className={styles.noData}>{t('admin.analytics.noData', 'No data available')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
