import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import styles from '../shared/ContentManagement.module.css'

export default function AdminRenting() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [categories, setCategories] = useState([])
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [platformToDelete, setPlatformToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Predefined categories based on data.json structure
  const categoryOptions = [
    { value: 'majorPortals', label: t('admin.renting.categories.majorPortals', 'Major Portals') },
    { value: 'studentHousing', label: t('admin.renting.categories.studentHousing', 'Student Housing') },
    { value: 'socialHousing', label: t('admin.renting.categories.socialHousing', 'Social Housing') },
    { value: 'privateRentals', label: t('admin.renting.categories.privateRentals', 'Private Rentals') },
    { value: 'sharedHousing', label: t('admin.renting.categories.sharedHousing', 'Shared Housing') },
    { value: 'shortTerm', label: t('admin.renting.categories.shortTerm', 'Short Term') },
    { value: 'agencies', label: t('admin.renting.categories.agencies', 'Agencies') },
  ]

  // Fetch platforms
  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN.RENTING}?${params}`)
      
      setPlatforms(response.data?.platforms || [])
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 0,
      }))
      
      // Extract unique categories from data
      if (categories.length === 0) {
        try {
          const catsRes = await apiFetch(`${API_ENDPOINTS.ADMIN.RENTING}/categories`)
          setCategories(catsRes.data || [])
        } catch {
          // Fallback to predefined categories
          setCategories(categoryOptions.map(c => c.value))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, categories.length])

  useEffect(() => {
    fetchPlatforms()
  }, [fetchPlatforms])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('category', categoryFilter)
    setSearchParams(params, { replace: true })
  }, [search, categoryFilter, setSearchParams])

  // Handle search
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle filter changes
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedPlatform({
      platform_name: '',
      platform_url: '',
      platform_description: '',
      category: 'majorPortals',
      platform_data: {},
    })
    setModalMode('create')
    setShowModal(true)
  }

  const openEditModal = (platform) => {
    setSelectedPlatform({ ...platform })
    setModalMode('edit')
    setShowModal(true)
  }

  const openViewModal = (platform) => {
    setSelectedPlatform(platform)
    setModalMode('view')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPlatform(null)
    setModalMode('create')
  }

  // Save platform (create or update)
  const handleSave = async () => {
    if (!selectedPlatform) return
    
    try {
      setSaving(true)
      
      const payload = {
        platform_name: selectedPlatform.platform_name,
        platform_url: selectedPlatform.platform_url,
        platform_description: selectedPlatform.platform_description,
        category: selectedPlatform.category,
        platform_data: selectedPlatform.platform_data || {},
      }

      if (modalMode === 'create') {
        await apiFetch(API_ENDPOINTS.ADMIN.RENTING, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch(API_ENDPOINTS.ADMIN.RENTING_PLATFORM(selectedPlatform.id), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }

      closeModal()
      fetchPlatforms()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete platform
  const handleDelete = async () => {
    if (!platformToDelete) return
    
    try {
      setSaving(true)
      await apiFetch(API_ENDPOINTS.ADMIN.RENTING_PLATFORM(platformToDelete.id), {
        method: 'DELETE',
      })
      setShowDeleteConfirm(false)
      setPlatformToDelete(null)
      fetchPlatforms()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate stats from actual data
  const getStats = () => {
    const categoryCounts = platforms.reduce((acc, plat) => {
      const cat = plat.category || 'unknown'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    const withUrl = platforms.filter(p => p.platform_url).length

    return { categoryCounts, withUrl }
  }

  const stats = getStats()

  // Pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Get category label
  const getCategoryLabel = (cat) => {
    return categoryOptions.find(c => c.value === cat)?.label || cat || '-'
  }

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'majorPortals': 'ri-global-line',
      'studentHousing': 'ri-graduation-cap-line',
      'socialHousing': 'ri-community-line',
      'privateRentals': 'ri-key-line',
      'sharedHousing': 'ri-group-line',
      'shortTerm': 'ri-calendar-line',
      'agencies': 'ri-building-line',
    }
    return icons[category] || 'ri-home-line'
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{t('admin.renting.title', 'Rental Platforms')}</h1>
          <p>{t('admin.renting.subtitle', 'Manage housing and rental platform resources')}</p>
        </div>
        <button className={styles.addButton} onClick={openCreateModal}>
          <i className="ri-add-line" />
          {t('admin.renting.addPlatform', 'Add Platform')}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-home-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pagination.total}</span>
            <span className={styles.statLabel}>{t('admin.renting.totalPlatforms', 'Total Platforms')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-folder-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{Object.keys(stats.categoryCounts).length}</span>
            <span className={styles.statLabel}>{t('admin.renting.categories', 'Categories')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-link" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.withUrl}</span>
            <span className={styles.statLabel}>{t('admin.renting.withUrls', 'With URLs')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-graduation-cap-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.categoryCounts['studentHousing'] || 0}</span>
            <span className={styles.statLabel}>{t('admin.renting.studentHousing', 'Student Housing')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.renting.searchPlaceholder', 'Search platforms...')}
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <select value={categoryFilter} onChange={handleCategoryChange} className={styles.filterSelect}>
          <option value="">{t('admin.renting.allCategories', 'All Categories')}</option>
          {categoryOptions.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        
        {(search || categoryFilter) && (
          <button className={styles.clearButton} onClick={clearFilters}>
            <i className="ri-close-line" />
            {t('admin.clear', 'Clear')}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          {error}
          <button onClick={() => setError(null)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Platforms table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.loading', 'Loading...')}</span>
        </div>
      ) : platforms.length === 0 ? (
        <div className={styles.empty}>
          <i className="ri-home-line" />
          <p>{t('admin.renting.noPlatforms', 'No platforms found')}</p>
          {(search || categoryFilter) && (
            <button onClick={clearFilters} className={styles.secondaryButton}>
              {t('admin.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.renting.platform', 'Platform')}</th>
                <th>{t('admin.renting.category', 'Category')}</th>
                <th>{t('admin.renting.url', 'Website')}</th>
                <th>{t('admin.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map(platform => (
                <tr key={platform.id}>
                  <td className={styles.nameCell}>
                    <span className={styles.itemName}>{platform.platform_name}</span>
                    <span className={styles.itemDesc}>
                      {platform.platform_description?.substring(0, 80)}
                      {platform.platform_description?.length > 80 ? '...' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgePrimary}>
                      <i className={getCategoryIcon(platform.category)} />
                      {getCategoryLabel(platform.category)}
                    </span>
                  </td>
                  <td>
                    {platform.platform_url ? (
                      <a
                        href={platform.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.badge + ' ' + styles.badgeInfo}
                        style={{ textDecoration: 'none' }}
                      >
                        <i className="ri-external-link-line" />
                        {new URL(platform.platform_url).hostname.replace('www.', '')}
                      </a>
                    ) : (
                      <span className={styles.badge + ' ' + styles.badgeSecondary}>
                        {t('admin.renting.noUrl', 'No URL')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => openViewModal(platform)}
                        title={t('admin.view', 'View')}
                      >
                        <i className="ri-eye-line" />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => openEditModal(platform)}
                        title={t('admin.edit', 'Edit')}
                      >
                        <i className="ri-edit-line" />
                      </button>
                      {platform.platform_url && (
                        <a
                          className={styles.actionButton + ' ' + styles.external}
                          href={platform.platform_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.openWebsite', 'Open Website')}
                        >
                          <i className="ri-external-link-line" />
                        </a>
                      )}
                      <button
                        className={`${styles.actionButton} ${styles.danger}`}
                        onClick={() => {
                          setPlatformToDelete(platform)
                          setShowDeleteConfirm(true)
                        }}
                        title={t('admin.delete', 'Delete')}
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              
              <span className={styles.pageInfo}>
                {t('admin.page', 'Page')} {pagination.page} {t('admin.of', 'of')} {pagination.totalPages}
              </span>
              
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit/View Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'create' && t('admin.renting.createPlatform', 'Add Rental Platform')}
                {modalMode === 'edit' && t('admin.renting.editPlatform', 'Edit Rental Platform')}
                {modalMode === 'view' && t('admin.renting.viewPlatform', 'Platform Details')}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="ri-close-line" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.viewDetails}>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.renting.platformName', 'Platform Name')}</label>
                    <p>{selectedPlatform?.platform_name}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.renting.description', 'Description')}</label>
                    <p>{selectedPlatform?.platform_description || '-'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.renting.category', 'Category')}</label>
                      <p>{getCategoryLabel(selectedPlatform?.category)}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.renting.url', 'Website URL')}</label>
                      <p>
                        {selectedPlatform?.platform_url ? (
                          <a href={selectedPlatform.platform_url} target="_blank" rel="noopener noreferrer">
                            {selectedPlatform.platform_url}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                  {selectedPlatform?.platform_data && Object.keys(selectedPlatform.platform_data).length > 0 && (
                    <div className={styles.detailGroup}>
                      <label>{t('admin.renting.platformData', 'Additional Data (JSON)')}</label>
                      <pre className={styles.jsonPreview}>
                        {JSON.stringify(selectedPlatform.platform_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.created', 'Created')}</label>
                      <p>{selectedPlatform?.created_at ? new Date(selectedPlatform.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.updated', 'Updated')}</label>
                      <p>{selectedPlatform?.updated_at ? new Date(selectedPlatform.updated_at).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={e => e.preventDefault()}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.renting.platformName', 'Platform Name')} <span>*</span></label>
                    <input
                      type="text"
                      value={selectedPlatform?.platform_name || ''}
                      onChange={e => setSelectedPlatform({ ...selectedPlatform, platform_name: e.target.value })}
                      placeholder={t('admin.renting.namePlaceholder', 'Enter platform name')}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.renting.description', 'Description')}</label>
                    <textarea
                      value={selectedPlatform?.platform_description || ''}
                      onChange={e => setSelectedPlatform({ ...selectedPlatform, platform_description: e.target.value })}
                      placeholder={t('admin.renting.descriptionPlaceholder', 'Enter description')}
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.renting.category', 'Category')} <span>*</span></label>
                      <select
                        value={selectedPlatform?.category || 'majorPortals'}
                        onChange={e => setSelectedPlatform({ ...selectedPlatform, category: e.target.value })}
                      >
                        {categoryOptions.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.renting.url', 'Website URL')}</label>
                      <input
                        type="url"
                        value={selectedPlatform?.platform_url || ''}
                        onChange={e => setSelectedPlatform({ ...selectedPlatform, platform_url: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  </div>

                  <div className={styles.sectionDivider}>
                    <span>{t('admin.renting.additionalData', 'Additional Data')}</span>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.renting.platformDataJson', 'Platform Data (JSON)')}</label>
                    <textarea
                      value={JSON.stringify(selectedPlatform?.platform_data || {}, null, 2)}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setSelectedPlatform({ ...selectedPlatform, platform_data: parsed })
                        } catch {
                          // Keep the raw text
                        }
                      }}
                      placeholder='{"features": [], "pricing": "", "coverage": []}'
                      rows={6}
                      style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                    />
                    <span className={styles.formHint}>
                      {t('admin.renting.jsonHint', 'Enter features, pricing, and other details in JSON format')}
                    </span>
                  </div>
                </form>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={closeModal}>
                {modalMode === 'view' 
                  ? t('admin.close', 'Close')
                  : t('admin.cancel', 'Cancel')
                }
              </button>
              {modalMode !== 'view' && (
                <button
                  className={styles.primaryButton}
                  onClick={handleSave}
                  disabled={saving || !selectedPlatform?.platform_name}
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" />
                      {t('admin.saving', 'Saving...')}
                    </>
                  ) : modalMode === 'create' ? (
                    <>
                      <i className="ri-add-line" />
                      {t('admin.create', 'Create')}
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line" />
                      {t('admin.save', 'Save')}
                    </>
                  )}
                </button>
              )}
              {modalMode === 'view' && (
                <button
                  className={styles.primaryButton}
                  onClick={() => setModalMode('edit')}
                >
                  <i className="ri-edit-line" />
                  {t('admin.edit', 'Edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <div className={styles.deleteConfirm}>
                <i className="ri-delete-bin-line" />
                <h3>{t('admin.renting.deleteConfirm', 'Delete Platform?')}</h3>
                <p>
                  {t('admin.renting.deleteWarning', 'Are you sure you want to delete')} <strong>{platformToDelete?.platform_name}</strong>?
                  {t('admin.renting.deleteNote', ' This action cannot be undone.')}
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('admin.cancel', 'Cancel')}
              </button>
              <button
                className={styles.dangerButton}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" />
                    {t('admin.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line" />
                    {t('admin.delete', 'Delete')}
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
