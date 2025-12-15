import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import styles from '../shared/ContentManagement.module.css'

export default function AdminGovAides() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State
  const [aides, setAides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [regionFilter, setRegionFilter] = useState(searchParams.get('region') || '')
  const [profileFilter, setProfileFilter] = useState(searchParams.get('profile') || '')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedAide, setSelectedAide] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [aideToDelete, setAideToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Profile types for filter (matching DB schema: french, eu, non_eu, all)
  const profileTypes = [
    { value: 'french', label: t('admin.govAides.profiles.french', 'French') },
    { value: 'eu', label: t('admin.govAides.profiles.eu', 'EU Citizens') },
    { value: 'non_eu', label: t('admin.govAides.profiles.nonEu', 'Non-EU') },
    { value: 'all', label: t('admin.govAides.profiles.all', 'All Profiles') },
  ]

  // Profile subtypes
  const profileSubtypes = [
    { value: 'student', label: t('admin.govAides.subtypes.student', 'Student') },
    { value: 'worker', label: t('admin.govAides.subtypes.worker', 'Worker') },
    { value: 'family', label: t('admin.govAides.subtypes.family', 'Family') },
    { value: 'senior', label: t('admin.govAides.subtypes.senior', 'Senior') },
    { value: 'unemployed', label: t('admin.govAides.subtypes.unemployed', 'Unemployed') },
  ]

  // French regions (static list - no API call needed)
  const frenchRegions = [
    { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
    { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
    { value: 'bretagne', label: 'Bretagne' },
    { value: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
    { value: 'corse', label: 'Corse' },
    { value: 'grand-est', label: 'Grand Est' },
    { value: 'hauts-de-france', label: 'Hauts-de-France' },
    { value: 'ile-de-france', label: 'Île-de-France' },
    { value: 'normandie', label: 'Normandie' },
    { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
    { value: 'occitanie', label: 'Occitanie' },
    { value: 'pays-de-la-loire', label: 'Pays de la Loire' },
    { value: 'provence-alpes-cote-dazur', label: "Provence-Alpes-Côte d'Azur" },
    { value: 'national', label: 'National (All France)' },
  ]

  // Fetch aides
  const fetchAides = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.set('search', search)
      if (regionFilter) params.set('region', regionFilter)
      if (profileFilter) params.set('profileType', profileFilter)
      
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN.GOV_AIDES}?${params}`)
      
      setAides(response.data?.aides || [])
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 0,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, regionFilter, profileFilter])

  useEffect(() => {
    fetchAides()
  }, [fetchAides])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (regionFilter) params.set('region', regionFilter)
    if (profileFilter) params.set('profile', profileFilter)
    setSearchParams(params, { replace: true })
  }, [search, regionFilter, profileFilter, setSearchParams])

  // Handle search with debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle filter changes
  const handleRegionChange = (e) => {
    setRegionFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleProfileChange = (e) => {
    setProfileFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setRegionFilter('')
    setProfileFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedAide({
      aide_name: '',
      aide_description: '',
      region_id: '',
      region_name: '',
      profile_type: 'all',
      profile_subtype: '',
      aide_category: '',
      aide_data: {},
      source_url: '',
    })
    setModalMode('create')
    setShowModal(true)
  }

  const openEditModal = (aide) => {
    setSelectedAide({ ...aide })
    setModalMode('edit')
    setShowModal(true)
  }

  const openViewModal = (aide) => {
    setSelectedAide(aide)
    setModalMode('view')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedAide(null)
    setModalMode('create')
  }

  // Save aide (create or update)
  const handleSave = async () => {
    if (!selectedAide) return
    
    try {
      setSaving(true)
      
      const payload = {
        aide_name: selectedAide.aide_name,
        aide_description: selectedAide.aide_description,
        region_id: selectedAide.region_id,
        region_name: selectedAide.region_name,
        profile_type: selectedAide.profile_type,
        profile_subtype: selectedAide.profile_subtype,
        aide_category: selectedAide.aide_category,
        aide_data: selectedAide.aide_data || {},
        source_url: selectedAide.source_url,
      }

      if (modalMode === 'create') {
        await apiFetch(API_ENDPOINTS.ADMIN.GOV_AIDES, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch(API_ENDPOINTS.ADMIN.GOV_AIDE(selectedAide.id), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }

      closeModal()
      fetchAides()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete aide
  const handleDelete = async () => {
    if (!aideToDelete) return
    
    try {
      setSaving(true)
      await apiFetch(API_ENDPOINTS.ADMIN.GOV_AIDE(aideToDelete.id), {
        method: 'DELETE',
      })
      setShowDeleteConfirm(false)
      setAideToDelete(null)
      fetchAides()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate stats from actual data
  const getStats = () => {
    const profileCounts = aides.reduce((acc, aide) => {
      const type = aide.profile_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const categoryCounts = aides.reduce((acc, aide) => {
      const cat = aide.aide_category || 'uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    return { profileCounts, categoryCounts }
  }

  const stats = getStats()

  // Pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Format profile type label
  const getProfileLabel = (type) => {
    const profile = profileTypes.find(p => p.value === type)
    return profile?.label || type || '-'
  }

  // Format profile subtype label
  const getSubtypeLabel = (subtype) => {
    const st = profileSubtypes.find(s => s.value === subtype)
    return st?.label || subtype || '-'
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{t('admin.govAides.title', 'Government Aides')}</h1>
          <p>{t('admin.govAides.subtitle', 'Manage regional government assistance programs')}</p>
        </div>
        <button className={styles.addButton} onClick={openCreateModal}>
          <i className="ri-add-line" />
          {t('admin.govAides.addAide', 'Add Aide')}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-hand-heart-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pagination.total}</span>
            <span className={styles.statLabel}>{t('admin.govAides.totalAides', 'Total Aides')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-map-pin-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{frenchRegions.length}</span>
            <span className={styles.statLabel}>{t('admin.govAides.regions', 'Regions')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-user-3-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{Object.keys(stats.profileCounts).length}</span>
            <span className={styles.statLabel}>{t('admin.govAides.profileTypes', 'Profile Types')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-folder-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{Object.keys(stats.categoryCounts).length}</span>
            <span className={styles.statLabel}>{t('admin.govAides.categories', 'Categories')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.govAides.searchPlaceholder', 'Search aides...')}
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <select value={regionFilter} onChange={handleRegionChange} className={styles.filterSelect}>
          <option value="">{t('admin.govAides.allRegions', 'All Regions')}</option>
          {frenchRegions.map(region => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
        
        <select value={profileFilter} onChange={handleProfileChange} className={styles.filterSelect}>
          <option value="">{t('admin.govAides.allProfiles', 'All Profiles')}</option>
          {profileTypes.map(profile => (
            <option key={profile.value} value={profile.value}>
              {profile.label}
            </option>
          ))}
        </select>
        
        {(search || regionFilter || profileFilter) && (
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

      {/* Aides table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.loading', 'Loading...')}</span>
        </div>
      ) : aides.length === 0 ? (
        <div className={styles.empty}>
          <i className="ri-hand-heart-line" />
          <p>{t('admin.govAides.noAides', 'No aides found')}</p>
          {(search || regionFilter || profileFilter) && (
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
                <th>{t('admin.govAides.name', 'Name')}</th>
                <th>{t('admin.govAides.region', 'Region')}</th>
                <th>{t('admin.govAides.profile', 'Profile')}</th>
                <th>{t('admin.govAides.category', 'Category')}</th>
                <th>{t('admin.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {aides.map(aide => (
                <tr key={aide.id}>
                  <td className={styles.nameCell}>
                    <span className={styles.itemName}>{aide.aide_name}</span>
                    <span className={styles.itemDesc}>
                      {aide.aide_description?.substring(0, 80)}
                      {aide.aide_description?.length > 80 ? '...' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeInfo}>
                      <i className="ri-map-pin-line" />
                      {aide.region_name || aide.region_id || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgePrimary}>
                      {getProfileLabel(aide.profile_type)}
                    </span>
                    {aide.profile_subtype && (
                      <span className={styles.badge + ' ' + styles.badgeSecondary} style={{ marginLeft: '0.25rem' }}>
                        {getSubtypeLabel(aide.profile_subtype)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeSecondary}>
                      {aide.aide_category || '-'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => openViewModal(aide)}
                        title={t('admin.view', 'View')}
                      >
                        <i className="ri-eye-line" />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => openEditModal(aide)}
                        title={t('admin.edit', 'Edit')}
                      >
                        <i className="ri-edit-line" />
                      </button>
                      {aide.source_url && (
                        <a
                          className={styles.actionButton + ' ' + styles.external}
                          href={aide.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.openSource', 'Open Source')}
                        >
                          <i className="ri-external-link-line" />
                        </a>
                      )}
                      <button
                        className={`${styles.actionButton} ${styles.danger}`}
                        onClick={() => {
                          setAideToDelete(aide)
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
                {modalMode === 'create' && t('admin.govAides.createAide', 'Create Government Aide')}
                {modalMode === 'edit' && t('admin.govAides.editAide', 'Edit Government Aide')}
                {modalMode === 'view' && t('admin.govAides.viewAide', 'Government Aide Details')}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="ri-close-line" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.viewDetails}>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.govAides.name', 'Name')}</label>
                    <p>{selectedAide?.aide_name}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.govAides.description', 'Description')}</label>
                    <p>{selectedAide?.aide_description || '-'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.govAides.region', 'Region')}</label>
                      <p>{selectedAide?.region_name || selectedAide?.region_id || '-'}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.govAides.profile', 'Profile Type')}</label>
                      <p>{getProfileLabel(selectedAide?.profile_type)}</p>
                    </div>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.govAides.subtype', 'Profile Subtype')}</label>
                      <p>{getSubtypeLabel(selectedAide?.profile_subtype)}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.govAides.category', 'Category')}</label>
                      <p>{selectedAide?.aide_category || '-'}</p>
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.govAides.sourceUrl', 'Source URL')}</label>
                    <p>
                      {selectedAide?.source_url ? (
                        <a href={selectedAide.source_url} target="_blank" rel="noopener noreferrer">
                          {selectedAide.source_url}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                  {selectedAide?.aide_data && Object.keys(selectedAide.aide_data).length > 0 && (
                    <div className={styles.detailGroup}>
                      <label>{t('admin.govAides.aideData', 'Additional Data (JSON)')}</label>
                      <pre className={styles.jsonPreview}>
                        {JSON.stringify(selectedAide.aide_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.created', 'Created')}</label>
                      <p>{selectedAide?.created_at ? new Date(selectedAide.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.lastVerified', 'Last Verified')}</label>
                      <p>{selectedAide?.last_verified ? new Date(selectedAide.last_verified).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={e => e.preventDefault()}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.govAides.name', 'Name')} <span>*</span></label>
                    <input
                      type="text"
                      value={selectedAide?.aide_name || ''}
                      onChange={e => setSelectedAide({ ...selectedAide, aide_name: e.target.value })}
                      placeholder={t('admin.govAides.namePlaceholder', 'Enter aide name')}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.govAides.description', 'Description')} <span>*</span></label>
                    <textarea
                      value={selectedAide?.aide_description || ''}
                      onChange={e => setSelectedAide({ ...selectedAide, aide_description: e.target.value })}
                      placeholder={t('admin.govAides.descriptionPlaceholder', 'Enter description')}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.govAides.region', 'Region')} <span>*</span></label>
                      <select
                        value={selectedAide?.region_id || ''}
                        onChange={e => {
                          const region = frenchRegions.find(r => r.value === e.target.value)
                          setSelectedAide({ 
                            ...selectedAide, 
                            region_id: e.target.value,
                            region_name: region?.label || ''
                          })
                        }}
                        required
                      >
                        <option value="">{t('admin.select', 'Select region...')}</option>
                        {frenchRegions.map(region => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.govAides.regionName', 'Region Display Name')}</label>
                      <input
                        type="text"
                        value={selectedAide?.region_name || ''}
                        onChange={e => setSelectedAide({ ...selectedAide, region_name: e.target.value })}
                        placeholder="Île-de-France"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.govAides.profile', 'Profile Type')} <span>*</span></label>
                      <select
                        value={selectedAide?.profile_type || 'all'}
                        onChange={e => setSelectedAide({ ...selectedAide, profile_type: e.target.value })}
                      >
                        {profileTypes.map(profile => (
                          <option key={profile.value} value={profile.value}>
                            {profile.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.govAides.subtype', 'Profile Subtype')}</label>
                      <select
                        value={selectedAide?.profile_subtype || ''}
                        onChange={e => setSelectedAide({ ...selectedAide, profile_subtype: e.target.value })}
                      >
                        <option value="">{t('admin.select', 'Select...')}</option>
                        {profileSubtypes.map(st => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.govAides.category', 'Category')}</label>
                    <input
                      type="text"
                      value={selectedAide?.aide_category || ''}
                      onChange={e => setSelectedAide({ ...selectedAide, aide_category: e.target.value })}
                      placeholder={t('admin.govAides.categoryPlaceholder', 'e.g., housing, education, health')}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.govAides.sourceUrl', 'Source URL')}</label>
                    <input
                      type="url"
                      value={selectedAide?.source_url || ''}
                      onChange={e => setSelectedAide({ ...selectedAide, source_url: e.target.value })}
                      placeholder="https://"
                    />
                  </div>

                  <div className={styles.sectionDivider}>
                    <span>{t('admin.govAides.additionalData', 'Additional Data')}</span>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.govAides.aideDataJson', 'Aide Data (JSON)')}</label>
                    <textarea
                      value={JSON.stringify(selectedAide?.aide_data || {}, null, 2)}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setSelectedAide({ ...selectedAide, aide_data: parsed })
                        } catch {
                          // Keep the raw text in a temporary field
                        }
                      }}
                      placeholder='{"amount_min": 100, "amount_max": 500, "eligibility": []}'
                      rows={5}
                      style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                    />
                    <span className={styles.formHint}>
                      {t('admin.govAides.jsonHint', 'Enter additional structured data in JSON format')}
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
                  disabled={saving || !selectedAide?.aide_name || !selectedAide?.aide_description || !selectedAide?.region_id}
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
                <h3>{t('admin.govAides.deleteConfirm', 'Delete Government Aide?')}</h3>
                <p>
                  {t('admin.govAides.deleteWarning', 'Are you sure you want to delete')} <strong>{aideToDelete?.aide_name}</strong>?
                  {t('admin.govAides.deleteNote', ' This action cannot be undone.')}
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
