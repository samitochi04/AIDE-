import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import styles from '../shared/ContentManagement.module.css'

export default function AdminProcedures() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [sectionFilter, setSectionFilter] = useState(searchParams.get('section') || '')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedProcedure, setSelectedProcedure] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [procedureToDelete, setProcedureToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Categories and sections (matching DB schema)
  const categories = [
    { value: 'students', label: t('admin.procedures.categories.students', 'Students') },
    { value: 'workers', label: t('admin.procedures.categories.workers', 'Workers') },
  ]

  const subcategories = [
    { value: 'erasmus', label: t('admin.procedures.subcategories.erasmus', 'Erasmus') },
    { value: 'eu', label: t('admin.procedures.subcategories.eu', 'EU') },
    { value: 'nonEu', label: t('admin.procedures.subcategories.nonEu', 'Non-EU') },
  ]
  
  const sections = [
    { value: 'preArrival', label: t('admin.procedures.sections.preArrival', 'Pre-Arrival') },
    { value: 'arrival', label: t('admin.procedures.sections.arrival', 'On Arrival') },
    { value: 'banking', label: t('admin.procedures.sections.banking', 'Banking') },
    { value: 'housing', label: t('admin.procedures.sections.housing', 'Housing') },
    { value: 'healthcare', label: t('admin.procedures.sections.healthcare', 'Healthcare') },
    { value: 'transport', label: t('admin.procedures.sections.transport', 'Transport') },
    { value: 'employment', label: t('admin.procedures.sections.employment', 'Employment') },
    { value: 'administrative', label: t('admin.procedures.sections.administrative', 'Administrative') },
  ]

  // Fetch procedures
  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (sectionFilter) params.set('section', sectionFilter)
      
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN.PROCEDURES}?${params}`)
      
      setProcedures(response.data?.procedures || [])
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
  }, [pagination.page, pagination.limit, search, categoryFilter, sectionFilter])

  useEffect(() => {
    fetchProcedures()
  }, [fetchProcedures])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('category', categoryFilter)
    if (sectionFilter) params.set('section', sectionFilter)
    setSearchParams(params, { replace: true })
  }, [search, categoryFilter, sectionFilter, setSearchParams])

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

  const handleSectionChange = (e) => {
    setSectionFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setSectionFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedProcedure({
      procedure_name: '',
      procedure_description: '',
      category: 'students',
      subcategory: 'eu',
      section: 'preArrival',
      subsection: '',
      procedure_data: {},
      source_url: '',
    })
    setModalMode('create')
    setShowModal(true)
  }

  const openEditModal = (procedure) => {
    setSelectedProcedure({ ...procedure })
    setModalMode('edit')
    setShowModal(true)
  }

  const openViewModal = (procedure) => {
    setSelectedProcedure(procedure)
    setModalMode('view')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedProcedure(null)
    setModalMode('create')
  }

  // Save procedure (create or update)
  const handleSave = async () => {
    if (!selectedProcedure) return
    
    try {
      setSaving(true)
      
      const payload = {
        procedure_name: selectedProcedure.procedure_name,
        procedure_description: selectedProcedure.procedure_description,
        category: selectedProcedure.category,
        subcategory: selectedProcedure.subcategory,
        section: selectedProcedure.section,
        subsection: selectedProcedure.subsection,
        procedure_data: selectedProcedure.procedure_data || {},
        source_url: selectedProcedure.source_url,
      }

      if (modalMode === 'create') {
        await apiFetch(API_ENDPOINTS.ADMIN.PROCEDURES, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch(API_ENDPOINTS.ADMIN.PROCEDURE(selectedProcedure.id), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }

      closeModal()
      fetchProcedures()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete procedure
  const handleDelete = async () => {
    if (!procedureToDelete) return
    
    try {
      setSaving(true)
      await apiFetch(API_ENDPOINTS.ADMIN.PROCEDURE(procedureToDelete.id), {
        method: 'DELETE',
      })
      setShowDeleteConfirm(false)
      setProcedureToDelete(null)
      fetchProcedures()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate stats from actual data
  const getStats = () => {
    const categoryCounts = procedures.reduce((acc, proc) => {
      const cat = proc.category || 'unknown'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    const sectionCounts = procedures.reduce((acc, proc) => {
      const sec = proc.section || 'unknown'
      acc[sec] = (acc[sec] || 0) + 1
      return acc
    }, {})

    return { categoryCounts, sectionCounts }
  }

  const stats = getStats()

  // Pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Get icons for sections
  const getSectionIcon = (section) => {
    const icons = {
      'preArrival': 'ri-plane-line',
      'arrival': 'ri-flight-land-line',
      'administrative': 'ri-file-list-3-line',
      'housing': 'ri-home-line',
      'banking': 'ri-bank-line',
      'healthcare': 'ri-heart-pulse-line',
      'transport': 'ri-bus-line',
      'employment': 'ri-briefcase-line',
    }
    return icons[section] || 'ri-file-list-3-line'
  }

  // Format labels
  const getCategoryLabel = (cat) => {
    return categories.find(c => c.value === cat)?.label || cat || '-'
  }

  const getSubcategoryLabel = (sub) => {
    return subcategories.find(s => s.value === sub)?.label || sub || '-'
  }

  const getSectionLabel = (sec) => {
    return sections.find(s => s.value === sec)?.label || sec || '-'
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{t('admin.procedures.title', 'Procedures')}</h1>
          <p>{t('admin.procedures.subtitle', 'Manage administrative procedures and guides')}</p>
        </div>
        <button className={styles.addButton} onClick={openCreateModal}>
          <i className="ri-add-line" />
          {t('admin.procedures.addProcedure', 'Add Procedure')}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-file-list-3-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pagination.total}</span>
            <span className={styles.statLabel}>{t('admin.procedures.totalProcedures', 'Total Procedures')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-graduation-cap-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.categoryCounts['students'] || 0}</span>
            <span className={styles.statLabel}>{t('admin.procedures.forStudents', 'For Students')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-briefcase-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.categoryCounts['workers'] || 0}</span>
            <span className={styles.statLabel}>{t('admin.procedures.forWorkers', 'For Workers')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-list-check" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{Object.keys(stats.sectionCounts).length}</span>
            <span className={styles.statLabel}>{t('admin.procedures.sections', 'Sections')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.procedures.searchPlaceholder', 'Search procedures...')}
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <select value={categoryFilter} onChange={handleCategoryChange} className={styles.filterSelect}>
          <option value="">{t('admin.procedures.allCategories', 'All Categories')}</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        
        <select value={sectionFilter} onChange={handleSectionChange} className={styles.filterSelect}>
          <option value="">{t('admin.procedures.allSections', 'All Sections')}</option>
          {sections.map(sec => (
            <option key={sec.value} value={sec.value}>
              {sec.label}
            </option>
          ))}
        </select>
        
        {(search || categoryFilter || sectionFilter) && (
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

      {/* Procedures table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.loading', 'Loading...')}</span>
        </div>
      ) : procedures.length === 0 ? (
        <div className={styles.empty}>
          <i className="ri-file-list-3-line" />
          <p>{t('admin.procedures.noProcedures', 'No procedures found')}</p>
          {(search || categoryFilter || sectionFilter) && (
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
                <th>{t('admin.procedures.name', 'Name')}</th>
                <th>{t('admin.procedures.category', 'Category')}</th>
                <th>{t('admin.procedures.section', 'Section')}</th>
                <th>{t('admin.procedures.subcategory', 'Target')}</th>
                <th>{t('admin.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map(procedure => (
                <tr key={procedure.id}>
                  <td className={styles.nameCell}>
                    <span className={styles.itemName}>{procedure.procedure_name}</span>
                    <span className={styles.itemDesc}>
                      {procedure.procedure_description?.substring(0, 80)}
                      {procedure.procedure_description?.length > 80 ? '...' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgePrimary}>
                      {getCategoryLabel(procedure.category)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeInfo}>
                      <i className={getSectionIcon(procedure.section)} />
                      {getSectionLabel(procedure.section)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeSecondary}>
                      {getSubcategoryLabel(procedure.subcategory)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => openViewModal(procedure)}
                        title={t('admin.view', 'View')}
                      >
                        <i className="ri-eye-line" />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => openEditModal(procedure)}
                        title={t('admin.edit', 'Edit')}
                      >
                        <i className="ri-edit-line" />
                      </button>
                      {procedure.source_url && (
                        <a
                          className={styles.actionButton + ' ' + styles.external}
                          href={procedure.source_url}
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
                          setProcedureToDelete(procedure)
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
                {modalMode === 'create' && t('admin.procedures.createProcedure', 'Create Procedure')}
                {modalMode === 'edit' && t('admin.procedures.editProcedure', 'Edit Procedure')}
                {modalMode === 'view' && t('admin.procedures.viewProcedure', 'Procedure Details')}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="ri-close-line" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.viewDetails}>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.procedures.name', 'Name')}</label>
                    <p>{selectedProcedure?.procedure_name}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.procedures.description', 'Description')}</label>
                    <p>{selectedProcedure?.procedure_description || '-'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.procedures.category', 'Category')}</label>
                      <p>{getCategoryLabel(selectedProcedure?.category)}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.procedures.subcategory', 'Target')}</label>
                      <p>{getSubcategoryLabel(selectedProcedure?.subcategory)}</p>
                    </div>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.procedures.section', 'Section')}</label>
                      <p>{getSectionLabel(selectedProcedure?.section)}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.procedures.subsection', 'Subsection')}</label>
                      <p>{selectedProcedure?.subsection || '-'}</p>
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.procedures.sourceUrl', 'Source URL')}</label>
                    <p>
                      {selectedProcedure?.source_url ? (
                        <a href={selectedProcedure.source_url} target="_blank" rel="noopener noreferrer">
                          {selectedProcedure.source_url}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                  {selectedProcedure?.procedure_data && Object.keys(selectedProcedure.procedure_data).length > 0 && (
                    <div className={styles.detailGroup}>
                      <label>{t('admin.procedures.procedureData', 'Additional Data (JSON)')}</label>
                      <pre className={styles.jsonPreview}>
                        {JSON.stringify(selectedProcedure.procedure_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.created', 'Created')}</label>
                      <p>{selectedProcedure?.created_at ? new Date(selectedProcedure.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.lastVerified', 'Last Verified')}</label>
                      <p>{selectedProcedure?.last_verified ? new Date(selectedProcedure.last_verified).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={e => e.preventDefault()}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.procedures.name', 'Name')} <span>*</span></label>
                    <input
                      type="text"
                      value={selectedProcedure?.procedure_name || ''}
                      onChange={e => setSelectedProcedure({ ...selectedProcedure, procedure_name: e.target.value })}
                      placeholder={t('admin.procedures.namePlaceholder', 'Enter procedure name')}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.procedures.description', 'Description')} <span>*</span></label>
                    <textarea
                      value={selectedProcedure?.procedure_description || ''}
                      onChange={e => setSelectedProcedure({ ...selectedProcedure, procedure_description: e.target.value })}
                      placeholder={t('admin.procedures.descriptionPlaceholder', 'Enter description')}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.procedures.category', 'Category')} <span>*</span></label>
                      <select
                        value={selectedProcedure?.category || 'students'}
                        onChange={e => setSelectedProcedure({ ...selectedProcedure, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.procedures.subcategory', 'Target Audience')} <span>*</span></label>
                      <select
                        value={selectedProcedure?.subcategory || 'eu'}
                        onChange={e => setSelectedProcedure({ ...selectedProcedure, subcategory: e.target.value })}
                      >
                        {subcategories.map(sub => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.procedures.section', 'Section')} <span>*</span></label>
                      <select
                        value={selectedProcedure?.section || 'preArrival'}
                        onChange={e => setSelectedProcedure({ ...selectedProcedure, section: e.target.value })}
                      >
                        {sections.map(sec => (
                          <option key={sec.value} value={sec.value}>
                            {sec.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.procedures.subsection', 'Subsection')}</label>
                      <input
                        type="text"
                        value={selectedProcedure?.subsection || ''}
                        onChange={e => setSelectedProcedure({ ...selectedProcedure, subsection: e.target.value })}
                        placeholder={t('admin.procedures.subsectionPlaceholder', 'Optional subsection')}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.procedures.sourceUrl', 'Source URL')}</label>
                    <input
                      type="url"
                      value={selectedProcedure?.source_url || ''}
                      onChange={e => setSelectedProcedure({ ...selectedProcedure, source_url: e.target.value })}
                      placeholder="https://"
                    />
                  </div>

                  <div className={styles.sectionDivider}>
                    <span>{t('admin.procedures.additionalData', 'Additional Data')}</span>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.procedures.procedureDataJson', 'Procedure Data (JSON)')}</label>
                    <textarea
                      value={JSON.stringify(selectedProcedure?.procedure_data || {}, null, 2)}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setSelectedProcedure({ ...selectedProcedure, procedure_data: parsed })
                        } catch {
                          // Keep the raw text in a temporary field
                        }
                      }}
                      placeholder='{"steps": [], "required_documents": [], "processing_time": "", "cost": ""}'
                      rows={6}
                      style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                    />
                    <span className={styles.formHint}>
                      {t('admin.procedures.jsonHint', 'Enter steps, required documents, and other details in JSON format')}
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
                  disabled={saving || !selectedProcedure?.procedure_name || !selectedProcedure?.procedure_description}
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
                <h3>{t('admin.procedures.deleteConfirm', 'Delete Procedure?')}</h3>
                <p>
                  {t('admin.procedures.deleteWarning', 'Are you sure you want to delete')} <strong>{procedureToDelete?.procedure_name}</strong>?
                  {t('admin.procedures.deleteNote', ' This action cannot be undone.')}
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
