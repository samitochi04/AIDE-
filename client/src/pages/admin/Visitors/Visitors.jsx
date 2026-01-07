import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Loading, Badge } from '../../../components/ui';
import { apiFetch, API_ENDPOINTS } from '../../../config/api';
import styles from './Visitors.module.css';

export function Visitors() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Fetch visitor stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.ADMIN.VISITORS_STATS);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch visitor stats:', error);
    }
  }, []);

  // Fetch visitors
  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN.VISITORS}?${params}`);
      if (response.data) {
        setVisitors(response.data.visitors || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStats();
    fetchVisitors();
  }, [fetchStats, fetchVisitors]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return t('admin.visitors.justNow', 'Just now');
    if (diff < 3600) return t('admin.visitors.minutesAgo', '{{count}} min ago', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('admin.visitors.hoursAgo', '{{count}} hours ago', { count: Math.floor(diff / 3600) });
    return t('admin.visitors.daysAgo', '{{count}} days ago', { count: Math.floor(diff / 86400) });
  };

  // Get device icon
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return 'ri-smartphone-line';
      case 'tablet': return 'ri-tablet-line';
      case 'desktop': return 'ri-computer-line';
      default: return 'ri-device-line';
    }
  };

  // Go to page
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>{t('admin.visitors.title', 'Anonymous Visitors')}</h1>
          <p className={styles.subtitle}>
            {t('admin.visitors.subtitle', 'Track and analyze anonymous visitor behavior')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => { fetchStats(); fetchVisitors(); }}>
          <i className="ri-refresh-line" />
          {t('admin.visitors.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="ri-user-follow-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total?.toLocaleString() || 0}</span>
              <span className={styles.statLabel}>{t('admin.visitors.totalVisitors', 'Total Visitors')}</span>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
              <i className="ri-calendar-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.today || 0}</span>
              <span className={styles.statLabel}>{t('admin.visitors.today', 'Today')}</span>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
              <i className="ri-calendar-check-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.thisWeek || 0}</span>
              <span className={styles.statLabel}>{t('admin.visitors.thisWeek', 'This Week')}</span>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)' }}>
              <i className="ri-user-shared-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.converted || 0}</span>
              <span className={styles.statLabel}>{t('admin.visitors.converted', 'Converted')}</span>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              <i className="ri-percent-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.conversionRate}%</span>
              <span className={styles.statLabel}>{t('admin.visitors.conversionRate', 'Conversion Rate')}</span>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--error)' }}>
              <i className="ri-calendar-todo-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.thisMonth || 0}</span>
              <span className={styles.statLabel}>{t('admin.visitors.thisMonth', 'This Month')}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Cards */}
      {stats && (
        <div className={styles.analyticsGrid}>
          {/* Device Breakdown */}
          <Card className={styles.analyticsCard}>
            <h3>
              <i className="ri-device-line" />
              {t('admin.visitors.deviceBreakdown', 'Device Breakdown')}
            </h3>
            <div className={styles.deviceList}>
              {Object.entries(stats.deviceBreakdown || {}).map(([device, count]) => (
                <div key={device} className={styles.deviceItem}>
                  <span className={styles.deviceName}>
                    <i className={getDeviceIcon(device)} />
                    {device.charAt(0).toUpperCase() + device.slice(1)}
                  </span>
                  <span className={styles.deviceCount}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.deviceBreakdown || {}).length === 0 && (
                <p className={styles.emptyText}>{t('admin.visitors.noData', 'No data available')}</p>
              )}
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card className={styles.analyticsCard}>
            <h3>
              <i className="ri-links-line" />
              {t('admin.visitors.trafficSources', 'Traffic Sources')}
            </h3>
            <div className={styles.sourceList}>
              {(stats.trafficSources || []).slice(0, 5).map(({ source, count }) => (
                <div key={source} className={styles.sourceItem}>
                  <span className={styles.sourceName}>{source}</span>
                  <span className={styles.sourceCount}>{count}</span>
                </div>
              ))}
              {(stats.trafficSources || []).length === 0 && (
                <p className={styles.emptyText}>{t('admin.visitors.noData', 'No data available')}</p>
              )}
            </div>
          </Card>

          {/* Top Landing Pages */}
          <Card className={styles.analyticsCard}>
            <h3>
              <i className="ri-pages-line" />
              {t('admin.visitors.topLandingPages', 'Top Landing Pages')}
            </h3>
            <div className={styles.pageList}>
              {(stats.topLandingPages || []).slice(0, 5).map(({ page, count }) => (
                <div key={page} className={styles.pageItem}>
                  <span className={styles.pageName} title={page}>{page}</span>
                  <span className={styles.pageCount}>{count}</span>
                </div>
              ))}
              {(stats.topLandingPages || []).length === 0 && (
                <p className={styles.emptyText}>{t('admin.visitors.noData', 'No data available')}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Visitors Table */}
      <Card className={styles.tableCard}>
        <h3>
          <i className="ri-group-line" />
          {t('admin.visitors.recentVisitors', 'Recent Visitors')}
        </h3>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading.Spinner size="lg" />
          </div>
        ) : visitors.length === 0 ? (
          <div className={styles.emptyContainer}>
            <i className="ri-user-search-line" />
            <p>{t('admin.visitors.noVisitors', 'No visitors yet')}</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('admin.visitors.device', 'Device')}</th>
                    <th>{t('admin.visitors.browser', 'Browser')}</th>
                    <th>{t('admin.visitors.landingPage', 'Landing Page')}</th>
                    <th>{t('admin.visitors.source', 'Source')}</th>
                    <th>{t('admin.visitors.pageViews', 'Views')}</th>
                    <th>{t('admin.visitors.lastSeen', 'Last Seen')}</th>
                    <th>{t('admin.visitors.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td>
                        <div className={styles.deviceCell}>
                          <i className={getDeviceIcon(visitor.device_type)} />
                          <span>{visitor.device_type || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{visitor.browser || '-'}</td>
                      <td className={styles.pageCell} title={visitor.landing_page}>
                        {visitor.landing_page || '-'}
                      </td>
                      <td>{visitor.first_source || 'direct'}</td>
                      <td>{visitor.total_page_views || 0}</td>
                      <td>{formatTimeAgo(visitor.last_seen_at)}</td>
                      <td>
                        {visitor.converted_to_user_id ? (
                          <Badge variant="success">
                            <i className="ri-check-line" />
                            {t('admin.visitors.converted', 'Converted')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t('admin.visitors.anonymous', 'Anonymous')}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <i className="ri-arrow-left-s-line" />
                  {t('common.previous', 'Previous')}
                </Button>
                <span className={styles.pageInfo}>
                  {t('common.pageOf', 'Page {{page}} of {{total}}', {
                    page: pagination.page,
                    total: pagination.totalPages,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  {t('common.next', 'Next')}
                  <i className="ri-arrow-right-s-line" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default Visitors;
