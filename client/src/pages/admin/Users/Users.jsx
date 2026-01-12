import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api, API_ENDPOINTS } from '../../../config/api'
import { ROUTES } from '../../../config/routes'
import styles from './Users.module.css'

export default function AdminUsers() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', tier: '', status: '' })
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.status && { status: filters.status }),
      })
      const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}?${params}`)
      if (response.success) {
        setUsers(response.data.users || [])
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search handler
  const handleSearch = (e) => {
    const value = e.target.value
    setSearchInput(value)
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }))
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.users.title', 'Users')}</h1>
          <p className={styles.subtitle}>{t('admin.users.subtitle', 'Manage platform users')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.users.searchPlaceholder', 'Search users...')}
            value={searchInput}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filters.tier}
          onChange={(e) => handleFilterChange('tier', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">{t('admin.users.allTiers', 'All Tiers')}</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="ultimate">Ultimate</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">{t('admin.users.allStatuses', 'All Statuses')}</option>
          <option value="student">{t('admin.users.student', 'Student')}</option>
          <option value="worker">{t('admin.users.worker', 'Worker')}</option>
          <option value="job_seeker">{t('admin.users.jobSeeker', 'Job Seeker')}</option>
          <option value="other">{t('admin.users.other', 'Other')}</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.users.loading', 'Loading users...')}</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          <span>{error}</span>
          <button onClick={fetchUsers} className={styles.retryBtn}>
            {t('admin.users.retry', 'Retry')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.users.user', 'User')}</th>
                  <th>{t('admin.users.status', 'Status')}</th>
                  <th>{t('admin.users.tier', 'Tier')}</th>
                  <th>{t('admin.users.joined', 'Joined')}</th>
                  <th>{t('admin.users.lastSeen', 'Last Seen')}</th>
                  <th>{t('admin.users.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" />
                          ) : (
                            <i className="ri-user-line" />
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {user.full_name || t('admin.users.noName', 'No name')}
                          </span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.statusBadge}`}>
                        {user.status || 'other'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[user.subscription_tier || 'free']}`}>
                        {user.subscription_tier || 'free'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className={styles.dateCell}>
                      {user.last_seen_at 
                        ? new Date(user.last_seen_at).toLocaleDateString() 
                        : t('admin.users.never', 'Never')}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link 
                          to={`${ROUTES.ADMIN_USERS}/${user.id}`}
                          className={styles.actionBtn}
                          title={t('admin.users.view', 'View')}
                        >
                          <i className="ri-eye-line" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      {t('admin.users.noUsers', 'No users found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className={styles.pageBtn}
              >
                <i className="ri-arrow-left-line" />
              </button>
              <span className={styles.pageInfo}>
                {t('admin.users.page', 'Page')} {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className={styles.pageBtn}
              >
                <i className="ri-arrow-right-line" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
