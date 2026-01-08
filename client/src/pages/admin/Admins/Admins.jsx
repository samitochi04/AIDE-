import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api, API_ENDPOINTS } from '../../../config/api'
import { useAdmin } from '../../../context/AdminContext'
import { ADMIN_ROLES } from '../../../config/adminConstants'
import styles from './Admins.module.css'

// Available permissions for admins
const PERMISSIONS = [
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'manage_content', label: 'Manage Content' },
  { key: 'manage_affiliates', label: 'Manage Affiliates' },
  { key: 'manage_subscriptions', label: 'Manage Subscriptions' },
  { key: 'view_analytics', label: 'View Analytics' },
  { key: 'send_bulk_emails', label: 'Send Bulk Emails' },
  { key: 'manage_settings', label: 'Manage Settings' },
]

// Available admin roles
const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'support', label: 'Support' },
]

export default function Admins() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAdmin()
  
  // State
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', role: '' })
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin',
    permissions: {},
  })

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (filters.search) params.set('search', filters.search)
      if (filters.role) params.set('role', filters.role)
      
      const response = await api.get(`${API_ENDPOINTS.ADMIN.ADMINS}?${params}`)
      
      if (response.success) {
        setAdmins(response.data?.admins || response.data || [])
        if (response.data?.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || 0,
            totalPages: response.data.pagination.totalPages || 0,
          }))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchAdmins()
    } else {
      setLoading(false)
      setError(t('admin.admins.accessDenied', 'Access denied. Super Admin only.'))
    }
  }, [fetchAdmins, isSuperAdmin])

  // Handle search
  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle role filter
  const handleRoleFilter = (e) => {
    setFilters(prev => ({ ...prev, role: e.target.value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      email: '',
      role: 'admin',
      permissions: {},
    })
    setModalMode('create')
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (admin) => {
    setSelectedAdmin(admin)
    setFormData({
      email: admin.user?.email || admin.email || '',
      role: admin.role || 'admin',
      permissions: admin.permissions || {},
    })
    setModalMode('edit')
    setShowModal(true)
  }

  // Open view modal
  const openViewModal = (admin) => {
    setSelectedAdmin(admin)
    setModalMode('view')
    setShowModal(true)
  }

  // Handle form change
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Toggle permission
  const togglePermission = (permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }))
  }

  // Save admin (create or update)
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      if (modalMode === 'create') {
        const response = await api.post(API_ENDPOINTS.ADMIN.ADMINS, {
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
        })
        
        if (response.success) {
          setShowModal(false)
          fetchAdmins()
        }
      } else if (modalMode === 'edit') {
        const response = await api.patch(API_ENDPOINTS.ADMIN.ADMIN_USER(selectedAdmin.id), {
          role: formData.role,
          permissions: formData.permissions,
        })
        
        if (response.success) {
          setShowModal(false)
          fetchAdmins()
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Confirm delete
  const confirmDelete = (admin) => {
    setAdminToDelete(admin)
    setShowDeleteConfirm(true)
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      setSaving(true)
      const response = await api.delete(API_ENDPOINTS.ADMIN.ADMIN_USER(adminToDelete.id))
      
      if (response.success) {
        setShowDeleteConfirm(false)
        setAdminToDelete(null)
        fetchAdmins()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#8b5cf6'
      case 'admin': return '#3b82f6'
      case 'moderator': return '#22c55e'
      case 'support': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  // Check if super admin only access
  if (!isSuperAdmin()) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="ri-shield-cross-line" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h3>{t('admin.admins.accessDenied', 'Access Denied')}</h3>
          <p>{t('admin.admins.superAdminOnly', 'This section is only accessible to Super Admins.')}</p>
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
            <i className="ri-shield-user-line" style={{ marginRight: '0.5rem' }} />
            {t('admin.admins.title', 'Admins')}
          </h1>
          <p className={styles.subtitle}>
            {t('admin.admins.subtitle', 'Manage admin accounts and permissions')}
          </p>
        </div>
        <button className={styles.addBtn} onClick={openCreateModal}>
          <i className="ri-user-add-line" />
          {t('admin.admins.addAdmin', 'Add Admin')}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.admins.searchPlaceholder', 'Search by email...')}
            value={filters.search}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filters.role}
          onChange={handleRoleFilter}
          className={styles.filterSelect}
        >
          <option value="">{t('admin.admins.allRoles', 'All Roles')}</option>
          {ROLES.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('common.loading', 'Loading...')}</span>
        </div>
      ) : error && !admins.length ? (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          <span>{error}</span>
          <button onClick={fetchAdmins} className={styles.retryBtn}>
            {t('common.retry', 'Retry')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.admins.admin', 'Admin')}</th>
                  <th>{t('admin.admins.role', 'Role')}</th>
                  <th>{t('admin.admins.permissions', 'Permissions')}</th>
                  <th>{t('admin.admins.created', 'Created')}</th>
                  <th>{t('admin.admins.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          <i className="ri-shield-user-line" />
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {admin.user?.full_name || 'Admin'}
                          </span>
                          <span className={styles.userEmail}>
                            {admin.user?.email || admin.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          background: `${getRoleColor(admin.role)}15`,
                          color: getRoleColor(admin.role),
                        }}
                      >
                        {admin.role?.replace('_', ' ') || 'admin'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {admin.role === 'super_admin' ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            All permissions
                          </span>
                        ) : (
                          PERMISSIONS.filter(p => admin.permissions?.[p.key]).slice(0, 2).map(p => (
                            <span 
                              key={p.key}
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.5rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.25rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {p.label}
                            </span>
                          ))
                        )}
                        {admin.role !== 'super_admin' && 
                          Object.values(admin.permissions || {}).filter(Boolean).length > 2 && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                            +{Object.values(admin.permissions).filter(Boolean).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(admin.created_at)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => openViewModal(admin)} 
                          className={styles.actionBtn}
                          title={t('common.view', 'View')}
                        >
                          <i className="ri-eye-line" />
                        </button>
                        <button 
                          onClick={() => openEditModal(admin)} 
                          className={styles.actionBtn}
                          title={t('common.edit', 'Edit')}
                        >
                          <i className="ri-edit-line" />
                        </button>
                        {admin.role !== 'super_admin' && (
                          <button 
                            onClick={() => confirmDelete(admin)} 
                            className={styles.actionBtn}
                            style={{ color: 'var(--color-error)' }}
                            title={t('common.delete', 'Delete')}
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      {t('admin.admins.noAdmins', 'No admins found')}
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
                {t('admin.common.page', 'Page')} {pagination.page} / {pagination.totalPages}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {modalMode === 'create' && t('admin.admins.addAdmin', 'Add Admin')}
                {modalMode === 'edit' && t('admin.admins.editAdmin', 'Edit Admin')}
                {modalMode === 'view' && t('admin.admins.viewAdmin', 'Admin Details')}
              </h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <i className="ri-close-line" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.adminDetails}>
                  {/* Admin Header */}
                  <div className={styles.adminHeader}>
                    <div className={styles.adminAvatarLarge}>
                      {selectedAdmin?.user?.avatar_url ? (
                        <img src={selectedAdmin.user.avatar_url} alt="" />
                      ) : (
                        <i className="ri-shield-user-line" />
                      )}
                    </div>
                    <div className={styles.adminHeaderInfo}>
                      <h4>{selectedAdmin?.user?.full_name || t('admin.admins.unnamed', 'Unnamed Admin')}</h4>
                      <p>{selectedAdmin?.user?.email}</p>
                      <span 
                        className={styles.roleBadge}
                        style={{ 
                          background: `${getRoleColor(selectedAdmin?.role)}15`,
                          color: getRoleColor(selectedAdmin?.role)
                        }}
                      >
                        {selectedAdmin?.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Admin Info Section */}
                  <div className={styles.adminSection}>
                    <h5>{t('admin.admins.accountInfo', 'Account Information')}</h5>
                    <div className={styles.adminInfoGrid}>
                      <div className={styles.adminInfoItem}>
                        <span className={styles.adminInfoLabel}>
                          <i className="ri-mail-line" />
                          {t('admin.admins.email', 'Email')}
                        </span>
                        <span className={styles.adminInfoValue}>
                          {selectedAdmin?.user?.email || '-'}
                        </span>
                      </div>
                      <div className={styles.adminInfoItem}>
                        <span className={styles.adminInfoLabel}>
                          <i className="ri-calendar-line" />
                          {t('admin.admins.created', 'Created')}
                        </span>
                        <span className={styles.adminInfoValue}>
                          {formatDate(selectedAdmin?.created_at)}
                        </span>
                      </div>
                      <div className={styles.adminInfoItem}>
                        <span className={styles.adminInfoLabel}>
                          <i className="ri-shield-check-line" />
                          {t('admin.admins.role', 'Role')}
                        </span>
                        <span className={styles.adminInfoValue} style={{ textTransform: 'capitalize' }}>
                          {selectedAdmin?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={styles.adminInfoItem}>
                        <span className={styles.adminInfoLabel}>
                          <i className="ri-id-card-line" />
                          {t('admin.admins.adminId', 'Admin ID')}
                        </span>
                        <span className={styles.adminInfoValue} style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          {selectedAdmin?.id?.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className={styles.adminSection}>
                    <h5>{t('admin.admins.permissions', 'Permissions')}</h5>
                    {selectedAdmin?.role === 'super_admin' ? (
                      <div className={styles.superAdminBadge}>
                        <i className="ri-vip-crown-line" />
                        <span>{t('admin.admins.allPermissions', 'All permissions (Super Admin)')}</span>
                      </div>
                    ) : (
                      <div className={styles.permissionsViewGrid}>
                        {PERMISSIONS.map(p => (
                          <div 
                            key={p.key} 
                            className={`${styles.permissionViewItem} ${selectedAdmin?.permissions?.[p.key] ? styles.permissionActive : ''}`}
                          >
                            <i className={selectedAdmin?.permissions?.[p.key] ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} />
                            <span>{p.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {modalMode === 'create' && (
                    <div className={styles.formGroup}>
                      <label>{t('admin.admins.userEmail', 'User Email')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="admin@example.com"
                        className={styles.input}
                      />
                      <small style={{ color: 'var(--text-tertiary)' }}>
                        {t('admin.admins.emailHint', 'Enter the email of an existing user to grant admin access')}
                      </small>
                    </div>
                  )}
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.admins.role', 'Role')}</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className={styles.input}
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.role !== 'super_admin' && (
                    <div className={styles.formGroup}>
                      <label>{t('admin.admins.permissions', 'Permissions')}</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {PERMISSIONS.map(perm => (
                          <label key={perm.key} className={styles.checkboxLabel} style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.permissions[perm.key] || false}
                              onChange={() => togglePermission(perm.key)}
                            />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.role === 'super_admin' && (
                    <div style={{ 
                      padding: '1rem', 
                      background: 'rgba(139, 92, 246, 0.1)', 
                      borderRadius: '0.5rem',
                      color: '#8b5cf6',
                      fontSize: '0.875rem',
                    }}>
                      <i className="ri-information-line" style={{ marginRight: '0.5rem' }} />
                      {t('admin.admins.superAdminNote', 'Super Admins have all permissions by default.')}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              {modalMode === 'view' ? (
                <button onClick={() => openEditModal(selectedAdmin)} className={styles.saveBtn}>
                  <i className="ri-edit-line" /> {t('common.edit', 'Edit')}
                </button>
              ) : (
                <>
                  <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                    {saving ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-save-line" />}
                    {' '}{t('common.save', 'Save')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && adminToDelete && (
        <div className={styles.modal} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3>{t('admin.admins.removeAdmin', 'Remove Admin')}</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.closeBtn}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                {t('admin.admins.removeConfirm', 'Are you sure you want to remove admin privileges from')} <strong>{adminToDelete.user?.email || adminToDelete.email}</strong>?
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {t('admin.admins.removeNote', 'The user account will remain active, but they will no longer have admin access.')}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelBtn}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button 
                onClick={handleDelete} 
                disabled={saving} 
                className={styles.deleteBtn}
                style={{ background: 'var(--color-error)' }}
              >
                {saving ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-delete-bin-line" />}
                {' '}{t('common.remove', 'Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
