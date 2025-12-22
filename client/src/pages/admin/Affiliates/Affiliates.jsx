import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api, API_ENDPOINTS } from '../../../config/api'
import { useAdmin } from '../../../context/AdminContext'
import styles from '../Users/Users.module.css'

export default function AdminAffiliates() {
  const { t } = useTranslation()
  const { hasPermission } = useAdmin()

  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('view')
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
      })
      const response = await api.get(`${API_ENDPOINTS.ADMIN.AFFILIATES}?${params}`)
      if (response.success) {
        setAffiliates(response.data.affiliates || response.data || [])
        if (response.data.pagination) {
          setPagination(prev => ({ ...prev, ...response.data.pagination }))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchAffiliates()
  }, [fetchAffiliates])

  // Debounced search handler
  const handleSearch = (e) => {
    const value = e.target.value
    setSearchInput(value)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
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

  const handleView = async (affiliate) => {
    try {
      const statsRes = await api.get(`${API_ENDPOINTS.ADMIN.AFFILIATES}/${affiliate.id}/stats`)
      setSelectedAffiliate({ ...affiliate, stats: statsRes.data })
    } catch {
      setSelectedAffiliate(affiliate)
    }
    setEditForm(affiliate)
    setModalMode('view')
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await api.patch(`${API_ENDPOINTS.ADMIN.AFFILIATES}/${selectedAffiliate.id}`, {
        status: editForm.status,
        commission_rate: editForm.commission_rate,
        is_verified: editForm.is_verified,
      })
      if (response.success) {
        fetchAffiliates()
        setShowModal(false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (affiliateId) => {
    try {
      setSaving(true)
      await api.patch(`${API_ENDPOINTS.ADMIN.AFFILIATES}/${affiliateId}`, {
        status: 'approved',
        is_verified: true,
      })
      fetchAffiliates()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (affiliateId) => {
    try {
      setSaving(true)
      await api.patch(`${API_ENDPOINTS.ADMIN.AFFILIATES}/${affiliateId}`, {
        status: 'rejected',
      })
      fetchAffiliates()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'var(--color-success)'
      case 'pending': return 'var(--color-warning)'
      case 'rejected': return 'var(--color-error)'
      default: return 'var(--color-text-secondary)'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.affiliates.title', 'Affiliates')}</h1>
          <p className={styles.subtitle}>{t('admin.affiliates.subtitle', 'Manage affiliate partners')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.affiliates.searchPlaceholder', 'Search affiliates...')}
            value={searchInput}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, status: e.target.value }))
            setPagination(prev => ({ ...prev, page: 1 }))
          }}
          className={styles.filterSelect}
        >
          <option value="">{t('admin.affiliates.allStatuses', 'All Statuses')}</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('common.loading', 'Loading...')}</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          <span>{error}</span>
          <button onClick={fetchAffiliates} className={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Code</th>
                  <th>Commission</th>
                  <th>Referrals</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          <i className="ri-user-star-line" />
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {affiliate.user?.full_name || affiliate.company_name || 'Unknown'}
                          </span>
                          <span className={styles.userEmail}>
                            {affiliate.user?.email || affiliate.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--color-bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        {affiliate.affiliate_code || '-'}
                      </code>
                    </td>
                    <td>{affiliate.commission_rate || 10}%</td>
                    <td>{affiliate.total_referrals || 0}</td>
                    <td>€{(affiliate.total_earnings || 0).toFixed(2)}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                        background: `${getStatusColor(affiliate.status)}15`,
                        color: getStatusColor(affiliate.status),
                      }}>
                        {affiliate.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => handleView(affiliate)} className={styles.actionBtn} title="View">
                          <i className="ri-eye-line" />
                        </button>
                        {affiliate.status === 'pending' && hasPermission('manage_affiliates') && (
                          <>
                            <button onClick={() => handleApprove(affiliate.id)} className={styles.actionBtn} style={{ color: 'var(--color-success)' }} disabled={saving}>
                              <i className="ri-check-line" />
                            </button>
                            <button onClick={() => handleReject(affiliate.id)} className={styles.actionBtn} style={{ color: 'var(--color-error)' }} disabled={saving}>
                              <i className="ri-close-line" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>No affiliates found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className={styles.pageBtn}>
                <i className="ri-arrow-left-line" />
              </button>
              <span className={styles.pageInfo}>Page {pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className={styles.pageBtn}>
                <i className="ri-arrow-right-line" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && selectedAffiliate && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === 'view' ? 'Affiliate Details' : 'Edit Affiliate'}</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Name</label>
                      <p>{selectedAffiliate.user?.full_name || selectedAffiliate.company_name || '-'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Email</label>
                      <p>{selectedAffiliate.user?.email || selectedAffiliate.email}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Affiliate Code</label>
                      <p><code>{selectedAffiliate.affiliate_code || '-'}</code></p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Commission Rate</label>
                      <p>{selectedAffiliate.commission_rate || 10}%</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Total Referrals</label>
                      <p>{selectedAffiliate.total_referrals || 0}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Total Earnings</label>
                      <p>€{(selectedAffiliate.total_earnings || 0).toFixed(2)}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Pending Payout</label>
                      <p>€{(selectedAffiliate.pending_payout || 0).toFixed(2)}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Status</label>
                      <p style={{ color: getStatusColor(selectedAffiliate.status), textTransform: 'capitalize' }}>
                        {selectedAffiliate.status || 'pending'}
                      </p>
                    </div>
                  </div>
                  {hasPermission('manage_affiliates') && (
                    <div className={styles.modalActions}>
                      <button onClick={() => setModalMode('edit')} className={styles.editBtn}>
                        <i className="ri-edit-line" /> Edit
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={editForm.status || 'pending'} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Commission Rate (%)</label>
                    <input type="number" min="0" max="50" value={editForm.commission_rate || 10} onChange={(e) => setEditForm(prev => ({ ...prev, commission_rate: parseInt(e.target.value) }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={editForm.is_verified || false} onChange={(e) => setEditForm(prev => ({ ...prev, is_verified: e.target.checked }))} />
                      Verified
                    </label>
                  </div>
                  <div className={styles.modalActions}>
                    <button onClick={() => setModalMode('view')} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                      {saving ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-save-line" />} Save
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
